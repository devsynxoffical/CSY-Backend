const { prisma } = require('../config/database');
const { generateQRToken, generateQRDataURL, decodeQRData } = require('../utils/qrGenerator');
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
        return {
          success: false,
          message: `Invalid QR type: ${type}`,
          error: 'INVALID_QR_TYPE'
        };
      }

      const qrCode = generateQRToken(type, referenceId);
      const expiresAt = new Date(Date.now() + this.expiryTimes[type]);

      // Validate reference exists (skip for payment/discount)
      if (type !== 'payment' && type !== 'discount') {
        const isValid = await this.validateReference(type, referenceId);
        if (!isValid) {
          return {
            success: false,
            message: `${type} with ID ${referenceId} not found`,
            error: 'REFERENCE_NOT_FOUND'
          };
        }
      }

      // Prepare QR data
      const qrData = {
        type,
        reference_id: referenceId,
        qr_token: qrCode,
        timestamp: Date.now(),
        ...additionalData
      };

      // Create QR code record using Prisma
      const createdQR = await prisma.qRCode.create({
        data: {
          code: qrCode, // Schema uses 'code' not 'qr_token'
          type: type, // Schema uses 'type' not 'qr_type'
          reference_id: referenceId,
          user_id: additionalData.user_id || null,
          business_id: additionalData.business_id || null,
          cashier_id: additionalData.cashier_id || null,
          expires_at: expiresAt,
          data: qrData, // Store full QR data in JSON field
          is_used: false
        }
      });

      // Generate QR image data URL
      let qrDataURL = null;
      try {
        qrDataURL = await generateQRDataURL(JSON.stringify(qrData));
      } catch (error) {
        logger.warn('QR image generation failed', { error: error.message });
      }

      logger.info('QR code generated', {
        id: createdQR.id,
        type,
        referenceId,
        code: qrCode
      });

      return {
        success: true,
        data: {
          id: createdQR.id,
          qr_token: createdQR.code, // Return as qr_token for compatibility
          qr_type: createdQR.type, // Return as qr_type for compatibility
          reference_id: createdQR.reference_id,
          qr_data_url: qrDataURL,
          expires_at: createdQR.expires_at,
          type: createdQR.type
        }
      };
    } catch (error) {
      logger.error('QR code generation failed', {
        type,
        referenceId,
        error: error.message
      });
      return {
        success: false,
        message: error.message || 'Failed to generate QR code',
        error: 'QR_GENERATION_FAILED'
      };
    }
  }

  /**
   * Validate that the reference exists
   */
  async validateReference(type, referenceId) {
    try {
      switch (type) {
        case 'reservation':
          const reservation = await prisma.reservation.findUnique({
            where: { id: referenceId }
          });
          return !!reservation;

        case 'order':
        case 'driver_pickup':
          const order = await prisma.order.findUnique({
            where: { id: referenceId }
          });
          return !!order;

        case 'discount':
        case 'payment':
          // Skip validation for these types
          return true;

        default:
          return false;
      }
    } catch (error) {
      logger.error('Reference validation failed', { type, referenceId, error: error.message });
      return false;
    }
  }

  /**
   * Validate QR code
   */
  async validateQR(qrToken) {
    try {
      const qrCode = await prisma.qRCode.findUnique({
        where: { code: qrToken }
      });

      if (!qrCode) {
        return {
          isValid: false,
          message: 'QR code not found',
          error: 'QR_NOT_FOUND',
          reason: 'QR code does not exist'
        };
      }

      // Check if expired
      if (qrCode.expires_at && new Date() > new Date(qrCode.expires_at)) {
        return {
          isValid: false,
          message: 'QR code has expired',
          error: 'QR_EXPIRED',
          reason: 'QR code has passed its expiration date'
        };
      }

      // Check if already used (for one-time use codes)
      if (qrCode.is_used && ['discount', 'payment'].includes(qrCode.type)) {
        return {
          isValid: false,
          message: 'QR code has already been used',
          error: 'QR_ALREADY_USED',
          reason: 'This QR code can only be used once'
        };
      }

      return {
        isValid: true,
        qrData: {
          id: qrCode.id,
          type: qrCode.type,
          reference_id: qrCode.reference_id,
          expires_at: qrCode.expires_at,
          is_used: qrCode.is_used,
          data: qrCode.data
        }
      };
    } catch (error) {
      logger.error('QR validation failed', { qrToken, error: error.message });
      return {
        isValid: false,
        message: 'Failed to validate QR code',
        error: 'VALIDATION_FAILED',
        reason: error.message
      };
    }
  }

  /**
   * Scan and process QR code
   */
  async scanQR(qrToken, scannerUserId = null, action = null, additionalData = {}) {
    try {
      // Find QR code by code (token)
      const qrCode = await prisma.qRCode.findUnique({
        where: { code: qrToken }
      });

      if (!qrCode) {
        return {
          success: false,
          message: 'QR code not found',
          error: 'QR_NOT_FOUND',
          statusCode: 404
        };
      }

      // Check if expired
      if (qrCode.expires_at && new Date() > new Date(qrCode.expires_at)) {
        return {
          success: false,
          message: 'QR code has expired',
          error: 'QR_EXPIRED',
          statusCode: 400
        };
      }

      // Check if already used (for one-time use codes)
      if (qrCode.is_used && ['discount', 'payment'].includes(qrCode.type)) {
        return {
          success: false,
          message: 'QR code has already been used',
          error: 'QR_ALREADY_USED',
          statusCode: 400
        };
      }

      // Process based on type
      const result = await this.processQRCode(qrCode, scannerUserId, additionalData);

      if (!result.success) {
        return {
          success: false,
          message: result.message || 'Failed to process QR code',
          error: result.error || 'PROCESSING_FAILED',
          statusCode: result.statusCode || 400,
          data: result.data
        };
      }

      // Mark as used if applicable
      const updateData = {
        is_used: ['discount', 'payment'].includes(qrCode.type) ? true : qrCode.is_used,
        used_at: ['discount', 'payment'].includes(qrCode.type) ? new Date() : qrCode.used_at
      };

      await prisma.qRCode.update({
        where: { id: qrCode.id },
        data: updateData
      });

      logger.info('QR code scanned successfully', {
        qrId: qrCode.id,
        type: qrCode.type,
        scannerUserId,
        result: result.success
      });

      return {
        success: true,
        message: result.message || 'QR code processed successfully',
        data: result
      };
    } catch (error) {
      logger.error('QR code scan failed', {
        qrToken,
        scannerUserId,
        error: error.message
      });

      return {
        success: false,
        message: error.message || 'Failed to scan QR code',
        error: 'SCAN_FAILED',
        statusCode: 500
      };
    }
  }

  /**
   * Process QR code based on type
   */
  async processQRCode(qrCode, scannerUserId, scannerData) {
    switch (qrCode.type) {
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
        return {
          success: false,
          message: `Unknown QR code type: ${qrCode.type}`,
          error: 'UNKNOWN_QR_TYPE'
        };
    }
  }

  /**
   * Process reservation QR code
   */
  async processReservationQR(qrCode, scannerUserId) {
    try {
      if (!qrCode.reference_id) {
        return {
          success: false,
          message: 'Reservation ID not found in QR code',
          error: 'MISSING_REFERENCE'
        };
      }

      const reservation = await prisma.reservation.findUnique({
        where: { id: qrCode.reference_id },
        include: { business: true }
      });

      if (!reservation) {
        return {
          success: false,
          message: 'Reservation not found',
          error: 'RESERVATION_NOT_FOUND'
        };
      }

      // Verify scanner has permission (business owner or staff)
      if (qrCode.business_id && qrCode.business_id !== scannerUserId) {
        const business = await prisma.business.findUnique({
          where: { id: qrCode.business_id }
        });
        if (!business || business.owner_email !== scannerUserId) {
          return {
            success: false,
            message: 'Unauthorized to scan this QR code',
            error: 'UNAUTHORIZED',
            statusCode: 403
          };
        }
      }

      // Update reservation status if appropriate
      if (reservation.status === 'confirmed') {
        await prisma.reservation.update({
          where: { id: reservation.id },
          data: { status: 'completed' }
        });
      }

      return {
        success: true,
        type: 'reservation',
        reservationId: reservation.id,
        message: 'Reservation validated successfully',
        data: {
          reservation_id: reservation.id,
          status: 'completed'
        }
      };
    } catch (error) {
      logger.error('Reservation QR processing failed', { error: error.message });
      return {
        success: false,
        message: `Reservation QR processing failed: ${error.message}`,
        error: 'PROCESSING_FAILED'
      };
    }
  }

  /**
   * Process order QR code
   */
  async processOrderQR(qrCode, scannerUserId) {
    try {
      if (!qrCode.reference_id) {
        return {
          success: false,
          message: 'Order ID not found in QR code',
          error: 'MISSING_REFERENCE'
        };
      }

      const order = await prisma.order.findUnique({
        where: { id: qrCode.reference_id },
        include: {
          user: true,
          order_items: {
            include: {
              business: true
            }
          }
        }
      });

      if (!order) {
        return {
          success: false,
          message: 'Order not found',
          error: 'ORDER_NOT_FOUND'
        };
      }

      // Different processing based on scanner type
      if (qrCode.business_id) {
        // Business scanning for order pickup
        if (order.status === 'preparing' || order.status === 'accepted') {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: 'waiting_driver' }
          });
          return {
            success: true,
            type: 'order_pickup',
            orderId: order.id,
            message: 'Order ready for pickup',
            data: {
              order_id: order.id,
              status: 'waiting_driver'
            }
          };
        }
      }

      return {
        success: true,
        type: 'order_info',
        orderId: order.id,
        message: `Order status: ${order.status}`,
        data: {
          order_id: order.id,
          status: order.status,
          order_number: order.order_number
        }
      };
    } catch (error) {
      logger.error('Order QR processing failed', { error: error.message });
      return {
        success: false,
        message: `Order QR processing failed: ${error.message}`,
        error: 'PROCESSING_FAILED'
      };
    }
  }

  /**
   * Process discount QR code
   */
  async processDiscountQR(qrCode, scannerUserId) {
    try {
      return {
        success: true,
        type: 'discount',
        discountId: qrCode.reference_id,
        message: 'Discount applied successfully',
        data: {
          discount_id: qrCode.reference_id,
          type: 'percentage',
          value: qrCode.data?.discount_percentage || 10,
          description: 'Discount applied'
        }
      };
    } catch (error) {
      logger.error('Discount QR processing failed', { error: error.message });
      return {
        success: false,
        message: `Discount QR processing failed: ${error.message}`,
        error: 'PROCESSING_FAILED'
      };
    }
  }

  /**
   * Process payment QR code
   */
  async processPaymentQR(qrCode, scannerUserId, scannerData) {
    try {
      const paymentAmount = scannerData.amount || qrCode.data?.amount || 0;

      return {
        success: true,
        type: 'payment',
        paymentId: qrCode.reference_id,
        amount: paymentAmount,
        message: `Payment of ${paymentAmount / 100} EGP processed`,
        data: {
          payment_id: qrCode.reference_id,
          amount: paymentAmount,
          currency: 'EGP',
          status: 'completed'
        }
      };
    } catch (error) {
      logger.error('Payment QR processing failed', { error: error.message });
      return {
        success: false,
        message: `Payment QR processing failed: ${error.message}`,
        error: 'PROCESSING_FAILED'
      };
    }
  }

  /**
   * Process driver pickup QR code
   */
  async processDriverPickupQR(qrCode, scannerUserId) {
    try {
      if (!qrCode.reference_id) {
        return {
          success: false,
          message: 'Order ID not found in QR code',
          error: 'MISSING_REFERENCE'
        };
      }

      const order = await prisma.order.findUnique({
        where: { id: qrCode.reference_id }
      });

      if (!order) {
        return {
          success: false,
          message: 'Order not found',
          error: 'ORDER_NOT_FOUND'
        };
      }

      // Verify driver is assigned to this order
      if (order.driver_id && order.driver_id !== scannerUserId) {
        return {
          success: false,
          message: 'You are not assigned to this order',
          error: 'UNAUTHORIZED',
          statusCode: 403
        };
      }

      // Update order status
      if (order.status === 'waiting_driver' || order.status === 'accepted') {
        await prisma.order.update({
          where: { id: order.id },
          data: { 
            status: 'in_delivery',
            driver_id: scannerUserId
          }
        });
      }

      return {
        success: true,
        type: 'driver_pickup',
        orderId: order.id,
        message: 'Order picked up successfully',
        data: {
          order_id: order.id,
          status: 'in_delivery'
        }
      };
    } catch (error) {
      logger.error('Driver pickup QR processing failed', { error: error.message });
      return {
        success: false,
        message: `Driver pickup QR processing failed: ${error.message}`,
        error: 'PROCESSING_FAILED'
      };
    }
  }

  /**
   * Get QR code by token (without processing)
   */
  async getQRByToken(qrToken) {
    try {
      const qrCode = await prisma.qRCode.findUnique({
        where: { code: qrToken }
      });

      if (!qrCode) {
        return null;
      }

      return {
        id: qrCode.id,
        type: qrCode.type,
        referenceId: qrCode.reference_id,
        expiresAt: qrCode.expires_at,
        isUsed: qrCode.is_used,
        isExpired: qrCode.expires_at ? new Date() > new Date(qrCode.expires_at) : false,
        usedAt: qrCode.used_at,
        data: qrCode.data
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
      const qrCodes = await prisma.qRCode.findMany({
        where: { 
          type: type,
          reference_id: referenceId
        },
        orderBy: { created_at: 'desc' }
      });

      return qrCodes.map(qr => ({
        id: qr.id,
        token: qr.code,
        type: qr.type,
        expiresAt: qr.expires_at,
        isUsed: qr.is_used,
        usedAt: qr.used_at,
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
}

module.exports = new QRService();
