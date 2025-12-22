const express = require('express');
const router = express.Router();

// Import controllers and middlewares
const driverController = require('../controllers/driver.controller');
const {
  authenticate,
  authenticateDriver,
  validateUserUpdate,
  validateDriverRegistration,
  validateDriverLogin,
  handleValidationErrors
} = require('../middlewares');

// Import rate limiters
const {
  generalLimiter
} = require('../middlewares');

/**
 * @swagger
 * tags:
 *   name: Driver Management
 *   description: Driver registration, profile management, and delivery operations
 */

// Public routes
/**
 * @swagger
 * /api/driver/register:
 *   post:
 *     summary: Register a new driver
 *     tags: [Driver Management]
 *     description: Create a new driver account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *               - email
 *               - phone
 *               - vehicle_type
 *               - password_hash
 *             properties:
 *               full_name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Driver full name
 *                 example: "Ahmed Mohamed"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Driver email address
 *                 example: "ahmed@example.com"
 *               phone:
 *                 type: string
 *                 pattern: '^\+?[0-9]{10,15}$'
 *                 description: Driver phone number
 *                 example: "+201234567890"
 *               vehicle_type:
 *                 type: string
 *                 description: Type of vehicle (car, motorcycle, bicycle, etc.)
 *                 example: "car"
 *               password_hash:
 *                 type: string
 *                 minLength: 8
 *                 description: Account password
 *                 example: "securepassword123"
 *     responses:
 *       201:
 *         description: Driver registered successfully
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
 *                   example: "Profile updated"
 *                 data:
 *                   type: object
 *                   properties:
 *                     driver:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         full_name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         vehicle_type:
 *                           type: string
 *                         profile_picture:
 *                           type: string
 *                         earnings_cash:
 *                           type: number
 *                         earnings_online:
 *                           type: number
 *                         platform_fees_owed:
 *                           type: number
 *                         is_available:
 *                           type: boolean
 *                         is_active:
 *                           type: boolean
 *                         rating_average:
 *                           type: number
 *                         rating_count:
 *                           type: integer
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                     token:
 *                       type: string
 *                       description: JWT access token
 */
router.post('/register',
  generalLimiter,
  validateDriverRegistration,
  handleValidationErrors,
  driverController.register
);

/**
 * @swagger
 * /api/driver/login:
 *   post:
 *     summary: Driver login
 *     tags: [Driver Management]
 *     description: Authenticate driver account
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
 *                 description: Driver email address
 *                 example: "ahmed@example.com"
 *               password:
 *                 type: string
 *                 description: Account password
 *                 example: "securepassword123"
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
 *                     driver:
 *                       type: object
 *                       description: Driver profile data
 *                     token:
 *                       type: string
 *                       description: JWT access token
 */
router.post('/login',
  generalLimiter,
  validateDriverLogin,
  handleValidationErrors,
  driverController.login
);

// All routes below require driver authentication
router.use(authenticateDriver);

/**
 * @swagger
 * /api/driver/profile:
 *   get:
 *     summary: Get driver profile
 *     tags: [Driver Management]
 *     description: Retrieve driver profile and current status
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
 *                   example: "Driver profile retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     full_name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     vehicle_type:
 *                       type: string
 *                     profile_picture:
 *                       type: string
 *                     earnings_cash:
 *                       type: number
 *                     earnings_online:
 *                       type: number
 *                     platform_fees_owed:
 *                       type: number
 *                     current_latitude:
 *                       type: number
 *                     current_longitude:
 *                       type: number
 *                     is_available:
 *                       type: boolean
 *                     is_active:
 *                       type: boolean
 *                     rating_average:
 *                       type: number
 *                     rating_count:
 *                       type: integer
 *                     stats:
 *                       type: object
 *                       properties:
 *                         active_orders:
 *                           type: integer
 *                         completed_today:
 *                           type: integer
 *                         ratings_summary:
 *                           type: object
 *                           properties:
 *                             average:
 *                               type: number
 *                             total:
 *                               type: integer
 *                     active_orders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         description: Current active orders
 */
router.get('/profile',
  generalLimiter,
  driverController.getProfile
);

/**
 * @swagger
 * /api/driver/profile:
 *   put:
 *     summary: Update driver profile
 *     tags: [Driver Management]
 *     description: Update driver information (name, phone, vehicle type, etc.)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Driver full name
 *                 example: "Ahmed Mohamed Ali"
 *               phone:
 *                 type: string
 *                 pattern: '^\+?[0-9]{10,15}$'
 *                 description: Driver phone number
 *                 example: "+201234567891"
 *               vehicle_type:
 *                 type: string
 *                 description: Type of vehicle
 *                 example: "motorcycle"
 *               profile_picture:
 *                 type: string
 *                 format: uri
 *                 description: Profile picture URL
 *                 example: "https://example.com/driver-photo.jpg"
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                   example: "Profile updated successfully"
 *                 data:
 *                   type: object
 *                   description: Updated driver profile
 */
router.put('/profile',
  generalLimiter,
  driverController.updateProfile
);

/**
 * @swagger
 * /api/driver/location:
 *   put:
 *     summary: Update driver location
 *     tags: [Driver Management]
 *     description: Update driver's current GPS location
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *                 description: GPS latitude
 *                 example: 31.4165
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *                 description: GPS longitude
 *                 example: 31.8133
 *     responses:
 *       200:
 *         description: Location updated successfully
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
 *                   example: "Location updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     latitude:
 *                       type: number
 *                     longitude:
 *                       type: number
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 */
router.put('/location',
  generalLimiter,
  driverController.updateLocation
);

/**
 * @swagger
 * /api/driver/availability:
 *   put:
 *     summary: Update driver availability
 *     tags: [Driver Management]
 *     description: Set driver online/offline status
 *     security:
 *       - bearerAuth: []
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
 *                 description: Driver availability status
 *                 example: true
 *     responses:
 *       200:
 *         description: Availability updated successfully
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
 *                   example: "Driver is now available"
 *                 data:
 *                   type: object
 *                   properties:
 *                     is_available:
 *                       type: boolean
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 */
router.put('/availability',
  generalLimiter,
  driverController.updateAvailability
);

/**
 * @swagger
 * /api/driver/orders/incoming:
 *   get:
 *     summary: Get incoming/available orders
 *     tags: [Driver Management]
 *     description: Retrieve orders available for pickup near the driver
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
 *           maximum: 50
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: number
 *           minimum: -90
 *           maximum: 90
 *         description: Driver's current latitude for location-based filtering
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: number
 *           minimum: -180
 *           maximum: 180
 *         description: Driver's current longitude for location-based filtering
 *     responses:
 *       200:
 *         description: Incoming orders retrieved successfully
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
 *                   example: "Incoming orders retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         description: Available orders with business and customer info
 *                     pagination:
 *                       type: object
 */
router.get('/orders/incoming',
  generalLimiter,
  driverController.getOrdersIncoming
);

/**
 * @swagger
 * /api/driver/orders/accepted:
 *   get:
 *     summary: Get accepted orders
 *     tags: [Driver Management]
 *     description: Retrieve orders accepted by the driver (preparing status)
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
 *     responses:
 *       200:
 *         description: Accepted orders retrieved successfully
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
 *                   example: "Accepted orders retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         description: Accepted orders data
 *                     pagination:
 *                       type: object
 */
router.get('/orders/accepted',
  generalLimiter,
  driverController.getOrdersAccepted
);

/**
 * @swagger
 * /api/driver/orders/in-delivery:
 *   get:
 *     summary: Get orders in delivery
 *     tags: [Driver Management]
 *     description: Retrieve orders currently being delivered by the driver
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
 *     responses:
 *       200:
 *         description: Orders in delivery retrieved successfully
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
 *                   example: "Orders in delivery retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         description: Orders in delivery data
 *                     pagination:
 *                       type: object
 */
router.get('/orders/in-delivery',
  generalLimiter,
  driverController.getOrdersInDelivery
);

/**
 * @swagger
 * /api/driver/orders:
 *   get:
 *     summary: Get all driver orders
 *     tags: [Driver Management]
 *     description: Retrieve all orders assigned to the driver (history)
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
 *           enum: [pending, accepted, preparing, waiting_driver, in_delivery, completed, cancelled]
 *         description: Filter by order status
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
 *                   example: "Driver orders retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         description: Order data with user information
 *                     pagination:
 *                       type: object
 */
router.get('/orders',
  generalLimiter,
  driverController.getOrders
);

/**
 * @swagger
 * /api/driver/orders/{id}/accept:
 *   post:
 *     summary: Accept order assignment
 *     tags: [Driver Management]
 *     description: Accept an order assignment for delivery
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
 *     responses:
 *       200:
 *         description: Order accepted successfully
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
 *                   example: "Order accepted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: "in_delivery"
 *                     accepted_at:
 *                       type: string
 *                       format: date-time
 */
router.post('/orders/:id/accept',
  generalLimiter,
  driverController.acceptOrder
);

/**
 * @swagger
 * /api/driver/orders/{id}/deliver:
 *   post:
 *     summary: Mark order as delivered
 *     tags: [Driver Management]
 *     description: Mark an order as successfully delivered
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
 *     responses:
 *       200:
 *         description: Order marked as delivered
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
 *                   example: "Order marked as delivered successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: "delivered"
 *                     delivered_at:
 *                       type: string
 *                       format: date-time
 */
router.post('/orders/:id/deliver',
  generalLimiter,
  driverController.deliverOrder
);

/**
 * @swagger
 * /api/driver/earnings:
 *   get:
 *     summary: Get driver earnings
 *     tags: [Driver Management]
 *     description: Retrieve driver's earnings and statistics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for earnings (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for earnings (YYYY-MM-DD)
 *         example: "2024-01-31"
 *     responses:
 *       200:
 *         description: Earnings data retrieved successfully
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
 *                   example: "Driver earnings retrieved successfully"
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
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total_orders:
 *                           type: integer
 *                         total_earnings:
 *                           type: integer
 *                         platform_fees:
 *                           type: integer
 *                         net_earnings:
 *                           type: integer
 *                     orders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         description: Individual order earnings data
 */
router.get('/earnings',
  generalLimiter,
  driverController.getEarnings
);

module.exports = router;
