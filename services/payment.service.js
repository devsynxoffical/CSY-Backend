const crypto = require('crypto');
const { Transaction, Wallet, User } = require('../models');
const { logger } = require('../utils');
const notificationService = require('./notification.service');

/**
 * Payment Service for handling payment processing
 */
class PaymentService {
  constructor() {
    this.providers = {
      paymob: this.initializePaymob(),
      stripe: this.initializeStripe(),
      wallet: null // Internal wallet payments
    };
  }

  /**
   * Initialize Paymob payment provider
   */
  initializePaymob() {
    return {
      apiKey: process.env.PAYMOB_API_KEY,
      integrationId: process.env.PAYMOB_INTEGRATION_ID,
      iframeId: process.env.PAYMOB_IFRAME_ID,
      baseUrl: process.env.PAYMOB_BASE_URL || 'https://accept.paymob.com/api'
    };
  }

  /**
   * Initialize Stripe payment provider
   */
  initializeStripe() {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      console.log('⚠️  Stripe not configured - skipping Stripe initialization');
      return null;
    }
    const Stripe = require('stripe');
    return new Stripe(stripeKey);
  }

  /**
   * Create payment intent/order
   */
  async createPayment(orderData, paymentMethod = 'online') {
    try {
      const { userId, amount, currency = 'EGP', description, orderId } = orderData;

      // Convert amount to piastres (multiply by 100)
      const amountInPiastres = Math.round(amount * 100);

      let paymentResult;

      switch (paymentMethod) {
        case 'paymob':
          paymentResult = await this.createPaymobPayment({
            amount: amountInPiastres,
            currency,
            description,
            orderId,
            userId
          });
          break;

        case 'stripe':
          paymentResult = await this.createStripePayment({
            amount: amountInPiastres,
            currency: currency.toLowerCase(),
            description,
            metadata: { orderId, userId }
          });
          break;

        case 'wallet':
          paymentResult = await this.processWalletPayment(userId, amountInPiastres, orderId);
          break;

        default:
          throw new Error('Unsupported payment method');
      }

      // Create transaction record
      await this.createTransactionRecord({
        user_id: userId,
        transaction_type: 'payment',
        reference_type: 'order',
        reference_id: orderId,
        amount: amountInPiastres,
        payment_method: paymentMethod,
        status: 'pending',
        description: `Payment for order ${orderId}`
      });

      logger.info('Payment created', {
        orderId,
        userId,
        amount: amountInPiastres,
        method: paymentMethod
      });

      return paymentResult;
    } catch (error) {
      logger.error('Payment creation failed', {
        orderId: orderData.orderId,
        userId: orderData.userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Create Paymob payment
   */
  async createPaymobPayment({ amount, currency, description, orderId, userId }) {
    try {
      const paymob = this.providers.paymob;

      // Step 1: Authentication Request
      const authResponse = await fetch(`${paymob.baseUrl}/auth/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: paymob.apiKey
        })
      });

      if (!authResponse.ok) {
        throw new Error('Paymob authentication failed');
      }

      const authData = await authResponse.json();
      const token = authData.token;

      // Step 2: Order Registration
      const orderResponse = await fetch(`${paymob.baseUrl}/ecommerce/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          auth_token: token,
          delivery_needed: false,
          amount_cents: amount,
          currency,
          items: [{
            name: description || 'Order Payment',
            amount_cents: amount,
            quantity: 1
          }]
        })
      });

      if (!orderResponse.ok) {
        throw new Error('Paymob order creation failed');
      }

      const orderData = await orderResponse.json();

      // Step 3: Payment Key Request
      const paymentKeyResponse = await fetch(`${paymob.baseUrl}/acceptance/payment_keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          auth_token: token,
          amount_cents: amount,
          expiration: 3600, // 1 hour
          order_id: orderData.id.toString(),
          billing_data: {
            apartment: 'NA',
            email: 'NA',
            floor: 'NA',
            first_name: 'NA',
            street: 'NA',
            building: 'NA',
            phone_number: 'NA',
            shipping_method: 'NA',
            postal_code: 'NA',
            city: 'NA',
            country: 'NA',
            last_name: 'NA',
            state: 'NA'
          },
          currency,
          integration_id: paymob.integrationId
        })
      });

      if (!paymentKeyResponse.ok) {
        throw new Error('Paymob payment key creation failed');
      }

      const paymentKeyData = await paymentKeyResponse.json();

      return {
        provider: 'paymob',
        paymentId: orderData.id,
        paymentKey: paymentKeyData.token,
        iframeUrl: `https://accept.paymob.com/api/acceptance/iframes/${paymob.iframeId}?payment_token=${paymentKeyData.token}`,
        amount,
        currency
      };
    } catch (error) {
      logger.error('Paymob payment creation failed', { error: error.message });
      throw new Error(`Paymob payment failed: ${error.message}`);
    }
  }

  /**
   * Create Stripe payment intent
   */
  async createStripePayment({ amount, currency, description, metadata }) {
    try {
      const stripe = this.providers.stripe;

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        description,
        metadata,
        automatic_payment_methods: {
          enabled: true
        }
      });

      return {
        provider: 'stripe',
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount,
        currency
      };
    } catch (error) {
      logger.error('Stripe payment creation failed', { error: error.message });
      throw new Error(`Stripe payment failed: ${error.message}`);
    }
  }

  /**
   * Process wallet payment
   */
  async processWalletPayment(userId, amount, orderId) {
    try {
      const user = await User.findOne({ id: userId });
      if (!user) {
        throw new Error('User not found');
      }

      if (user.wallet_balance < amount) {
        throw new Error('Insufficient wallet balance');
      }

      // Deduct from wallet
      await User.update(
        { wallet_balance: user.wallet_balance - amount },
        { where: { id: userId } }
      );

      return {
        provider: 'wallet',
        success: true,
        amount,
        newBalance: user.wallet_balance - amount
      };
    } catch (error) {
      logger.error('Wallet payment failed', { userId, amount, error: error.message });
      throw error;
    }
  }

  /**
   * Process payment webhook/callback
   */
  async processPaymentCallback(provider, paymentData) {
    try {
      let transactionUpdate = {};
      let userNotification = null;

      switch (provider) {
        case 'paymob':
          transactionUpdate = await this.processPaymobCallback(paymentData);
          break;

        case 'stripe':
          transactionUpdate = await this.processStripeCallback(paymentData);
          break;

        default:
          throw new Error('Unknown payment provider');
      }

      // Update transaction
      if (transactionUpdate.transactionId) {
        await Transaction.update(
          {
            status: transactionUpdate.status,
            description: transactionUpdate.description
          },
          { where: { id: transactionUpdate.transactionId } }
        );
      }

      // Send notification if payment successful
      if (transactionUpdate.status === 'completed' && transactionUpdate.userId) {
        userNotification = await notificationService.sendPaymentNotification(
          transactionUpdate.userId,
          transactionUpdate.amount,
          'success',
          { email: transactionUpdate.userEmail, phone: transactionUpdate.userPhone }
        );
      }

      logger.info('Payment callback processed', {
        provider,
        transactionId: transactionUpdate.transactionId,
        status: transactionUpdate.status
      });

      return {
        success: true,
        transactionUpdate,
        notification: userNotification
      };
    } catch (error) {
      logger.error('Payment callback processing failed', {
        provider,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Process Paymob callback
   */
  async processPaymobCallback(callbackData) {
    // Paymob callback structure - adjust based on actual callback format
    const { order, success } = callbackData;

    return {
      transactionId: order.id,
      status: success ? 'completed' : 'failed',
      amount: order.amount_cents,
      description: `Paymob payment ${success ? 'successful' : 'failed'}`
    };
  }

  /**
   * Process Stripe webhook
   */
  async processStripeCallback(webhookData) {
    const { type, data } = webhookData;

    if (type === 'payment_intent.succeeded') {
      const paymentIntent = data.object;

      return {
        transactionId: paymentIntent.metadata.orderId,
        status: 'completed',
        amount: paymentIntent.amount,
        description: 'Stripe payment successful'
      };
    }

    return {
      status: 'failed',
      description: 'Stripe payment failed'
    };
  }

  /**
   * Refund payment
   */
  async refundPayment(transactionId, amount = null, reason = 'Customer request') {
    try {
      const transaction = await Transaction.findOne({
        where: { id: transactionId, transaction_type: 'payment' }
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status !== 'completed') {
        throw new Error('Can only refund completed transactions');
      }

      const refundAmount = amount || transaction.amount;

      let refundResult;

      switch (transaction.payment_method) {
        case 'stripe':
          refundResult = await this.refundStripePayment(transaction.reference_id, refundAmount);
          break;

        case 'wallet':
          refundResult = await this.refundWalletPayment(transaction.user_id, refundAmount);
          break;

        default:
          throw new Error('Refunds not supported for this payment method');
      }

      // Create refund transaction
      await this.createTransactionRecord({
        user_id: transaction.user_id,
        transaction_type: 'refund',
        reference_type: transaction.reference_type,
        reference_id: transaction.reference_id,
        amount: refundAmount,
        payment_method: transaction.payment_method,
        status: 'completed',
        description: `Refund: ${reason}`
      });

      logger.info('Payment refunded', {
        transactionId,
        amount: refundAmount,
        method: transaction.payment_method
      });

      return refundResult;
    } catch (error) {
      logger.error('Payment refund failed', {
        transactionId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Refund Stripe payment
   */
  async refundStripePayment(paymentIntentId, amount) {
    try {
      const stripe = this.providers.stripe;

      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount
      });

      return {
        refundId: refund.id,
        amount: refund.amount,
        status: refund.status
      };
    } catch (error) {
      logger.error('Stripe refund failed', { paymentIntentId, error: error.message });
      throw error;
    }
  }

  /**
   * Refund wallet payment
   */
  async refundWalletPayment(userId, amount) {
    try {
      const user = await User.findOne({ id: userId });
      if (!user) {
        throw new Error('User not found');
      }

      // Add back to wallet
      await User.update(
        { wallet_balance: user.wallet_balance + amount },
        { where: { id: userId } }
      );

      return {
        success: true,
        amount,
        newBalance: user.wallet_balance + amount
      };
    } catch (error) {
      logger.error('Wallet refund failed', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Create transaction record
   */
  async createTransactionRecord(transactionData) {
    try {
      const transaction = await Transaction.create(transactionData);
      return transaction;
    } catch (error) {
      logger.error('Transaction record creation failed', {
        error: error.message,
        data: transactionData
      });
      throw error;
    }
  }

  /**
   * Get payment methods available for user
   */
  async getAvailablePaymentMethods(userId) {
    try {
      const user = await User.findOne({ id: userId });

      const methods = [
        {
          id: 'cash',
          name: 'Cash on Delivery',
          available: true,
          description: 'Pay when you receive your order'
        },
        {
          id: 'online',
          name: 'Online Payment',
          available: true,
          description: 'Pay securely online'
        },
        {
          id: 'wallet',
          name: 'CSY Wallet',
          available: true,
          balance: user?.wallet_balance || 0,
          description: 'Pay using your wallet balance'
        }
      ];

      return methods;
    } catch (error) {
      logger.error('Get payment methods failed', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Validate payment amount
   */
  validatePaymentAmount(amount, currency = 'EGP') {
    const minAmount = 100; // 1 EGP in piastres
    const maxAmount = 5000000; // 50,000 EGP in piastres

    if (amount < minAmount) {
      throw new Error(`Minimum payment amount is ${minAmount / 100} ${currency}`);
    }

    if (amount > maxAmount) {
      throw new Error(`Maximum payment amount is ${maxAmount / 100} ${currency}`);
    }

    return true;
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(startDate, endDate) {
    try {
      const stats = await Transaction.findAll({
        where: {
          transaction_type: 'payment',
          created_at: {
            [Op.between]: [startDate, endDate]
          }
        },
        attributes: [
          'payment_method',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'total_amount']
        ],
        group: ['payment_method']
      });

      return stats.map(stat => ({
        method: stat.payment_method,
        count: parseInt(stat.dataValues.count),
        totalAmount: parseInt(stat.dataValues.total_amount)
      }));
    } catch (error) {
      logger.error('Get payment stats failed', { error: error.message });
      throw error;
    }
  }
}

module.exports = new PaymentService();
