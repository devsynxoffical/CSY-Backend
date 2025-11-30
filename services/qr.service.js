const { QRCode, Reservation, Order, Business, User, Driver } = require('../models');
const { generateQRToken, generateQRDataURL, decodeQRData } = require('../utils');
const { logger } = require('../utils');

/**
 * QR Code Service for managing QR codes across the application
 */
class QRService {
  constructor() {
    this.expiryTimes = {
      discount: 24 * 60 * 60 * 1000, // 24 hours
      payment: 60 * 60 * 1000, // 1 hour
      reservation: 24 * 60 * 60 * 1000, // 24 hours
      order: 24 * 60 * 60 * 1000, // 24 hours
      driver_pickup: 2 * 60 * 60 * 1000 // 2 hours
    };
  }

  /**
   * Generate QR code for different types
   */
  async generateQR(type, referenceId, additionalData = {}) {
    try {
      if (!Object.keys(this.expiryTimes).includes(type)) {
        throw new Error(`Invalid QR type: ${type}`);
      }

      const qrToken = generateQRToken(type, referenceId);
      const expiresAt = new Date(Date.now() + this.expiryTimes[type]);

      // Validate reference exists
      await this.validateReference(type, referenceId);

      // Create QR code record
      const qrCode = await QRCode.create({
        qr_type: type,
        reference_id: referenceId,
        qr_token: qrToken,
        expires_at: expiresAt,
        user_id: additionalData.user_id,
        business_id: additionalData.business_id,
        driver_id: additionalData.driver_id
      });

      logger.info('QR code generated', {
        id: qrCode.id,
        type,
        referenceId,
        token: qrToken
      });

      return qrCode;
    } catch (error) {
      logger.error('QR code generation failed', {
        type,
        referenceId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Validate that the reference exists
   */
  async validateReference(type, referenceId) {
    let model;
    let idField = 'id';

    switch (type) {
      case 'reservation':
        model = Reservation;
        break;
      case 'order':
        model = Order;
        break;
      case 'discount':
      case 'payment':
        // These might reference different models based on context
        return true; // Skip validation for now
      case 'driver_pickup':
        // This might reference an order or delivery
        model = Order;
        break;
      default:
        throw new Error(`Unknown QR type: ${type}`);
    }

    const exists = await model.findOne({ where: { [idField]: referenceId } });
    if (!exists) {
      throw new Error(`${type} with ID ${referenceId} not found`);
    }

    return true;
  }

  /**
   * Scan and process QR code
   */
  async scanQR(qrToken, scannerUserId = null, scannerData = {}) {
    try {
      // Find QR code by token
      const qrCode = await QRCode.findOne({
        where: { qr_token: qrToken }
      });

      if (!qrCode) {
        throw new Error('QR code not found');
      }

      // Check if expired
      if (new Date() > qrCode.expires_at) {
        throw new Error('QR code has expired');
      }

      // Check if already used (for one-time use codes)
      if (qrCode.is_used && ['discount', 'payment'].includes(qrCode.qr_type)) {
        throw new Error('QR code has already been used');
      }

      // Process based on type
      const result = await this.processQRCode(qrCode, scannerUserId, scannerData);

      // Mark as used if applicable
      if (['discount', 'payment'].includes(qrCode.qr_type)) {
        await qrCode.update({ is_used: true });
      }

      // Update scan count and timestamp
      await qrCode.update({
        scan_count: qrCode.scan_count + 1,
        last_scanned_at: new Date()
      });

      logger.info('QR code scanned successfully', {
        qrId: qrCode.id,
        type: qrCode.qr_type,
        scannerUserId,
        result: result.success
      });

      return {
        success: true,
        qrCode,
        result,
        message: result.message
      };
    } catch (error) {
      logger.error('QR code scan failed', {
        qrToken,
        scannerUserId,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process QR code based on type
   */
  async processQRCode(qrCode, scannerUserId, scannerData) {
    switch (qrCode.qr_type) {
      case 'reservation':
        return await this.processReservationQR(qrCode, scannerUserId);

      case 'order':
        return await this.processOrderQR(qrCode, scannerUserId);

      case 'discount':
        return await this.processDiscountQR(qrCode, scannerUserId);

      case 'payment':
        return await this.processPaymentQR(qrCode, scannerUserId, scannerData);

      case 'driver_pickup':
        return await this.processDriverPickupQR(qrCode, scannerUserId);

      default:
        throw new Error(`Unknown QR code type: ${qrCode.qr_type}`);
    }
  }

  /**
   * Process reservation QR code
   */
  async processReservationQR(qrCode, scannerUserId) {
    try {
      const reservation = await Reservation.findOne({
        where: { id: qrCode.reference_id },
        include: [{ model: Business, as: 'business' }]
      });

      if (!reservation) {
        throw new Error('Reservation not found');
      }

      // Verify scanner has permission (business owner or staff)
      if (qrCode.business_id && qrCode.business_id !== scannerUserId) {
        const business = await Business.findOne({ where: { id: qrCode.business_id } });
        if (!business || business.owner_email !== scannerUserId) {
          throw new Error('Unauthorized to scan this QR code');
        }
      }

      // Update reservation status if appropriate
      if (reservation.status === 'confirmed') {
        await reservation.update({ status: 'completed' });
      }

      return {
        success: true,
        type: 'reservation',
        reservationId: reservation.id,
        customerName: reservation.customer_name,
        businessName: reservation.business_name,
        message: 'Reservation validated successfully'
      };
    } catch (error) {
      throw new Error(`Reservation QR processing failed: ${error.message}`);
    }
  }

  /**
   * Process order QR code
   */
  async processOrderQR(qrCode, scannerUserId) {
    try {
      const order = await Order.findOne({
        where: { id: qrCode.reference_id },
        include: [
          { model: User, as: 'user' },
          { model: Business, as: 'business' },
          { model: Driver, as: 'driver' }
        ]
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Different processing based on scanner type
      if (qrCode.business_id) {
        // Business scanning for order pickup
        if (order.status === 'ready') {
          await order.update({ status: 'completed' });
          return {
            success: true,
            type: 'order_pickup',
            orderId: order.id,
            message: 'Order picked up successfully'
          };
        }
      } else if (qrCode.driver_id) {
        // Driver scanning for delivery
        if (order.status === 'in_delivery') {
          await order.update({
            status: 'delivered',
            actual_delivery_time: new Date()
          });
          return {
            success: true,
            type: 'order_delivery',
            orderId: order.id,
            message: 'Order delivered successfully'
          };
        }
      }

      return {
        success: true,
        type: 'order_info',
        orderId: order.id,
        status: order.status,
        message: `Order status: ${order.status}`
      };
    } catch (error) {
      throw new Error(`Order QR processing failed: ${error.message}`);
    }
  }

  /**
   * Process discount QR code
   */
  async processDiscountQR(qrCode, scannerUserId) {
    try {
      // This would integrate with a discount/coupon system
      // For now, return basic discount info
      return {
        success: true,
        type: 'discount',
        discountId: qrCode.reference_id,
        message: 'Discount applied successfully',
        discount: {
          id: qrCode.reference_id,
          type: 'percentage',
          value: 10, // This would come from discount data
          description: '10% off your order'
        }
      };
    } catch (error) {
      throw new Error(`Discount QR processing failed: ${error.message}`);
    }
  }

  /**
   * Process payment QR code
   */
  async processPaymentQR(qrCode, scannerUserId, scannerData) {
    try {
      const paymentAmount = scannerData.amount || 0;

      return {
        success: true,
        type: 'payment',
        paymentId: qrCode.reference_id,
        amount: paymentAmount,
        message: `Payment of EGP ${paymentAmount / 100} processed`,
        payment: {
          id: qrCode.reference_id,
          amount: paymentAmount,
          currency: 'EGP',
          status: 'completed'
        }
      };
    } catch (error) {
      throw new Error(`Payment QR processing failed: ${error.message}`);
    }
  }

  /**
   * Process driver pickup QR code
   */
  async processDriverPickupQR(qrCode, scannerUserId) {
    try {
      const order = await Order.findOne({ where: { id: qrCode.reference_id } });

      if (!order) {
        throw new Error('Order not found');
      }

      // Verify driver is assigned to this order
      if (order.driver_id !== scannerUserId) {
        throw new Error('You are not assigned to this order');
      }

      // Update order status
      if (order.status === 'accepted') {
        await order.update({ status: 'picked_up' });
      }

      return {
        success: true,
        type: 'driver_pickup',
        orderId: order.id,
        message: 'Order picked up successfully'
      };
    } catch (error) {
      throw new Error(`Driver pickup QR processing failed: ${error.message}`);
    }
  }

  /**
   * Get QR code by token (without processing)
   */
  async getQRByToken(qrToken) {
    try {
      const qrCode = await QRCode.findOne({
        where: { qr_token: qrToken }
      });

      if (!qrCode) {
        return null;
      }

      return {
        id: qrCode.id,
        type: qrCode.qr_type,
        referenceId: qrCode.reference_id,
        expiresAt: qrCode.expires_at,
        isUsed: qrCode.is_used,
        isExpired: new Date() > qrCode.expires_at,
        scanCount: qrCode.scan_count,
        lastScannedAt: qrCode.last_scanned_at
      };
    } catch (error) {
      logger.error('Get QR by token failed', { qrToken, error: error.message });
      throw error;
    }
  }

  /**
   * Get QR codes by reference
   */
  async getQRCodesByReference(type, referenceId) {
    try {
      const qrCodes = await QRCode.findAll({
        where: { qr_type: type, reference_id: referenceId },
        order: [['created_at', 'DESC']]
      });

      return qrCodes.map(qr => ({
        id: qr.id,
        token: qr.qr_token,
        type: qr.qr_type,
        expiresAt: qr.expires_at,
        isUsed: qr.is_used,
        scanCount: qr.scan_count,
        createdAt: qr.created_at
      }));
    } catch (error) {
      logger.error('Get QR codes by reference failed', {
        type,
        referenceId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Regenerate QR code (for expired or lost codes)
   */
  async regenerateQR(qrId, newExpiryHours = null) {
    try {
      const existingQR = await QRCode.findOne({ where: { id: qrId } });

      if (!existingQR) {
        throw new Error('QR code not found');
      }

      const newExpiry = newExpiryHours
        ? new Date(Date.now() + (newExpiryHours * 60 * 60 * 1000))
        : new Date(Date.now() + this.expiryTimes[existingQR.qr_type]);

      const newToken = generateQRToken(existingQR.qr_type, existingQR.reference_id);

      await existingQR.update({
        qr_token: newToken,
        expires_at: newExpiry,
        is_used: false,
        scan_count: 0,
        last_scanned_at: null
      });

      logger.info('QR code regenerated', {
        qrId,
        newToken,
        type: existingQR.qr_type
      });

      return existingQR;
    } catch (error) {
      logger.error('QR code regeneration failed', { qrId, error: error.message });
      throw error;
    }
  }

  /**
   * Delete expired QR codes (cleanup job)
   */
  async deleteExpiredQRCodes() {
    try {
      const deletedCount = await QRCode.destroy({
        where: {
          expires_at: { [Op.lt]: new Date() },
          is_used: true
        }
      });

      logger.info('Expired QR codes deleted', { deletedCount });

      return deletedCount;
    } catch (error) {
      logger.error('Delete expired QR codes failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get QR code statistics
   */
  async getQRStats(startDate, endDate) {
    try {
      const stats = await QRCode.findAll({
        where: {
          created_at: { [Op.between]: [startDate, endDate] }
        },
        attributes: [
          'qr_type',
          [sequelize.fn('COUNT', sequelize.col('id')), 'total_count'],
          [sequelize.fn('SUM', sequelize.col('scan_count')), 'total_scans'],
          [sequelize.fn('SUM', sequelize.literal('CASE WHEN is_used THEN 1 ELSE 0 END')), 'used_count']
        ],
        group: ['qr_type']
      });

      return stats.map(stat => ({
        type: stat.qr_type,
        totalCount: parseInt(stat.dataValues.total_count),
        totalScans: parseInt(stat.dataValues.total_scans || 0),
        usedCount: parseInt(stat.dataValues.used_count || 0),
        usageRate: parseInt(stat.dataValues.total_count) > 0
          ? Math.round((parseInt(stat.dataValues.used_count || 0) / parseInt(stat.dataValues.total_count)) * 100)
          : 0
      }));
    } catch (error) {
      logger.error('Get QR stats failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Bulk generate QR codes
   */
  async bulkGenerateQRCodes(qrRequests) {
    const results = {
      successful: 0,
      failed: 0,
      qrCodes: [],
      errors: []
    };

    for (const request of qrRequests) {
      try {
        const qrCode = await this.generateQR(
          request.type,
          request.referenceId,
          request.additionalData || {}
        );
        results.qrCodes.push(qrCode);
        results.successful++;
      } catch (error) {
        results.errors.push({
          request,
          error: error.message
        });
        results.failed++;
      }
    }

    logger.info('Bulk QR generation completed', {
      total: qrRequests.length,
      successful: results.successful,
      failed: results.failed
    });

    return results;
  }
}

module.exports = new QRService();
