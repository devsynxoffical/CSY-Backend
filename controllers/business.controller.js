const bcrypt = require('bcryptjs');
const { prisma } = require('../models');
const CacheService = require('../services/cache.service');
const { generateToken } = require('../utils');
const { emailService, notificationService } = require('../services');
const { logger } = require('../utils');
const { SUCCESS_MESSAGES, ERROR_MESSAGES, VALIDATION_RULES } = require('../config/constants');

/**
 * Business Controller - Handles business profile and management operations
 */
class BusinessController {
  /**
   * Register a new business
   */
  async register(req, res) {
    try {
      const {
        owner_email,
        business_name,
        business_type,
        app_type,
        address,
        city,
        governorate,
        latitude,
        longitude,
        password
      } = req.body;

      // Check if business already exists
      const existingBusiness = await prisma.business.findFirst({
        where: {
          OR: [{ owner_email }, { business_name }]
        }
      });

      if (existingBusiness) {
        return res.status(409).json({
          success: false,
          message: 'Business already exists',
          error: existingBusiness.owner_email === owner_email ? 'Email already registered' : 'Business name already taken'
        });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create business
      const business = await prisma.business.create({
        data: {
          owner_email: owner_email.toLowerCase(),
          business_name,
          business_type,
          app_type,
          address,
          city,
          governorate,
          latitude,
          longitude,
          password_hash: hashedPassword,
          is_active: true
        }
      });

      // Generate JWT token with role
      const token = generateToken(business.id, 'business');

      // Send welcome email
      try {
        await emailService.sendEmail(
          business.owner_email,
          'Welcome to CSY Pro - Business Account',
          `Hi there,

Welcome to CSY Pro! Your business "${business.business_name}" has been successfully registered.

You can now:
- Set up your menu and products
- Manage reservations and orders
- Track your business analytics
- Communicate with customers

Login to your dashboard to get started.

Best regards,
CSY Pro Team`,
          `Hi there,

Welcome to CSY Pro! Your business "${business.business_name}" has been successfully registered.

Login to your dashboard to get started.

Best regards,
CSY Pro Team`
        );
      } catch (emailError) {
        logger.error('Failed to send business welcome email', {
          businessId: business.id,
          error: emailError.message
        });
      }

      // Remove password from response
      const businessResponse = {
        id: business.id,
        owner_email: business.owner_email,
        business_name: business.business_name,
        business_type: business.business_type,
        app_type: business.app_type,
        address: business.address,
        city: business.city,
        governorate: business.governorate,
        latitude: business.latitude,
        longitude: business.longitude,
        rating_average: business.rating_average,
        rating_count: business.rating_count,
        is_active: business.is_active,
        created_at: business.created_at
      };

      logger.info('Business registered successfully', { businessId: business.id, name: business.business_name });

      res.status(201).json({
        success: true,
        message: SUCCESS_MESSAGES.PROFILE_UPDATED,
        data: {
          business: businessResponse,
          token
        }
      });
    } catch (error) {
      logger.error('Business registration failed', {
        email: req.body.owner_email,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Business registration failed',
        error: error.message
      });
    }
  }

  /**
   * Business login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
          error: 'MISSING_CREDENTIALS'
        });
      }

      // Find business by email
      const business = await prisma.business.findUnique({ where: { owner_email: email.toLowerCase() } });

      if (!business) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
          error: ERROR_MESSAGES.INVALID_CREDENTIALS
        });
      }

      if (!business.is_active) {
        return res.status(401).json({
          success: false,
          message: 'Business account is deactivated',
          error: 'Please contact support to reactivate your account'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, business.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
          error: ERROR_MESSAGES.INVALID_CREDENTIALS
        });
      }

      // Generate JWT token with role
      const token = generateToken(business.id, 'business');

      // Update last login
      try {
        await prisma.business.update({
          where: { id: business.id },
          data: { updated_at: new Date() }
        });
      } catch (updateError) {
        logger.warn('Failed to update last login time', { businessId: business.id, error: updateError.message });
        // Continue login even if update fails
      }

      // Business response (without password)
      const businessResponse = {
        id: business.id,
        owner_email: business.owner_email,
        business_name: business.business_name,
        business_type: business.business_type,
        app_type: business.app_type,
        address: business.address,
        city: business.city,
        governorate: business.governorate,
        latitude: business.latitude,
        longitude: business.longitude,
        working_hours: business.working_hours,
        photos: business.photos,
        videos: business.videos,
        rating_average: business.rating_average,
        rating_count: business.rating_count,
        has_reservations: business.has_reservations,
        has_delivery: business.has_delivery,
        is_active: business.is_active
      };

      logger.info('Business logged in successfully', { businessId: business.id, name: business.business_name });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          business: businessResponse,
          token
        }
      });
    } catch (error) {
      logger.error('Business login failed', {
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
   * Get all businesses with filtering
   */
  async getAllBusinesses(req, res) {
    try {
      const { city, type, app_type, search, page = 1, limit = 20 } = req.query;

      const whereClause = { is_active: true };

      if (city) whereClause.city = { contains: city, mode: 'insensitive' };
      if (type) whereClause.business_type = type;
      if (app_type) whereClause.app_type = app_type;
      if (search) {
        whereClause.OR = [
          { business_name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [businesses, total] = await Promise.all([
        prisma.business.findMany({
          where: whereClause,
          select: {
            id: true,
            business_name: true,
            business_type: true,
            app_type: true,
            address: true,
            city: true,
            governorate: true,
            latitude: true,
            longitude: true,
            rating_average: true,
            rating_count: true,
            photos: true,
            has_reservations: true,
            has_delivery: true,
            is_active: true
          },
          skip: (parseInt(page) - 1) * parseInt(limit),
          take: parseInt(limit),
          orderBy: { created_at: 'desc' }
        }),
        prisma.business.count({ where: whereClause })
      ]);

      res.json({
        success: true,
        message: 'Businesses retrieved successfully',
        data: {
          businesses,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      logger.error('Get all businesses failed', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve businesses',
        error: error.message
      });
    }
  }

  /**
   * Get public business profile
   */
  async getPublicBusinessProfile(req, res) {
    try {
      const { id } = req.params;

      const business = await prisma.business.findUnique({
        where: { id },
        select: {
          id: true,
          business_name: true,
          business_type: true,
          app_type: true,
          address: true,
          city: true,
          governorate: true,
          latitude: true,
          longitude: true,
          working_hours: true,
          photos: true,
          videos: true,
          rating_average: true,
          rating_count: true,
          has_reservations: true,
          has_delivery: true,
          is_active: true
        }
      });

      if (!business || !business.is_active) {
        return res.status(404).json({
          success: false,
          message: 'Business not found',
          error: ERROR_MESSAGES.BUSINESS_NOT_FOUND
        });
      }

      const ratingsSummary = await prisma.rating.groupBy({
        by: ['rating'],
        where: { business_id: id },
        _count: { rating: true }
      });

      res.json({
        success: true,
        message: 'Business profile retrieved successfully',
        data: {
          ...business,
          ratings_breakdown: ratingsSummary
        }
      });
    } catch (error) {
      logger.error('Get public business profile failed', {
        businessId: req.params.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve business profile',
        error: error.message
      });
    }
  }

  /**
   * Get business products (Public)
   */
  async getBusinessProducts(req, res) {
    try {
      const { id } = req.params;
      const { category, search } = req.query;

      const whereClause = {
        business_id: id,
        is_available: true
      };

      if (category) whereClause.category = category;
      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      const products = await prisma.product.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' }
      });

      res.json({
        success: true,
        message: 'products retrieved successfully',
        data: products
      });
    } catch (error) {
      logger.error('Get business products failed', {
        businessId: req.params.id,
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
   * Get business profile
   */
  async getProfile(req, res) {
    try {
      const businessId = req.business?.id || req.params.id;

      if (!businessId) {
        return res.status(400).json({
          success: false,
          message: 'Business ID is required',
          error: 'Missing business identifier'
        });
      }

      const business = await prisma.business.findUnique({ where: { id: businessId } });

      if (!business) {
        return res.status(404).json({
          success: false,
          message: 'Business not found',
          error: ERROR_MESSAGES.BUSINESS_NOT_FOUND
        });
      }

      // Get additional business data
      const [productsCount, ordersCount, reservationsCount, ratingsSummary] = await Promise.all([
        prisma.product.count({ where: { business_id: businessId } }),
        prisma.order.count({ where: { business_id: businessId } }),
        prisma.reservation.count({ where: { business_id: businessId } }),
        (async () => {
          const ratings = await prisma.rating.groupBy({
            by: ['rating'],
            where: { business_id: businessId },
            _count: { rating: true }
          });

          const aggregate = await prisma.rating.aggregate({
            where: { business_id: businessId },
            _avg: { rating: true },
            _count: { rating: true }
          });

          const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          ratings.forEach(r => {
            if (r.rating >= 1 && r.rating <= 5) {
              breakdown[r.rating] = r._count.rating;
            }
          });

          return {
            average: aggregate._avg.rating ? aggregate._avg.rating.toFixed(1) : 0,
            total: aggregate._count.rating || 0,
            breakdown
          };
        })()
      ]);

      const businessProfile = {
        id: business.id,
        owner_email: business.owner_email,
        business_name: business.business_name,
        business_type: business.business_type,
        app_type: business.app_type,
        address: business.address,
        city: business.city,
        governorate: business.governorate,
        latitude: business.latitude,
        longitude: business.longitude,
        working_hours: business.working_hours,
        photos: business.photos,
        videos: business.videos,
        rating_average: business.rating_average,
        rating_count: business.rating_count,
        has_reservations: business.has_reservations,
        has_delivery: business.has_delivery,
        is_active: business.is_active,
        created_at: business.created_at,
        updated_at: business.updated_at,
        // Additional computed data
        stats: {
          products_count: productsCount,
          orders_count: ordersCount,
          reservations_count: reservationsCount,
          ratings_summary: ratingsSummary
        }
      };

      res.json({
        success: true,
        message: 'Business profile retrieved successfully',
        data: businessProfile
      });
    } catch (error) {
      logger.error('Get business profile failed', {
        businessId: req.business?.id || req.params.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve business profile',
        error: error.message
      });
    }
  }

  /**
   * Update business working hours
   */
  async updateWorkingHours(req, res) {
    try {
      const businessId = req.business.id;
      const { working_hours } = req.body;

      if (!working_hours || typeof working_hours !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Working hours must be provided as an object',
          error: 'Invalid working hours format'
        });
      }

      // Validate working hours format
      const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      for (const day of daysOfWeek) {
        if (working_hours[day] && typeof working_hours[day] !== 'string') {
          return res.status(400).json({
            success: false,
            message: `Invalid format for ${day} working hours`,
            error: 'Working hours must be strings (e.g., "9:00-18:00" or "closed")'
          });
        }
      }

      const updatedBusiness = await Business.findOneAndUpdate(
        { id: businessId },
        {
          working_hours,
          updated_at: new Date()
        },
        { new: true }
      );

      if (!updatedBusiness) {
        return res.status(404).json({
          success: false,
          message: 'Business not found',
          error: ERROR_MESSAGES.BUSINESS_NOT_FOUND
        });
      }

      logger.info('Business working hours updated', {
        businessId,
        working_hours
      });

      res.json({
        success: true,
        message: 'Working hours updated successfully',
        data: {
          working_hours: updatedBusiness.working_hours,
          updated_at: updatedBusiness.updated_at
        }
      });
    } catch (error) {
      logger.error('Update working hours failed', {
        businessId: req.business?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to update working hours',
        error: error.message
      });
    }
  }

  /**
   * Update business profile
   */
  async updateProfile(req, res) {
    try {
      const businessId = req.business.id;
      const updates = req.body;

      // Fields that can be updated
      const allowedFields = [
        'business_name',
        'business_type',
        'address',
        'city',
        'governorate',
        'latitude',
        'longitude',
        'working_hours',
        'photos',
        'videos',
        'has_reservations',
        'has_delivery'
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

      // Update business
      filteredUpdates.updated_at = new Date();

      const updatedBusiness = await Business.findOneAndUpdate(
        { id: businessId },
        filteredUpdates,
        { new: true }
      );

      if (!updatedBusiness) {
        return res.status(404).json({
          success: false,
          message: 'Business not found',
          error: ERROR_MESSAGES.BUSINESS_NOT_FOUND
        });
      }

      const businessResponse = {
        id: updatedBusiness.id,
        owner_email: updatedBusiness.owner_email,
        business_name: updatedBusiness.business_name,
        business_type: updatedBusiness.business_type,
        app_type: updatedBusiness.app_type,
        address: updatedBusiness.address,
        city: updatedBusiness.city,
        governorate: updatedBusiness.governorate,
        latitude: updatedBusiness.latitude,
        longitude: updatedBusiness.longitude,
        working_hours: updatedBusiness.working_hours,
        photos: updatedBusiness.photos,
        videos: updatedBusiness.videos,
        rating_average: updatedBusiness.rating_average,
        rating_count: updatedBusiness.rating_count,
        has_reservations: updatedBusiness.has_reservations,
        has_delivery: updatedBusiness.has_delivery,
        is_active: updatedBusiness.is_active,
        updated_at: updatedBusiness.updated_at
      };

      logger.info('Business profile updated successfully', {
        businessId,
        updatedFields: Object.keys(filteredUpdates)
      });

      res.json({
        success: true,
        message: SUCCESS_MESSAGES.PROFILE_UPDATED,
        data: businessResponse
      });
    } catch (error) {
      logger.error('Business profile update failed', {
        businessId: req.business?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Business profile update failed',
        error: error.message
      });
    }
  }

  /**
   * Upload business photos
   */
  async uploadPhotos(req, res) {
    try {
      const businessId = req.business.id;
      const { photos } = req.body; // Array of photo URLs

      if (!photos || !Array.isArray(photos) || photos.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Photos array is required',
          error: 'Please provide at least one photo URL'
        });
      }

      // Validate photo URLs
      const urlRegex = /^https?:\/\/.+/;
      for (const photo of photos) {
        if (!urlRegex.test(photo)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid photo URL format',
            error: 'All photo URLs must start with http:// or https://'
          });
        }
      }

      // Get current business to append to existing photos
      const business = await prisma.business.findUnique({ where: { id: businessId } });
      if (!business) {
        return res.status(404).json({
          success: false,
          message: 'Business not found',
          error: ERROR_MESSAGES.BUSINESS_NOT_FOUND
        });
      }

      const updatedPhotos = [...(business.photos || []), ...photos];

      // Limit to 20 photos maximum
      if (updatedPhotos.length > 20) {
        return res.status(400).json({
          success: false,
          message: 'Too many photos',
          error: 'Maximum 20 photos allowed per business'
        });
      }

      const updatedBusiness = await Business.findOneAndUpdate(
        { id: businessId },
        {
          photos: updatedPhotos,
          updated_at: new Date()
        },
        { new: true }
      );

      logger.info('Business photos uploaded', {
        businessId,
        uploadedCount: photos.length,
        totalCount: updatedPhotos.length
      });

      res.status(201).json({
        success: true,
        message: 'Photos uploaded successfully',
        data: {
          photos: updatedBusiness.photos,
          uploaded_count: photos.length,
          total_count: updatedBusiness.photos.length
        }
      });
    } catch (error) {
      logger.error('Upload photos failed', {
        businessId: req.business?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to upload photos',
        error: error.message
      });
    }
  }

  /**
   * Delete business photo
   */
  async deletePhoto(req, res) {
    try {
      const businessId = req.business.id;
      const photoIndex = parseInt(req.params.id);

      if (isNaN(photoIndex) || photoIndex < 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid photo index',
          error: 'Photo index must be a non-negative integer'
        });
      }

      const business = await prisma.business.findUnique({ where: { id: businessId } });
      if (!business) {
        return res.status(404).json({
          success: false,
          message: 'Business not found',
          error: ERROR_MESSAGES.BUSINESS_NOT_FOUND
        });
      }

      if (!business.photos || photoIndex >= business.photos.length) {
        return res.status(404).json({
          success: false,
          message: 'Photo not found',
          error: 'Photo with the specified index does not exist'
        });
      }

      const deletedPhoto = business.photos.splice(photoIndex, 1)[0];

      await prisma.business.update({
        where: { id: businessId },
        data: { photos: business.photos }
      });

      logger.info('Business photo deleted', {
        businessId,
        deletedPhoto,
        remainingCount: business.photos.length
      });

      res.json({
        success: true,
        message: 'Photo deleted successfully',
        data: {
          deleted_photo: deletedPhoto,
          remaining_photos: business.photos.length
        }
      });
    } catch (error) {
      logger.error('Delete photo failed', {
        businessId: req.business?.id,
        photoIndex: req.params.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to delete photo',
        error: error.message
      });
    }
  }

  /**
   * Get business dashboard/analytics
   */
  async getDashboard(req, res) {
    try {
      const businessId = req.business.id;
      const { startDate, endDate } = req.query;

      // Default to last 30 days
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Get various metrics
      const [ordersMetrics, reservationsMetrics, ratingsMetrics, revenueMetrics] = await Promise.all([
        this.getOrdersMetrics(businessId, start, end),
        this.getReservationsMetrics(businessId, start, end),
        this.getRatingsMetrics(businessId, start, end),
        this.getRevenueMetrics(businessId, start, end)
      ]);

      const dashboard = {
        period: {
          start: start.toISOString(),
          end: end.toISOString()
        },
        metrics: {
          orders: ordersMetrics,
          reservations: reservationsMetrics,
          ratings: ratingsMetrics,
          revenue: revenueMetrics
        },
        summary: {
          total_orders: ordersMetrics.total,
          total_reservations: reservationsMetrics.total,
          average_rating: ratingsMetrics.average,
          total_revenue: revenueMetrics.total
        }
      };

      res.json({
        success: true,
        message: 'Dashboard data retrieved successfully',
        data: dashboard
      });
    } catch (error) {
      logger.error('Get business dashboard failed', {
        businessId: req.business?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve dashboard data',
        error: error.message
      });
    }
  }

  /**
   * Create cashier account
   */
  async createCashier(req, res) {
    try {
      const businessId = req.business.id;
      const { email, full_name, password } = req.body;

      // Check if cashier with this email already exists
      const existingCashier = await prisma.cashier.findUnique({ where: { email } });
      if (existingCashier) {
        return res.status(409).json({
          success: false,
          message: 'Cashier already exists',
          error: 'A cashier with this email already exists'
        });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create cashier
      const cashier = await prisma.cashier.create({
        data: {
          business_id: businessId,
          email: email.toLowerCase(),
          full_name,
          password_hash: hashedPassword,
          is_active: true
        }
      });

      logger.info('Cashier account created', {
        businessId,
        cashierId: cashier.id,
        email: cashier.email
      });

      // Remove password from response
      const cashierResponse = {
        id: cashier.id,
        business_id: cashier.business_id,
        email: cashier.email,
        full_name: cashier.full_name,
        is_active: cashier.is_active,
        created_at: cashier.created_at
      };

      res.status(201).json({
        success: true,
        message: 'Cashier account created successfully',
        data: cashierResponse
      });
    } catch (error) {
      logger.error('Create cashier failed', {
        businessId: req.business?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to create cashier account',
        error: error.message
      });
    }
  }

  /**
   * Get business cashiers
   */
  async getCashiers(req, res) {
    try {
      const businessId = req.business.id;
      const { page = 1, limit = 20 } = req.query;

      const [cashiers, total] = await Promise.all([
        prisma.cashier.findMany({
          where: { business_id: businessId },
          orderBy: { created_at: 'desc' },
          skip: (parseInt(page) - 1) * parseInt(limit),
          take: parseInt(limit),
          select: {
            id: true,
            business_id: true,
            email: true,
            full_name: true,
            is_active: true,
            created_at: true,
            updated_at: true
          }
        }),
        prisma.cashier.count({ where: { business_id: businessId } })
      ]);

      res.json({
        success: true,
        message: 'Cashiers retrieved successfully',
        data: {
          cashiers,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      logger.error('Get cashiers failed', {
        businessId: req.business?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve cashiers',
        error: error.message
      });
    }
  }

  /**
   * Update cashier
   */
  async updateCashier(req, res) {
    try {
      const businessId = req.business.id;
      const cashierId = req.params.id;
      const updates = req.body;

      // Allowed fields to update
      const allowedFields = ['full_name', 'is_active'];
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

      filteredUpdates.updated_at = new Date();

      const updatedCashier = await prisma.cashier.update({
        where: { id: cashierId },
        data: filteredUpdates,
        select: {
          id: true,
          business_id: true,
          email: true,
          full_name: true,
          is_active: true,
          created_at: true,
          updated_at: true
        }
      });

      if (!updatedCashier) {
        return res.status(404).json({
          success: false,
          message: 'Cashier not found',
          error: 'Cashier does not exist or does not belong to your business'
        });
      }

      logger.info('Cashier updated', {
        businessId,
        cashierId,
        updatedFields: Object.keys(filteredUpdates)
      });

      res.json({
        success: true,
        message: 'Cashier updated successfully',
        data: updatedCashier
      });
    } catch (error) {
      logger.error('Update cashier failed', {
        businessId: req.business?.id,
        cashierId: req.params.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to update cashier',
        error: error.message
      });
    }
  }

  /**
   * Delete cashier
   */
  async deleteCashier(req, res) {
    try {
      const businessId = req.business.id;
      const cashierId = req.params.id;

      const deletedCashier = await prisma.cashier.delete({
        where: { id: cashierId }
      });

      if (!deletedCashier) {
        return res.status(404).json({
          success: false,
          message: 'Cashier not found',
          error: 'Cashier does not exist or does not belong to your business'
        });
      }

      logger.info('Cashier deleted', {
        businessId,
        cashierId,
        email: deletedCashier.email
      });

      res.json({
        success: true,
        message: 'Cashier deleted successfully',
        data: {
          deleted_id: cashierId,
          deleted_at: new Date()
        }
      });
    } catch (error) {
      logger.error('Delete cashier failed', {
        businessId: req.business?.id,
        cashierId: req.params.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to delete cashier',
        error: error.message
      });
    }
  }

  /**
   * Get business appointments
   */
  async getAppointments(req, res) {
    try {
      const businessId = req.business.id;
      const { page = 1, limit = 20, date, service_name } = req.query;

      const whereClause = { business_id: businessId };

      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        whereClause.date = {
          gte: startOfDay,
          lte: endOfDay
        };
      }

      if (service_name) {
        whereClause.service_name = {
          contains: service_name,
          mode: 'insensitive'
        };
      }

      const [appointments, total] = await Promise.all([
        prisma.appointment.findMany({
          where: whereClause,
          orderBy: [{ date: 'desc' }, { time: 'desc' }],
          skip: (parseInt(page) - 1) * parseInt(limit),
          take: parseInt(limit)
        }),
        prisma.appointment.count({ where: whereClause })
      ]);

      res.json({
        success: true,
        message: 'Appointments retrieved successfully',
        data: {
          appointments,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      logger.error('Get appointments failed', {
        businessId: req.business?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve appointments',
        error: error.message
      });
    }
  }

  /**
   * Get business reservations (Alias for appointments)
   */
  async getReservations(req, res) {
    return this.getAppointments(req, res);
  }

  /**
   * Add appointment
   */
  async addAppointment(req, res) {
    try {
      const businessId = req.business.id;
      const { service_name, description, duration, price, date, start_time, end_time } = req.body;

      // Validate required fields
      if (!service_name || !duration || !price || !date || !start_time || !end_time) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
          error: 'service_name, duration, price, date, start_time, and end_time are required'
        });
      }

      // Validate date is not in the past
      const appointmentDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (appointmentDate < today) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date',
          error: 'Appointment date cannot be in the past'
        });
      }

      // Create appointment
      // Schema uses 'time' field, so we'll use start_time as the time
      const appointment = await prisma.appointment.create({
        data: {
          business_id: businessId,
          service_name,
          description,
          duration,
          price,
          date: appointmentDate,
          time: start_time, // Schema has 'time' field, not 'start_time' or 'end_time'
          is_available: true
        }
      });

      logger.info('Appointment added', {
        businessId,
        appointmentId: appointment.id,
        service: service_name,
        date: appointment.date
      });

      res.status(201).json({
        success: true,
        message: 'Appointment added successfully',
        data: appointment
      });
    } catch (error) {
      logger.error('Add appointment failed', {
        businessId: req.business?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to add appointment',
        error: error.message
      });
    }
  }

  /**
   * Update appointment
   */
  async updateAppointment(req, res) {
    try {
      const businessId = req.business.id;
      const appointmentId = req.params.id;
      const updates = req.body;

      // Allowed fields to update
      const allowedFields = [
        'service_name',
        'description',
        'duration',
        'price',
        'date',
        'start_time',
        'end_time',
        'is_available'
      ];

      const filteredUpdates = {};
      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          // Map start_time to time (schema field name)
          if (key === 'start_time') {
            filteredUpdates.time = updates[key];
          } else if (key === 'end_time') {
            // end_time is not stored in schema, we can ignore it or store it differently
            // For now, we'll ignore it since schema only has 'time' field
          } else {
            filteredUpdates[key] = updates[key];
          }
        }
      });

      if (Object.keys(filteredUpdates).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update',
          error: 'Please provide at least one valid field to update'
        });
      }

      const updatedAppointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: filteredUpdates
      });

      if (!updatedAppointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found',
          error: 'Appointment does not exist or does not belong to your business'
        });
      }

      logger.info('Appointment updated', {
        businessId,
        appointmentId,
        updatedFields: Object.keys(filteredUpdates)
      });

      res.json({
        success: true,
        message: 'Appointment updated successfully',
        data: updatedAppointment
      });
    } catch (error) {
      logger.error('Update appointment failed', {
        businessId: req.business?.id,
        appointmentId: req.params.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to update appointment',
        error: error.message
      });
    }
  }

  /**
   * Delete appointment
   */
  async deleteAppointment(req, res) {
    try {
      const businessId = req.business.id;
      const appointmentId = req.params.id;

      const deletedAppointment = await prisma.appointment.delete({
        where: { id: appointmentId }
      });

      if (!deletedAppointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found',
          error: 'Appointment does not exist or does not belong to your business'
        });
      }

      logger.info('Appointment deleted', {
        businessId,
        appointmentId,
        service: deletedAppointment.service_name
      });

      res.json({
        success: true,
        message: 'Appointment deleted successfully',
        data: {
          deleted_id: appointmentId,
          deleted_at: new Date()
        }
      });
    } catch (error) {
      logger.error('Delete appointment failed', {
        businessId: req.business?.id,
        appointmentId: req.params.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to delete appointment',
        error: error.message
      });
    }
  }

  /**
   * Add product
   */
  async addProduct(req, res) {
    try {
      const businessId = req.business.id;
      const { category, name, description, ingredients, image, price, add_ons } = req.body;

      // Validate required fields
      if (!name || !price) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
          error: 'Product name and price are required'
        });
      }

      if (price <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid price',
          error: 'Price must be greater than 0'
        });
      }

      // Create product
      const product = await prisma.product.create({
        data: {
          business_id: businessId,
          category,
          name,
          description,
          ingredients,
          image_url: image, // Schema uses image_url, not image
          price,
          // Note: add_ons is not in Product schema, stored in OrderItem preferences instead
          is_available: true
        }
      });

      logger.info('Product added', {
        businessId,
        productId: product.id,
        name: product.name,
        price: product.price
      });

      res.status(201).json({
        success: true,
        message: 'Product added successfully',
        data: product
      });
    } catch (error) {
      logger.error('Add product failed', {
        businessId: req.business?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to add product',
        error: error.message
      });
    }
  }

  /**
   * Update product
   */
  async updateProduct(req, res) {
    try {
      const businessId = req.business.id;
      const productId = req.params.id;
      const updates = req.body;

      // Allowed fields to update
      const allowedFields = [
        'category',
        'name',
        'description',
        'ingredients',
        'image',
        'price',
        'add_ons',
        'is_available'
      ];

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

      // Validate price if being updated
      if (filteredUpdates.price && filteredUpdates.price <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid price',
          error: 'Price must be greater than 0'
        });
      }

      filteredUpdates.updated_at = new Date();

      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: filteredUpdates
      });

      if (!updatedProduct) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
          error: 'Product does not exist or does not belong to your business'
        });
      }

      logger.info('Product updated', {
        businessId,
        productId,
        updatedFields: Object.keys(filteredUpdates)
      });

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: updatedProduct
      });
    } catch (error) {
      logger.error('Update product failed', {
        businessId: req.business?.id,
        productId: req.params.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to update product',
        error: error.message
      });
    }
  }

  /**
   * Delete product
   */
  async deleteProduct(req, res) {
    try {
      const businessId = req.business.id;
      const productId = req.params.id;

      const deletedProduct = await prisma.product.delete({
        where: { id: productId }
      });

      if (!deletedProduct) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
          error: 'Product does not exist or does not belong to your business'
        });
      }

      logger.info('Product deleted', {
        businessId,
        productId,
        name: deletedProduct.name
      });

      res.json({
        success: true,
        message: 'Product deleted successfully',
        data: {
          deleted_id: productId,
          deleted_at: new Date()
        }
      });
    } catch (error) {
      logger.error('Delete product failed', {
        businessId: req.business?.id,
        productId: req.params.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to delete product',
        error: error.message
      });
    }
  }

  /**
   * Get business products/menu
   */
  async getProducts(req, res) {
    try {
      const businessId = req.business.id;
      const { page = 1, limit = 20, category, available } = req.query;

      const whereClause = { business_id: businessId };

      if (category) {
        whereClause.category = category;
      }

      if (available !== undefined) {
        whereClause.is_available = available === 'true';
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where: whereClause,
          orderBy: { created_at: 'desc' },
          skip: (parseInt(page) - 1) * parseInt(limit),
          take: parseInt(limit)
        }),
        prisma.product.count({ where: whereClause })
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
      logger.error('Get business products failed', {
        businessId: req.business?.id,
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
   * Get business orders
   */
  async getOrders(req, res) {
    try {
      const businessId = req.business.id;
      const { page = 1, limit = 20, status, startDate, endDate } = req.query;

      // Order doesn't have business_id, so we filter through OrderItem
      const whereClause = {
        order_items: {
          some: {
            business_id: businessId
          }
        }
      };

      if (status) {
        whereClause.status = status;
      }

      if (startDate || endDate) {
        whereClause.created_at = {};
        if (startDate) whereClause.created_at.gte = new Date(startDate);
        if (endDate) whereClause.created_at.lte = new Date(endDate);
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where: whereClause,
          include: {
            user: {
              select: { id: true, full_name: true, phone: true }
            },
            order_items: {
              where: {
                business_id: businessId
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
        prisma.order.count({ where: whereClause })
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
      logger.error('Get business orders failed', {
        businessId: req.business?.id,
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
   * Accept order
   */
  async acceptOrder(req, res) {
    try {
      const businessId = req.business.id;
      const orderId = req.params.id;

      const order = await prisma.order.findUnique({
        where: {
          id: orderId,
          business_id: businessId,
          status: 'pending'
        }
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found or cannot be accepted',
          error: 'Order does not exist, is not pending, or does not belong to your business'
        });
      }

      // Update order status
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'accepted',
          updated_at: new Date()
        }
      });

      // Create notification for user
      try {
        const { prisma } = require('../models');
        const CacheService = require('../services/cache.service');
        await Notification.create({
          recipient_type: 'user',
          recipient_id: order.user_id,
          title: 'Order Accepted',
          message: `Your order #${order.order_number} has been accepted and is being prepared.`,
          notification_type: 'order_status',
          reference_id: order.id,
          sent_via: ['push']
        });
      } catch (notificationError) {
        logger.error('Failed to create order acceptance notification', {
          orderId,
          error: notificationError.message
        });
      }

      logger.info('Order accepted', {
        businessId,
        orderId,
        orderNumber: order.order_number
      });

      res.json({
        success: true,
        message: 'Order accepted successfully',
        data: {
          order_id: order.id,
          order_number: order.order_number,
          status: order.status,
          accepted_at: order.updated_at
        }
      });
    } catch (error) {
      logger.error('Accept order failed', {
        businessId: req.business?.id,
        orderId: req.params.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to accept order',
        error: error.message
      });
    }
  }

  /**
   * Reject order
   */
  async rejectOrder(req, res) {
    try {
      const businessId = req.business.id;
      const orderId = req.params.id;
      const { reason } = req.body;

      const order = await prisma.order.findUnique({
        where: {
          id: orderId,
          business_id: businessId,
          status: 'pending'
        }
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found or cannot be rejected',
          error: 'Order does not exist, is not pending, or does not belong to your business'
        });
      }

      // Update order status
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'cancelled',
          updated_at: new Date()
        }
      });

      // Create notification for user
      try {
        const { prisma } = require('../models');
        const CacheService = require('../services/cache.service');
        await Notification.create({
          recipient_type: 'user',
          recipient_id: order.user_id,
          title: 'Order Cancelled',
          message: `Your order #${order.order_number} has been cancelled. ${reason || 'Please contact the business for more details.'}`,
          notification_type: 'order_status',
          reference_id: order.id,
          sent_via: ['push']
        });
      } catch (notificationError) {
        logger.error('Failed to create order rejection notification', {
          orderId,
          error: notificationError.message
        });
      }

      logger.info('Order rejected', {
        businessId,
        orderId,
        orderNumber: order.order_number,
        reason: reason || 'Not specified'
      });

      res.json({
        success: true,
        message: 'Order rejected successfully',
        data: {
          order_id: order.id,
          order_number: order.order_number,
          status: order.status,
          reason: reason || 'Not specified',
          rejected_at: order.updated_at
        }
      });
    } catch (error) {
      logger.error('Reject order failed', {
        businessId: req.business?.id,
        orderId: req.params.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to reject order',
        error: error.message
      });
    }
  }

  /**
   * Get business reservations
   */
  async getReservations(req, res) {
    try {
      const businessId = req.business.id;
      const { page = 1, limit = 20, status, date } = req.query;

      const whereClause = { business_id: businessId };

      if (status) {
        whereClause.status = status;
      }

      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        whereClause.date = {
          gte: startOfDay,
          lte: endOfDay
        };
      }

      const [reservations, total] = await Promise.all([
        prisma.reservation.findMany({
          where: whereClause,
          include: {
            user: {
              select: { id: true, full_name: true, phone: true }
            }
          },
          orderBy: [{ date: 'desc' }, { time: 'desc' }],
          skip: (parseInt(page) - 1) * parseInt(limit),
          take: parseInt(limit)
        }),
        prisma.reservation.count({ where: whereClause })
      ]);

      res.json({
        success: true,
        message: 'Reservations retrieved successfully',
        data: {
          reservations,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      logger.error('Get business reservations failed', {
        businessId: req.business?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve reservations',
        error: error.message
      });
    }
  }

  /**
   * Get business analytics/reports
   */
  async getAnalytics(req, res) {
    try {
      const businessId = req.business.id;
      const { startDate, endDate, reportType = 'summary' } = req.query;

      // Default to last 30 days
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      let analytics = {};

      switch (reportType) {
        case 'orders':
          analytics = await this.getDetailedOrderAnalytics(businessId, start, end);
          break;
        case 'revenue':
          analytics = await this.getRevenueAnalytics(businessId, start, end);
          break;
        case 'customers':
          analytics = await this.getCustomerAnalytics(businessId, start, end);
          break;
        case 'products':
          analytics = await this.getProductAnalytics(businessId, start, end);
          break;
        default:
          analytics = await this.getSummaryAnalytics(businessId, start, end);
      }

      res.json({
        success: true,
        message: 'Analytics retrieved successfully',
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
      logger.error('Get analytics failed', {
        businessId: req.business?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve analytics',
        error: error.message
      });
    }
  }

  /**
   * Get financial records
   */
  async getFinancials(req, res) {
    try {
      const businessId = req.business.id;
      const { page = 1, limit = 20, startDate, endDate, type } = req.query;

      const where = { business_id: businessId };

      if (startDate || endDate) {
        where.created_at = {};
        if (startDate) where.created_at.gte = new Date(startDate);
        if (endDate) where.created_at.lte = new Date(endDate);
      }

      if (type) {
        where.transaction_type = type;
      }

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          include: {
            user: { select: { full_name: true, email: true } }
          },
          orderBy: { created_at: 'desc' },
          skip: (parseInt(page) - 1) * parseInt(limit),
          take: parseInt(limit)
        }),
        prisma.transaction.count({ where })
      ]);

      // Calculate totals
      const totals = await prisma.transaction.aggregate({
        where,
        _sum: {
          amount: true,
          platform_fee: true,
          discount_amount: true
        }
      });

      res.json({
        success: true,
        message: 'Financial records retrieved successfully',
        data: {
          transactions,
          summary: {
            total_amount: totals._sum.amount || 0,
            total_platform_fee: totals._sum.platform_fee || 0,
            total_discount: totals._sum.discount_amount || 0
          },
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      logger.error('Get financials failed', {
        businessId: req.business?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve financial records',
        error: error.message
      });
    }
  }

  /**
   * Get operations log/history
   */
  async getOperationsLog(req, res) {
    try {
      const businessId = req.business.id;
      const { page = 1, limit = 50, startDate, endDate, operation_type } = req.query;

      // For now, we'll aggregate from multiple collections
      // In a real application, you might have a dedicated operations log collection
      const operations = [];

      // Helper to build date filter
      const dateFilter = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
      const hasDateFilter = startDate || endDate;

      // Get recent orders
      const orders = await prisma.order.findMany({
        where: {
          business_id: businessId,
          ...(hasDateFilter ? { created_at: dateFilter } : {})
        },
        select: { id: true, order_number: true, status: true, created_at: true, updated_at: true },
        orderBy: { updated_at: 'desc' },
        take: Math.ceil(parseInt(limit) * 0.4) // 40% for orders
      });

      orders.forEach(order => {
        operations.push({
          id: `order_${order.id}`,
          type: 'order',
          operation: `${order.status} order #${order.order_number}`,
          timestamp: order.updated_at || order.created_at,
          reference_id: order.id
        });
      });

      // Get recent reservations
      const reservations = await prisma.reservation.findMany({
        where: {
          business_id: businessId,
          ...(hasDateFilter ? { created_at: dateFilter } : {})
        },
        select: { id: true, status: true, date: true, time: true, created_at: true, updated_at: true },
        orderBy: { updated_at: 'desc' },
        take: Math.ceil(parseInt(limit) * 0.4) // 40% for reservations
      });

      reservations.forEach(reservation => {
        operations.push({
          id: `reservation_${reservation.id}`,
          type: 'reservation',
          operation: `${reservation.status} reservation for ${reservation.date.toDateString()} ${reservation.time}`,
          timestamp: reservation.updated_at || reservation.created_at,
          reference_id: reservation.id
        });
      });

      // Get recent product changes
      const products = await prisma.product.findMany({
        where: {
          business_id: businessId,
          ...(hasDateFilter ? { updated_at: dateFilter } : {})
        },
        select: { id: true, name: true, updated_at: true },
        orderBy: { updated_at: 'desc' },
        take: Math.ceil(parseInt(limit) * 0.2) // 20% for products
      });

      products.forEach(product => {
        operations.push({
          id: `product_${product.id}`,
          type: 'product',
          operation: `Updated product: ${product.name}`,
          timestamp: product.updated_at,
          reference_id: product.id
        });
      });

      // Sort all operations by timestamp and paginate
      operations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      const startIndex = (page - 1) * parseInt(limit);
      const endIndex = startIndex + parseInt(limit);
      const paginatedOperations = operations.slice(startIndex, endIndex);

      res.json({
        success: true,
        message: 'Operations log retrieved successfully',
        data: {
          operations: paginatedOperations,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: operations.length,
            totalPages: Math.ceil(operations.length / limit)
          }
        }
      });
    } catch (error) {
      logger.error('Get operations log failed', {
        businessId: req.business?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve operations log',
        error: error.message
      });
    }
  }

  // Helper methods

  async getBusinessRatingsSummary(businessId) {
    const [aggStats, distStats] = await Promise.all([
      prisma.rating.aggregate({
        where: { business_id: businessId },
        _avg: { stars: true },
        _count: true
      }),
      prisma.rating.groupBy({
        by: ['stars'],
        where: { business_id: businessId },
        _count: true
      })
    ]);

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    distStats.forEach(item => {
      breakdown[item.stars] = item._count;
    });

    return {
      average: parseFloat(aggStats._avg.stars || 0).toFixed(1),
      total: aggStats._count,
      breakdown
    };
  }

  async getOrdersMetrics(businessId, startDate, endDate) {
    // Order doesn't have business_id, filter through OrderItem
    const baseWhere = {
      order_items: {
        some: {
          business_id: businessId
        }
      },
      created_at: { gte: startDate, lte: endDate }
    };

    const [total, completed, cancelled, revenue] = await Promise.all([
      prisma.order.count({ where: baseWhere }),
      prisma.order.count({ where: { ...baseWhere, status: 'completed' } }),
      prisma.order.count({ where: { ...baseWhere, status: 'cancelled' } }),
      prisma.order.aggregate({
        where: baseWhere,
        _sum: { final_amount: true }
      })
    ]);

    return {
      total,
      completed,
      cancelled,
      completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      total_revenue: revenue._sum.final_amount || 0
    };
  }

  async getReservationsMetrics(businessId, startDate, endDate) {
    const where = {
      business_id: businessId,
      created_at: { gte: startDate, lte: endDate }
    };

    const [total, completed, cancelled] = await Promise.all([
      prisma.reservation.count({ where }),
      prisma.reservation.count({ where: { ...where, status: 'completed' } }),
      prisma.reservation.count({ where: { ...where, status: 'cancelled' } })
    ]);

    return {
      total,
      completed,
      cancelled,
      completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }

  async getRatingsMetrics(businessId, startDate, endDate) {
    const stats = await prisma.rating.aggregate({
      where: {
        business_id: businessId,
        created_at: { gte: startDate, lte: endDate }
      },
      _avg: { stars: true },
      _count: true
    });

    return {
      average: parseFloat(stats._avg.stars || 0).toFixed(1),
      count: stats._count
    };
  }

  async getRevenueMetrics(businessId, startDate, endDate) {
    // Order doesn't have business_id, filter through OrderItem
    const stats = await prisma.order.aggregate({
      where: {
        order_items: {
          some: {
            business_id: businessId
          }
        },
        status: 'completed',
        created_at: { gte: startDate, lte: endDate }
      },
      _sum: { final_amount: true },
      _avg: { final_amount: true },
      _count: true
    });

    return {
      total: stats._sum.final_amount || 0,
      average: parseFloat(stats._avg.final_amount || 0).toFixed(2)
    };
  }

  async getSummaryAnalytics(businessId, startDate, endDate) {
    const [orders, reservations, revenue, ratings] = await Promise.all([
      this.getOrdersMetrics(businessId, startDate, endDate),
      this.getReservationsMetrics(businessId, startDate, endDate),
      this.getRevenueMetrics(businessId, startDate, endDate),
      this.getRatingsMetrics(businessId, startDate, endDate)
    ]);

    return {
      orders,
      reservations,
      revenue,
      ratings,
      overall: {
        total_revenue: revenue.total,
        total_orders: orders.total,
        total_reservations: reservations.total,
        average_rating: ratings.average
      }
    };
  }

  async getDetailedOrderAnalytics(businessId, startDate, endDate) {
    // Fetch all relevant orders
    const orders = await prisma.order.findMany({
      where: {
        business_id: businessId,
        created_at: { gte: startDate, lte: endDate }
      },
      select: {
        created_at: true,
        final_amount: true,
        status: true
      }
    });

    // Group by date in JS
    const dailyMap = new Map();

    orders.forEach(order => {
      const dateStr = order.created_at.toISOString().split('T')[0];
      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, {
          _id: dateStr,
          count: 0,
          revenue: 0,
          completed: 0,
          cancelled: 0
        });
      }
      const dayStats = dailyMap.get(dateStr);
      dayStats.count++;
      dayStats.revenue += Number(order.final_amount);
      if (order.status === 'completed') dayStats.completed++;
      if (order.status === 'cancelled') dayStats.cancelled++;
    });

    const dailyBreakdown = Array.from(dailyMap.values()).sort((a, b) => a._id.localeCompare(b._id));

    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;

    return {
      daily_breakdown: dailyBreakdown,
      total_orders: totalOrders,
      total_revenue: orders.reduce((sum, o) => sum + Number(o.final_amount), 0),
      completion_rate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0
    };
  }

  async getRevenueAnalytics(businessId, startDate, endDate) {
    // Fetch completed orders
    const orders = await prisma.order.findMany({
      where: {
        business_id: businessId,
        status: 'completed',
        created_at: { gte: startDate, lte: endDate }
      },
      select: {
        created_at: true,
        final_amount: true
      }
    });

    // Group by date in JS
    const dailyMap = new Map();

    orders.forEach(order => {
      const dateStr = order.created_at.toISOString().split('T')[0];
      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, {
          _id: dateStr,
          revenue: 0,
          orders: 0,
          average_order: 0 // Calculated later
        });
      }
      const dayStats = dailyMap.get(dateStr);
      dayStats.revenue += Number(order.final_amount);
      dayStats.orders++;
    });

    const dailyRevenue = Array.from(dailyMap.values()).map(day => ({
      ...day,
      average_order: day.orders > 0 ? day.revenue / day.orders : 0
    })).sort((a, b) => a._id.localeCompare(b._id));

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.final_amount), 0);

    return {
      daily_revenue: dailyRevenue,
      total_revenue: totalRevenue,
      average_daily_revenue: dailyRevenue.length > 0 ? Math.round(totalRevenue / dailyRevenue.length) : 0,
      average_order_value: orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0
    };
  }

  async getCustomerAnalytics(businessId, startDate, endDate) {
    // Fetch orders with user details
    const orders = await prisma.order.findMany({
      where: {
        business_id: businessId,
        created_at: { gte: startDate, lte: endDate }
      },
      include: {
        user: {
          select: { id: true, full_name: true, email: true }
        }
      }
    });

    // Group by user
    const userMap = new Map();

    orders.forEach(order => {
      if (!order.user) return; // Skip if no user (shouldn't happen usually)

      const userId = order.user.id;
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          user_id: userId,
          full_name: order.user.full_name,
          email: order.user.email,
          order_count: 0,
          total_spent: 0,
          last_order: order.created_at,
          status: order.status
        });
      }
      const userStats = userMap.get(userId);
      userStats.order_count++;
      userStats.total_spent += Number(order.final_amount);
      if (new Date(order.created_at) > new Date(userStats.last_order)) {
        userStats.last_order = order.created_at;
        userStats.status = order.status;
      }
    });

    const topCustomers = Array.from(userMap.values())
      .sort((a, b) => b.total_spent - a.total_spent)
      .slice(0, 50);

    const totalCustomers = userMap.size;
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + Number(o.final_amount), 0);

    return {
      top_customers: topCustomers,
      total_customers: totalCustomers,
      average_orders_per_customer: totalCustomers > 0 ? Math.round(totalOrders / totalCustomers) : 0,
      average_spent_per_customer: totalCustomers > 0 ? Math.round(totalSpent / totalCustomers) : 0
    };
  }

  async getProductAnalytics(businessId, startDate, endDate) {
    // Fetch order items for completed orders in this business
    // We need to fetch orders first, then their items, or use a deep include
    const orders = await prisma.order.findMany({
      where: {
        business_id: businessId,
        status: 'completed',
        created_at: { gte: startDate, lte: endDate }
      },
      include: {
        order_items: {
          include: {
            product: { select: { id: true, name: true } }
          }
        }
      }
    });

    // Flatten items and group by product
    const productMap = new Map();

    orders.forEach(order => {
      order.order_items.forEach(item => {
        const productId = item.product_id;
        if (!productMap.has(productId)) {
          productMap.set(productId, {
            product_id: productId,
            name: item.product?.name || 'Unknown Product',
            total_quantity: 0,
            total_revenue: 0,
            order_count: 0
          });
        }
        const prodStats = productMap.get(productId);
        prodStats.total_quantity += item.quantity;
        prodStats.total_revenue += Number(item.price) * item.quantity;
        prodStats.order_count++;
      });
    });

    const topProducts = Array.from(productMap.values())
      .map(p => ({
        ...p,
        average_quantity: p.order_count > 0 ? p.total_quantity / p.order_count : 0
      }))
      .sort((a, b) => b.total_quantity - a.total_quantity)
      .slice(0, 20);

    const totalQuantity = Array.from(productMap.values()).reduce((sum, p) => sum + p.total_quantity, 0);
    const totalRevenue = Array.from(productMap.values()).reduce((sum, p) => sum + p.total_revenue, 0);

    return {
      top_products: topProducts,
      total_products_sold: totalQuantity,
      total_product_revenue: totalRevenue
    };
  }


  /**
   * Create category
   */
  async createCategory(req, res) {
    try {
      const businessId = req.business.id;
      const { name, image_url, order } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Category name is required',
          error: 'Missing required field: name'
        });
      }

      const category = await prisma.category.create({
        data: {
          business_id: businessId,
          name,
          image_url,
          order: order || 0,
          is_active: true
        }
      });

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category
      });
    } catch (error) {
      logger.error('Create category failed', { businessId: req.business.id, error: error.message });
      res.status(500).json({ success: false, message: 'Failed to create category', error: error.message });
    }
  }

  /**
   * Get business categories
   */
  async getCategories(req, res) {
    try {
      const businessId = req.business.id;
      const categories = await prisma.category.findMany({
        where: { business_id: businessId, is_active: true },
        orderBy: { order: 'asc' }
      });

      res.json({
        success: true,
        message: 'Categories retrieved successfully',
        data: categories
      });
    } catch (error) {
      logger.error('Get categories failed', { businessId: req.business.id, error: error.message });
      res.status(500).json({ success: false, message: 'Failed to retrieve categories', error: error.message });
    }
  }

  /**
   * Update category
   */
  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name, image_url, order, is_active } = req.body;

      const category = await prisma.category.update({
        where: { id },
        data: { name, image_url, order, is_active, updated_at: new Date() }
      });

      res.json({
        success: true,
        message: 'Category updated successfully',
        data: category
      });
    } catch (error) {
      logger.error('Update category failed', { categoryId: req.params.id, error: error.message });
      res.status(500).json({ success: false, message: 'Failed to update category', error: error.message });
    }
  }

  /**
   * Delete category
   */
  async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      await prisma.category.delete({ where: { id } });
      res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
      logger.error('Delete category failed', { categoryId: req.params.id, error: error.message });
      res.status(500).json({ success: false, message: 'Failed to delete category', error: error.message });
    }
  }

  /**
   * Create offer
   */
  async createOffer(req, res) {
    try {
      const businessId = req.business.id;
      const { title, description, image_url, discount_percentage, start_date, end_date } = req.body;

      if (!title || !discount_percentage || !start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields for offer',
          error: 'title, discount_percentage, start_date, and end_date are required'
        });
      }

      const offer = await prisma.offer.create({
        data: {
          business_id: businessId,
          title,
          description,
          image_url,
          discount_percentage,
          start_date: new Date(start_date),
          end_date: new Date(end_date),
          is_active: true
        }
      });

      res.status(201).json({
        success: true,
        message: 'Offer created successfully',
        data: offer
      });
    } catch (error) {
      logger.error('Create offer failed', { businessId: req.business.id, error: error.message });
      res.status(500).json({ success: false, message: 'Failed to create offer', error: error.message });
    }
  }

  /**
   * Get business offers
   */
  async getOffers(req, res) {
    try {
      const businessId = req.business.id;
      const offers = await prisma.offer.findMany({
        where: { business_id: businessId },
        orderBy: { created_at: 'desc' }
      });

      res.json({
        success: true,
        message: 'Offers retrieved successfully',
        data: offers
      });
    } catch (error) {
      logger.error('Get offers failed', { businessId: req.business.id, error: error.message });
      res.status(500).json({ success: false, message: 'Failed to retrieve offers', error: error.message });
    }
  }

  /**
   * Update offer
   */
  async updateOffer(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Convert dates if present
      if (updates.start_date) updates.start_date = new Date(updates.start_date);
      if (updates.end_date) updates.end_date = new Date(updates.end_date);
      updates.updated_at = new Date();

      const offer = await prisma.offer.update({
        where: { id },
        data: updates
      });

      res.json({
        success: true,
        message: 'Offer updated successfully',
        data: offer
      });
    } catch (error) {
      logger.error('Update offer failed', { offerId: req.params.id, error: error.message });
      res.status(500).json({ success: false, message: 'Failed to update offer', error: error.message });
    }
  }

  /**
   * Delete offer
   */
  async deleteOffer(req, res) {
    try {
      const { id } = req.params;
      await prisma.offer.delete({ where: { id } });
      res.json({ success: true, message: 'Offer deleted successfully' });
    } catch (error) {
      logger.error('Delete offer failed', { offerId: req.params.id, error: error.message });
      res.status(500).json({ success: false, message: 'Failed to delete offer', error: error.message });
    }
  }
}

module.exports = new BusinessController();
