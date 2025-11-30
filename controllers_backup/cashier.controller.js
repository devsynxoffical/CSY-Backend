const bcrypt = require('bcryptjs');
// const { Op } = require('sequelize');
// const { sequelize } = require('../config/database'); // Commented out - using MongoDB only
const { Cashier, Business, Order, OrderItem, Product, User, QRCode, Reservation } = require('../models');
const { generateToken } = require('../utils');
const { notificationService } = require('../services');
const { logger } = require('../utils');
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../config/constants');

/**
 * Cashier Controller - Handles cashier operations for businesses
 */
class CashierController {
  /**
   * Cashier login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find cashier by email and populate business
      const cashier = await Cashier.findOne({ email: email.toLowerCase() })
        .populate('business_id', 'id business_name business_type');

      if (!cashier) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
          error: ERROR_MESSAGES.INVALID_CREDENTIALS
        });
      }

      if (!cashier.is_active) {
        return res.status(401).json({
          success: false,
          message: 'Cashier account is deactivated',
          error: 'Please contact your business administrator'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, cashier.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
          error: ERROR_MESSAGES.INVALID_CREDENTIALS
        });
      }

      // Generate JWT token
      const token = generateToken(cashier.id);

      // Update last login
      cashier.updated_at = new Date();
      await cashier.save();

      // Cashier response (without password)
      const cashierResponse = {
        id: cashier.id,
        business_id: cashier.business_id,
        email: cashier.email,
        full_name: cashier.full_name,
        is_active: cashier.is_active,
        created_at: cashier.created_at,
        business: cashier.business_id ? {
          id: cashier.business_id.id,
          name: cashier.business_id.business_name,
          type: cashier.business_id.business_type
        } : null
      };

      logger.info('Cashier logged in successfully', {
        cashierId: cashier.id,
        businessId: cashier.business_id,
        businessName: cashier.business_id?.business_name
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          cashier: cashierResponse,
          token
        }
      });
    } catch (error) {
      logger.error('Cashier login failed', {
        email: req.body.email,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }
  }

  /**
   * Get cashier profile
   */
  async getProfile(req, res) {
    try {
      const cashierId = req.user.id;

      const cashier = await Cashier.findOne({ id: cashierId })
        .populate('business_id', 'id business_name business_type address city');

      if (!cashier) {
        return res.status(404).json({
          success: false,
          message: 'Cashier not found',
          error: 'Cashier profile not found'
        });
      }

      const cashierProfile = {
        id: cashier.id,
        business_id: cashier.business_id?._id || cashier.business_id,
        email: cashier.email,
        full_name: cashier.full_name,
        is_active: cashier.is_active,
        created_at: cashier.created_at,
        updated_at: cashier.updated_at,
        business: cashier.business_id
      };

      res.json({
        success: true,
        message: 'Cashier profile retrieved successfully',
        data: cashierProfile
      });
    } catch (error) {
      logger.error('Get cashier profile failed', {
        cashierId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve cashier profile',
        error: error.message
      });
    }
  }

  /**
   * Get business orders for cashier
   */
  async getOrders(req, res) {
    try {
      const cashierId = req.user.id;

      // Get cashier's business
      const cashier = await Cashier.findOne({ id: cashierId });
      if (!cashier) {
        return res.status(404).json({
          success: false,
          message: 'Cashier not found',
          error: 'Cashier profile not found'
        });
      }

      const { page = 1, limit = 20, status, startDate, endDate } = req.query;

      const whereClause = { business_id: cashier.business_id };

      if (status) {
        whereClause.status = status;
      }

      if (startDate || endDate) {
        whereClause.created_at = {};
        if (startDate) whereClause.created_at.$gte = new Date(startDate);
        if (endDate) whereClause.created_at.$lte = new Date(endDate);
      }

      const [orders, total] = await Promise.all([
        Order.find(whereClause)
          .populate('user_id', 'id full_name phone')
          .sort({ created_at: -1 })
          .limit(parseInt(limit))
          .skip((page - 1) * parseInt(limit)),
        Order.countDocuments(whereClause)
      ]);

      res.json({
        success: true,
        message: 'Orders retrieved successfully',
        data: {
          orders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      logger.error('Get cashier orders failed', {
        cashierId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve orders',
        error: error.message
      });
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(req, res) {
    try {
      const cashierId = req.user.id;
      const orderId = req.params.id;
      const { status, notes } = req.body;

      // Get cashier's business
      const cashier = await Cashier.findOne({ id: cashierId });
      if (!cashier) {
        return res.status(404).json({
          success: false,
          message: 'Cashier not found',
          error: 'Cashier profile not found'
        });
      }

      // Find order in cashier's business
      const order = await Order.findOne({
        id: orderId,
        business_id: cashier.business_id
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
          error: 'Order not found in your business'
        });
      }

      // Validate status transition
      const validStatuses = ['pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid order status',
          error: `Status must be one of: ${validStatuses.join(', ')}`
        });
      }

      // Update order
      order.status = status;
      order.updated_at = new Date();

      // Add notes if provided
      if (notes) {
        order.notes = notes;
      }

      await order.save();

      logger.info('Order status updated by cashier', {
        cashierId,
        orderId,
        oldStatus: order.status,
        newStatus: status
      });

      // Notify user about status change
      await notificationService.sendOrderNotification(order.user_id, orderId, status, {
        email: null, // Would need user email
        phone: null  // Would need user phone
      });

      res.json({
        success: true,
        message: 'Order status updated successfully',
        data: {
          orderId,
          status,
          updated_at: new Date()
        }
      });
    } catch (error) {
      logger.error('Order status update failed', {
        cashierId: req.user?.id,
        orderId: req.params.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Order status update failed',
        error: error.message
      });
    }
  }

  /**
   * Get business products for cashier
   */
  async getProducts(req, res) {
    try {
      const cashierId = req.user.id;

      // Get cashier's business
      const cashier = await Cashier.findOne({ id: cashierId });
      if (!cashier) {
        return res.status(404).json({
          success: false,
          message: 'Cashier not found',
          error: 'Cashier profile not found'
        });
      }

      const { page = 1, limit = 20, category, available } = req.query;

      const whereClause = { business_id: cashier.business_id };

      if (category) {
        whereClause.category = category;
      }

      if (available !== undefined) {
        whereClause.is_available = available === 'true';
      }

      const [products, total] = await Promise.all([
        Product.find(whereClause)
          .sort({ category: 1, name: 1 })
          .limit(parseInt(limit))
          .skip((page - 1) * parseInt(limit)),
        Product.countDocuments(whereClause)
      ]);

      res.json({
        success: true,
        message: 'Products retrieved successfully',
        data: {
          products,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      logger.error('Get cashier products failed', {
        cashierId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve products',
        error: error.message
      });
    }
  }

  /**
   * Update product availability
   */
  async updateProductAvailability(req, res) {
    try {
      const cashierId = req.user.id;
      const productId = req.params.id;
      const { is_available } = req.body;

      if (typeof is_available !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'Invalid availability status',
          error: 'is_available must be a boolean value'
        });
      }

      // Get cashier's business
      const cashier = await Cashier.findOne({ id: cashierId });
      if (!cashier) {
        return res.status(404).json({
          success: false,
          message: 'Cashier not found',
          error: 'Cashier profile not found'
        });
      }

      // Find and update product
      const product = await Product.findOneAndUpdate(
        {
          id: productId,
          business_id: cashier.business_id
        },
        {
          is_available: is_available,
          updated_at: new Date()
        },
        { new: true }
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
          error: 'Product not found in your business'
        });
      }

      logger.info('Product availability updated by cashier', {
        cashierId,
        productId,
        is_available
      });

      res.json({
        success: true,
        message: `Product ${is_available ? 'enabled' : 'disabled'} successfully`,
        data: {
          productId,
          is_available,
          updated_at: new Date()
        }
      });
    } catch (error) {
      logger.error('Product availability update failed', {
        cashierId: req.user?.id,
        productId: req.params.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Product availability update failed',
        error: error.message
      });
    }
  }

  /**
   * Process payment for order
   */
  async processPayment(req, res) {
    try {
      const cashierId = req.user.id;
      const orderId = req.params.id;
      const { payment_method, payment_amount } = req.body;

      // Get cashier's business
      const cashier = await Cashier.findOne({ id: cashierId });
      if (!cashier) {
        return res.status(404).json({
          success: false,
          message: 'Cashier not found',
          error: 'Cashier profile not found'
        });
      }

      // Find order
      const order = await Order.findOne({
        id: orderId,
        business_id: cashier.business_id
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
          error: 'Order not found in your business'
        });
      }

      if (order.payment_status === 'paid') {
        return res.status(400).json({
          success: false,
          message: 'Order already paid',
          error: 'Payment has already been processed for this order'
        });
      }

      // Validate payment amount
      if (payment_amount && payment_amount !== order.final_amount) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment amount',
          error: `Payment amount must be ${order.final_amount} piastres`
        });
      }

      // Update order payment status
      order.payment_method = payment_method || 'cash';
      order.payment_status = 'paid';
      order.updated_at = new Date();
      await order.save();

      logger.info('Payment processed by cashier', {
        cashierId,
        orderId,
        amount: order.final_amount,
        method: payment_method || 'cash'
      });

      // Notify user
      await notificationService.sendPaymentNotification(order.user_id, order.final_amount, 'success', {
        email: null,
        phone: null
      });

      res.json({
        success: true,
        message: 'Payment processed successfully',
        data: {
          orderId,
          payment_amount: order.final_amount,
          payment_method: payment_method || 'cash',
          payment_status: 'paid',
          processed_at: new Date()
        }
      });
    } catch (error) {
      logger.error('Payment processing failed', {
        cashierId: req.user?.id,
        orderId: req.params.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Payment processing failed',
        error: error.message
      });
    }
  }

  /**
   * Get daily sales report
   */
  async getDailyReport(req, res) {
    try {
      const cashierId = req.user.id;
      const date = req.query.date ? new Date(req.query.date) : new Date();

      // Get cashier's business
      const cashier = await Cashier.findOne({ id: cashierId });
      if (!cashier) {
        return res.status(404).json({
          success: false,
          message: 'Cashier not found',
          error: 'Cashier profile not found'
        });
      }

      // Set date range for the day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Get orders for the day
      const orders = await Order.find({
        business_id: cashier.business_id,
        created_at: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      }).populate('user_id', 'id full_name');

      // Calculate metrics
      const totalOrders = orders.length;
      const completedOrders = orders.filter(order => order.status === 'completed').length;
      const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;
      const paidOrders = orders.filter(order => order.payment_status === 'paid').length;

      const totalRevenue = orders
        .filter(order => order.payment_status === 'paid')
        .reduce((sum, order) => sum + order.final_amount, 0);

      const cashPayments = orders.filter(order =>
        order.payment_status === 'paid' && order.payment_method === 'cash'
      ).length;

      const onlinePayments = paidOrders - cashPayments;

      const report = {
        date: date.toISOString().split('T')[0],
        business_id: cashier.business_id,
        summary: {
          total_orders: totalOrders,
          completed_orders: completedOrders,
          cancelled_orders: cancelledOrders,
          paid_orders: paidOrders,
          total_revenue: totalRevenue,
          cash_payments: cashPayments,
          online_payments: onlinePayments
        },
        orders: orders.map(order => ({
          id: order.id,
          order_number: order.order_number,
          customer_name: order.User?.full_name || 'Unknown',
          status: order.status,
          payment_status: order.payment_status,
          payment_method: order.payment_method,
          amount: order.final_amount,
          created_at: order.created_at
        }))
      };

      res.json({
        success: true,
        message: 'Daily report retrieved successfully',
        data: report
      });
    } catch (error) {
      logger.error('Get daily report failed', {
        cashierId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve daily report',
        error: error.message
      });
    }
  }

  /**
   * Get cashier statistics
   */
  async getStatistics(req, res) {
    try {
      const cashierId = req.user.id;
      const { startDate, endDate } = req.query;

      // Get cashier's business
      const cashier = await Cashier.findOne({ id: cashierId });
      if (!cashier) {
        return res.status(404).json({
          success: false,
          message: 'Cashier not found',
          error: 'Cashier profile not found'
        });
      }

      // Default to last 7 days
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Get statistics using aggregation
      const [ordersProcessed, paymentsProcessed, totalRevenue] = await Promise.all([
        Order.countDocuments({
          business_id: cashier.business_id,
          updated_at: { $gte: start, $lte: end }
        }),
        Order.countDocuments({
          business_id: cashier.business_id,
          payment_status: 'paid',
          updated_at: { $gte: start, $lte: end }
        }),
        Order.aggregate([
          {
            $match: {
              business_id: cashier.business_id,
              payment_status: 'paid',
              updated_at: { $gte: start, $lte: end }
            }
          },
          { $group: { _id: null, total: { $sum: '$final_amount' } } }
        ]).then(result => result[0]?.total || 0)
      ]);

      const stats = {
        period: {
          start: start.toISOString(),
          end: end.toISOString()
        },
        metrics: {
          orders_processed: ordersProcessed || 0,
          payments_processed: paymentsProcessed || 0,
          total_revenue: totalRevenue || 0
        }
      };

      res.json({
        success: true,
        message: 'Cashier statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      logger.error('Get cashier statistics failed', {
        cashierId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve statistics',
        error: error.message
      });
    }
  }

  /**
   * Scan QR code
   */
  async scanQRCode(req, res) {
    try {
      const cashierId = req.user.id;
      const { qr_token } = req.body;

      if (!qr_token) {
        return res.status(400).json({
          success: false,
          message: 'QR token is required',
          error: 'Please provide a valid QR token'
        });
      }

      // Get cashier's business
      const cashier = await Cashier.findOne({ id: cashierId });
      if (!cashier) {
        return res.status(404).json({
          success: false,
          message: 'Cashier not found',
          error: 'Cashier profile not found'
        });
      }

      // Find QR code
      const qrCode = await QRCode.findOne({
        qr_token,
        is_used: false,
        expires_at: { $gt: new Date() }
      });

      if (!qrCode) {
        return res.status(404).json({
          success: false,
          message: 'Invalid or expired QR code',
          error: 'QR code not found or already used'
        });
      }

      // Process based on QR type
      let result = null;
      let action = '';

      switch (qrCode.qr_type) {
        case 'discount':
          // Apply discount to business
          result = { discount_applied: true, qr_code: qrCode };
          action = 'discount_applied';
          break;

        case 'payment':
          // Process payment
          result = { payment_processed: true, qr_code: qrCode };
          action = 'payment_processed';
          break;

        case 'reservation':
          // Get reservation details
          const reservation = await Reservation.findOne({
            id: qrCode.reference_id,
            business_id: cashier.business_id
          });
          if (!reservation) {
            return res.status(404).json({
              success: false,
              message: 'Reservation not found',
              error: 'Reservation associated with QR code not found'
            });
          }
          result = { reservation, qr_code: qrCode };
          action = 'reservation_scanned';
          break;

        case 'order':
          // Get order details
          const order = await Order.findOne({
            id: qrCode.reference_id,
            business_id: cashier.business_id
          });
          if (!order) {
            return res.status(404).json({
              success: false,
              message: 'Order not found',
              error: 'Order associated with QR code not found'
            });
          }
          result = { order, qr_code: qrCode };
          action = 'order_scanned';
          break;

        case 'driver_pickup':
          // Driver pickup confirmation
          result = { driver_pickup: true, qr_code: qrCode };
          action = 'driver_pickup_scanned';
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Unsupported QR code type',
            error: `QR type '${qrCode.qr_type}' is not supported`
          });
      }

      // Mark QR code as used
      qrCode.is_used = true;
      qrCode.used_at = new Date();
      await qrCode.save();

      // Log the operation
      logger.info('QR code scanned by cashier', {
        cashierId,
        qrToken: qr_token,
        qrType: qrCode.qr_type,
        action
      });

      res.json({
        success: true,
        message: 'QR code scanned successfully',
        data: result
      });
    } catch (error) {
      logger.error('QR code scan failed', {
        cashierId: req.user?.id,
        qrToken: req.body?.qr_token,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'QR code scan failed',
        error: error.message
      });
    }
  }

  /**
   * Get operations history
   */
  async getOperationsHistory(req, res) {
    try {
      const cashierId = req.user.id;
      const { page = 1, limit = 20, startDate, endDate } = req.query;

      // Get cashier's business
      const cashier = await Cashier.findOne({ id: cashierId });
      if (!cashier) {
        return res.status(404).json({
          success: false,
          message: 'Cashier not found',
          error: 'Cashier profile not found'
        });
      }

      // Default to last 30 days
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Get operations (orders processed, QR codes scanned, etc.)
      const [ordersProcessed, qrCodesScanned, paymentsProcessed] = await Promise.all([
        Order.find({
          business_id: cashier.business_id,
          updated_at: { $gte: start, $lte: end }
        })
        .populate('user_id', 'id full_name')
        .sort({ updated_at: -1 })
        .limit(10), // Limit for summary

        QRCode.find({
          is_used: true,
          used_at: { $gte: start, $lte: end }
        })
        .sort({ used_at: -1 })
        .limit(10),

        Order.find({
          business_id: cashier.business_id,
          payment_status: 'paid',
          updated_at: { $gte: start, $lte: end }
        })
        .populate('user_id', 'id full_name')
        .sort({ updated_at: -1 })
        .limit(10)
      ]);

      // Get statistics
      const [totalOrders, totalPayments, totalRevenue] = await Promise.all([
        Order.countDocuments({
          business_id: cashier.business_id,
          updated_at: { $gte: start, $lte: end }
        }),
        Order.countDocuments({
          business_id: cashier.business_id,
          payment_status: 'paid',
          updated_at: { $gte: start, $lte: end }
        }),
        Order.aggregate([
          {
            $match: {
              business_id: cashier.business_id,
              payment_status: 'paid',
              updated_at: { $gte: start, $lte: end }
            }
          },
          { $group: { _id: null, total: { $sum: '$final_amount' } } }
        ]).then(result => result[0]?.total || 0)
      ]);

      const operations = {
        summary: {
          period: { start: start.toISOString(), end: end.toISOString() },
          total_orders_processed: totalOrders,
          total_payments_processed: totalPayments,
          total_revenue: totalRevenue,
          total_qr_scans: qrCodesScanned.length
        },
        recent_activity: {
          orders: ordersProcessed.map(order => ({
            id: order.id,
            order_number: order.order_number,
            customer: order.user_id?.full_name || 'Unknown',
            status: order.status,
            payment_status: order.payment_status,
            amount: order.final_amount,
            processed_at: order.updated_at
          })),
          payments: paymentsProcessed.map(order => ({
            id: order.id,
            order_number: order.order_number,
            customer: order.user_id?.full_name || 'Unknown',
            amount: order.final_amount,
            payment_method: order.payment_method,
            processed_at: order.updated_at
          })),
          qr_scans: qrCodesScanned.map(qr => ({
            id: qr.id,
            qr_type: qr.qr_type,
            scanned_at: qr.used_at
          }))
        }
      };

      res.json({
        success: true,
        message: 'Operations history retrieved successfully',
        data: operations
      });
    } catch (error) {
      logger.error('Get operations history failed', {
        cashierId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve operations history',
        error: error.message
      });
    }
  }
}

module.exports = new CashierController();
