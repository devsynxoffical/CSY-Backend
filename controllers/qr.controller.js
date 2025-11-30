const { prisma } = require('../models');
const CacheService = require('../services/cache.service');
const { qrService } = require('../services');
const { logger } = require('../utils');
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../config/constants');

/**
 * QR Controller - Handles QR code generation, validation and scanning operations
 */
class QRController {
  /**
   * Generate QR code
   */
  async generateQR(req, res) {
    try {
      const userId = req.user.id;
      const { type, reference_id, additional_data } = req.body;

      // Validate required fields
      if (!type || !reference_id) {
        return res.status(400).json({
          success: false,
          message: 'QR type and reference ID are required',
          error: 'MISSING_REQUIRED_FIELDS'
        });
      }

      // Validate QR type
      const validTypes = ['discount', 'payment', 'reservation', 'order', 'driver_pickup'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: `Invalid QR type. Allowed types: ${validTypes.join(', ')}`,
          error: 'INVALID_QR_TYPE'
        });
      }

      // Prepare additional data
      const additionalData = {
        user_id: userId,
        ...additional_data
      };

      // Generate QR code
      const qrResult = await qrService.generateQR(type, reference_id, additionalData);

      if (!qrResult.success) {
        return res.status(400).json({
          success: false,
          message: qrResult.message,
          error: qrResult.error
        });
      }

      res.status(201).json({
        success: true,
        message: 'QR code generated successfully',
        data: qrResult.data
      });

    } catch (error) {
      logger.error('Generate QR error', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Failed to generate QR code',
        error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
      });
    }
  }

  /**
   * Validate QR code
   */
  async validateQR(req, res) {
    try {
      const { qr_token } = req.body;

      if (!qr_token) {
        return res.status(400).json({
          success: false,
          message: 'QR token is required',
          error: 'MISSING_QR_TOKEN'
        });
      }

      // Validate QR code
      const validationResult = await qrService.validateQR(qr_token);

      if (!validationResult.isValid) {
        return res.status(400).json({
          success: false,
          message: validationResult.message,
          error: validationResult.error,
          data: {
            is_valid: false,
            reason: validationResult.reason
          }
        });
      }

      res.json({
        success: true,
        message: 'QR code is valid',
        data: {
          is_valid: true,
          qr_data: validationResult.qrData,
          expires_at: validationResult.qrData.expires_at,
          qr_type: validationResult.qrData.qr_type,
          reference_id: validationResult.qrData.reference_id
        }
      });

    } catch (error) {
      logger.error('Validate QR error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to validate QR code',
        error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
      });
    }
  }

  /**
   * Scan and process QR code
   */
  async scanQR(req, res) {
    try {
      const userId = req.user.id;
      const { qr_token, action, additional_data } = req.body;

      if (!qr_token) {
        return res.status(400).json({
          success: false,
          message: 'QR token is required',
          error: 'MISSING_QR_TOKEN'
        });
      }

      // Scan and process QR code
      const scanResult = await qrService.scanQR(qr_token, userId, action, additional_data);

      if (!scanResult.success) {
        return res.status(scanResult.statusCode || 400).json({
          success: false,
          message: scanResult.message,
          error: scanResult.error,
          data: scanResult.data
        });
      }

      res.json({
        success: true,
        message: scanResult.message,
        data: scanResult.data
      });

    } catch (error) {
      logger.error('Scan QR error', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Failed to scan QR code',
        error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
      });
    }
  }
}

module.exports = new QRController();
