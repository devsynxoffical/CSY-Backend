const bcrypt = require('bcryptjs');
const { prisma } = require('../models');
const CacheService = require('../services/cache.service');
const { generateToken } = require('../utils');
const { notificationService } = require('../services');
const { logger } = require('../utils');
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../config/constants');

/**
 * Driver Controller - Handles driver profile and delivery operations
 */
class DriverController {
  /**
   * Register a new driver
   */
  async register(req, res) {
    try {
      const {
        full_name,
        email,
        phone,
        vehicle_type,
        password_hash
      } = req.body;

      // Check if driver already exists
      const existingDriver = await Driver.findOne({
        OR: [{ email }, { phone }]
      });

      if (existingDriver) {
        return res.status(409).json({
          success: false,
          message: 'Driver already exists',
          error: existingDriver.email === email ? 'Email already registered' : 'Phone number already registered'
        });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password_hash, saltRounds);

      // Create driver
      const driver = await prisma.driver.create({
        data: {
          full_name,
          email: email.toLowerCase(),
          phone,
          vehicle_type,
          password_hash: hashedPassword,
          is_active: true,
          is_available: false
        }
      });

      // Generate JWT token
      const token = generateToken(driver.id);

      logger.info('Driver registered successfully', { driverId: driver.id, name: driver.full_name });

      // Remove password from response
      const driverResponse = {
        id: driver.id,
        full_name: driver.full_name,
        email: driver.email,
        phone: driver.phone,
        vehicle_type: driver.vehicle_type,
        profile_picture: driver.profile_picture,
        earnings_cash: driver.earnings_cash,
        earnings_online: driver.earnings_online,
        platform_fees_owed: driver.platform_fees_owed,
        is_available: driver.is_available,
        is_active: driver.is_active,
        rating_average: driver.rating_average,
        rating_count: driver.rating_count,
        created_at: driver.created_at
      };

      res.status(201).json({
        success: true,
        message: SUCCESS_MESSAGES.PROFILE_UPDATED,
        data: {
          driver: driverResponse,
          token
        }
      });
    } catch (error) {
      logger.error('Driver registration failed', {
        email: req.body.email,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Driver registration failed',
        error: error.message
      });
    }
  }

  /**
   * Driver login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find driver by email
      const driver = await prisma.driver.findUnique({ where: { email: email.toLowerCase() } });

      if (!driver) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
          error: ERROR_MESSAGES.INVALID_CREDENTIALS
        });
      }

      if (!driver.is_active) {
        return res.status(401).json({
          success: false,
          message: 'Driver account is deactivated',
          error: 'Please contact support to reactivate your account'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, driver.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
          error: ERROR_MESSAGES.INVALID_CREDENTIALS
        });
      }

      // Generate JWT token
      const token = generateToken(driver.id);

      // Update last login
      // Update last login
      await prisma.driver.update({
        where: { id: driver.id },
        data: { updated_at: new Date() }
      });

      // Driver response (without password)
      const driverResponse = {
        id: driver.id,
        full_name: driver.full_name,
        email: driver.email,
        phone: driver.phone,
        vehicle_type: driver.vehicle_type,
        profile_picture: driver.profile_picture,
        earnings_cash: driver.earnings_cash,
        earnings_online: driver.earnings_online,
        platform_fees_owed: driver.platform_fees_owed,
        current_latitude: driver.current_latitude,
        current_longitude: driver.current_longitude,
        is_available: driver.is_available,
        is_active: driver.is_active,
        rating_average: driver.rating_average,
        rating_count: driver.rating_count
      };

      logger.info('Driver logged in successfully', { driverId: driver.id, name: driver.full_name });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          driver: driverResponse,
          token
        }
      });
    } catch (error) {
      logger.error('Driver login failed', {
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
   * Get driver profile
   */
  async getProfile(req, res) {
    try {
      const driverId = req.user.id;

      const driver = await prisma.driver.findUnique({ where: { id: driverId } });

      if (!driver) {
        return res.status(404).json({
          success: false,
          message: 'Driver not found',
          error: 'Driver profile not found'
        });
      }

      // Get additional driver data
      const [activeOrders, completedToday, ratingsSummary] = await Promise.all([
        prisma.order.findMany({
          where: {
            driver_id: driverId,
            status: { in: ['accepted', 'preparing', 'waiting_driver', 'in_delivery'] }
          },
          include: {
            user: {
              select: { id: true, full_name: true, phone: true }
            }
          },
          orderBy: { created_at: 'desc' }
        }),
        (async () => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          return await prisma.order.count({
            where: {
              driver_id: driverId,
              status: 'delivered',
              actual_delivery_time: {
                gte: today,
                lt: tomorrow
              }
            }
          });
        })(),
        (async () => {
          const aggregate = await prisma.rating.aggregate({
            where: { driver_id: driverId },
            _avg: { rating: true },
            _count: { rating: true }
          });

          return {
            average: aggregate._avg.rating ? aggregate._avg.rating.toFixed(1) : 0,
            total: aggregate._count.rating || 0
          };
        })()
      ]);

      const driverProfile = {
        id: driver.id,
        full_name: driver.full_name,
        email: driver.email,
        phone: driver.phone,
        vehicle_type: driver.vehicle_type,
        profile_picture: driver.profile_picture,
        earnings_cash: driver.earnings_cash,
        earnings_online: driver.earnings_online,
        platform_fees_owed: driver.platform_fees_owed,
        current_latitude: driver.current_latitude,
        current_longitude: driver.current_longitude,
        is_available: driver.is_available,
        is_active: driver.is_active,
        rating_average: driver.rating_average,
        rating_count: driver.rating_count,
        created_at: driver.created_at,
        updated_at: driver.updated_at,
        // Additional computed data
        stats: {
          active_orders: activeOrders.length,
          completed_today: completedToday,
          ratings_summary: ratingsSummary
        },
        active_orders: activeOrders
      };

      res.json({
        success: true,
        message: 'Driver profile retrieved successfully',
        data: driverProfile
      });
    } catch (error) {
      logger.error('Get driver profile failed', {
        driverId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve driver profile',
        error: error.message
      });
    }
  }

  /**
   * Update driver profile
   */
  async updateProfile(req, res) {
    try {
      const driverId = req.user.id;
      const updates = req.body;

      // Fields that can be updated
      const allowedFields = [
        'full_name',
        'phone',
        'vehicle_type',
        'profile_picture'
      ];

      // Filter out non-allowed fields
      const filteredUpdates = {};
      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          filteredUpdates[key] = updates[key];
        }
      });

      if (Object.keys(filteredUpdates).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update',
          error: 'Please provide at least one valid field to update'
        });
      }

      // Update driver
      filteredUpdates.updated_at = new Date();

      const updatedDriver = await Driver.findOneAndUpdate(
        { id: driverId },
        filteredUpdates,
        { new: true }
      );

      if (!updatedDriver) {
        return res.status(404).json({
          success: false,
          message: 'Driver not found',
          error: 'Driver profile not found'
        });
      }

      const driverResponse = {
        id: updatedDriver.id,
        full_name: updatedDriver.full_name,
        email: updatedDriver.email,
        phone: updatedDriver.phone,
        vehicle_type: updatedDriver.vehicle_type,
        profile_picture: updatedDriver.profile_picture,
        earnings_cash: updatedDriver.earnings_cash,
        earnings_online: updatedDriver.earnings_online,
        platform_fees_owed: updatedDriver.platform_fees_owed,
        current_latitude: updatedDriver.current_latitude,
        current_longitude: updatedDriver.current_longitude,
        is_available: updatedDriver.is_available,
        is_active: updatedDriver.is_active,
        rating_average: updatedDriver.rating_average,
        rating_count: updatedDriver.rating_count,
        updated_at: updatedDriver.updated_at
      };

      logger.info('Driver profile updated successfully', {
        driverId,
        updatedFields: Object.keys(filteredUpdates)
      });

      res.json({
        success: true,
        message: SUCCESS_MESSAGES.PROFILE_UPDATED,
        data: driverResponse
      });
    } catch (error) {
      logger.error('Driver profile update failed', {
        driverId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Driver profile update failed',
        error: error.message
      });
    }
  }

  /**
   * Update driver location
   */
  async updateLocation(req, res) {
    try {
      const driverId = req.user.id;
      const { latitude, longitude } = req.body;

      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: 'Location coordinates are required',
          error: 'Please provide both latitude and longitude'
        });
      }

      // Validate coordinates
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({
          success: false,
          message: 'Invalid coordinates',
          error: 'Latitude must be between -90 and 90, longitude between -180 and 180'
        });
      }

      // Update location
      await Driver.findOneAndUpdate(
        { id: driverId },
        {
          current_latitude: latitude,
          current_longitude: longitude,
          updated_at: new Date()
        }
      );

      logger.info('Driver location updated', { driverId, latitude, longitude });

      res.json({
        success: true,
        message: 'Location updated successfully',
        data: {
          latitude,
          longitude,
          updated_at: new Date()
        }
      });
    } catch (error) {
      logger.error('Driver location update failed', {
        driverId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Location update failed',
        error: error.message
      });
    }
  }

  /**
   * Update driver availability status
   */
  async updateAvailability(req, res) {
    try {
      const driverId = req.user.id;
      const { is_available } = req.body;

      if (typeof is_available !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'Invalid availability status',
          error: 'is_available must be a boolean value'
        });
      }

      // Update availability
      await Driver.findOneAndUpdate(
        { id: driverId },
        {
          is_available: is_available,
          updated_at: new Date()
        }
      );

      logger.info('Driver availability updated', { driverId, is_available });

      res.json({
        success: true,
        message: `Driver is now ${is_available ? 'available' : 'unavailable'}`,
        data: {
          is_available,
          updated_at: new Date()
        }
      });
    } catch (error) {
      logger.error('Driver availability update failed', {
        driverId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Availability update failed',
        error: error.message
      });
    }
  }

  /**
   * Get driver orders
   */
  /**
   * Get driver orders
   */
  async getOrders(req, res) {
    try {
      const driverId = req.user.id;
      const { page = 1, limit = 20, status } = req.query;

      const where = { driver_id: driverId };

      if (status) {
        where.status = status;
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            user: {
              select: { id: true, full_name: true, phone: true }
            }
          },
          orderBy: { created_at: 'desc' },
          skip: (parseInt(page) - 1) * parseInt(limit),
          take: parseInt(limit)
        }),
        prisma.order.count({ where })
      ]);

      res.json({
        success: true,
        message: 'Driver orders retrieved successfully',
        data: {
          orders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      logger.error('Get driver orders failed', {
        driverId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve driver orders',
        error: error.message
      });
    }
  }

  /**
   * Accept order assignment
   */
  async acceptOrder(req, res) {
    try {
      const driverId = req.user.id;
      const orderId = req.params.id;

      // Find order
      const order = await prisma.order.findUnique({
        where: {
          id: orderId,
          driver_id: driverId
        }
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
          error: 'Order not assigned to this driver'
        });
      }

      if (order.status !== 'waiting_driver') {
        return res.status(400).json({
          success: false,
          message: 'Order cannot be accepted',
          error: `Order is already ${order.status}`
        });
      }

      // Update order status
      // Update order status
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'in_delivery',
          updated_at: new Date()
        }
      });

      logger.info('Driver accepted order', { driverId, orderId });

      // Notify user
      await notificationService.sendOrderNotification(order.user_id, orderId, 'accepted', {
        email: null, // Would need to fetch user email
        phone: null  // Would need to fetch user phone
      });

      res.json({
        success: true,
        message: 'Order accepted successfully',
        data: {
          orderId,
          status: 'in_delivery',
          accepted_at: new Date()
        }
      });
    } catch (error) {
      logger.error('Order acceptance failed', {
        driverId: req.user?.id,
        orderId: req.params.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Order acceptance failed',
        error: error.message
      });
    }
  }

  /**
   * Mark order as delivered
   */
  async deliverOrder(req, res) {
    try {
      const driverId = req.user.id;
      const orderId = req.params.id;

      // Find order
      const order = await prisma.order.findUnique({
        where: {
          id: orderId,
          driver_id: driverId
        }
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
          error: 'Order not assigned to this driver'
        });
      }

      if (order.status !== 'in_delivery') {
        return res.status(400).json({
          success: false,
          message: 'Order cannot be marked as delivered',
          error: `Order status is ${order.status}`
        });
      }

      // Update order status
      // Update order status
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'delivered',
          actual_delivery_time: new Date(),
          updated_at: new Date()
        }
      });

      logger.info('Order marked as delivered', { driverId, orderId });

      // Notify user
      await notificationService.sendOrderNotification(order.user_id, orderId, 'delivered', {
        email: null,
        phone: null
      });

      res.json({
        success: true,
        message: 'Order marked as delivered successfully',
        data: {
          orderId,
          status: 'delivered',
          delivered_at: new Date()
        }
      });
    } catch (error) {
      logger.error('Order delivery update failed', {
        driverId: req.user?.id,
        orderId: req.params.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Order delivery update failed',
        error: error.message
      });
    }
  }

  /**
   * Get available/incoming orders for driver
   */
  /**
   * Get available/incoming orders for driver
   */
  async getOrdersIncoming(req, res) {
    try {
      const driverId = req.user.id;
      const { page = 1, limit = 10, latitude, longitude } = req.query;

      // Get driver's current location if available
      const driver = await prisma.driver.findUnique({ where: { id: driverId } });
      const driverLat = latitude || driver?.current_latitude;
      const driverLng = longitude || driver?.current_longitude;

      // Find orders that are ready for pickup (preparing status) without assigned driver
      const where = {
        status: 'preparing',
        driver_id: null
      };

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            user: {
              select: { id: true, full_name: true, phone: true }
            },
            business: {
              select: { business_name: true, address: true, latitude: true, longitude: true }
            }
          },
          orderBy: { created_at: 'desc' },
          skip: (parseInt(page) - 1) * parseInt(limit),
          take: parseInt(limit)
        }),
        prisma.order.count({ where })
      ]);

      res.json({
        success: true,
        message: 'Incoming orders retrieved successfully',
        data: {
          orders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      logger.error('Get incoming orders failed', {
        driverId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve incoming orders',
        error: error.message
      });
    }
  }

  /**
   * Reject order assignment
   */
  async rejectOrder(req, res) {
    try {
      const driverId = req.user.id;
      const orderId = req.params.id;

      // Find order
      const order = await prisma.order.findUnique({
        where: {
          id: orderId,
          driver_id: driverId,
          status: 'waiting_driver'
        }
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
          error: 'Order not assigned to this driver or not in waiting status'
        });
      }

      // Remove driver assignment and set back to preparing status
      // Remove driver assignment and set back to preparing status
      await prisma.order.update({
        where: { id: orderId },
        data: {
          driver_id: null,
          status: 'preparing',
          updated_at: new Date()
        }
      });

      logger.info('Driver rejected order', { driverId, orderId });

      res.json({
        success: true,
        message: 'Order rejected successfully',
        data: {
          orderId,
          status: 'preparing',
          rejected_at: new Date()
        }
      });
    } catch (error) {
      logger.error('Order rejection failed', {
        driverId: req.user?.id,
        orderId: req.params.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Order rejection failed',
        error: error.message
      });
    }
  }

  /**
   * Get accepted orders
   */
  /**
   * Get accepted orders
   */
  async getOrdersAccepted(req, res) {
    try {
      const driverId = req.user.id;
      const { page = 1, limit = 20 } = req.query;

      const where = {
        driver_id: driverId,
        status: { in: ['accepted', 'preparing'] }
      };

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            user: {
              select: { id: true, full_name: true, phone: true }
            },
            business: {
              select: { business_name: true, address: true, latitude: true, longitude: true }
            }
          },
          orderBy: { created_at: 'desc' },
          skip: (parseInt(page) - 1) * parseInt(limit),
          take: parseInt(limit)
        }),
        prisma.order.count({ where })
      ]);

      res.json({
        success: true,
        message: 'Accepted orders retrieved successfully',
        data: {
          orders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      logger.error('Get accepted orders failed', {
        driverId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve accepted orders',
        error: error.message
      });
    }
  }

  /**
   * Get orders in delivery
   */
  /**
   * Get orders in delivery
   */
  async getOrdersInDelivery(req, res) {
    try {
      const driverId = req.user.id;
      const { page = 1, limit = 20 } = req.query;

      const where = {
        driver_id: driverId,
        status: 'in_delivery'
      };

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            user: {
              select: { id: true, full_name: true, phone: true }
            },
            business: {
              select: { business_name: true, address: true, latitude: true, longitude: true }
            }
          },
          orderBy: { created_at: 'desc' },
          skip: (parseInt(page) - 1) * parseInt(limit),
          take: parseInt(limit)
        }),
        prisma.order.count({ where })
      ]);

      res.json({
        success: true,
        message: 'Orders in delivery retrieved successfully',
        data: {
          orders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      logger.error('Get orders in delivery failed', {
        driverId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve orders in delivery',
        error: error.message
      });
    }
  }

  /**
   * Get driver operations log
   */
  /**
   * Get driver operations log
   */
  async getOperationsLog(req, res) {
    try {
      const driverId = req.user.id;
      const { page = 1, limit = 50, startDate, endDate } = req.query;

      // Get recent orders for this driver
      const where = { driver_id: driverId };
      if (startDate || endDate) {
        where.updated_at = {};
        if (startDate) where.updated_at.gte = new Date(startDate);
        if (endDate) where.updated_at.lte = new Date(endDate);
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            user: {
              select: { full_name: true }
            },
            business: {
              select: { business_name: true }
            }
          },
          orderBy: { updated_at: 'desc' },
          skip: (parseInt(page) - 1) * parseInt(limit),
          take: parseInt(limit)
        }),
        prisma.order.count({ where })
      ]);

      // Format operations
      const operations = orders.map(order => ({
        id: `order_${order.id}`,
        type: 'delivery',
        operation: `${order.status} order #${order.order_number}`,
        customer: order.user?.full_name || 'Unknown',
        business: order.business?.business_name || 'Unknown',
        timestamp: order.updated_at || order.created_at,
        reference_id: order.id
      }));

      res.json({
        success: true,
        message: 'Operations log retrieved successfully',
        data: {
          operations,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      logger.error('Get operations log failed', {
        driverId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve operations log',
        error: error.message
      });
    }
  }

  /**
   * Get driver analytics/performance reports
   */
  async getAnalytics(req, res) {
    try {
      const driverId = req.user.id;
      const { startDate, endDate, reportType = 'summary' } = req.query;

      // Default to last 30 days
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      let analytics = {};

      switch (reportType) {
        case 'deliveries':
          analytics = await this.getDeliveryAnalytics(driverId, start, end);
          break;
        case 'earnings':
          analytics = await this.getEarningsAnalytics(driverId, start, end);
          break;
        case 'ratings':
          analytics = await this.getDriverRatingAnalytics(driverId, start, end);
          break;
        default:
          analytics = await this.getDriverSummaryAnalytics(driverId, start, end);
      }

      res.json({
        success: true,
        message: 'Driver analytics retrieved successfully',
        data: {
          period: {
            start: start.toISOString(),
            end: end.toISOString(),
            report_type: reportType
          },
          analytics
        }
      });
    } catch (error) {
      logger.error('Get driver analytics failed', {
        driverId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve analytics',
        error: error.message
      });
    }
  }

  // Helper methods for analytics

  async getDriverSummaryAnalytics(driverId, startDate, endDate) {
    const [deliveries, earnings, ratings] = await Promise.all([
      this.getDeliveryAnalytics(driverId, startDate, endDate),
      this.getEarningsAnalytics(driverId, startDate, endDate),
      this.getDriverRatingAnalytics(driverId, startDate, endDate)
    ]);

    return {
      deliveries: deliveries.total_deliveries,
      total_earnings: earnings.total_earnings,
      average_rating: ratings.average_rating,
      completion_rate: deliveries.completion_rate,
      period_summary: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    };
  }

  async getDeliveryAnalytics(driverId, startDate, endDate) {
    const [total, completed, cancelled] = await Promise.all([
      prisma.order.count({
        where: {
          driver_id: driverId,
          created_at: { gte: startDate, lte: endDate }
        }
      }),
      prisma.order.count({
        where: {
          driver_id: driverId,
          status: 'delivered',
          created_at: { gte: startDate, lte: endDate }
        }
      }),
      prisma.order.count({
        where: {
          driver_id: driverId,
          status: 'cancelled',
          created_at: { gte: startDate, lte: endDate }
        }
      })
    ]);

    return {
      total_deliveries: total,
      completed_deliveries: completed,
      cancelled_deliveries: cancelled,
      completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }

  async getEarningsAnalytics(driverId, startDate, endDate) {
    const aggregate = await prisma.order.aggregate({
      where: {
        driver_id: driverId,
        status: 'delivered',
        actual_delivery_time: { gte: startDate, lte: endDate }
      },
      _sum: { final_amount: true },
      _count: { id: true },
      _avg: { final_amount: true }
    });

    return {
      total_earnings: aggregate._sum.final_amount || 0,
      delivery_count: aggregate._count.id || 0,
      average_earning: Math.round(aggregate._avg.final_amount || 0)
    };
  }

  async getDriverRatingAnalytics(driverId, startDate, endDate) {
    const aggregate = await prisma.rating.aggregate({
      where: {
        driver_id: driverId,
        created_at: { gte: startDate, lte: endDate }
      },
      _avg: { rating: true },
      _count: { rating: true }
    });

    return {
      average_rating: aggregate._avg.rating ? aggregate._avg.rating.toFixed(1) : 0,
      total_ratings: aggregate._count.rating || 0
    };
  }

  /**
   * Get driver earnings
   */
  async getEarnings(req, res) {
    try {
      const driverId = req.user.id;
      const { startDate, endDate } = req.query;

      // Default to current month
      const now = new Date();
      const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
      const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Get completed orders in date range
      const completedOrders = await prisma.order.findMany({
        where: {
          driver_id: driverId,
          status: 'delivered',
          actual_delivery_time: {
            gte: start,
            lte: end
          }
        },
        select: { id: true, final_amount: true, actual_delivery_time: true }
      });

      // Calculate earnings (simplified - would need actual commission logic)
      const totalEarnings = completedOrders.reduce((sum, order) => sum + (order.final_amount || 0), 0);
      const platformFees = Math.round(totalEarnings * 0.3); // 30% platform fee
      const netEarnings = totalEarnings - platformFees;

      res.json({
        success: true,
        message: 'Driver earnings retrieved successfully',
        data: {
          period: {
            start: start.toISOString(),
            end: end.toISOString()
          },
          summary: {
            total_orders: completedOrders.length,
            total_earnings: totalEarnings,
            platform_fees: platformFees,
            net_earnings: netEarnings
          },
          orders: completedOrders
        }
      });
    } catch (error) {
      logger.error('Get driver earnings failed', {
        driverId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve earnings',
        error: error.message
      });
    }
  }

  // Helper methods

  async getDriverActiveOrders(driverId) {
    return await prisma.order.findMany({
      where: {
        driver_id: driverId,
        status: { in: ['accepted', 'preparing', 'waiting_driver', 'in_delivery'] }
      },
      include: {
        user: {
          select: { id: true, full_name: true, phone: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async getDriverCompletedToday(driverId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const completedOrders = await prisma.order.count({
      where: {
        driver_id: driverId,
        status: 'delivered',
        actual_delivery_time: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    return completedOrders;
  }

  async getDriverRatingsSummary(driverId) {
    const aggregate = await prisma.rating.aggregate({
      where: { driver_id: driverId },
      _avg: { rating: true },
      _count: { rating: true }
    });

    return {
      average: aggregate._avg.rating ? aggregate._avg.rating.toFixed(1) : 0,
      total: aggregate._count.rating || 0
    };
  }
}

module.exports = new DriverController();
