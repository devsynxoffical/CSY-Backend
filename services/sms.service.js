const { snsHelpers } = require('../config');
const { logger } = require('../utils');

/**
 * SMS Service for sending SMS via AWS SNS
 */
class SMSService {
  constructor() {
    this.templates = this.loadTemplates();
    this.countryCode = '+20'; // Egypt country code
  }

  /**
   * Load SMS templates
   */
  loadTemplates() {
    return {
      otp: 'Your CSY Pro verification code is: {{code}}. Valid for 10 minutes.',
      welcome: 'Welcome to CSY Pro! Your Pass ID is {{passId}}. Start ordering now!',
      order_confirmation: 'Order confirmed! Order #{{orderNumber}} - EGP {{total}}. Track in app.',
      order_ready: 'Your order #{{orderNumber}} is ready for pickup!',
      order_delivered: 'Your order #{{orderNumber}} has been delivered. Enjoy your meal!',
      driver_assigned: 'Driver {{driverName}} ({{driverPhone}}) is on the way to pick up your order #{{orderNumber}}.',
      reservation_reminder: 'Reminder: You have a reservation at {{businessName}} on {{date}} at {{time}}.',
      payment_success: 'Payment successful! EGP {{amount}} has been charged to your account.',
      wallet_topup: 'Your wallet has been topped up with EGP {{amount}}. New balance: EGP {{balance}}.',
      promotion: 'Special offer: {{message}}. Use code {{code}} to get {{discount}} off!'
    };
  }

  /**
   * Format phone number to international format
   */
  formatPhoneNumber(phone) {
    // Remove any existing + or country code
    let cleanPhone = phone.replace(/^\+/, '').replace(/^20/, '');

    // Remove any non-numeric characters
    cleanPhone = cleanPhone.replace(/\D/g, '');

    // Add country code
    return `${this.countryCode}${cleanPhone}`;
  }

  /**
   * Send SMS
   */
  async sendSMS(phoneNumber, message) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      // Validate phone number format
      if (!this.isValidPhoneNumber(formattedPhone)) {
        throw new Error('Invalid phone number format');
      }

      const result = await snsHelpers.sendSMS(formattedPhone, message);

      logger.info('SMS sent successfully', {
        to: formattedPhone,
        messageLength: message.length
      });

      return {
        success: true,
        messageId: result.messageId,
        phoneNumber: formattedPhone
      };
    } catch (error) {
      logger.error('SMS sending failed', {
        to: phoneNumber,
        error: error.message
      });

      throw new Error(`SMS sending failed: ${error.message}`);
    }
  }

  /**
   * Send templated SMS
   */
  async sendTemplateSMS(phoneNumber, templateName, templateData = {}) {
    try {
      const template = this.templates[templateName];
      if (!template) {
        throw new Error(`SMS template '${templateName}' not found`);
      }

      // Replace placeholders in template
      let message = template;
      Object.keys(templateData).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        message = message.replace(regex, templateData[key]);
      });

      return await this.sendSMS(phoneNumber, message);
    } catch (error) {
      logger.error('Template SMS sending failed', {
        to: phoneNumber,
        template: templateName,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Validate phone number format
   */
  isValidPhoneNumber(phoneNumber) {
    // Egyptian phone number pattern: +20 1XX XXXXXXX
    const egyptianPhoneRegex = /^\+20(10|11|12|15)\d{8}$/;
    return egyptianPhoneRegex.test(phoneNumber);
  }

  /**
   * Send OTP SMS
   */
  async sendOTP(phoneNumber, otp) {
    return await this.sendTemplateSMS(phoneNumber, 'otp', { code: otp });
  }

  /**
   * Send welcome SMS
   */
  async sendWelcomeSMS(phoneNumber, passId) {
    return await this.sendTemplateSMS(phoneNumber, 'welcome', { passId });
  }

  /**
   * Send order confirmation SMS
   */
  async sendOrderConfirmationSMS(phoneNumber, orderNumber, total) {
    return await this.sendTemplateSMS(phoneNumber, 'order_confirmation', {
      orderNumber,
      total: (total / 100).toFixed(2) // Convert from piastres to EGP
    });
  }

  /**
   * Send order status SMS
   */
  async sendOrderStatusSMS(phoneNumber, orderNumber, status) {
    const statusMessages = {
      preparing: 'Your order #{{orderNumber}} is being prepared.',
      ready: 'Your order #{{orderNumber}} is ready for pickup!',
      picked_up: 'Your order #{{orderNumber}} has been picked up by the driver.',
      in_delivery: 'Your order #{{orderNumber}} is on the way!',
      delivered: 'Your order #{{orderNumber}} has been delivered. Enjoy your meal!'
    };

    const template = statusMessages[status] || 'Your order #{{orderNumber}} status: {{status}}';

    return await this.sendTemplateSMS(phoneNumber, status, {
      orderNumber,
      status: status.charAt(0).toUpperCase() + status.slice(1)
    });
  }

  /**
   * Send driver assignment SMS
   */
  async sendDriverAssignedSMS(phoneNumber, orderNumber, driverName, driverPhone) {
    return await this.sendTemplateSMS(phoneNumber, 'driver_assigned', {
      orderNumber,
      driverName,
      driverPhone
    });
  }

  /**
   * Send reservation reminder SMS
   */
  async sendReservationReminder(phoneNumber, businessName, date, time) {
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });

    return await this.sendTemplateSMS(phoneNumber, 'reservation_reminder', {
      businessName,
      date: formattedDate,
      time
    });
  }

  /**
   * Send payment success SMS
   */
  async sendPaymentSuccessSMS(phoneNumber, amount) {
    return await this.sendTemplateSMS(phoneNumber, 'payment_success', {
      amount: (amount / 100).toFixed(2)
    });
  }

  /**
   * Send wallet topup SMS
   */
  async sendWalletTopupSMS(phoneNumber, amount, newBalance) {
    return await this.sendTemplateSMS(phoneNumber, 'wallet_topup', {
      amount: (amount / 100).toFixed(2),
      balance: (newBalance / 100).toFixed(2)
    });
  }

  /**
   * Send promotional SMS
   */
  async sendPromotionSMS(phoneNumber, message, code, discount) {
    return await this.sendTemplateSMS(phoneNumber, 'promotion', {
      message,
      code,
      discount
    });
  }

  /**
   * Send bulk SMS (for marketing/promotions)
   */
  async sendBulkSMS(phoneNumbers, message, batchSize = 10) {
    const results = [];
    const errors = [];

    // Process in batches to avoid rate limits
    for (let i = 0; i < phoneNumbers.length; i += batchSize) {
      const batch = phoneNumbers.slice(i, i + batchSize);

      const batchPromises = batch.map(async (phoneNumber) => {
        try {
          const result = await this.sendSMS(phoneNumber, message);
          results.push(result);
          return result;
        } catch (error) {
          errors.push({ phoneNumber, error: error.message });
          return null;
        }
      });

      // Wait for current batch to complete before processing next batch
      await Promise.allSettled(batchPromises);

      // Small delay between batches to respect rate limits
      if (i + batchSize < phoneNumbers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    logger.info('Bulk SMS completed', {
      total: phoneNumbers.length,
      successful: results.length,
      failed: errors.length
    });

    return {
      successful: results.length,
      failed: errors.length,
      results,
      errors
    };
  }

  /**
   * Check SMS delivery status (if supported by provider)
   */
  async checkDeliveryStatus(messageId) {
    // This would depend on your SMS provider's API
    // For AWS SNS, delivery status is typically handled via SNS topics
    logger.info('Delivery status check requested', { messageId });

    // Placeholder - implement based on your SMS provider
    return {
      messageId,
      status: 'unknown',
      note: 'Delivery status checking not implemented for current provider'
    };
  }

  /**
   * Get SMS costs (estimated)
   */
  getEstimatedCost(message, phoneNumbers = 1) {
    // Rough estimation: ~0.03 EGP per SMS in Egypt
    const costPerSMS = 0.03;
    const messageLength = message.length;

    // Each SMS can contain ~160 characters
    const smsCount = Math.ceil(messageLength / 160);
    const totalCost = costPerSMS * smsCount * phoneNumbers;

    return {
      costPerSMS,
      smsCount,
      totalCost: Math.round(totalCost * 100) / 100,
      currency: 'EGP'
    };
  }

  /**
   * Validate message content
   */
  validateMessage(message) {
    const errors = [];

    if (!message || message.trim().length === 0) {
      errors.push('Message cannot be empty');
    }

    if (message.length > 160) {
      errors.push('Message too long. Maximum 160 characters allowed.');
    }

    // Check for potentially harmful content
    const harmfulPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i
    ];

    harmfulPatterns.forEach(pattern => {
      if (pattern.test(message)) {
        errors.push('Message contains potentially harmful content');
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      length: message.length,
      smsCount: Math.ceil(message.length / 160)
    };
  }
}

module.exports = new SMSService();
