const express = require('express');
const router = express.Router();

// Import controllers and middlewares
const cashierController = require('../controllers/cashier.controller');
const {
  validateUUID,
  authenticateCashier
} = require('../middlewares');

// Import rate limiters
const {
  generalLimiter
} = require('../middlewares');

/**
 * @swagger
 * tags:
 *   name: Cashier Operations
 *   description: Cashier login and business operations endpoints
 */

// Public routes
/**
 * @swagger
 * /api/cashier/login:
 *   post:
 *     summary: Cashier login
 *     tags: [Cashier Operations]
 *     description: Authenticate cashier account for business operations
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Cashier email address
 *                 example: "cashier@restaurant.com"
 *               password:
 *                 type: string
 *                 description: Cashier password
 *                 example: "cashierpassword123"
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: "Login successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     cashier:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         business_id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         full_name:
 *                           type: string
 *                         is_active:
 *                           type: boolean
 *                         business:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             name:
 *                               type: string
 *                             type:
 *                               type: string
 *                     token:
 *                       type: string
 *                       description: JWT access token
 */
router.post('/login',
  generalLimiter,
  cashierController.login
);

// All routes below require cashier authentication
// Note: Cashier authentication is handled in the controller methods
// since they need to verify business ownership

/**
 * @swagger
 * /api/cashier/profile:
 *   get:
 *     summary: Get cashier profile
 *     tags: [Cashier Operations]
 *     description: Retrieve cashier profile and business information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
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
 *                   example: "Cashier profile retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     business_id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     full_name:
 *                       type: string
 *                     is_active:
 *                       type: boolean
 *                     business:
 *                       type: object
 *                       description: Associated business information
 */
router.get('/profile',
  authenticateCashier,
  generalLimiter,
  cashierController.getProfile
);

/**
 * @swagger
 * /api/cashier/orders:
 *   get:
 *     summary: Get business orders
 *     tags: [Cashier Operations]
 *     description: Retrieve orders for the cashier's business
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
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, accepted, preparing, ready, completed, cancelled]
 *         description: Filter by order status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
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
 *                   example: "Orders retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         description: Order data with customer information
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 */
router.get('/orders',
  authenticateCashier,
  generalLimiter,
  cashierController.getOrders
);

/**
 * @swagger
 * /api/cashier/orders/{id}/status:
 *   put:
 *     summary: Update order status
 *     tags: [Cashier Operations]
 *     description: Update the status of an order (accept, prepare, ready, etc.)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *         example: "60d5ecb74b24c72b8c8b4567"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, accepted, preparing, ready, completed, cancelled]
 *                 description: New order status
 *                 example: "preparing"
 *               notes:
 *                 type: string
 *                 description: Additional notes for the status update
 *                 example: "Customer requested extra cheese"
 *     responses:
 *       200:
 *         description: Order status updated successfully
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
 *                   example: "Order status updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                     status:
 *                       type: string
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 */
router.put('/orders/:id/status',
  authenticateCashier,
  generalLimiter,
  validateUUID,
  cashierController.updateOrderStatus
);

/**
 * @swagger
 * /api/cashier/products:
 *   get:
 *     summary: Get business products
 *     tags: [Cashier Operations]
 *     description: Retrieve products/menu items for the cashier's business
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
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by product category
 *       - in: query
 *         name: available
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by availability
 *     responses:
 *       200:
 *         description: Products retrieved successfully
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
 *                   example: "Products retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         type: object
 *                         description: Product data
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 */
router.get('/products',
  authenticateCashier,
  generalLimiter,
  cashierController.getProducts
);

/**
 * @swagger
 * /api/cashier/products/{id}/availability:
 *   put:
 *     summary: Update product availability
 *     tags: [Cashier Operations]
 *     description: Enable or disable a product for ordering
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *         example: "60d5ecb74b24c72b8c8b4567"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - is_available
 *             properties:
 *               is_available:
 *                 type: boolean
 *                 description: Product availability status
 *                 example: true
 *     responses:
 *       200:
 *         description: Product availability updated successfully
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
 *                   example: "Product enabled successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     is_available:
 *                       type: boolean
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 */
router.put('/products/:id/availability',
  authenticateCashier,
  generalLimiter,
  validateUUID,
  cashierController.updateProductAvailability
);

/**
 * @swagger
 * /api/cashier/orders/{id}/payment:
 *   post:
 *     summary: Process payment for order
 *     tags: [Cashier Operations]
 *     description: Mark an order as paid and process payment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *         example: "60d5ecb74b24c72b8c8b4567"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_method
 *             properties:
 *               payment_method:
 *                 type: string
 *                 enum: [cash, online, wallet]
 *                 description: Payment method used
 *                 example: "cash"
 *               payment_amount:
 *                 type: integer
 *                 description: Payment amount in piastres (optional, uses order total)
 *                 example: 75000
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
 *                   example: "Payment processed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                     payment_amount:
 *                       type: integer
 *                     payment_method:
 *                       type: string
 *                     payment_status:
 *                       type: string
 *                       example: "paid"
 *                     processed_at:
 *                       type: string
 *                       format: date-time
 */
router.post('/orders/:id/payment',
  authenticateCashier,
  generalLimiter,
  validateUUID,
  cashierController.processPayment
);

/**
 * @swagger
 * /api/cashier/reports/daily:
 *   get:
 *     summary: Get daily sales report
 *     tags: [Cashier Operations]
 *     description: Retrieve daily sales and operations report
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Report date (YYYY-MM-DD, defaults to today)
 *         example: "2024-01-15"
 *     responses:
 *       200:
 *         description: Daily report retrieved successfully
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
 *                   example: "Daily report retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     date:
 *                       type: string
 *                       format: date
 *                       example: "2024-01-15"
 *                     business_id:
 *                       type: string
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total_orders:
 *                           type: integer
 *                         completed_orders:
 *                           type: integer
 *                         cancelled_orders:
 *                           type: integer
 *                         paid_orders:
 *                           type: integer
 *                         total_revenue:
 *                           type: integer
 *                         cash_payments:
 *                           type: integer
 *                         online_payments:
 *                           type: integer
 *                     orders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         description: Individual order details
 */
router.get('/reports/daily',
  authenticateCashier,
  generalLimiter,
  cashierController.getDailyReport
);

/**
 * @swagger
 * /api/cashier/statistics:
 *   get:
 *     summary: Get cashier statistics
 *     tags: [Cashier Operations]
 *     description: Retrieve cashier performance and statistics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for statistics (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for statistics (YYYY-MM-DD)
 *         example: "2024-01-31"
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
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
 *                   example: "Cashier statistics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     period:
 *                       type: object
 *                       properties:
 *                         start:
 *                           type: string
 *                           format: date-time
 *                         end:
 *                           type: string
 *                           format: date-time
 *                     metrics:
 *                       type: object
 *                       properties:
 *                         orders_processed:
 *                           type: integer
 *                         payments_processed:
 *                           type: integer
 *                         total_revenue:
 *                           type: integer
 */
router.get('/statistics',
  authenticateCashier,
  generalLimiter,
  cashierController.getStatistics
);

/**
 * @swagger
 * /api/cashier/qr/scan:
 *   post:
 *     summary: Scan QR code
 *     tags: [Cashier Operations]
 *     description: Scan and process QR codes for discounts, payments, reservations, orders, or driver pickups
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
 *                 example: "abc123def456"
 *     responses:
 *       200:
 *         description: QR code scanned successfully
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
 *                   example: "QR code scanned successfully"
 *                 data:
 *                   type: object
 *                   description: Scan result based on QR code type
 *       400:
 *         description: Invalid QR token or unsupported type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid or expired QR code"
 *                 error:
 *                   type: string
 *                   example: "QR code not found or already used"
 *       404:
 *         description: QR code or associated resource not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Reservation not found"
 *                 error:
 *                   type: string
 *                   example: "Reservation associated with QR code not found"
 */
router.post('/qr/scan',
  authenticateCashier,
  generalLimiter,
  cashierController.scanQRCode
);

/**
 * @swagger
 * /api/cashier/operations:
 *   get:
 *     summary: Get operations history
 *     tags: [Cashier Operations]
 *     description: Retrieve cashier operations history including orders processed, payments, and QR scans
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
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for operations (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for operations (YYYY-MM-DD)
 *         example: "2024-01-31"
 *     responses:
 *       200:
 *         description: Operations history retrieved successfully
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
 *                   example: "Operations history retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         period:
 *                           type: object
 *                           properties:
 *                             start:
 *                               type: string
 *                               format: date-time
 *                             end:
 *                               type: string
 *                               format: date-time
 *                         total_orders_processed:
 *                           type: integer
 *                         total_payments_processed:
 *                           type: integer
 *                         total_revenue:
 *                           type: integer
 *                         total_qr_scans:
 *                           type: integer
 *                     recent_activity:
 *                       type: object
 *                       properties:
 *                         orders:
 *                           type: array
 *                           items:
 *                             type: object
 *                             description: Recent orders processed
 *                         payments:
 *                           type: array
 *                           items:
 *                             type: object
 *                             description: Recent payments processed
 *                         qr_scans:
 *                           type: array
 *                           items:
 *                             type: object
 *                             description: Recent QR code scans
 */
router.get('/operations',
  authenticateCashier,
  generalLimiter,
  cashierController.getOperationsHistory
);

module.exports = router;
