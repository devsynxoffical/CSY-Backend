const { prisma } = require('../config/database');
const { snsHelpers } = require('../config');
const { logger } = require('../utils');
const emailService = require('./email.service');
const smsService = require('./sms.service');

/**
 * Notification Service for managing all types of notifications
 */
class NotificationService {
  constructor() {
    this.templates = this.loadTemplates();
  }

  /**
   * Load notification templates
   */
  loadTemplates() {
    return {
      order_confirmed: {
        title: 'Order Confirmed! ✅',
        message: 'Your order #{orderNumber} has been confirmed and is being prepared.',
        type: 'order',
        priority: 'normal'
      },
      order_ready: {
        title: 'Order Ready! 🍽️',
        message: 'Your order #{orderNumber} is ready for pickup.',
        type: 'order',
        priority: 'high'
      },
      order_picked_up: {
        title: 'Order Picked Up 🚗',
        message: 'Your order #{orderNumber} has been picked up by the driver.',
        type: 'order',
        priority: 'normal'
      },
      order_delivered: {
        title: 'Order Delivered! 🎉',
        message: 'Your order #{orderNumber} has been delivered successfully.',
        type: 'order',
        priority: 'normal'
      },
      order_cancelled: {
        title: 'Order Cancelled ❌',
        message: 'Your order #{orderNumber} has been cancelled.',
        type: 'order',
        priority: 'high'
      },
      driver_assigned: {
        title: 'Driver Assigned 🚗',
        message: '{driverName} will deliver your order #{orderNumber}.',
        type: 'order',
        priority: 'normal'
      },
      reservation_confirmed: {
        title: 'Reservation Confirmed! 📅',
        message: 'Your reservation at {businessName} on {date} at {time} is confirmed.',
        type: 'reservation',
        priority: 'normal'
      },
      reservation_reminder: {
        title: 'Reservation Reminder ⏰',
        message: 'You have a reservation at {businessName} in 1 hour.',
        type: 'reservation',
        priority: 'high'
      },
      payment_success: {
        title: 'Payment Successful 💳',
        message: 'Payment of EGP {amount} processed successfully.',
        type: 'payment',
        priority: 'normal'
      },
      wallet_topup: {
        title: 'Wallet Topped Up 💰',
        message: 'Your wallet has been credited with EGP {amount}.',
        type: 'wallet',
        priority: 'normal'
      },
      points_earned: {
        title: 'Points Earned! ⭐',
        message: 'You earned {points} points from your recent order.',
        type: 'points',
        priority: 'low'
      },
      promotion: {
        title: 'Special Offer! 🎁',
        message: '{message}',
        type: 'promotion',
        priority: 'normal'
      },
      rating_received: {
        title: 'New Rating 📝',
        message: 'You received a {stars}-star rating from {customerName}.',
        type: 'rating',
        priority: 'low'
      }
    };
  }

  /**
   * Create and send notification
   */
  async createNotification(recipientType, recipientId, notificationType, templateData = {}, options = {}) {
    try {
      const template = this.templates[notificationType];
      if (!template) {
        throw new Error(`Notification template '${notificationType}' not found`);
      }

      // Format template with data
      const { title, message } = this.formatTemplate(template, templateData);

      // Prepare notification data for Prisma
      const notificationData = {
        type: notificationType,
        title,
        message,
        data: templateData || {},
        is_read: false
      };

      // Set recipient based on type
      if (recipientType === 'user') {
        notificationData.user_id = recipientId;
      } else if (recipientType === 'business') {
        notificationData.business_id = recipientId;
      } else if (recipientType === 'driver') {
        notificationData.driver_id = recipientId;
      }

      // Create notification in database using Prisma
      const notification = await prisma.notification.create({
        data: notificationData
      });

      // Send via specified channels
      await this.sendViaChannels(notification, options);

      logger.info('Notification created and sent', {
        id: notification.id,
        type: notificationType,
        recipient: `${recipientType}:${recipientId}`,
        channels: notificationData.sent_via
      });

      return notification;
    } catch (error) {
      logger.error('Notification creation failed', {
        recipientType,
        recipientId,
        notificationType,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Format template with data
   */
  formatTemplate(template, data) {
    let title = template.title;
    let message = template.message;

    // Replace placeholders
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{${key}}`, 'g');
      title = title.replace(regex, data[key] || '');
      message = message.replace(regex, data[key] || '');
    });

    return { title, message };
  }

  /**
   * Determine send channels based on options and preferences
   */
  determineSendChannels(options) {
    const channels = [];

    // Default channels
    if (options.sendPush !== false) channels.push('push');
    if (options.sendEmail !== false) channels.push('email');
    if (options.sendSMS !== false) channels.push('sms');

    // Override with specific channels
    if (options.channels) {
      return options.channels;
    }

    return channels;
  }

  /**
   * Send notification via specified channels
   */
  async sendViaChannels(notification, options) {
    const results = {
      push: null,
      email: null,
      sms: null
    };

    // Send push notification
    if (notification.sent_via.includes('push')) {
      try {
        results.push = await this.sendPushNotification(notification, options);
      } catch (error) {
        logger.error('Push notification failed', { notificationId: notification.id, error: error.message });
      }
    }

    // Send email
    if (notification.sent_via.includes('email') && options.email) {
      try {
        results.email = await emailService.sendEmail(
          options.email,
          notification.title,
          this.createEmailContent(notification),
          notification.message
        );
      } catch (error) {
        logger.error('Email notification failed', { notificationId: notification.id, error: error.message });
      }
    }

    // Send SMS
    if (notification.sent_via.includes('sms') && options.phone) {
      try {
        results.sms = await smsService.sendSMS(options.phone, notification.message);
      } catch (error) {
        logger.error('SMS notification failed', { notificationId: notification.id, error: error.message });
      }
    }

    return results;
  }

  /**
   * Send push notification
   */
  async sendPushNotification(notification, options) {
    try {
      if (!options.deviceToken) {
        throw new Error('Device token not provided');
      }

      const result = await snsHelpers.sendPushNotification(
        options.deviceToken,
        notification.title,
        notification.message,
        {
          notificationId: notification.id,
          type: notification.notification_type,
          priority: notification.priority
        }
      );

      return result;
    } catch (error) {
      logger.error('Push notification send failed', {
        notificationId: notification.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Create email content for notification
   */
  createEmailContent(notification) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${notification.title}</h2>
        <p>${notification.message}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          You received this notification from CSY Pro.<br>
          If you no longer wish to receive these notifications, you can update your preferences in the app.
        </p>
      </div>
    `;
  }

  /**
   * Simple sendNotification method for backward compatibility
   * Creates a notification in the database
   */
  async sendNotification(email, title, message, data = {}) {
    try {
      // Find user or business by email
      let user = await prisma.user.findUnique({ where: { email } });
      let business = await prisma.business.findUnique({ where: { owner_email: email } });
      
      let notificationData = {
        type: data.type || 'system',
        title,
        message,
        data: data || {},
        is_read: false
      };

      if (user) {
        notificationData.user_id = user.id;
      } else if (business) {
        notificationData.business_id = business.id;
      } else {
        // If neither found, log warning but still create notification
        logger.warn('No user or business found for notification email', { email });
        // Create notification without user_id or business_id
      }

      const notification = await prisma.notification.create({
        data: notificationData
      });

      logger.info('Notification sent', {
        notificationId: notification.id,
        email,
        type: notificationData.type
      });

      return notification;
    } catch (error) {
      logger.error('Send notification failed', {
        email,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          user_id: userId
        }
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          is_read: true
        }
      });

      logger.info('Notification marked as read', { notificationId, userId });

      return notification;
    } catch (error) {
      logger.error('Mark notification as read failed', {
        notificationId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const { page = 1, limit = 20, unreadOnly = false } = options;

      const whereClause = {
        recipient_type: 'user',
        recipient_id: userId
      };

      if (unreadOnly) {
        whereClause.is_read = false;
      }

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where: whereClause,
          orderBy: { created_at: 'desc' },
          take: limit,
          skip: (page - 1) * limit
        }),
        prisma.notification.count({ where: whereClause })
      ]);

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Get user notifications failed', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send order notification
   */
  async sendOrderNotification(userId, orderId, status, userDetails) {
    const statusTemplates = {
      confirmed: 'order_confirmed',
      ready: 'order_ready',
      picked_up: 'order_picked_up',
      delivered: 'order_delivered',
      cancelled: 'order_cancelled'
    };

    const templateType = statusTemplates[status];
    if (!templateType) return;

    return await this.createNotification('user', userId, templateType, {
      orderNumber: orderId
    }, {
      sendEmail: userDetails.email,
      sendSMS: userDetails.phone,
      email: userDetails.email,
      phone: userDetails.phone
    });
  }

  /**
   * Send reservation notification
   */
  async sendReservationNotification(userId, reservationId, type, reservationDetails, userDetails) {
    const templateType = type === 'reminder' ? 'reservation_reminder' : 'reservation_confirmed';

    return await this.createNotification('user', userId, templateType, {
      businessName: reservationDetails.businessName,
      date: reservationDetails.date,
      time: reservationDetails.time
    }, {
      sendEmail: userDetails.email,
      sendSMS: userDetails.phone,
      email: userDetails.email,
      phone: userDetails.phone
    });
  }

  /**
   * Send payment notification
   */
  async sendPaymentNotification(userId, amount, type, userDetails) {
    const templateType = type === 'topup' ? 'wallet_topup' : 'payment_success';

    return await this.createNotification('user', userId, templateType, {
      amount: (amount / 100).toFixed(2)
    }, {
      sendEmail: userDetails.email,
      sendSMS: userDetails.phone,
      email: userDetails.email,
      phone: userDetails.phone
    });
  }

  /**
   * Send promotional notification
   */
  async sendPromotionNotification(userIds, message, promotionData = {}) {
    const notifications = [];

    for (const userId of userIds) {
      try {
        const notification = await this.createNotification('user', userId, 'promotion', {
          message
        }, {
          priority: 'low',
          channels: ['push'] // Promotions typically only push
        });
        notifications.push(notification);
      } catch (error) {
        logger.error('Failed to send promotion to user', { userId, error: error.message });
      }
    }

    return notifications;
  }

  /**
   * Send business notification
   */
  async sendBusinessNotification(businessId, type, data, options = {}) {
    return await this.createNotification('business', businessId, type, data, {
      priority: options.priority || 'normal',
      channels: options.channels || ['push', 'email']
    });
  }

  /**
   * Send driver notification
   */
  async sendDriverNotification(driverId, type, data, options = {}) {
    return await this.createNotification('driver', driverId, type, data, {
      priority: options.priority || 'normal',
      channels: options.channels || ['push', 'sms']
    });
  }

  /**
   * Bulk send notifications
   */
  async sendBulkNotifications(recipients, notificationType, templateData, options = {}) {
    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };

    for (const recipient of recipients) {
      try {
        await this.createNotification(
          recipient.type,
          recipient.id,
          notificationType,
          templateData,
          {
            ...options,
            email: recipient.email,
            phone: recipient.phone,
            deviceToken: recipient.deviceToken
          }
        );
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          recipient: recipient.id,
          error: error.message
        });
      }
    }

    logger.info('Bulk notifications completed', {
      total: recipients.length,
      successful: results.successful,
      failed: results.failed
    });

    return results;
  }

  /**
   * Delete old notifications (cleanup job)
   */
  async deleteOldNotifications(daysOld = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const deletedCount = await prisma.notification.deleteMany({
        where: {
          created_at: { lt: cutoffDate },
          is_read: true
        }
      });

      logger.info('Old notifications deleted', { deletedCount, daysOld });

      return deletedCount;
    } catch (error) {
      logger.error('Delete old notifications failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(userId, days = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const notifications = await prisma.notification.findMany({
        where: {
          user_id: userId,
          created_at: { gte: cutoffDate }
        }
      });

      // Group by type and calculate stats
      const statsMap = {};
      notifications.forEach(notif => {
        const type = notif.type;
        if (!statsMap[type]) {
          statsMap[type] = { total: 0, read: 0 };
        }
        statsMap[type].total++;
        if (notif.is_read) {
          statsMap[type].read++;
        }
      });

      return Object.keys(statsMap).map(type => ({
        type,
        total: statsMap[type].total,
        read: statsMap[type].read,
        unread: statsMap[type].total - statsMap[type].read
      }));
    } catch (error) {
      logger.error('Get notification stats failed', { userId, error: error.message });
      throw error;
    }
  }
}

module.exports = new NotificationService();
