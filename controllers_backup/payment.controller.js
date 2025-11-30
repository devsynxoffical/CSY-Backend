const { Transaction, Wallet, Order, User } = require('../models');
const { paymentService } = require('../services');
const { logger } = require('../utils');
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../config/constants');

/**
 * Payment Controller - Handles payment processing, wallet operations and refunds
 */
class PaymentController {
  /**
   * Add balance to wallet
   */
  async addWalletBalance(req, res) {
    try {
      const userId = req.user.id;
      const { amount, payment_method } = req.body;

      // Validate amount
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid amount is required',
          error: 'INVALID_AMOUNT'
        });
      }

      if (!payment_method || !['stripe', 'paymob'].includes(payment_method)) {
        return res.status(400).json({
          success: false,
          message: 'Valid payment method is required (stripe or paymob)',
          error: 'INVALID_PAYMENT_METHOD'
        });
      }

      // Get user wallet
      let wallet = await Wallet.findOne({ user_id: userId });
      if (!wallet) {
        wallet = await Wallet.create({
          user_id: userId,
          balance: 0,
          currency: 'EGP'
        });
      }

      // Process payment
      let paymentResult;
      try {
        if (payment_method === 'stripe') {
          paymentResult = await paymentService.processStripePayment(amount * 100, 'egp'); // Convert to cents
        } else if (payment_method === 'paymob') {
          paymentResult = await paymentService.processPaymobPayment(amount);
        }
      } catch (paymentError) {
        logger.error('Payment processing error', { error: paymentError.message });
        return res.status(400).json({
          success: false,
          message: 'Payment processing failed',
          error: 'PAYMENT_FAILED'
        });
      }

      if (!paymentResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Payment failed',
          error: paymentResult.error
        });
      }

      // Update wallet balance
      const newBalance = wallet.balance + amount;
      await Wallet.findOneAndUpdate(
        { user_id: userId },
        { balance: newBalance, updated_at: new Date() }
      );

      // Create transaction record
      const transaction = await Transaction.create({
        user_id: userId,
        transaction_type: 'wallet_topup',
        reference_type: 'wallet',
        reference_id: wallet.id,
        amount: amount,
        payment_method: payment_method,
        status: 'completed',
        description: `Wallet top-up via ${payment_method}`
      });

      // Send success notification
      try {
        await require('../services').notificationService.sendNotification(
          req.user.email,
          'Wallet Top-up Successful',
          `Your wallet has been credited with ${amount} EGP. New balance: ${newBalance} EGP`,
          { transactionId: transaction.id, type: 'wallet_topup' }
        );
      } catch (notificationError) {
        logger.error('Failed to send wallet topup notification', {
          userId,
          error: notificationError.message
        });
      }

      res.json({
        success: true,
        message: 'Wallet balance added successfully',
        data: {
          transaction_id: transaction.id,
          amount,
          new_balance: newBalance,
          currency: 'EGP',
          payment_reference: paymentResult.reference
        }
      });

    } catch (error) {
      logger.error('Add wallet balance error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to add wallet balance',
        error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
      });
    }
  }

  /**
   * Process payment for order
   */
  async processPayment(req, res) {
    try {
      const userId = req.user.id;
      const { order_id, payment_method, use_wallet } = req.body;

      if (!order_id) {
        return res.status(400).json({
          success: false,
          message: 'Order ID is required',
          error: 'MISSING_ORDER_ID'
        });
      }

      // Get order details
      const order = await Order.findOne({ id: order_id });
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
          error: 'ORDER_NOT_FOUND'
        });
      }

      // Check if user owns this order
      if (order.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
          error: 'UNAUTHORIZED_ACCESS'
        });
      }

      // Check if order is already paid
      if (order.payment_status === 'paid') {
        return res.status(400).json({
          success: false,
          message: 'Order is already paid',
          error: 'ORDER_ALREADY_PAID'
        });
      }

      // Check order status
      if (!['pending', 'accepted'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: 'Order cannot be paid at this stage',
          error: 'ORDER_NOT_PAYABLE'
        });
      }

      let finalAmount = order.final_amount;
      let walletDeduction = 0;
      let paymentAmount = finalAmount;

      // Handle wallet usage
      if (use_wallet) {
        const wallet = await Wallet.findOne({ user_id: userId });
        if (wallet && wallet.balance > 0) {
          walletDeduction = Math.min(wallet.balance, finalAmount);
          paymentAmount = finalAmount - walletDeduction;
        }
      }

      // Process external payment if needed
      let paymentResult = { success: true, reference: null };
      if (paymentAmount > 0) {
        if (!payment_method || !['stripe', 'paymob'].includes(payment_method)) {
          return res.status(400).json({
            success: false,
            message: 'Valid payment method is required for remaining amount',
            error: 'INVALID_PAYMENT_METHOD'
          });
        }

        try {
          if (payment_method === 'stripe') {
            paymentResult = await paymentService.processStripePayment(paymentAmount * 100, 'egp');
          } else if (payment_method === 'paymob') {
            paymentResult = await paymentService.processPaymobPayment(paymentAmount);
          }
        } catch (paymentError) {
          logger.error('Payment processing error', { error: paymentError.message });
          return res.status(400).json({
            success: false,
            message: 'Payment processing failed',
            error: 'PAYMENT_FAILED'
          });
        }

        if (!paymentResult.success) {
          return res.status(400).json({
            success: false,
            message: 'Payment failed',
            error: paymentResult.error
          });
        }
      }

      // Deduct from wallet if used
      if (walletDeduction > 0) {
        await Wallet.findOneAndUpdate(
          { user_id: userId },
          { $inc: { balance: -walletDeduction }, updated_at: new Date() }
        );
      }

      // Update order payment status
      await Order.findOneAndUpdate(
        { id: order_id },
        {
          payment_status: 'paid',
          payment_method: paymentAmount > 0 ? payment_method : 'wallet',
          updated_at: new Date()
        }
      );

      // Create transaction records
      const transactions = [];

      // Wallet transaction if used
      if (walletDeduction > 0) {
        const walletTransaction = await Transaction.create({
          user_id: userId,
          transaction_type: 'payment',
          reference_type: 'order',
          reference_id: order_id,
          amount: -walletDeduction,
          payment_method: 'wallet',
          status: 'completed',
          description: `Payment for order ${order.order_number} (wallet)`
        });
        transactions.push(walletTransaction);
      }

      // External payment transaction
      if (paymentAmount > 0) {
        const paymentTransaction = await Transaction.create({
          user_id: userId,
          transaction_type: 'payment',
          reference_type: 'order',
          reference_id: order_id,
          amount: -paymentAmount,
          payment_method: payment_method,
          status: 'completed',
          description: `Payment for order ${order.order_number}`
        });
        transactions.push(paymentTransaction);
      }

      // Send payment confirmation
      try {
        await require('../services').notificationService.sendNotification(
          req.user.email,
          'Payment Successful',
          `Your payment of ${finalAmount} EGP for order ${order.order_number} has been processed successfully`,
          { orderId: order_id, type: 'payment_success' }
        );
      } catch (notificationError) {
        logger.error('Failed to send payment confirmation', {
          orderId: order_id,
          error: notificationError.message
        });
      }

      res.json({
        success: true,
        message: 'Payment processed successfully',
        data: {
          order_id,
          total_amount: finalAmount,
          wallet_deduction: walletDeduction,
          payment_amount: paymentAmount,
          payment_method: paymentAmount > 0 ? payment_method : 'wallet',
          transactions: transactions.map(t => ({ id: t.id, amount: t.amount, method: t.payment_method })),
          payment_reference: paymentResult.reference
        }
      });

    } catch (error) {
      logger.error('Process payment error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to process payment',
        error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
      });
    }
  }

  /**
   * Verify payment status
   */
  async verifyPayment(req, res) {
    try {
      const { transaction_id, payment_reference } = req.body;

      if (!transaction_id && !payment_reference) {
        return res.status(400).json({
          success: false,
          message: 'Transaction ID or payment reference is required',
          error: 'MISSING_VERIFICATION_DATA'
        });
      }

      let transaction;
      if (transaction_id) {
        transaction = await Transaction.findOne({ id: transaction_id });
      } else {
        // Find by payment reference (this would need to be implemented based on payment service)
        transaction = await Transaction.findOne({ /* search by reference */ });
      }

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found',
          error: 'TRANSACTION_NOT_FOUND'
        });
      }

      // Check if user owns this transaction
      if (transaction.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
          error: 'UNAUTHORIZED_ACCESS'
        });
      }

      // Verify payment status with external service
      let verificationResult = { status: transaction.status };

      if (transaction.payment_method === 'stripe' && payment_reference) {
        try {
          verificationResult = await paymentService.verifyStripePayment(payment_reference);
        } catch (error) {
          logger.error('Stripe verification error', { error: error.message });
        }
      } else if (transaction.payment_method === 'paymob' && payment_reference) {
        try {
          verificationResult = await paymentService.verifyPaymobPayment(payment_reference);
        } catch (error) {
          logger.error('Paymob verification error', { error: error.message });
        }
      }

      // Update transaction status if needed
      if (verificationResult.status !== transaction.status) {
        await Transaction.findOneAndUpdate(
          { id: transaction.id },
          { status: verificationResult.status, updated_at: new Date() }
        );
        transaction.status = verificationResult.status;
      }

      res.json({
        success: true,
        message: 'Payment verification completed',
        data: {
          transaction_id: transaction.id,
          status: transaction.status,
          amount: transaction.amount,
          payment_method: transaction.payment_method,
          verified_at: new Date()
        }
      });

    } catch (error) {
      logger.error('Verify payment error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to verify payment',
        error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
      });
    }
  }

  /**
   * Process refund
   */
  async processRefund(req, res) {
    try {
      const userId = req.user.id;
      const { order_id, amount, reason } = req.body;

      if (!order_id) {
        return res.status(400).json({
          success: false,
          message: 'Order ID is required',
          error: 'MISSING_ORDER_ID'
        });
      }

      // Get order details
      const order = await Order.findOne({ id: order_id });
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
          error: 'ORDER_NOT_FOUND'
        });
      }

      // Check if user owns this order
      if (order.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
          error: 'UNAUTHORIZED_ACCESS'
        });
      }

      // Check if order can be refunded
      if (order.payment_status !== 'paid') {
        return res.status(400).json({
          success: false,
          message: 'Order is not paid or already refunded',
          error: 'ORDER_NOT_REFUNDABLE'
        });
      }

      if (!['cancelled', 'completed'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: 'Order must be cancelled or completed for refund',
          error: 'INVALID_ORDER_STATUS'
        });
      }

      // Determine refund amount
      const refundAmount = amount || order.final_amount;

      if (refundAmount > order.final_amount) {
        return res.status(400).json({
          success: false,
          message: 'Refund amount cannot exceed order total',
          error: 'INVALID_REFUND_AMOUNT'
        });
      }

      // Process refund based on payment method
      let refundResult = { success: true, reference: null };

      if (order.payment_method === 'stripe') {
        // Get original transaction
        const originalTransaction = await Transaction.findOne({
          reference_type: 'order',
          reference_id: order_id,
          transaction_type: 'payment',
          payment_method: 'stripe'
        });

        if (originalTransaction) {
          try {
            refundResult = await paymentService.processStripeRefund(
              originalTransaction.id,
              refundAmount * 100 // Convert to cents
            );
          } catch (error) {
            logger.error('Stripe refund error', { error: error.message });
            return res.status(400).json({
              success: false,
              message: 'Refund processing failed',
              error: 'REFUND_FAILED'
            });
          }
        }
      } else if (order.payment_method === 'paymob') {
        // Similar logic for Paymob refunds
        // Implementation depends on Paymob API
      }

      // For wallet payments, refund directly to wallet
      if (order.payment_method === 'wallet' || refundResult.success) {
        // Refund to wallet
        const wallet = await Wallet.findOne({ user_id: userId });
        if (wallet) {
          await Wallet.findOneAndUpdate(
            { user_id: userId },
            { $inc: { balance: refundAmount }, updated_at: new Date() }
          );
        } else {
          // Create wallet if doesn't exist
          await Wallet.create({
            user_id: userId,
            balance: refundAmount,
            currency: 'EGP'
          });
        }
      }

      // Update order payment status
      await Order.findOneAndUpdate(
        { id: order_id },
        {
          payment_status: 'refunded',
          updated_at: new Date()
        }
      );

      // Create refund transaction
      const refundTransaction = await Transaction.create({
        user_id: userId,
        transaction_type: 'refund',
        reference_type: 'order',
        reference_id: order_id,
        amount: refundAmount,
        payment_method: order.payment_method,
        status: 'completed',
        description: `Refund for order ${order.order_number}: ${reason || 'Customer request'}`
      });

      // Send refund notification
      try {
        await require('../services').notificationService.sendNotification(
          req.user.email,
          'Refund Processed',
          `Your refund of ${refundAmount} EGP for order ${order.order_number} has been processed`,
          { orderId: order_id, transactionId: refundTransaction.id, type: 'refund' }
        );
      } catch (notificationError) {
        logger.error('Failed to send refund notification', {
          orderId: order_id,
          error: notificationError.message
        });
      }

      res.json({
        success: true,
        message: 'Refund processed successfully',
        data: {
          order_id,
          refund_amount: refundAmount,
          refund_method: order.payment_method,
          transaction_id: refundTransaction.id,
          refund_reference: refundResult.reference
        }
      });

    } catch (error) {
      logger.error('Process refund error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to process refund',
        error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
      });
    }
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(req, res) {
    try {
      const userId = req.user.id;

      const wallet = await Wallet.findOne({ user_id: userId });

      res.json({
        success: true,
        message: 'Wallet balance retrieved successfully',
        data: {
          balance: wallet ? wallet.balance : 0,
          currency: 'EGP',
          last_updated: wallet ? wallet.updated_at : null
        }
      });

    } catch (error) {
      logger.error('Get wallet balance error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve wallet balance',
        error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
      });
    }
  }

  /**
   * Get wallet transaction history
   */
  async getWalletHistory(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, type } = req.query;

      const query = {
        user_id: userId,
        $or: [
          { transaction_type: 'wallet_topup' },
          { reference_type: 'wallet' }
        ]
      };

      if (type) {
        query.transaction_type = type;
      }

      const skip = (page - 1) * limit;

      const transactions = await Transaction.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Transaction.countDocuments(query);

      res.json({
        success: true,
        message: 'Wallet history retrieved successfully',
        data: {
          transactions: transactions.map(t => ({
            id: t.id,
            type: t.transaction_type,
            amount: t.amount,
            status: t.status,
            description: t.description,
            created_at: t.created_at
          })),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      logger.error('Get wallet history error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve wallet history',
        error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
      });
    }
  }
}

module.exports = new PaymentController();
