const bcrypt = require('bcryptjs');
const { Business, Product, Order, Reservation, Rating, User, Cashier, Appointment } = require('../models');
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
        password_hash
      } = req.body;

      // Check if business already exists
      const existingBusiness = await Business.findOne({
        $or: [{ owner_email }, { business_name }]
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
      const hashedPassword = await bcrypt.hash(password_hash, saltRounds);

      // Create business
      const business = await Business.create({
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
      });

      // Generate JWT token
      const token = generateToken(business.id);

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

      // Find business by email
      const business = await Business.findOne({ owner_email: email.toLowerCase() });

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

      // Generate JWT token
      const token = generateToken(business.id);

      // Update last login
      business.updated_at = new Date();
      await business.save();

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

      const business = await Business.findOne({ id: businessId });

      if (!business) {
        return res.status(404).json({
          success: false,
          message: 'Business not found',
          error: ERROR_MESSAGES.BUSINESS_NOT_FOUND
        });
      }

      // Get additional business data
      const [productsCount, ordersCount, reservationsCount, ratingsSummary] = await Promise.all([
        Product.countDocuments({ business_id: businessId }),
        Order.countDocuments({ business_id: businessId }),
        Reservation.countDocuments({ business_id: businessId }),
        (async () => {
          const ratings = await Rating.aggregate([
            { $match: { business_id: businessId } },
            {
              $group: {
                _id: null,
                average: { $avg: '$stars' },
                count: { $sum: 1 },
                five_star: { $sum: { $cond: [{ $eq: ['$stars', 5] }, 1, 0] } },
                four_star: { $sum: { $cond: [{ $eq: ['$stars', 4] }, 1, 0] } },
                three_star: { $sum: { $cond: [{ $eq: ['$stars', 3] }, 1, 0] } },
                two_star: { $sum: { $cond: [{ $eq: ['$stars', 2] }, 1, 0] } },
                one_star: { $sum: { $cond: [{ $eq: ['$stars', 1] }, 1, 0] } }
              }
            }
          ]);

          return ratings[0] ? {
            average: parseFloat(ratings[0].average || 0).toFixed(1),
            total: parseInt(ratings[0].count || 0),
            breakdown: {
              5: parseInt(ratings[0].five_star || 0),
              4: parseInt(ratings[0].four_star || 0),
              3: parseInt(ratings[0].three_star || 0),
              2: parseInt(ratings[0].two_star || 0),
              1: parseInt(ratings[0].one_star || 0)
            }
          } : { average: 0, total: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
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
      const business = await Business.findOne({ id: businessId });
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

      const business = await Business.findOne({ id: businessId });
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

      await business.save();

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
      const { email, full_name, password_hash } = req.body;

      // Check if cashier with this email already exists
      const existingCashier = await Cashier.findOne({ email });
      if (existingCashier) {
        return res.status(409).json({
          success: false,
          message: 'Cashier already exists',
          error: 'A cashier with this email already exists'
        });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password_hash, saltRounds);

      // Create cashier
      const cashier = await Cashier.create({
        business_id: businessId,
        email: email.toLowerCase(),
        full_name,
        password_hash: hashedPassword,
        is_active: true
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
        Cashier.find({ business_id: businessId })
          .select('-password_hash')
          .sort({ created_at: -1 })
          .limit(parseInt(limit))
          .skip((page - 1) * parseInt(limit)),
        Cashier.countDocuments({ business_id: businessId })
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

      const updatedCashier = await Cashier.findOneAndUpdate(
        { id: cashierId, business_id: businessId },
        filteredUpdates,
        { new: true }
      ).select('-password_hash');

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

      const deletedCashier = await Cashier.findOneAndDelete({
        id: cashierId,
        business_id: businessId
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
          $gte: startOfDay,
          $lte: endOfDay
        };
      }

      if (service_name) {
        whereClause.service_name = new RegExp(service_name, 'i');
      }

      const [appointments, total] = await Promise.all([
        Appointment.find(whereClause)
          .sort({ date: -1, start_time: -1 })
          .limit(parseInt(limit))
          .skip((page - 1) * parseInt(limit)),
        Appointment.countDocuments(whereClause)
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
      const appointment = await Appointment.create({
        business_id: businessId,
        service_name,
        description,
        duration,
        price,
        date: appointmentDate,
        start_time,
        end_time,
        is_available: true
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

      const updatedAppointment = await Appointment.findOneAndUpdate(
        { id: appointmentId, business_id: businessId },
        filteredUpdates,
        { new: true }
      );

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

      const deletedAppointment = await Appointment.findOneAndDelete({
        id: appointmentId,
        business_id: businessId
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
      const product = await Product.create({
        business_id: businessId,
        category,
        name,
        description,
        ingredients,
        image,
        price,
        add_ons,
        is_available: true
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

      const updatedProduct = await Product.findOneAndUpdate(
        { id: productId, business_id: businessId },
        filteredUpdates,
        { new: true }
      );

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

      const deletedProduct = await Product.findOneAndDelete({
        id: productId,
        business_id: businessId
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
        Product.find(whereClause)
          .sort({ created_at: -1 })
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

      const whereClause = { business_id: businessId };

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

      const order = await Order.findOne({
        id: orderId,
        business_id: businessId,
        status: 'pending'
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found or cannot be accepted',
          error: 'Order does not exist, is not pending, or does not belong to your business'
        });
      }

      order.status = 'accepted';
      order.updated_at = new Date();
      await order.save();

      // Create notification for user
      try {
        const { Notification } = require('../models');
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

      const order = await Order.findOne({
        id: orderId,
        business_id: businessId,
        status: 'pending'
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found or cannot be rejected',
          error: 'Order does not exist, is not pending, or does not belong to your business'
        });
      }

      order.status = 'cancelled';
      order.updated_at = new Date();
      await order.save();

      // Create notification for user
      try {
        const { Notification } = require('../models');
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
          $gte: startOfDay,
          $lte: endOfDay
        };
      }

      const [reservations, total] = await Promise.all([
        Reservation.find(whereClause)
          .populate('user_id', 'id full_name phone')
          .sort({ date: -1, time: -1 })
          .limit(parseInt(limit))
          .skip((page - 1) * parseInt(limit)),
        Reservation.countDocuments(whereClause)
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

      const whereClause = { business_id: businessId };

      if (startDate || endDate) {
        whereClause.created_at = {};
        if (startDate) whereClause.created_at.$gte = new Date(startDate);
        if (endDate) whereClause.created_at.$lte = new Date(endDate);
      }

      if (type) {
        whereClause.transaction_type = type;
      }

      const { Transaction } = require('../models');
      const [transactions, total] = await Promise.all([
        Transaction.find(whereClause)
          .populate('user_id', 'full_name email')
          .sort({ created_at: -1 })
          .limit(parseInt(limit))
          .skip((page - 1) * parseInt(limit)),
        Transaction.countDocuments(whereClause)
      ]);

      // Calculate totals
      const totals = await Transaction.aggregate([
        { $match: whereClause },
        {
          $group: {
            _id: null,
            total_amount: { $sum: '$amount' },
            total_platform_fee: { $sum: '$platform_fee' },
            total_discount: { $sum: '$discount_amount' }
          }
        }
      ]);

      res.json({
        success: true,
        message: 'Financial records retrieved successfully',
        data: {
          transactions,
          summary: totals[0] || {
            total_amount: 0,
            total_platform_fee: 0,
            total_discount: 0
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

      // Get recent orders
      const orders = await Order.find({
        business_id: businessId,
        ...(startDate || endDate ? {
          created_at: {
            ...(startDate ? { $gte: new Date(startDate) } : {}),
            ...(endDate ? { $lte: new Date(endDate) } : {})
          }
        } : {})
      })
      .select('id order_number status created_at updated_at')
      .sort({ updated_at: -1 })
      .limit(parseInt(limit) * 0.4); // 40% for orders

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
      const reservations = await Reservation.find({
        business_id: businessId,
        ...(startDate || endDate ? {
          created_at: {
            ...(startDate ? { $gte: new Date(startDate) } : {}),
            ...(endDate ? { $lte: new Date(endDate) } : {})
          }
        } : {})
      })
      .select('id status date time created_at updated_at')
      .sort({ updated_at: -1 })
      .limit(parseInt(limit) * 0.4); // 40% for reservations

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
      const products = await Product.find({
        business_id: businessId,
        ...(startDate || endDate ? {
          updated_at: {
            ...(startDate ? { $gte: new Date(startDate) } : {}),
            ...(endDate ? { $lte: new Date(endDate) } : {})
          }
        } : {})
      })
      .select('id name updated_at')
      .sort({ updated_at: -1 })
      .limit(parseInt(limit) * 0.2); // 20% for products

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
    const ratings = await Rating.aggregate([
      { $match: { business_id: businessId } },
      {
        $group: {
          _id: null,
          average: { $avg: '$stars' },
          count: { $sum: 1 },
          five_star: { $sum: { $cond: [{ $eq: ['$stars', 5] }, 1, 0] } },
          four_star: { $sum: { $cond: [{ $eq: ['$stars', 4] }, 1, 0] } },
          three_star: { $sum: { $cond: [{ $eq: ['$stars', 3] }, 1, 0] } },
          two_star: { $sum: { $cond: [{ $eq: ['$stars', 2] }, 1, 0] } },
          one_star: { $sum: { $cond: [{ $eq: ['$stars', 1] }, 1, 0] } }
        }
      }
    ]);

    return ratings[0] ? {
      average: parseFloat(ratings[0].average || 0).toFixed(1),
      total: parseInt(ratings[0].count || 0),
      breakdown: {
        5: parseInt(ratings[0].five_star || 0),
        4: parseInt(ratings[0].four_star || 0),
        3: parseInt(ratings[0].three_star || 0),
        2: parseInt(ratings[0].two_star || 0),
        1: parseInt(ratings[0].one_star || 0)
      }
    } : { average: 0, total: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
  }

  async getOrdersMetrics(businessId, startDate, endDate) {
    const metrics = await Order.aggregate([
      {
        $match: {
          business_id: businessId,
          created_at: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          total_revenue: { $sum: '$final_amount' }
        }
      }
    ]);

    const data = metrics[0] || {};
    return {
      total: parseInt(data.total || 0),
      completed: parseInt(data.completed || 0),
      cancelled: parseInt(data.cancelled || 0),
      completion_rate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
      total_revenue: parseInt(data.total_revenue || 0)
    };
  }

  async getReservationsMetrics(businessId, startDate, endDate) {
    const metrics = await Reservation.aggregate([
      {
        $match: {
          business_id: businessId,
          created_at: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
        }
      }
    ]);

    const data = metrics[0] || {};
    return {
      total: parseInt(data.total || 0),
      completed: parseInt(data.completed || 0),
      cancelled: parseInt(data.cancelled || 0),
      completion_rate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
    };
  }

  async getRatingsMetrics(businessId, startDate, endDate) {
    const metrics = await Rating.aggregate([
      {
        $match: {
          business_id: businessId,
          created_at: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          average: { $avg: '$stars' },
          count: { $sum: 1 }
        }
      }
    ]);

    const data = metrics[0] || {};
    return {
      average: parseFloat(data.average || 0).toFixed(1),
      count: parseInt(data.count || 0)
    };
  }

  async getRevenueMetrics(businessId, startDate, endDate) {
    const metrics = await Order.aggregate([
      {
        $match: {
          business_id: businessId,
          status: 'completed',
          created_at: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$final_amount' },
          average: { $avg: '$final_amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const data = metrics[0] || {};
    return {
      total: parseInt(data.total || 0),
      average: parseFloat(data.average || 0).toFixed(2)
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
    const orders = await Order.aggregate([
      {
        $match: {
          business_id: businessId,
          created_at: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$created_at' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$final_amount' },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    return {
      daily_breakdown: orders,
      total_orders: orders.reduce((sum, day) => sum + day.count, 0),
      total_revenue: orders.reduce((sum, day) => sum + day.revenue, 0),
      completion_rate: orders.length > 0 ?
        Math.round((orders.reduce((sum, day) => sum + day.completed, 0) /
                   orders.reduce((sum, day) => sum + day.count, 0)) * 100) : 0
    };
  }

  async getRevenueAnalytics(businessId, startDate, endDate) {
    const revenue = await Order.aggregate([
      {
        $match: {
          business_id: businessId,
          status: 'completed',
          created_at: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$created_at' }
          },
          revenue: { $sum: '$final_amount' },
          orders: { $sum: 1 },
          average_order: { $avg: '$final_amount' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    return {
      daily_revenue: revenue,
      total_revenue: revenue.reduce((sum, day) => sum + day.revenue, 0),
      average_daily_revenue: revenue.length > 0 ?
        Math.round(revenue.reduce((sum, day) => sum + day.revenue, 0) / revenue.length) : 0,
      average_order_value: revenue.length > 0 ?
        Math.round(revenue.reduce((sum, day) => sum + (day.average_order || 0), 0) / revenue.length) : 0
    };
  }

  async getCustomerAnalytics(businessId, startDate, endDate) {
    const customers = await Order.aggregate([
      {
        $match: {
          business_id: businessId,
          created_at: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$user_id',
          order_count: { $sum: 1 },
          total_spent: { $sum: '$final_amount' },
          last_order: { $max: '$created_at' },
          status: { $last: '$status' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          user_id: '$_id',
          full_name: '$user.full_name',
          email: '$user.email',
          order_count: 1,
          total_spent: 1,
          last_order: 1,
          status: 1
        }
      },
      { $sort: { total_spent: -1 } },
      { $limit: 50 }
    ]);

    return {
      top_customers: customers,
      total_customers: customers.length,
      average_orders_per_customer: customers.length > 0 ?
        Math.round(customers.reduce((sum, cust) => sum + cust.order_count, 0) / customers.length) : 0,
      average_spent_per_customer: customers.length > 0 ?
        Math.round(customers.reduce((sum, cust) => sum + cust.total_spent, 0) / customers.length) : 0
    };
  }

  async getProductAnalytics(businessId, startDate, endDate) {
    const { OrderItem } = require('../models');

    const products = await OrderItem.aggregate([
      {
        $lookup: {
          from: 'orders',
          localField: 'order_id',
          foreignField: 'id',
          as: 'order'
        }
      },
      { $unwind: '$order' },
      {
        $match: {
          'order.business_id': businessId,
          'order.created_at': { $gte: startDate, $lte: endDate },
          'order.status': 'completed'
        }
      },
      {
        $group: {
          _id: '$product_id',
          total_quantity: { $sum: '$quantity' },
          total_revenue: { $sum: '$total_price' },
          order_count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          product_id: '$_id',
          name: '$product.name',
          total_quantity: 1,
          total_revenue: 1,
          order_count: 1,
          average_quantity: { $divide: ['$total_quantity', '$order_count'] }
        }
      },
      { $sort: { total_quantity: -1 } },
      { $limit: 20 }
    ]);

    return {
      top_products: products,
      total_products_sold: products.reduce((sum, prod) => sum + prod.total_quantity, 0),
      total_product_revenue: products.reduce((sum, prod) => sum + prod.total_revenue, 0)
    };
  }
}

module.exports = new BusinessController();
