const bcrypt = require('bcryptjs');
// const { Op } = require('sequelize');
// const { sequelize } = require('../config/database'); // Commented out - using MongoDB only
const { prisma } = require('../models');
const CacheService = require('../services/cache.service');
const { generateToken } = require('../utils');
const { notificationService } = require('../services');
const { logger } = require('../utils');
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../config/constants');

/**
 * Cashier Controller - Handles cashier operations for businesses
 */
class CashierController {
  /**
   * Helper method to find order by UUID or order_number
   */
  static async findOrderByIdentifier(identifier, businessId) {
    // Check if it's a UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    let order;
    if (uuidRegex.test(identifier)) {
      // It's a UUID, find by id
      order = await prisma.order.findUnique({
        where: { id: identifier },
        include: {
          order_items: {
            where: { business_id: businessId },
            take: 1
          }
        }
      });
    } else {
      // It's an order_number, find by order_number
      order = await prisma.order.findUnique({
        where: { order_number: identifier },
        include: {
          order_items: {
            where: { business_id: businessId },
            take: 1
          }
        }
      });
    }
    
    return order;
  }
  /**
   * Cashier login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find cashier by email and include business relation
      const cashier = await prisma.cashier.findUnique({ 
        where: { email: email.toLowerCase() },
        include: {
          business: {
            select: {
              id: true,
              business_name: true,
              business_type: true
            }
          }
        }
      });

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

      // Generate JWT token with role
      const token = generateToken(cashier.id, 'cashier');

      // Update last login
      await prisma.cashier.update({
        where: { id: cashier.id },
        data: { updated_at: new Date() }
      });

      // Cashier response (without password)
      const cashierResponse = {
        id: cashier.id,
        business_id: cashier.business_id,
        email: cashier.email,
        full_name: cashier.full_name,
        is_active: cashier.is_active,
        created_at: cashier.created_at,
        business: cashier.business ? {
          id: cashier.business.id,
          name: cashier.business.business_name,
          type: cashier.business.business_type
        } : null
      };

      logger.info('Cashier logged in successfully', {
        cashierId: cashier.id,
        businessId: cashier.business_id,
        businessName: cashier.business?.business_name
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

      const cashier = await prisma.cashier.findUnique({
        where: { id: cashierId },
        include: {
          business: {
            select: { id: true, business_name: true, business_type: true, address: true, city: true }
          }
        }
      });

      if (!cashier) {
        return res.status(404).json({
          success: false,
          message: 'Cashier not found',
          error: 'Cashier profile not found'
        });
      }

      const cashierProfile = {
        id: cashier.id,
        business_id: cashier.business_id,
        email: cashier.email,
        full_name: cashier.full_name,
        is_active: cashier.is_active,
        created_at: cashier.created_at,
        updated_at: cashier.updated_at,
        business: cashier.business
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
      const cashier = await prisma.cashier.findUnique({ where: { id: cashierId } });
      if (!cashier) {
        return res.status(404).json({
          success: false,
          message: 'Cashier not found',
          error: 'Cashier profile not found'
        });
      }

      const { page = 1, limit = 20, status, startDate, endDate } = req.query;

      // Order doesn't have business_id, so we filter through OrderItem
      const where = {
        order_items: {
          some: {
            business_id: cashier.business_id
          }
        }
      };

      if (status) {
        where.status = status;
      }

      if (startDate || endDate) {
        where.created_at = {};
        if (startDate) where.created_at.gte = new Date(startDate);
        if (endDate) where.created_at.lte = new Date(endDate);
      }

      // Filter orders that have items from this business
      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where: {
            ...where,
            order_items: {
              some: {
                business_id: cashier.business_id
              }
            }
          },
          include: {
            user: { select: { id: true, full_name: true, phone: true } },
            order_items: {
              where: {
                business_id: cashier.business_id
              },
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    image_url: true
                  }
                }
              }
            }
          },
          orderBy: { created_at: 'desc' },
          skip: (parseInt(page) - 1) * parseInt(limit),
          take: parseInt(limit)
        }),
        prisma.order.count({
          where: {
            ...where,
            order_items: {
              some: {
                business_id: cashier.business_id
              }
            }
          }
        })
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
      const cashier = await prisma.cashier.findUnique({ where: { id: cashierId } });
      if (!cashier) {
        return res.status(404).json({
          success: false,
          message: 'Cashier not found',
          error: 'Cashier profile not found'
        });
      }

      // Find order and verify it belongs to cashier's business
      // Order doesn't have business_id, so we check through OrderItem
      const order = await CashierController.findOrderByIdentifier(orderId, cashier.business_id);

      if (!order || order.order_items.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
          error: 'Order not found in your business'
        });
      }

      // Validate status transition
      const validStatuses = ['pending', 'accepted', 'preparing', 'waiting_driver', 'ready', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid order status',
          error: `Status must be one of: ${validStatuses.join(', ')}`
        });
      }

      // Update order - use the actual order id (UUID)
      // Note: Order model doesn't have a notes field, so we skip it
      const updateData = {
        status: status,
        updated_at: new Date()
      };

      await prisma.order.update({
        where: { id: order.id },
        data: updateData
      });

      logger.info('Order status updated by cashier', {
        cashierId,
        orderId: order.id,
        orderNumber: order.order_number,
        oldStatus: order.status,
        newStatus: status
      });

      // Get updated order with full details
      const updatedOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: {
          user: {
            select: { id: true, full_name: true, phone: true }
          },
          order_items: {
            include: {
              product: {
                select: { id: true, name: true, price: true, image_url: true, category: true }
              },
              business: {
                select: { id: true, business_name: true, address: true }
              }
            },
            orderBy: { created_at: 'asc' }
          },
          driver: {
            select: { id: true, full_name: true, phone: true, vehicle_type: true }
          }
        }
      });

      // Notify user about status change
      await notificationService.sendOrderNotification(order.user_id, orderId, status, {
        email: null, // Would need user email
        phone: null  // Would need user phone
      });

      // Format response with all necessary order details
      const responseData = {
        id: updatedOrder.id,
        order_number: updatedOrder.order_number,
        status: updatedOrder.status,
        order_type: updatedOrder.order_type,
        payment_method: updatedOrder.payment_method,
        payment_status: updatedOrder.payment_status,
        total_amount: updatedOrder.total_amount,
        discount_amount: updatedOrder.discount_amount,
        platform_fee: updatedOrder.platform_fee,
        delivery_fee: updatedOrder.delivery_fee,
        final_amount: updatedOrder.final_amount,
        delivery_address: updatedOrder.delivery_address,
        qr_code: updatedOrder.qr_code,
        created_at: updatedOrder.created_at,
        updated_at: updatedOrder.updated_at,
        user: updatedOrder.user,
        driver: updatedOrder.driver,
        order_items: updatedOrder.order_items,
        status_change: {
          old_status: order.status,
          new_status: status,
          changed_at: updatedOrder.updated_at
        }
      };

      res.json({
        success: true,
        message: 'Order status updated successfully',
        data: responseData
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
      const cashier = await prisma.cashier.findUnique({ where: { id: cashierId } });
      if (!cashier) {
        return res.status(404).json({
          success: false,
          message: 'Cashier not found',
          error: 'Cashier profile not found'
        });
      }

      const { page = 1, limit = 20, category, available } = req.query;

      const where = { business_id: cashier.business_id };

      if (category) {
        where.category = category;
      }

      if (available !== undefined) {
        where.is_available = available === 'true';
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          orderBy: [{ category: 'asc' }, { name: 'asc' }],
          skip: (parseInt(page) - 1) * parseInt(limit),
          take: parseInt(limit)
        }),
        prisma.product.count({ where })
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
      const cashier = await prisma.cashier.findUnique({ where: { id: cashierId } });
      if (!cashier) {
        return res.status(404).json({
          success: false,
          message: 'Cashier not found',
          error: 'Cashier profile not found'
        });
      }

      // Find and update product
      // Prisma update throws if not found, but we need to ensure it belongs to the business
      const product = await prisma.product.findFirst({
        where: { id: productId, business_id: cashier.business_id }
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
          error: 'Product not found in your business'
        });
      }

      await prisma.product.update({
        where: { id: productId },
        data: {
          is_available: is_available,
          updated_at: new Date()
        }
      });

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
      const cashier = await prisma.cashier.findUnique({ where: { id: cashierId } });
      if (!cashier) {
        return res.status(404).json({
          success: false,
          message: 'Cashier not found',
          error: 'Cashier profile not found'
        });
      }

      // Find order and verify it belongs to cashier's business
      const order = await CashierController.findOrderByIdentifier(orderId, cashier.business_id);

      if (!order || order.order_items.length === 0) {
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
      if (payment_amount && Number(payment_amount) !== Number(order.final_amount)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment amount',
          error: `Payment amount must be ${order.final_amount} piastres`
        });
      }

      // Update order payment status - use the actual order id (UUID)
      await prisma.order.update({
        where: { id: order.id },
        data: {
          payment_method: payment_method || 'cash',
          payment_status: 'paid',
          updated_at: new Date()
        }
      });

      logger.info('Payment processed by cashier', {
        cashierId,
        orderId: order.id,
        orderNumber: order.order_number,
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
          orderId: order.id,
          orderNumber: order.order_number,
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
      const cashier = await prisma.cashier.findUnique({ where: { id: cashierId } });
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

      // Get orders for the day that have items from this business
      const orders = await prisma.order.findMany({
        where: {
          order_items: {
            some: {
              business_id: cashier.business_id
            }
          },
          created_at: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        include: {
          user: { select: { id: true, full_name: true } }
        }
      });

      // Calculate metrics
      const totalOrders = orders.length;
      const completedOrders = orders.filter(order => order.status === 'completed').length;
      const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;
      const paidOrders = orders.filter(order => order.payment_status === 'paid').length;

      const totalRevenue = orders
        .filter(order => order.payment_status === 'paid')
        .reduce((sum, order) => sum + Number(order.final_amount), 0);

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
          customer_name: order.user?.full_name || 'Unknown',
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
      const cashier = await prisma.cashier.findUnique({ where: { id: cashierId } });
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

      // Get statistics using aggregation - filter through order_items
      const [ordersProcessed, paymentsProcessed, revenueAgg] = await Promise.all([
        prisma.order.count({
          where: {
            order_items: {
              some: {
                business_id: cashier.business_id
              }
            },
            updated_at: { gte: start, lte: end }
          }
        }),
        prisma.order.count({
          where: {
            order_items: {
              some: {
                business_id: cashier.business_id
              }
            },
            payment_status: 'paid',
            updated_at: { gte: start, lte: end }
          }
        }),
        prisma.order.aggregate({
          where: {
            order_items: {
              some: {
                business_id: cashier.business_id
              }
            },
            payment_status: 'paid',
            updated_at: { gte: start, lte: end }
          },
          _sum: { final_amount: true }
        })
      ]);

      const stats = {
        period: {
          start: start.toISOString(),
          end: end.toISOString()
        },
        metrics: {
          orders_processed: ordersProcessed || 0,
          payments_processed: paymentsProcessed || 0,
          total_revenue: revenueAgg._sum.final_amount || 0
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
   * Get operations history
   */
  async getOperationsHistory(req, res) {
    try {
      const cashierId = req.user.id;
      const { page = 1, limit = 20, startDate, endDate } = req.query;

      // Get cashier's business
      const cashier = await prisma.cashier.findUnique({ where: { id: cashierId } });
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
        prisma.order.findMany({
          where: {
            order_items: {
              some: {
                business_id: cashier.business_id
              }
            },
            updated_at: { gte: start, lte: end }
          },
          orderBy: { updated_at: 'desc' },
          take: 50 // Limit recent history
        }),
        prisma.qRCode.findMany({
          where: {
            business_id: cashier.business_id,
            used_at: { gte: start, lte: end },
            is_used: true
          },
          orderBy: { used_at: 'desc' },
          take: 50
        }),
        prisma.order.findMany({
          where: {
            order_items: {
              some: {
                business_id: cashier.business_id
              }
            },
            payment_status: 'paid',
            updated_at: { gte: start, lte: end }
          },
          orderBy: { updated_at: 'desc' },
          take: 50
        })
      ]);

      // Combine and sort operations
      const operations = [
        ...ordersProcessed.map(o => ({
          type: 'order_update',
          date: o.updated_at,
          details: `Order #${o.order_number} status: ${o.status}`
        })),
        ...qrCodesScanned.map(q => ({
          type: 'qr_scan',
          date: q.used_at,
          details: `QR Code (${q.qr_type}) scanned`
        })),
        ...paymentsProcessed.map(p => ({
          type: 'payment_processed',
          date: p.updated_at,
          details: `Payment received for Order #${p.order_number}: ${p.final_amount}`
        }))
      ].sort((a, b) => b.date - a.date)
        .slice(0, parseInt(limit)); // Apply pagination to combined list

      res.json({
        success: true,
        message: 'Operations history retrieved successfully',
        data: {
          operations,
          period: {
            start: start.toISOString(),
            end: end.toISOString()
          }
        }
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

  /**
   * Scan QR code
   */
  async scanQRCode(req, res) {
    try {
      const cashierId = req.user.id;
      const { qr_token, action, additional_data } = req.body;

      if (!qr_token) {
        return res.status(400).json({
          success: false,
          message: 'QR token is required',
          error: 'MISSING_QR_TOKEN'
        });
      }

      // Get cashier's business
      const cashier = await prisma.cashier.findUnique({ where: { id: cashierId } });
      if (!cashier) {
        return res.status(404).json({
          success: false,
          message: 'Cashier not found',
          error: 'Cashier profile not found'
        });
      }

      // Use QR service to scan QR code
      const { qrService } = require('../services');
      const scanResult = await qrService.scanQR(
        qr_token,
        cashierId,
        action || 'process',
        {
          ...additional_data,
          scannerType: 'cashier',
          business_id: cashier.business_id,
          cashier_id: cashierId
        }
      );

      if (!scanResult.success) {
        return res.status(scanResult.statusCode || 400).json({
          success: false,
          message: scanResult.message,
          error: scanResult.error,
          data: scanResult.data
        });
      }

      res.json({
        success: true,
        message: scanResult.message || 'QR code scanned successfully',
        data: scanResult.data || scanResult
      });

    } catch (error) {
      logger.error('Cashier scan QR error', {
        cashierId: req.user?.id,
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        message: 'Failed to scan QR code',
        error: error.message
      });
    }
  }

  /**
   * Get operations history
   */
  /**
   * Get operations history
   */
  async getOperationsHistory(req, res) {
    try {
      const cashierId = req.user.id;
      const { page = 1, limit = 20, startDate, endDate } = req.query;

      // Get cashier's business
      const cashier = await prisma.cashier.findUnique({ where: { id: cashierId } });
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
        prisma.order.findMany({
          where: {
            order_items: {
              some: {
                business_id: cashier.business_id
              }
            },
            updated_at: { gte: start, lte: end }
          },
          orderBy: { updated_at: 'desc' },
          take: 50 // Limit recent history
        }),
        prisma.qRCode.findMany({
          where: {
            business_id: cashier.business_id,
            used_at: { gte: start, lte: end },
            is_used: true
          },
          orderBy: { used_at: 'desc' },
          take: 50
        }),
        prisma.order.findMany({
          where: {
            order_items: {
              some: {
                business_id: cashier.business_id
              }
            },
            payment_status: 'paid',
            updated_at: { gte: start, lte: end }
          },
          orderBy: { updated_at: 'desc' },
          take: 50
        })
      ]);

      // Combine and sort operations
      const operations = [
        ...ordersProcessed.map(o => ({
          type: 'order_update',
          date: o.updated_at,
          details: `Order #${o.order_number} status: ${o.status}`
        })),
        ...qrCodesScanned.map(q => ({
          type: 'qr_scan',
          date: q.used_at,
          details: `QR Code (${q.qr_type}) scanned`
        })),
        ...paymentsProcessed.map(p => ({
          type: 'payment_processed',
          date: p.updated_at,
          details: `Payment received for Order #${p.order_number}: ${p.final_amount}`
        }))
      ].sort((a, b) => b.date - a.date)
        .slice(0, parseInt(limit)); // Apply pagination to combined list

      res.json({
        success: true,
        message: 'Operations history retrieved successfully',
        data: {
          operations,
          period: {
            start: start.toISOString(),
            end: end.toISOString()
          }
        }
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
