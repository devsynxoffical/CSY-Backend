// const { Op } = require('sequelize'); // Commented out - using MongoDB only
const { prisma } = require('../models');
const CacheService = require('../services/cache.service');
const { notificationService, emailService, smsService } = require('../services');
const { logger } = require('../utils');
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../config/constants');

/**
 * Reservation Controller - Handles reservation booking and management
 */
class ReservationController {
  /**
   * Create a new reservation
   */
  async createReservation(req, res) {
    try {
      const userId = req.user.id;
      const {
        business_id,
        reservation_type,
        date,
        time,
        duration,
        number_of_people,
        payment_method,
        notes,
        specialty
      } = req.body;

      // Validate business exists and accepts reservations
      const business = await prisma.business.findUnique({ where: { id: business_id } });

      if (!business) {
        return res.status(404).json({
          success: false,
          message: 'Business not found',
          error: ERROR_MESSAGES.BUSINESS_NOT_FOUND
        });
      }

      if (!business.has_reservations) {
        return res.status(400).json({
          success: false,
          message: 'Business does not accept reservations',
          error: 'This business does not offer reservation services'
        });
      }

      // Check availability
      const isAvailable = await this.checkAvailability(business_id, date, time, duration);
      if (!isAvailable) {
        return res.status(409).json({
          success: false,
          message: 'Time slot not available',
          error: 'The requested time slot is already booked'
        });
      }

      // Calculate reservation details
      const reservationDate = new Date(date);
      const [hours, minutes] = time.split(':');
      reservationDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const endTime = new Date(reservationDate);
      endTime.setMinutes(endTime.getMinutes() + duration);

      // Create reservation
      const reservation = await prisma.reservation.create({
        data: {
          user_id: userId,
          business_id,
          reservation_type,
          specialty,
          date: reservationDate,
          time,
          duration,
          number_of_people,
          payment_method,
          payment_status: 'pending',
          status: 'pending',
          notes
        }
      });

      logger.info('Reservation created successfully', {
        reservationId: reservation.id,
        userId,
        businessId: business_id,
        date,
        time
      });

      // Send confirmation notifications
      try {
        await notificationService.sendReservationNotification(
          userId,
          reservation.id,
          'confirmed',
          {
            businessName: business.business_name,
            date: reservationDate.toLocaleDateString(),
            time
          },
          {
            email: req.user.email,
            phone: null // Would need to get from user profile
          }
        );
      } catch (notificationError) {
        logger.error('Failed to send reservation notification', {
          reservationId: reservation.id,
          error: notificationError.message
        });
      }

      res.status(201).json({
        success: true,
        message: 'Reservation created successfully',
        data: {
          reservation: {
            id: reservation.id,
            business_id,
            reservation_type,
            date: reservationDate.toISOString().split('T')[0],
            time,
            duration,
            number_of_people,
            status: reservation.status,
            payment_status: reservation.payment_status,
            created_at: reservation.created_at
          }
        }
      });
    } catch (error) {
      logger.error('Reservation creation failed', {
        userId: req.user?.id,
        businessId: req.body.business_id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Reservation creation failed',
        error: error.message
      });
    }
  }

  /**
   * Get user reservations
   */
  async getUserReservations(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, status, upcoming } = req.query;

      const whereClause = { user_id: userId };

      if (status) {
        whereClause.status = status;
      }

      if (upcoming === 'true') {
        whereClause.date = {
          [Op.gte]: new Date()
        };
      }

      const [reservations, total] = await Promise.all([
        prisma.reservation.findMany({
          where: whereClause,
          include: {
            business: {
              select: {
                id: true,
                business_name: true,
                business_type: true,
                address: true,
                phone: true // Note: phone might not be in Business model, check schema
              }
            }
          },
          orderBy: [
            { date: 'desc' },
            { time: 'desc' }
          ],
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
      logger.error('Get user reservations failed', {
        userId: req.user?.id,
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
   * Get reservation details
   */
  async getReservation(req, res) {
    try {
      const userId = req.user.id;
      const reservationId = req.params.id;

      const reservation = await prisma.reservation.findUnique({
        where: { id: reservationId },
        include: {
          business: {
            select: {
              id: true,
              business_name: true,
              business_type: true,
              address: true,
              city: true,
              // phone: true, // Check schema
              working_hours: true
            }
          }
          // Rating include is complex in Prisma if not directly related, checking schema
        }
      });

      // Check user ownership manually if not using composite key in where
      if (reservation && reservation.user_id !== userId) {
        return res.status(404).json({
          success: false,
          message: 'Reservation not found',
          error: 'Reservation not found or does not belong to you'
        });
      }

      if (!reservation) {
        return res.status(404).json({
          success: false,
          message: 'Reservation not found',
          error: 'Reservation not found or does not belong to you'
        });
      }

      res.json({
        success: true,
        message: 'Reservation details retrieved successfully',
        data: reservation
      });
    } catch (error) {
      logger.error('Get reservation details failed', {
        userId: req.user?.id,
        reservationId: req.params.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve reservation details',
        error: error.message
      });
    }
  }

  /**
   * Update reservation
   */
  async updateReservation(req, res) {
    try {
      const userId = req.user.id;
      const reservationId = req.params.id;
      const updates = req.body;

      // Find reservation
      const reservation = await prisma.reservation.findUnique({
        where: { id: reservationId }
      });

      if (!reservation || reservation.user_id !== userId) {
        return res.status(404).json({
          success: false,
          message: 'Reservation not found',
          error: 'Reservation not found or does not belong to you'
        });
      }

      // Check if reservation can be updated
      if (!['pending', 'confirmed'].includes(reservation.status)) {
        return res.status(400).json({
          success: false,
          message: 'Reservation cannot be updated',
          error: `Cannot update reservation with status: ${reservation.status}`
        });
      }

      // Validate updates
      const allowedFields = ['time', 'duration', 'number_of_people', 'notes'];
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

      // If time or duration is being updated, check availability
      if (filteredUpdates.time || filteredUpdates.duration) {
        const newTime = filteredUpdates.time || reservation.time;
        const newDuration = filteredUpdates.duration || reservation.duration;

        const isAvailable = await this.checkAvailability(
          reservation.business_id,
          reservation.date,
          newTime,
          newDuration,
          reservationId // Exclude current reservation
        );

        if (!isAvailable) {
          return res.status(409).json({
            success: false,
            message: 'New time slot not available',
            error: 'The requested time slot is already booked'
          });
        }
      }

      // Update reservation
      filteredUpdates.updated_at = new Date();
      await prisma.reservation.update({
        where: { id: reservationId },
        data: filteredUpdates
      });

      logger.info('Reservation updated successfully', {
        reservationId,
        userId,
        updatedFields: Object.keys(filteredUpdates)
      });

      res.json({
        success: true,
        message: 'Reservation updated successfully',
        data: reservation
      });
    } catch (error) {
      logger.error('Reservation update failed', {
        userId: req.user?.id,
        reservationId: req.params.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Reservation update failed',
        error: error.message
      });
    }
  }

  /**
   * Cancel reservation
   */
  async cancelReservation(req, res) {
    try {
      const userId = req.user.id;
      const reservationId = req.params.id;
      const { reason } = req.body;

      // Find reservation
      const reservation = await prisma.reservation.findUnique({
        where: { id: reservationId },
        include: { business: { select: { business_name: true } } }
      });

      if (!reservation || reservation.user_id !== userId) {
        return res.status(404).json({
          success: false,
          message: 'Reservation not found',
          error: 'Reservation not found or does not belong to you'
        });
      }

      // Check if reservation can be cancelled
      if (reservation.status === 'cancelled') {
        return res.status(400).json({
          success: false,
          message: 'Reservation already cancelled',
          error: 'This reservation has already been cancelled'
        });
      }

      if (reservation.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel completed reservation',
          error: 'Completed reservations cannot be cancelled'
        });
      }

      // Check cancellation policy (within 24 hours)
      const reservationDateTime = new Date(reservation.date);
      const [hours, minutes] = reservation.time.split(':');
      reservationDateTime.setHours(parseInt(hours), parseInt(minutes));

      const now = new Date();
      const hoursUntilReservation = (reservationDateTime - now) / (1000 * 60 * 60);

      if (hoursUntilReservation < 24 && reservation.status === 'confirmed') {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel reservation',
          error: 'Reservations cannot be cancelled within 24 hours of the booking time'
        });
      }

      // Update reservation status
      await prisma.reservation.update({
        where: { id: reservationId },
        data: {
          status: 'cancelled',
          notes: reason ? `${reservation.notes || ''}\nCancellation reason: ${reason}`.trim() : reservation.notes,
          updated_at: new Date()
        }
      });

      logger.info('Reservation cancelled successfully', {
        reservationId,
        userId,
        reason: reason || 'Not specified'
      });

      // Send cancellation notifications
      try {
        await notificationService.sendReservationNotification(
          userId,
          reservationId,
          'cancelled',
          {
            businessName: reservation.Business?.business_name || 'Business'
          },
          {
            email: req.user.email,
            phone: null
          }
        );
      } catch (notificationError) {
        logger.error('Failed to send cancellation notification', {
          reservationId,
          error: notificationError.message
        });
      }

      res.json({
        success: true,
        message: 'Reservation cancelled successfully',
        data: {
          reservationId,
          status: 'cancelled',
          cancelled_at: new Date(),
          refund_eligible: hoursUntilReservation >= 24
        }
      });
    } catch (error) {
      logger.error('Reservation cancellation failed', {
        userId: req.user?.id,
        reservationId: req.params.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Reservation cancellation failed',
        error: error.message
      });
    }
  }

  /**
   * Get available time slots for a business
   */
  async getAvailableSlots(req, res) {
    try {
      const { businessId, date, duration = 60 } = req.query;

      if (!businessId || !date) {
        return res.status(400).json({
          success: false,
          message: 'Business ID and date are required',
          error: 'Missing required parameters'
        });
      }

      // Validate business
      const business = await Business.findOne({ where: { id: businessId } });

      if (!business) {
        return res.status(404).json({
          success: false,
          message: 'Business not found',
          error: ERROR_MESSAGES.BUSINESS_NOT_FOUND
        });
      }

      if (!business.has_reservations) {
        return res.status(400).json({
          success: false,
          message: 'Business does not accept reservations',
          error: 'This business does not offer reservation services'
        });
      }

      // Get available time slots
      const availableSlots = await this.getAvailableTimeSlots(businessId, date, duration);

      res.json({
        success: true,
        message: 'Available time slots retrieved successfully',
        data: {
          business_id: businessId,
          date,
          duration: parseInt(duration),
          available_slots: availableSlots
        }
      });
    } catch (error) {
      logger.error('Get available slots failed', {
        businessId: req.query.businessId,
        date: req.query.date,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve available slots',
        error: error.message
      });
    }
  }

  /**
   * Rate a completed reservation
   */
  async rateReservation(req, res) {
    try {
      const userId = req.user.id;
      const reservationId = req.params.id;
      const { stars, comment } = req.body;

      // Find reservation
      const reservation = await prisma.reservation.findUnique({
        where: { id: reservationId }
      });

      if (!reservation || reservation.user_id !== userId) {
        return res.status(404).json({
          success: false,
          message: 'Reservation not found',
          error: 'Reservation not found or does not belong to you'
        });
      }

      if (reservation.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Cannot rate reservation',
          error: 'Only completed reservations can be rated'
        });
      }

      // Check if already rated
      const existingRating = await prisma.rating.findFirst({
        where: {
          user_id: userId,
          reservation_id: reservationId
        }
      });

      if (existingRating) {
        return res.status(409).json({
          success: false,
          message: 'Reservation already rated',
          error: 'You have already rated this reservation'
        });
      }

      // Create rating
      const rating = await prisma.rating.create({
        data: {
          user_id: userId,
          business_id: reservation.business_id,
          reservation_id: reservationId,
          stars: parseInt(stars),
          comment: comment || null,
          is_moderated: false
        }
      });

      logger.info('Reservation rated successfully', {
        reservationId,
        userId,
        stars,
        businessId: reservation.business_id
      });

      res.status(201).json({
        success: true,
        message: 'Reservation rated successfully',
        data: rating
      });
    } catch (error) {
      logger.error('Reservation rating failed', {
        userId: req.user?.id,
        reservationId: req.params.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Reservation rating failed',
        error: error.message
      });
    }
  }

  // Helper methods

  async checkAvailability(businessId, date, time, duration, excludeReservationId = null) {
    try {
      const reservationDate = new Date(date);
      const [hours, minutes] = time.split(':');
      reservationDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const endTime = new Date(reservationDate);
      endTime.setMinutes(endTime.getMinutes() + duration);

      // Check for conflicting reservations
      const whereClause = {
        business_id: businessId,
        date: reservationDate,
        status: { in: ['pending', 'confirmed'] }
      };

      if (excludeReservationId) {
        whereClause.id = { not: excludeReservationId };
      }

      const conflictingReservations = await prisma.reservation.findMany({
        where: whereClause
      });

      // Check for time overlaps
      for (const reservation of conflictingReservations) {
        const existingStart = new Date(reservation.date);
        const [existingHours, existingMinutes] = reservation.time.split(':');
        existingStart.setHours(parseInt(existingHours), parseInt(existingMinutes), 0, 0);

        const existingEnd = new Date(existingStart);
        existingEnd.setMinutes(existingEnd.getMinutes() + reservation.duration);

        // Check for overlap
        if (reservationDate < existingEnd && endTime > existingStart) {
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error('Availability check failed', {
        businessId,
        date,
        time,
        error: error.message
      });
      return false;
    }
  }

  async getAvailableTimeSlots(businessId, date, duration) {
    try {
      const business = await prisma.business.findUnique({ where: { id: businessId } });

      if (!business) {
        return res.status(404).json({
          success: false,
          message: 'Business not found',
          error: ERROR_MESSAGES.BUSINESS_NOT_FOUND
        });
      }

      if (!business.has_reservations) {
        return res.status(400).json({
          success: false,
          message: 'Business does not accept reservations',
          error: 'This business does not offer reservation services'
        });
      }

      if (!business.working_hours) {
        return [];
      }

      // Parse working hours for the day
      const dayOfWeek = new Date(date).toLocaleLowerCase('en-US', { weekday: 'long' });
      const workingHours = business.working_hours[dayOfWeek];

      if (!workingHours || workingHours === 'closed') {
        return []; // Business closed on this day
      }

      const [startTime, endTime] = workingHours.split('-');
      const slots = this.generateTimeSlots(startTime.trim(), endTime.trim(), duration);

      // Filter out booked slots
      const availableSlots = [];

      for (const slot of slots) {
        const isAvailable = await this.checkAvailability(businessId, date, slot, duration);
        if (isAvailable) {
          availableSlots.push(slot);
        }
      }

      return availableSlots;
    } catch (error) {
      logger.error('Get available time slots failed', {
        businessId,
        date,
        error: error.message
      });
      return [];
    }
  }

  generateTimeSlots(startTime, endTime, duration) {
    const slots = [];
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    // Generate slots every 30 minutes (configurable)
    const slotInterval = 30; // minutes

    for (let minutes = startMinutes; minutes + duration <= endMinutes; minutes += slotInterval) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const timeString = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
      slots.push(timeString);
    }

    return slots;
  }
}

module.exports = new ReservationController();
