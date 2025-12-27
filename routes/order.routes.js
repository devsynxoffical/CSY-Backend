const express = require('express');
const router = express.Router();

// Import controllers and middlewares
const orderController = require('../controllers/order.controller');
const {
  authenticate,
  validateOrderCreation,
  validateOrderUpdate,
  handleValidationErrors,
  validateUUID
} = require('../middlewares');

// Import rate limiters
const {
  generalLimiter,
  strictLimiter
} = require('../middlewares');

/**
 * @swagger
 * tags:
 *   name: Order Management
 *   description: Order creation, tracking and management endpoints
 */

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Order Management]
 *     description: Create a new delivery or pickup order with cart items
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - order_type
 *               - payment_method
 *             properties:
 *               items:
 *                 type: array
 *                 description: Array of order items
 *                 items:
 *                   type: object
 *                   required:
 *                     - product_id
 *                     - quantity
 *                   properties:
 *                     product_id:
 *                       type: string
 *                       description: Product ID
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       description: Quantity of the product
 *                     add_ons:
 *                       type: array
 *                       description: Array of add-ons for the product
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           price:
 *                             type: number
 *               order_type:
 *                 type: string
 *                 enum: [delivery, pickup]
 *                 description: Type of order
 *               payment_method:
 *                 type: string
 *                 enum: [cash, online]
 *                 description: Payment method for the order
 *               delivery_address:
 *                 type: object
 *                 description: Delivery address (required for delivery orders)
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   governorate:
 *                     type: string
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *               delivery_notes:
 *                 type: string
 *                 description: Special delivery instructions
 *               coupon_code:
 *                 type: string
 *                 description: Coupon code for discount
 *     responses:
 *       201:
 *         description: Order created successfully
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
 *                     id:
 *                       type: string
 *                     order_number:
 *                       type: string
 *                     total_amount:
 *                       type: number
 *                     final_amount:
 *                       type: number
 *                     status:
 *                       type: string
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post('/', generalLimiter, validateOrderCreation, handleValidationErrors, orderController.createOrder);

/**
 * @swagger
 * /api/orders/user:
 *   get:
 *     summary: Get user's orders
 *     tags: [Order Management]
 *     description: Retrieve paginated list of user's orders
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
 *         description: Number of orders per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, accepted, preparing, waiting_driver, in_delivery, completed, cancelled]
 *         description: Filter by order status
 *       - in: query
 *         name: order_type
 *         schema:
 *           type: string
 *           enum: [delivery, pickup]
 *         description: Filter by order type
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/user', generalLimiter, orderController.getUserOrders);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order details
 *     tags: [Order Management]
 *     description: Retrieve detailed information about a specific order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
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
 *                     id:
 *                       type: string
 *                     order_number:
 *                       type: string
 *                     status:
 *                       type: string
 *                     total_amount:
 *                       type: number
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
router.get('/:id', ...validateUUID, orderController.getOrderDetails);

/**
 * @swagger
 * /api/orders/{id}:
 *   put:
 *     summary: Update order
 *     tags: [Order Management]
 *     description: Update order details (limited fields only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               delivery_address:
 *                 type: object
 *                 description: Updated delivery address
 *               delivery_notes:
 *                 type: string
 *                 description: Updated delivery notes
 *     responses:
 *       200:
 *         description: Order updated successfully
 *       400:
 *         description: Invalid request data or order not updatable
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
router.put('/:id', strictLimiter, ...validateUUID, ...validateOrderUpdate, orderController.updateOrder);

/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     summary: Cancel order
 *     tags: [Order Management]
 *     description: Cancel a pending or accepted order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       400:
 *         description: Order cannot be cancelled
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
router.delete('/:id', strictLimiter, ...validateUUID, orderController.cancelOrder);


/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     summary: Cancel an order
 *     tags: [Order Management]
 *     description: Cancel an order (only for pending/accepted orders)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       400:
 *         description: Order cannot be cancelled
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
router.delete('/:id', strictLimiter, ...validateUUID, orderController.cancelOrder);

/**
 * @swagger
 * /api/orders/cart:
 *   post:
 *     summary: Calculate cart total
 *     tags: [Order Management]
 *     description: Calculate total price and fees for cart items
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 description: Array of cart items
 *                 items:
 *                   type: object
 *                   required:
 *                     - product_id
 *                     - quantity
 *                   properties:
 *                     product_id:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                     add_ons:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           price:
 *                             type: number
 *               order_type:
 *                 type: string
 *                 enum: [delivery, pickup]
 *                 description: Type of order for delivery fee calculation
 *               coupon_code:
 *                 type: string
 *                 description: Coupon code for discount
 *     responses:
 *       200:
 *         description: Cart total calculated successfully
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
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                     breakdown:
 *                       type: object
 *                       properties:
 *                         subtotal:
 *                           type: number
 *                         platform_fee:
 *                           type: number
 *                         delivery_fee:
 *                           type: number
 *                         discount:
 *                           type: number
 *                         total:
 *                           type: number
 *                     currency:
 *                       type: string
 *                       example: EGP
 *       400:
 *         description: Invalid cart items
 *       401:
 *         description: Unauthorized
 */
router.post('/cart', generalLimiter, orderController.calculateCartTotal);

/**
 * @swagger
 * /api/orders/track/{id}:
 *   get:
 *     summary: Track order location
 *     tags: [Order Management]
 *     description: Get real-time tracking information for delivery orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Tracking information retrieved successfully
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
 *                     status:
 *                       type: string
 *                     driver_location:
 *                       type: object
 *                       nullable: true
 *                     estimated_delivery_time:
 *                       type: string
 *                       nullable: true
 *                     delivery_address:
 *                       type: object
 *       400:
 *         description: Tracking not available for this order
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
router.get('/track/:id', ...validateUUID, orderController.trackOrder);

module.exports = router;
