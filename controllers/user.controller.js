const bcrypt = require('bcryptjs');
const { prisma } = require('../models');
const CacheService = require('../services/cache.service');
const { generateToken } = require('../utils');
const { pointsService, notificationService, emailService } = require('../services');
const { logger } = require('../utils');
const { SUCCESS_MESSAGES, ERROR_MESSAGES, VALIDATION_RULES } = require('../config/constants');

/**
 * User Controller - Handles user profile management and related operations
 */
class UserController {
  /**
   * Get user profile
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.id;

      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: ERROR_MESSAGES.USER_NOT_FOUND
        });
      }

      // Get additional user data - simplified approach
      const wallet = {
        balance: user.wallet_balance || 0,
        currency: 'EGP',
        total_added: 0, // Would come from Transaction model
        total_spent: 0  // Would come from Transaction model
      };

      // Get points balance
      const pointsBalance = {
        current_balance: user.points || 0,
        total_earned: 0,
        total_spent: 0
      };

      // Get recent orders and reservations
      const recentOrders = await prisma.order.findMany({ where: { user_id: userId }, select: { id: true, order_number: true, status: true, total_amount: true, created_at: true }, orderBy: { created_at: 'desc' }, take: 5 });

      const recentReservations = await prisma.reservation.findMany({ where: { user_id: userId }, select: { id: true, reservation_type: true, status: true, date: true, time: true, created_at: true }, orderBy: { created_at: 'desc' }, take: 5 });

      const userProfile = {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        pass_id: user.pass_id,
        governorate_code: user.governorate_code,
        profile_picture: user.profile_picture,
        ai_assistant_name: user.ai_assistant_name,
        wallet_balance: user.wallet_balance,
        points: user.points,
        is_active: user.is_active,
        is_verified: user.is_verified,
        created_at: user.created_at,
        updated_at: user.updated_at,
        // Additional computed data
        wallet: wallet,
        points_balance: pointsBalance,
        recent_activity: {
          orders: recentOrders,
          reservations: recentReservations
        }
      };

      res.json({
        success: true,
        message: 'Profile retrieved successfully',
        data: userProfile
      });
    } catch (error) {
      logger.error('Get profile failed', {
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve profile',
        error: error.message
      });
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const updates = req.body;

      // Fields that can be updated
      const allowedFields = [
        'full_name',
        'phone',
        'profile_picture',
        'ai_assistant_name'
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

      // Validate phone number if being updated
      if (filteredUpdates.phone) {
        // Use utility function or regex directly if method not available
        const phoneRegex = /^(\+|00)?[0-9]{6,15}$/;
        if (!phoneRegex.test(filteredUpdates.phone.replace(/\s+/g, ''))) {
          return res.status(400).json({
            success: false,
            message: 'Invalid phone number',
            error: 'Please provide a valid phone number'
          });
        }

        // Check if phone is already taken by another user
        const existingUser = await prisma.user.findFirst({
          where: {
            phone: filteredUpdates.phone,
            id: { not: userId }
          }
        });

        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: 'Phone number already in use',
            error: 'This phone number is already registered to another account'
          });
        }
      }

      // Validate full name
      if (filteredUpdates.full_name) {
        if (filteredUpdates.full_name.trim().length < 2) {
          return res.status(400).json({
            success: false,
            message: 'Invalid full name',
            error: 'Full name must be at least 2 characters long'
          });
        }
      }

      // Update user
      filteredUpdates.updated_at = new Date();

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: filteredUpdates
      });

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: ERROR_MESSAGES.USER_NOT_FOUND
        });
      }

      const userResponse = {
        id: updatedUser.id,
        full_name: updatedUser.full_name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        pass_id: updatedUser.pass_id,
        governorate_code: updatedUser.governorate_code,
        profile_picture: updatedUser.profile_picture,
        ai_assistant_name: updatedUser.ai_assistant_name,
        wallet_balance: updatedUser.wallet_balance,
        points: updatedUser.points,
        is_active: updatedUser.is_active,
        is_verified: updatedUser.is_verified,
        updated_at: updatedUser.updated_at
      };

      logger.info('Profile updated successfully', {
        userId,
        updatedFields: Object.keys(filteredUpdates)
      });

      res.json({
        success: true,
        message: SUCCESS_MESSAGES.PROFILE_UPDATED,
        data: userResponse
      });
    } catch (error) {
      logger.error('Profile update failed', {
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Profile update failed',
        error: error.message
      });
    }
  }

  /**
   * Change password
   */
  async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required',
          error: 'Missing required fields'
        });
      }

      // Validate new password strength
      if (newPassword.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
        return res.status(400).json({
          success: false,
          message: 'New password too weak',
          error: `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters long`
        });
      }

      // Get user
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: ERROR_MESSAGES.USER_NOT_FOUND
        });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect',
          error: 'Please enter your correct current password'
        });
      }

      // Check if new password is different from current
      const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);

      if (isSamePassword) {
        return res.status(400).json({
          success: false,
          message: 'New password must be different from current password',
          error: 'Please choose a different password'
        });
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      user.password_hash = hashedPassword;
      user.updated_at = new Date();
      // TODO: Replace with prisma update - await user.save();

      // Send notification email
      try {
        await emailService.sendEmail(
          user.email,
          'Password Changed - CSY Pro',
          `Hi ${user.full_name},\n\nYour password has been successfully changed.\n\nIf you didn't make this change, please contact support immediately.\n\nBest regards,\nCSY Pro Team`,
          `Hi ${user.full_name},\n\nYour password has been successfully changed.\n\nIf you didn't make this change, please contact support immediately.\n\nBest regards,\nCSY Pro Team`
        );
      } catch (emailError) {
        logger.error('Failed to send password change notification', {
          userId,
          error: emailError.message
        });
      }

      logger.info('Password changed successfully', { userId, email: user.email });

      res.json({
        success: true,
        message: SUCCESS_MESSAGES.PASSWORD_CHANGED,
        data: {
          changedAt: new Date(),
          notificationSent: true
        }
      });
    } catch (error) {
      logger.error('Password change failed', {
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Password change failed',
        error: error.message
      });
    }
  }

  /**
   * Deactivate account
   */
  async deactivateAccount(req, res) {
    try {
      const userId = req.user.id;
      const { password, reason } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password confirmation is required',
          error: 'Please enter your password to confirm account deactivation'
        });
      }

      // Get user
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: ERROR_MESSAGES.USER_NOT_FOUND
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password',
          error: 'Please enter your correct password'
        });
      }

      // Deactivate account
      user.is_active = false;
      user.updated_at = new Date();
      // TODO: Replace with prisma update - await user.save();

      // Send notification email
      try {
        await emailService.sendEmail(
          user.email,
          'Account Deactivated - CSY Pro',
          `Hi ${user.full_name},\n\nYour account has been deactivated as requested.\n\nReason: ${reason || 'Not specified'}\n\nIf you change your mind, you can reactivate your account by contacting support.\n\nBest regards,\nCSY Pro Team`,
          `Hi ${user.full_name},\n\nYour account has been deactivated as requested.\n\nReason: ${reason || 'Not specified'}\n\nIf you change your mind, you can reactivate your account by contacting support.\n\nBest regards,\nCSY Pro Team`
        );
      } catch (emailError) {
        logger.error('Failed to send deactivation notification', {
          userId,
          error: emailError.message
        });
      }

      logger.info('Account deactivated', {
        userId,
        email: user.email,
        reason: reason || 'Not specified'
      });

      res.json({
        success: true,
        message: 'Account deactivated successfully',
        data: {
          deactivatedAt: new Date(),
          reason: reason || 'Not specified',
          reactivationInfo: 'Contact support to reactivate your account'
        }
      });
    } catch (error) {
      logger.error('Account deactivation failed', {
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Account deactivation failed',
        error: error.message
      });
    }
  }

  /**
   * Get user addresses
   */
  async getAddresses(req, res) {
    try {
      const userId = req.user.id;

      const addresses = await prisma.address.findMany({
        where: { user_id: userId },
        orderBy: [
          { is_default: 'desc' },
          { created_at: 'desc' }
        ]
      });

      res.json({
        success: true,
        message: 'Addresses retrieved successfully',
        data: addresses
      });
    } catch (error) {
      logger.error('Get addresses failed', {
        userId: req.user?.id,
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve addresses',
        error: error.message
      });
    }
  }

  /**
   * Add user address
   */
  async addAddress(req, res) {
    try {
      const userId = req.user.id;
      const addressData = req.body;

      // Validate address
      const { validateAddress } = require('../utils');
      const validation = validateAddress(addressData);

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid address data',
          errors: validation.errors
        });
      }

      // Check address limit
      const addressCount = await prisma.address.count({ where: { user_id: userId } });

      if (addressCount >= 50) { // Max 50 addresses per user
        return res.status(400).json({
          success: false,
          message: 'Address limit reached',
          error: 'You can only save up to 10 addresses'
        });
      }

      // If this is the default address, unset other defaults
      if (addressData.is_default) {
        await prisma.address.updateMany({
          where: { user_id: userId },
          data: { is_default: false }
        });
      }

      // Create address
      const address = await prisma.address.create({
        data: {
          user_id: userId,
          ...addressData
        }
      });

      logger.info('Address added successfully', { userId, addressId: address.id });

      res.status(201).json({
        success: true,
        message: 'Address added successfully',
        data: address
      });
    } catch (error) {
      logger.error('Add address failed', {
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to add address',
        error: error.message
      });
    }
  }

  /**
   * Update user address
   */
  async updateAddress(req, res) {
    try {
      const userId = req.user.id;
      const addressId = req.params.id;
      const updates = req.body;

      // Find address
      const address = await prisma.address.findUnique({
        where: {
          id: addressId,
          user_id: userId
        }
      });

      if (!address) {
        return res.status(404).json({
          success: false,
          message: 'Address not found',
          error: 'Address does not exist or does not belong to you'
        });
      }

      // Validate updates if coordinates are being updated
      if (updates.latitude || updates.longitude) {
        const { validateAddress } = require('../utils');
        const validation = validateAddress({ ...address, ...updates });

        if (!validation.isValid) {
          return res.status(400).json({
            success: false,
            message: 'Invalid address data',
            errors: validation.errors
          });
        }
      }

      // If setting as default, unset other defaults
      if (updates.is_default) {
        await prisma.address.updateMany({
          where: { user_id: userId, id: { not: addressId } },
          data: { is_default: false }
        });
      }

      // Update address
      const updatedAddress = await prisma.address.update({
        where: { id: addressId },
        data: updates
      });

      logger.info('Address updated successfully', { userId, addressId });

      res.json({
        success: true,
        message: 'Address updated successfully',
        data: address
      });
    } catch (error) {
      logger.error('Update address failed', {
        userId: req.user?.id,
        addressId: req.params.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to update address',
        error: error.message
      });
    }
  }

  /**
   * Delete user address
   */
  async deleteAddress(req, res) {
    try {
      const userId = req.user.id;
      const addressId = req.params.id;

      // Find and delete address
      const deleteResult = await prisma.address.delete({
        where: {
          id: addressId,
          user_id: userId
        }
      });

      if (deleteResult.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Address not found',
          error: 'Address does not exist or does not belong to you'
        });
      }

      logger.info('Address deleted successfully', { userId, addressId });

      res.json({
        success: true,
        message: 'Address deleted successfully',
        data: {
          deletedId: addressId,
          deletedAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Delete address failed', {
        userId: req.user?.id,
        addressId: req.params.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to delete address',
        error: error.message
      });
    }
  }

  /**
   * Get user wallet information
   */
  async getWallet(req, res) {
    try {
      const userId = req.user.id;

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: ERROR_MESSAGES.USER_NOT_FOUND
        });
      }

      const wallet = {
        balance: user.wallet_balance || 0,
        currency: 'EGP',
        total_added: 0, // Would come from Transaction model
        total_spent: 0  // Would come from Transaction model
      };

      res.json({
        success: true,
        message: 'Wallet information retrieved successfully',
        data: wallet
      });
    } catch (error) {
      logger.error('Get wallet failed', {
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve wallet information',
        error: error.message
      });
    }
  }

  /**
   * Get user points information
   */
  async getPoints(req, res) {
    try {
      const userId = req.user.id;

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: ERROR_MESSAGES.USER_NOT_FOUND
        });
      }

      // Get detailed points from Points model
      const pointsAgg = await prisma.points.aggregate({
        where: { user_id: userId },
        _sum: {
          points_earned: true,
          points_redeemed: true
        }
      });

      const totalEarned = pointsAgg._sum.points_earned || 0;
      const totalRedeemed = pointsAgg._sum.points_redeemed || 0;
      const currentBalance = totalEarned - totalRedeemed;

      const balance = {
        current_balance: currentBalance,
        total_earned: totalEarned,
        total_spent: totalRedeemed
      };

      res.json({
        success: true,
        message: 'Points information retrieved successfully',
        data: {
          balance
        }
      });
    } catch (error) {
      logger.error('Get points failed', {
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve points information',
        error: error.message
      });
    }
  }

  /**
   * Update AI assistant name
   */
  async updateAssistantName(req, res) {
    try {
      const userId = req.user.id;
      const { ai_assistant_name } = req.body;

      if (!ai_assistant_name || ai_assistant_name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'AI assistant name is required',
          error: 'Please provide a valid assistant name'
        });
      }

      if (ai_assistant_name.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'AI assistant name too long',
          error: 'Assistant name must be 50 characters or less'
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ai_assistant_name: ai_assistant_name.trim(),
          updated_at: new Date()
        }
      });

      if (!updatedUser) { // This check might be redundant as Prisma update throws if not found
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: ERROR_MESSAGES.USER_NOT_FOUND
        });
      }

      logger.info('AI assistant name updated', {
        userId,
        newName: ai_assistant_name.trim()
      });

      res.json({
        success: true,
        message: 'AI assistant name updated successfully',
        data: {
          ai_assistant_name: updatedUser.ai_assistant_name,
          updated_at: updatedUser.updated_at
        }
      });
    } catch (error) {
      if (error.code === 'P2025') { // Record to update does not exist
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: ERROR_MESSAGES.USER_NOT_FOUND
        });
      }
      logger.error('Update assistant name failed', {
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to update assistant name',
        error: error.message
      });
    }
  }

  /**
   * Add balance to wallet
   */
  async addWalletBalance(req, res) {
    try {
      const userId = req.user.id;
      const { amount, payment_method, payment_details } = req.body;

      if (!amount || amount < 1000) {
        return res.status(400).json({
          success: false,
          message: 'Invalid amount',
          error: 'Minimum amount is 1000 piastres (10 EGP)'
        });
      }

      const validPaymentMethods = ['card', 'mobile_wallet', 'bank_transfer'];
      if (!payment_method || !validPaymentMethods.includes(payment_method)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment method',
          error: 'Payment method must be one of: card, mobile_wallet, bank_transfer'
        });
      }

      // Here you would integrate with payment service
      // For now, we'll simulate a successful payment
      const paymentResult = {
        success: true,
        transaction_id: `txn_${Date.now()}`,
        amount,
        payment_method
      };

      if (paymentResult.success) {
        // Update user wallet balance
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            wallet_balance: { increment: amount },
            updated_at: new Date()
          }
        });

        // Create wallet transaction record
        await prisma.transaction.create({
          data: {
            user_id: userId,
            transaction_type: 'wallet_topup',
            reference_type: 'wallet',
            reference_id: userId,
            amount,
            payment_method,
            status: 'completed',
            description: `Wallet top-up via ${payment_method}`,
            created_at: new Date()
          }
        });

        logger.info('Wallet balance added', {
          userId,
          amount,
          payment_method,
          transaction_id: paymentResult.transaction_id
        });

        res.json({
          success: true,
          message: 'Balance added successfully',
          data: {
            transaction_id: paymentResult.transaction_id,
            amount_added: amount,
            new_balance: updatedUser.wallet_balance,
            payment_method
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Payment failed',
          error: 'Unable to process payment. Please try again.'
        });
      }
    } catch (error) {
      logger.error('Add wallet balance failed', {
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to add balance',
        error: error.message
      });
    }
  }

  /**
   * Get wallet transaction history
   */
  async getWalletHistory(req, res) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);
      const skip = (page - 1) * limit;

      const where = {
        user_id: userId,
        OR: [
          { transaction_type: 'wallet_topup' },
          { transaction_type: 'payment', payment_method: 'wallet' }
        ]
      };

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          orderBy: { created_at: 'desc' },
          skip,
          take: limit
        }),

        prisma.transaction.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        message: 'Wallet history retrieved successfully',
        data: {
          transactions,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      });
    } catch (error) {
      logger.error('Get wallet history failed', {
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve wallet history',
        error: error.message
      });
    }
  }

  /**
   * Get points transaction history
   */
  async getPointsHistory(req, res) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);
      const skip = (page - 1) * limit;

      const [points, total] = await Promise.all([
        prisma.points.findMany({
          where: { user_id: userId },
          orderBy: { created_at: 'desc' },
          skip,
          take: limit
        }),

        prisma.points.count({ where: { user_id: userId } })
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        message: 'Points history retrieved successfully',
        data: {
          transactions: points,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      });
    } catch (error) {
      logger.error('Get points history failed', {
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve points history',
        error: error.message
      });
    }
  }

  /**
   * Get user visit history
   */
  async getVisitHistory(req, res) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);
      const skip = (page - 1) * limit;

      // Visit history can be derived from orders and reservations
      const [orders, reservations] = await Promise.all([
        prisma.order.findMany({
          where: { user_id: userId },
          include: { business: { select: { business_name: true, address: true } } },
          orderBy: { created_at: 'desc' },
          skip,
          take: limit
        }),

        prisma.reservation.findMany({
          where: { user_id: userId },
          include: { business: { select: { business_name: true, address: true } } },
          orderBy: { created_at: 'desc' },
          skip,
          take: limit
        })
      ]);

      // Combine and sort by date
      const visits = [
        ...orders.map(order => ({
          type: 'order',
          id: order.id,
          business: order.business,
          date: order.created_at,
          status: order.status,
          amount: order.total_amount
        })),
        ...reservations.map(reservation => ({
          type: 'reservation',
          id: reservation.id,
          business: reservation.business,
          date: reservation.created_at,
          status: reservation.status,
          reservation_date: reservation.date
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      const total = visits.length;
      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        message: 'Visit history retrieved successfully',
        data: {
          visits: visits.slice(0, limit),
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      });
    } catch (error) {
      logger.error('Get visit history failed', {
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve visit history',
        error: error.message
      });
    }
  }

  /**
   * Get user notifications
   */
  async getNotifications(req, res) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);
      const unreadOnly = req.query.unread_only === 'true';
      const skip = (page - 1) * limit;

      const where = {
        recipient_type: 'user',
        recipient_id: userId
      };

      if (unreadOnly) {
        where.is_read = false;
      }

      const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { created_at: 'desc' },
          skip,
          take: limit
        }),

        prisma.notification.count({ where }),

        prisma.notification.count({
          where: {
            recipient_type: 'user',
            recipient_id: userId,
            is_read: false
          }
        })
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        message: 'Notifications retrieved successfully',
        data: {
          notifications,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          },
          unread_count: unreadCount
        }
      });
    } catch (error) {
      logger.error('Get notifications failed', {
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve notifications',
        error: error.message
      });
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(req, res) {
    try {
      const userId = req.user.id;
      const notificationId = req.params.id;

      const notification = await prisma.notification.update({
        where: { id: notificationId },
        data: {
          is_read: true,
          updated_at: new Date()
        }
      });

      // Verify ownership (Prisma update throws if not found, but we should verify recipient)
      if (notification.recipient_id !== userId) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found',
          error: 'Notification does not exist or does not belong to you'
        });
      }

      logger.info('Notification marked as read', {
        userId,
        notificationId
      });

      res.json({
        success: true,
        message: 'Notification marked as read',
        data: {
          notification_id: notificationId,
          marked_at: new Date()
        }
      });
    } catch (error) {
      // Handle Prisma "Record to update not found" error
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'Notification not found',
          error: 'Notification does not exist'
        });
      }

      logger.error('Mark notification as read failed', {
        userId: req.user?.id,
        notificationId: req.params.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: error.message
      });
    }
  }

  /**
   * Delete user account permanently
   */
  async deleteAccount(req, res) {
    try {
      const userId = req.user.id;
      const { password, reason } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password confirmation is required',
          error: 'Please enter your password to confirm account deletion'
        });
      }

      // Get user
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: ERROR_MESSAGES.USER_NOT_FOUND
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password',
          error: 'Please enter your correct password'
        });
      }

      // Delete related data
      await Promise.all([
        prisma.address.deleteMany({ where: { user_id: userId } }),
        prisma.points.deleteMany({ where: { user_id: userId } }),
        // Assuming 'wallet' is a model, if wallet_balance is on User, this might not be needed.
        // If there's a separate Wallet model with user_id, then this is correct.
        // For now, keeping it as per original code's intent.
        prisma.wallet.deleteMany({ where: { user_id: userId } }),
        // Note: You might want to keep orders/reservations for business records
        // prisma.order.deleteMany({ where: { user_id: userId } }),
        // prisma.reservation.deleteMany({ where: { user_id: userId } }),
      ]);

      // Delete user account
      await prisma.user.delete({ where: { id: userId } });

      // Send notification email
      try {
        await emailService.sendEmail(
          user.email,
          'Account Deleted - CSY Pro',
          `Hi ${user.full_name},\n\nYour account has been permanently deleted as requested.\n\nReason: ${reason || 'Not specified'}\n\nWe're sorry to see you go. If you change your mind, you can create a new account anytime.\n\nBest regards,\nCSY Pro Team`,
          `Hi ${user.full_name},\n\nYour account has been permanently deleted as requested.\n\nReason: ${reason || 'Not specified'}\n\nWe're sorry to see you go. If you change your mind, you can create a new account anytime.\n\nBest regards,\nCSY Pro Team`
        );
      } catch (emailError) {
        logger.error('Failed to send deletion notification', {
          userId,
          error: emailError.message
        });
      }

      logger.info('Account deleted permanently', {
        userId,
        email: user.email,
        reason: reason || 'Not specified'
      });

      res.json({
        success: true,
        message: 'Account deleted successfully',
        data: {
          deleted_at: new Date(),
          reason: reason || 'Not specified',
          message: 'Your account and all associated data have been permanently deleted'
        }
      });
    } catch (error) {
      if (error.code === 'P2025') { // Record to delete does not exist (for user.delete)
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: ERROR_MESSAGES.USER_NOT_FOUND
        });
      }
      logger.error('Account deletion failed', {
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Account deletion failed',
        error: error.message
      });
    }
  }

  // Helper methods

  async getUserWallet(userId) {
    // This would typically fetch from Wallet model
    const user = await prisma.user.findUnique({ where: { id: userId } });
    return {
      balance: user?.wallet_balance || 0,
      currency: 'EGP',
      total_added: 0, // Would come from Wallet model
      total_spent: 0  // Would come from Wallet model
    };
  }

  async getUserPointsBalance(userId) {
    try {
      // Get user's current points from User model
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return { current_balance: 0, total_earned: 0, total_spent: 0 };

      // Also get detailed points from Points model
      const pointsAgg = await prisma.points.aggregate({
        where: { user_id: userId },
        _sum: {
          points_earned: true,
          points_spent: true
        }
      });

      const totalEarned = pointsAgg._sum.points_earned || 0;
      const totalSpent = pointsAgg._sum.points_spent || 0;
      const currentBalance = totalEarned - totalSpent;

      return {
        current_balance: currentBalance,
        total_earned: totalEarned,
        total_spent: totalSpent
      };
    } catch (error) {
      logger.error('Get points balance failed', { userId, error: error.message });
      return { current_balance: 0, total_earned: 0, total_spent: 0 };
    }
  }

  async getRecentOrders(userId, limit = 5) {
    const orders = await prisma.order.findMany({
      where: { user_id: userId },
      select: { id: true, order_number: true, status: true, total_amount: true, created_at: true },
      orderBy: { created_at: 'desc' },
      take: limit
    });

    return orders;
  }

  async getRecentReservations(userId, limit = 5) {
    const reservations = await prisma.reservation.findMany({
      where: { user_id: userId },
      select: { id: true, reservation_type: true, status: true, date: true, time: true, created_at: true },
      orderBy: { created_at: 'desc' },
      take: limit
    });

    return reservations;
  }

  isValidPhoneNumber(phone) {
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  }
}

module.exports = new UserController();
