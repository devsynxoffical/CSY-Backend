const express = require('express');
const router = express.Router();

// Import controllers and middlewares
const paymentController = require('../controllers/payment.controller');
const {
  authenticate,
  validateWalletTopup,
  validatePaymentProcessing,
  validateRefundRequest,
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
 *   name: Payment Management
 *   description: Payment processing, wallet operations and refunds
 */

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/payments/wallet/topup:
 *   post:
 *     summary: Add balance to wallet
 *     tags: [Payment Management]
 *     description: Add money to user's wallet using external payment methods
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - payment_method
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 1
 *                 description: Amount to add in EGP
 *                 example: 100
 *               payment_method:
 *                 type: string
 *                 enum: [stripe, paymob]
 *                 description: Payment method to use
 *                 example: stripe
 *     responses:
 *       200:
 *         description: Wallet balance added successfully
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
 *                     transaction_id:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     new_balance:
 *                       type: number
 *                     currency:
 *                       type: string
 *                       example: EGP
 *                     payment_reference:
 *                       type: string
 *                       nullable: true
 *       400:
 *         description: Invalid request data or payment failed
 *       401:
 *         description: Unauthorized
 */
router.post('/wallet/topup', strictLimiter, validateWalletTopup, handleValidationErrors, paymentController.addWalletBalance);

/**
 * @swagger
 * /api/payments/process:
 *   post:
 *     summary: Process payment for order
 *     tags: [Payment Management]
 *     description: Process payment for an order using wallet balance and/or external payment methods
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - order_id
 *             properties:
 *               order_id:
 *                 type: string
 *                 description: Order ID to process payment for
 *               payment_method:
 *                 type: string
 *                 enum: [stripe, paymob]
 *                 description: External payment method (required if wallet balance is insufficient)
 *               use_wallet:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to use wallet balance for payment
 *     responses:
 *       200:
 *         description: Payment processed successfully
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
 *                     order_id:
 *                       type: string
 *                     total_amount:
 *                       type: number
 *                     wallet_deduction:
 *                       type: number
 *                     payment_amount:
 *                       type: number
 *                     payment_method:
 *                       type: string
 *                     transactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           amount:
 *                             type: number
 *                           method:
 *                             type: string
 *                     payment_reference:
 *                       type: string
 *                       nullable: true
 *       400:
 *         description: Invalid request data or payment failed
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
router.post('/process', strictLimiter, validatePaymentProcessing, handleValidationErrors, paymentController.processPayment);

/**
 * @swagger
 * /api/payments/verify:
 *   post:
 *     summary: Verify payment status
 *     tags: [Payment Management]
 *     description: Verify the status of a payment transaction with external payment providers
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transaction_id:
 *                 type: string
 *                 description: Internal transaction ID
 *               payment_reference:
 *                 type: string
 *                 description: External payment reference ID
 *             oneOf:
 *               - required: [transaction_id]
 *               - required: [payment_reference]
 *     responses:
 *       200:
 *         description: Payment verification completed
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
 *                     transaction_id:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [pending, completed, failed, refunded]
 *                     amount:
 *                       type: number
 *                     payment_method:
 *                       type: string
 *                     verified_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Transaction not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
router.post('/verify', generalLimiter, paymentController.verifyPayment);

/**
 * @swagger
 * /api/payments/refund:
 *   post:
 *     summary: Process refund
 *     tags: [Payment Management]
 *     description: Process a refund for a completed or cancelled order
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - order_id
 *             properties:
 *               order_id:
 *                 type: string
 *                 description: Order ID to process refund for
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Refund amount (if not provided, full order amount will be refunded)
 *               reason:
 *                 type: string
 *                 description: Reason for the refund
 *                 example: Customer request
 *     responses:
 *       200:
 *         description: Refund processed successfully
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
 *                     order_id:
 *                       type: string
 *                     refund_amount:
 *                       type: number
 *                     refund_method:
 *                       type: string
 *                     transaction_id:
 *                       type: string
 *                     refund_reference:
 *                       type: string
 *                       nullable: true
 *       400:
 *         description: Invalid request data or refund failed
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
router.post('/refund', strictLimiter, validateRefundRequest, handleValidationErrors, paymentController.processRefund);

/**
 * @swagger
 * /api/payments/wallet/balance:
 *   get:
 *     summary: Get wallet balance
 *     tags: [Payment Management]
 *     description: Retrieve current wallet balance for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance retrieved successfully
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
 *                     balance:
 *                       type: number
 *                       example: 150.50
 *                     currency:
 *                       type: string
 *                       example: EGP
 *                     last_updated:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *       401:
 *         description: Unauthorized
 */
router.get('/wallet/balance', generalLimiter, paymentController.getWalletBalance);

/**
 * @swagger
 * /api/payments/wallet/history:
 *   get:
 *     summary: Get wallet transaction history
 *     tags: [Payment Management]
 *     description: Retrieve paginated wallet transaction history
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of transactions per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [wallet_topup, payment, refund, discount, earnings]
 *         description: Filter by transaction type
 *     responses:
 *       200:
 *         description: Wallet history retrieved successfully
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
 *                     transactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           type:
 *                             type: string
 *                           amount:
 *                             type: number
 *                           status:
 *                             type: string
 *                           description:
 *                             type: string
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/wallet/history', generalLimiter, paymentController.getWalletHistory);

module.exports = router;
