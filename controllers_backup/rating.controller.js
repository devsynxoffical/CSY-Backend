const { Rating, Business, Driver, User, Reservation, Order } = require('../models');
const { notificationService } = require('../services');
const { logger } = require('../utils');
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../config/constants');

/**
 * Rating Controller - Handles rating submission and retrieval operations
 */
class RatingController {
  /**
   * Submit a rating
   */
  async submitRating(req, res) {
    try {
      const userId = req.user.id;
      const {
        business_id,
        driver_id,
        reservation_id,
        order_id,
        stars,
        comment
      } = req.body;

      // Validate required fields
      if (!stars || stars < 1 || stars > 5) {
        return res.status(400).json({
          success: false,
          message: 'Stars rating is required and must be between 1 and 5',
          error: 'INVALID_STARS_RATING'
        });
      }

      // Validate that at least one reference is provided
      if (!business_id && !driver_id && !reservation_id && !order_id) {
        return res.status(400).json({
          success: false,
          message: 'At least one reference (business, driver, reservation, or order) must be provided',
          error: 'MISSING_REFERENCE'
        });
      }

      // Validate references exist
      if (business_id) {
        const business = await Business.findOne({ id: business_id });
        if (!business) {
          return res.status(404).json({
            success: false,
            message: 'Business not found',
            error: 'BUSINESS_NOT_FOUND'
          });
        }
      }

      if (driver_id) {
        const driver = await Driver.findOne({ id: driver_id });
        if (!driver) {
          return res.status(404).json({
            success: false,
            message: 'Driver not found',
            error: 'DRIVER_NOT_FOUND'
          });
        }
      }

      if (reservation_id) {
        const reservation = await Reservation.findOne({ id: reservation_id });
        if (!reservation) {
          return res.status(404).json({
            success: false,
            message: 'Reservation not found',
            error: 'RESERVATION_NOT_FOUND'
          });
        }

        // Check if user owns this reservation
        if (reservation.user_id !== userId) {
          return res.status(403).json({
            success: false,
            message: 'Access denied',
            error: 'UNAUTHORIZED_ACCESS'
          });
        }

        // Check if reservation is completed
        if (reservation.status !== 'completed') {
          return res.status(400).json({
            success: false,
            message: 'Can only rate completed reservations',
            error: 'RESERVATION_NOT_COMPLETED'
          });
        }
      }

      if (order_id) {
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

        // Check if order is completed
        if (order.status !== 'completed') {
          return res.status(400).json({
            success: false,
            message: 'Can only rate completed orders',
            error: 'ORDER_NOT_COMPLETED'
          });
        }
      }

      // Check if user already rated this entity
      const existingRating = await Rating.findOne({
        user_id: userId,
        $or: [
          business_id ? { business_id } : null,
          driver_id ? { driver_id } : null,
          reservation_id ? { reservation_id } : null,
          order_id ? { order_id } : null
        ].filter(Boolean)
      });

      if (existingRating) {
        return res.status(409).json({
          success: false,
          message: 'You have already rated this item',
          error: 'ALREADY_RATED'
        });
      }

      // Create rating
      const rating = await Rating.create({
        user_id: userId,
        business_id,
        driver_id,
        reservation_id,
        order_id,
        stars,
        comment: comment || null
      });

      // Send notification to rated entity
      try {
        let notificationTarget;
        let notificationMessage;

        if (business_id) {
          const business = await Business.findOne({ id: business_id });
          notificationTarget = business.owner_email;
          notificationMessage = `Your business received a ${stars}-star rating`;
        } else if (driver_id) {
          const driver = await Driver.findOne({ id: driver_id });
          notificationTarget = driver.email;
          notificationMessage = `You received a ${stars}-star rating`;
        }

        if (notificationTarget) {
          await notificationService.sendNotification(
            notificationTarget,
            'New Rating Received',
            notificationMessage,
            { ratingId: rating.id, stars, type: 'new_rating' }
          );
        }
      } catch (notificationError) {
        logger.error('Failed to send rating notification', {
          ratingId: rating.id,
          error: notificationError.message
        });
      }

      res.status(201).json({
        success: true,
        message: 'Rating submitted successfully',
        data: {
          id: rating.id,
          stars: rating.stars,
          comment: rating.comment,
          created_at: rating.created_at
        }
      });

    } catch (error) {
      logger.error('Submit rating error', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Failed to submit rating',
        error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
      });
    }
  }

  /**
   * Get business ratings
   */
  async getBusinessRatings(req, res) {
    try {
      const { id } = req.params;
      const {
        page = 1,
        limit = 10,
        min_stars,
        max_stars,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = req.query;

      // Validate business exists
      const business = await Business.findOne({ id });
      if (!business) {
        return res.status(404).json({
          success: false,
          message: 'Business not found',
          error: 'BUSINESS_NOT_FOUND'
        });
      }

      // Build query
      const query = { business_id: id };
      if (min_stars) query.stars = { $gte: parseInt(min_stars) };
      if (max_stars) {
        query.stars = query.stars || {};
        query.stars.$lte = parseInt(max_stars);
      }

      // Build sort
      const sort = {};
      sort[sort_by] = sort_order === 'desc' ? -1 : 1;

      const skip = (page - 1) * limit;

      // Get ratings
      const ratings = await Rating.find(query)
        .populate('user_id', 'id full_name profile_image')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Rating.countDocuments(query);

      // Calculate rating statistics
      const stats = await Rating.aggregate([
        { $match: { business_id: id } },
        {
          $group: {
            _id: null,
            average_rating: { $avg: '$stars' },
            total_ratings: { $sum: 1 },
            rating_distribution: {
              $push: '$stars'
            }
          }
        }
      ]);

      let ratingStats = {
        average_rating: 0,
        total_ratings: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };

      if (stats.length > 0) {
        const stat = stats[0];
        ratingStats.average_rating = Math.round(stat.average_rating * 10) / 10;
        ratingStats.total_ratings = stat.total_ratings;

        // Calculate distribution
        stat.rating_distribution.forEach(star => {
          ratingStats.distribution[star] = (ratingStats.distribution[star] || 0) + 1;
        });
      }

      res.json({
        success: true,
        message: 'Business ratings retrieved successfully',
        data: {
          business: {
            id: business.id,
            business_name: business.business_name
          },
          ratings: ratings.map(rating => ({
            id: rating.id,
            stars: rating.stars,
            comment: rating.comment,
            created_at: rating.created_at,
            user: rating.user_id ? {
              id: rating.user_id.id,
              full_name: rating.user_id.full_name,
              profile_image: rating.user_id.profile_image
            } : null
          })),
          statistics: ratingStats,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      logger.error('Get business ratings error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve business ratings',
        error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
      });
    }
  }

  /**
   * Get driver ratings
   */
  async getDriverRatings(req, res) {
    try {
      const { id } = req.params;
      const {
        page = 1,
        limit = 10,
        min_stars,
        max_stars,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = req.query;

      // Validate driver exists
      const driver = await Driver.findOne({ id });
      if (!driver) {
        return res.status(404).json({
          success: false,
          message: 'Driver not found',
          error: 'DRIVER_NOT_FOUND'
        });
      }

      // Build query
      const query = { driver_id: id };
      if (min_stars) query.stars = { $gte: parseInt(min_stars) };
      if (max_stars) {
        query.stars = query.stars || {};
        query.stars.$lte = parseInt(max_stars);
      }

      // Build sort
      const sort = {};
      sort[sort_by] = sort_order === 'desc' ? -1 : 1;

      const skip = (page - 1) * limit;

      // Get ratings
      const ratings = await Rating.find(query)
        .populate('user_id', 'id full_name profile_image')
        .populate('order_id', 'id order_number')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Rating.countDocuments(query);

      // Calculate rating statistics
      const stats = await Rating.aggregate([
        { $match: { driver_id: id } },
        {
          $group: {
            _id: null,
            average_rating: { $avg: '$stars' },
            total_ratings: { $sum: 1 },
            rating_distribution: {
              $push: '$stars'
            }
          }
        }
      ]);

      let ratingStats = {
        average_rating: 0,
        total_ratings: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };

      if (stats.length > 0) {
        const stat = stats[0];
        ratingStats.average_rating = Math.round(stat.average_rating * 10) / 10;
        ratingStats.total_ratings = stat.total_ratings;

        // Calculate distribution
        stat.rating_distribution.forEach(star => {
          ratingStats.distribution[star] = (ratingStats.distribution[star] || 0) + 1;
        });
      }

      res.json({
        success: true,
        message: 'Driver ratings retrieved successfully',
        data: {
          driver: {
            id: driver.id,
            full_name: driver.full_name,
            profile_image: driver.profile_image
          },
          ratings: ratings.map(rating => ({
            id: rating.id,
            stars: rating.stars,
            comment: rating.comment,
            created_at: rating.created_at,
            order: rating.order_id ? {
              id: rating.order_id.id,
              order_number: rating.order_id.order_number
            } : null,
            user: rating.user_id ? {
              id: rating.user_id.id,
              full_name: rating.user_id.full_name,
              profile_image: rating.user_id.profile_image
            } : null
          })),
          statistics: ratingStats,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      logger.error('Get driver ratings error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve driver ratings',
        error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
      });
    }
  }
}

module.exports = new RatingController();
