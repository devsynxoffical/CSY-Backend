const express = require('express');
const router = express.Router();

// Import controllers and middlewares
const qrController = require('../controllers/qr.controller');
const {
  authenticate,
  validateQRGeneration,
  validateQRValidation,
  validateQRScan,
  handleValidationErrors
} = require('../middlewares');

// Import rate limiters
const {
  generalLimiter,
  strictLimiter
} = require('../middlewares');

/**
 * @swagger
 * tags:
 *   name: QR Code Management
 *   description: QR code generation, validation and scanning operations
 */

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/qr/generate:
 *   post:
 *     summary: Generate QR code
 *     tags: [QR Code Management]
 *     description: Generate QR codes for discounts, payments, reservations, orders, and driver pickups
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - reference_id
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [discount, payment, reservation, order, driver_pickup]
 *                 description: Type of QR code to generate
 *                 example: order
 *               reference_id:
 *                 type: string
 *                 description: ID of the referenced entity (order, reservation, etc.)
 *                 example: "64f1a2b3c4d5e6f7g8h9i0j1"
 *               additional_data:
 *                 type: object
 *                 description: Additional data specific to the QR type
 *                 properties:
 *                   business_id:
 *                     type: string
 *                     description: Business ID (for business-related QR codes)
 *                   driver_id:
 *                     type: string
 *                     description: Driver ID (for driver pickup QR codes)
 *     responses:
 *       201:
 *         description: QR code generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     qr_id:
 *                       type: string
 *                     qr_token:
 *                       type: string
 *                     qr_data_url:
 *                       type: string
 *                     expires_at:
 *                       type: string
 *                       format: date-time
 *                     qr_type:
 *                       type: string
 *       400:
 *         description: Invalid request data or reference not found
 *       401:
 *         description: Unauthorized
 */
router.post('/generate', strictLimiter, validateQRGeneration, handleValidationErrors, qrController.generateQR);

/**
 * @swagger
 * /api/qr/validate:
 *   post:
 *     summary: Validate QR code
 *     tags: [QR Code Management]
 *     description: Validate if a QR code token is valid and not expired
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qr_token
 *             properties:
 *               qr_token:
 *                 type: string
 *                 description: QR code token to validate
 *                 example: "ABC123DEF456"
 *     responses:
 *       200:
 *         description: QR code validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     is_valid:
 *                       type: boolean
 *                     qr_data:
 *                       type: object
 *                       nullable: true
 *                     expires_at:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     qr_type:
 *                       type: string
 *                       nullable: true
 *                     reference_id:
 *                       type: string
 *                       nullable: true
 *       400:
 *         description: Invalid QR token or QR code expired/invalid
 *       401:
 *         description: Unauthorized
 */
router.post('/validate', generalLimiter, validateQRValidation, handleValidationErrors, qrController.validateQR);

/**
 * @swagger
 * /api/qr/scan:
 *   post:
 *     summary: Scan and process QR code
 *     tags: [QR Code Management]
 *     description: Scan a QR code and perform the associated action (payment, discount application, etc.)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qr_token
 *             properties:
 *               qr_token:
 *                 type: string
 *                 description: QR code token to scan
 *                 example: "ABC123DEF456"
 *               action:
 *                 type: string
 *                 enum: [process, redeem, confirm_pickup]
 *                 description: Action to perform with the QR code
 *                 example: process
 *               additional_data:
 *                 type: object
 *                 description: Additional data required for the action
 *                 properties:
 *                   amount:
 *                     type: number
 *                     description: Amount for payment QR codes
 *                   discount_percentage:
 *                     type: number
 *                     description: Discount percentage for discount QR codes
 *     responses:
 *       200:
 *         description: QR code scanned and processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   description: Processing result data
 *       400:
 *         description: Invalid QR token, action, or processing failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied (QR code not for this user)
 *       404:
 *         description: QR code not found
 */
router.post('/scan', generalLimiter, validateQRScan, handleValidationErrors, qrController.scanQR);

module.exports = router;
