const { Points, User, Transaction } = require('../models');
const { calculatePointsEarned, calculatePointsRedemption } = require('../utils');
const { FEES } = require('../config/constants');
const { logger } = require('../utils');
const notificationService = require('./notification.service');

/**
 * Points Service for managing loyalty points system
 */
class PointsService {
  constructor() {
    this.pointsRate = FEES.POINTS_PER_EGP_SPENT;
    this.egpPerPoint = FEES.EGP_PER_POINT_REDEEMED;
    this.expiryDays = FEES.POINTS_EXPIRY_DAYS;
  }

  /**
   * Award points to user
   */
  async awardPoints(userId, points, activityType, referenceId, description = '') {
    try {
      // Get current user points balance
      const currentPoints = await this.getUserPointsBalance(userId);
      const newBalance = currentPoints + points;

      // Calculate expiry date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.expiryDays);

      // Create points transaction
      const pointsEntry = await Points.create({
        user_id: userId,
        points_earned: points,
        points_spent: 0,
        balance: newBalance,
        activity_type: activityType,
        reference_id: referenceId,
        expires_at: expiresAt
      });

      logger.info('Points awarded', {
        userId,
        points,
        newBalance,
        activityType,
        referenceId
      });

      // Send notification
      await notificationService.sendNotification('user', userId, 'points_earned', {
        points: points.toString()
      }, {
        sendPush: true,
        priority: 'low'
      });

      return pointsEntry;
    } catch (error) {
      logger.error('Points awarding failed', {
        userId,
        points,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Redeem points
   */
  async redeemPoints(userId, pointsToRedeem, referenceId, description = '') {
    try {
      const availablePoints = await this.getUserPointsBalance(userId);

      if (availablePoints < pointsToRedeem) {
        throw new Error('Insufficient points balance');
      }

      // Calculate EGP equivalent
      const egpValue = calculatePointsRedemption(pointsToRedeem);
      const newBalance = availablePoints - pointsToRedeem;

      // Create redemption transaction
      const pointsEntry = await Points.create({
        user_id: userId,
        points_earned: 0,
        points_spent: pointsToRedeem,
        balance: newBalance,
        activity_type: 'redemption',
        reference_id: referenceId
      });

      logger.info('Points redeemed', {
        userId,
        pointsRedeemed: pointsToRedeem,
        egpValue,
        newBalance,
        referenceId
      });

      return {
        pointsEntry,
        egpValue,
        newBalance
      };
    } catch (error) {
      logger.error('Points redemption failed', {
        userId,
        pointsToRedeem,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Award points for order completion
   */
  async awardOrderPoints(userId, orderTotal, orderId) {
    try {
      const pointsEarned = calculatePointsEarned(orderTotal);

      if (pointsEarned > 0) {
        await this.awardPoints(
          userId,
          pointsEarned,
          'order',
          orderId,
          `Points earned from order #${orderId}`
        );
      }

      return pointsEarned;
    } catch (error) {
      logger.error('Order points awarding failed', {
        userId,
        orderId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Award points for reservation
   */
  async awardReservationPoints(userId, reservationId, businessName) {
    try {
      const pointsEarned = 50; // Fixed points for reservations

      await this.awardPoints(
        userId,
        pointsEarned,
        'reservation',
        reservationId,
        `Points earned from reservation at ${businessName}`
      );

      return pointsEarned;
    } catch (error) {
      logger.error('Reservation points awarding failed', {
        userId,
        reservationId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Award points for rating/review
   */
  async awardRatingPoints(userId, ratingId, businessName) {
    try {
      const pointsEarned = 25; // Fixed points for ratings

      await this.awardPoints(
        userId,
        pointsEarned,
        'rating',
        ratingId,
        `Points earned for rating ${businessName}`
      );

      return pointsEarned;
    } catch (error) {
      logger.error('Rating points awarding failed', {
        userId,
        ratingId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get user points balance
   */
  async getUserPointsBalance(userId) {
    try {
      // Get the latest points entry for the user
      const latestEntry = await Points.findOne({
        where: { user_id: userId },
        order: [['created_at', 'DESC']]
      });

      return latestEntry ? latestEntry.balance : 0;
    } catch (error) {
      logger.error('Get user points balance failed', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get user points history
   */
  async getUserPointsHistory(userId, options = {}) {
    try {
      const { page = 1, limit = 20, type = null } = options;

      const whereClause = { user_id: userId };
      if (type) {
        whereClause.activity_type = type;
      }

      const points = await Points.findAndCountAll({
        where: whereClause,
        order: [['created_at', 'DESC']],
        limit,
        offset: (page - 1) * limit
      });

      return {
        points: points.rows,
        pagination: {
          page,
          limit,
          total: points.count,
          totalPages: Math.ceil(points.count / limit)
        }
      };
    } catch (error) {
      logger.error('Get user points history failed', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get points expiry information
   */
  async getExpiringPoints(userId, daysAhead = 30) {
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + daysAhead);

      const expiringPoints = await Points.findAll({
        where: {
          user_id: userId,
          expires_at: {
            [Op.lte]: expiryDate,
            [Op.gt]: new Date()
          },
          balance: { [Op.gt]: 0 }
        },
        order: [['expires_at', 'ASC']]
      });

      return expiringPoints.map(entry => ({
        id: entry.id,
        points: entry.balance,
        expiresAt: entry.expires_at,
        daysUntilExpiry: Math.ceil((entry.expires_at - new Date()) / (1000 * 60 * 60 * 24))
      }));
    } catch (error) {
      logger.error('Get expiring points failed', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Expire old points (cleanup job)
   */
  async expireOldPoints() {
    try {
      const expiredPoints = await Points.findAll({
        where: {
          expires_at: { [Op.lt]: new Date() },
          balance: { [Op.gt]: 0 }
        }
      });

      let totalExpiredPoints = 0;

      for (const entry of expiredPoints) {
        // Create an expiry transaction
        await Points.create({
          user_id: entry.user_id,
          points_earned: 0,
          points_spent: entry.balance,
          balance: 0,
          activity_type: 'expiry',
          reference_id: entry.id.toString()
        });

        totalExpiredPoints += entry.balance;
      }

      logger.info('Points expiry processed', {
        expiredEntries: expiredPoints.length,
        totalExpiredPoints
      });

      return {
        expiredEntries: expiredPoints.length,
        totalExpiredPoints
      };
    } catch (error) {
      logger.error('Points expiry processing failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Calculate points value in EGP
   */
  calculatePointsValue(points) {
    return calculatePointsRedemption(points);
  }

  /**
   * Calculate required points for EGP amount
   */
  calculateRequiredPoints(egpAmount) {
    return Math.ceil(egpAmount / this.egpPerPoint);
  }

  /**
   * Get points statistics
   */
  async getPointsStats(startDate, endDate) {
    try {
      const stats = await Points.findAll({
        where: {
          created_at: { [Op.between]: [startDate, endDate] }
        },
        attributes: [
          'activity_type',
          [sequelize.fn('SUM', sequelize.col('points_earned')), 'total_earned'],
          [sequelize.fn('SUM', sequelize.col('points_spent')), 'total_spent'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'transaction_count']
        ],
        group: ['activity_type']
      });

      return stats.map(stat => ({
        activityType: stat.activity_type,
        totalEarned: parseInt(stat.dataValues.total_earned || 0),
        totalSpent: parseInt(stat.dataValues.total_spent || 0),
        netPoints: parseInt(stat.dataValues.total_earned || 0) - parseInt(stat.dataValues.total_spent || 0),
        transactionCount: parseInt(stat.dataValues.transaction_count)
      }));
    } catch (error) {
      logger.error('Get points stats failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get user points summary
   */
  async getUserPointsSummary(userId) {
    try {
      const balance = await this.getUserPointsBalance(userId);
      const expiringPoints = await this.getExpiringPoints(userId, 30);

      // Get points earned and spent in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentActivity = await Points.findAll({
        where: {
          user_id: userId,
          created_at: { [Op.gte]: thirtyDaysAgo }
        },
        attributes: [
          [sequelize.fn('SUM', sequelize.col('points_earned')), 'earned'],
          [sequelize.fn('SUM', sequelize.col('points_spent')), 'spent']
        ]
      });

      const recentEarned = parseInt(recentActivity[0]?.dataValues?.earned || 0);
      const recentSpent = parseInt(recentActivity[0]?.dataValues?.spent || 0);

      return {
        currentBalance: balance,
        expiringSoon: expiringPoints,
        recentActivity: {
          earned: recentEarned,
          spent: recentSpent,
          net: recentEarned - recentSpent
        },
        redemptionInfo: {
          egpPerPoint: this.egpPerPoint,
          maxRedemptionValue: calculatePointsRedemption(balance)
        }
      };
    } catch (error) {
      logger.error('Get user points summary failed', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Transfer points between users (for future feature)
   */
  async transferPoints(fromUserId, toUserId, points, description = '') {
    try {
      const fromBalance = await this.getUserPointsBalance(fromUserId);

      if (fromBalance < points) {
        throw new Error('Insufficient points balance for transfer');
      }

      // Deduct from sender
      await this.redeemPoints(fromUserId, points, `transfer_to_${toUserId}`, description);

      // Award to receiver
      await this.awardPoints(toUserId, points, 'transfer', `from_${fromUserId}`, description);

      logger.info('Points transferred', {
        fromUserId,
        toUserId,
        points,
        description
      });

      return {
        success: true,
        points,
        fromUserId,
        toUserId
      };
    } catch (error) {
      logger.error('Points transfer failed', {
        fromUserId,
        toUserId,
        points,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Bulk award points to multiple users
   */
  async bulkAwardPoints(pointsData) {
    const results = {
      successful: 0,
      failed: 0,
      awards: [],
      errors: []
    };

    for (const data of pointsData) {
      try {
        const award = await this.awardPoints(
          data.userId,
          data.points,
          data.activityType,
          data.referenceId,
          data.description
        );
        results.awards.push(award);
        results.successful++;
      } catch (error) {
        results.errors.push({
          userId: data.userId,
          error: error.message
        });
        results.failed++;
      }
    }

    logger.info('Bulk points awarding completed', {
      total: pointsData.length,
      successful: results.successful,
      failed: results.failed
    });

    return results;
  }

  /**
   * Validate points redemption
   */
  validatePointsRedemption(points, minPoints = 100, maxPoints = 10000) {
    if (points < minPoints) {
      throw new Error(`Minimum ${minPoints} points required for redemption`);
    }

    if (points > maxPoints) {
      throw new Error(`Maximum ${maxPoints} points allowed per redemption`);
    }

    if (points % 10 !== 0) {
      throw new Error('Points must be redeemed in multiples of 10');
    }

    return true;
  }

  /**
   * Get points leaderboard (top users by points)
   */
  async getPointsLeaderboard(limit = 10) {
    try {
      const leaderboard = await Points.findAll({
        attributes: [
          'user_id',
          [sequelize.fn('MAX', sequelize.col('balance')), 'points']
        ],
        group: ['user_id'],
        order: [[sequelize.fn('MAX', sequelize.col('balance')), 'DESC']],
        limit,
        include: [{
          model: User,
          attributes: ['full_name', 'pass_id']
        }]
      });

      return leaderboard.map((entry, index) => ({
        rank: index + 1,
        userId: entry.user_id,
        userName: entry.User?.full_name || 'Unknown',
        passId: entry.User?.pass_id || 'N/A',
        points: parseInt(entry.dataValues.points)
      }));
    } catch (error) {
      logger.error('Get points leaderboard failed', { error: error.message });
      throw error;
    }
  }
}

module.exports = new PointsService();
