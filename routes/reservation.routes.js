const express = require('express');
const router = express.Router();

// Import controllers and middlewares
const reservationController = require('../controllers/reservation.controller');
const {
  authenticate,
  validateUUID,
  validateReservationCreation,
  handleValidationErrors
} = require('../middlewares');

// Import rate limiters
const {
  generalLimiter,
  reservationLimiter
} = require('../middlewares');

/**
 * @swagger
 * tags:
 *   name: Reservation Management
 *   description: Reservation booking and management endpoints
 */

// All routes require user authentication
router.use(authenticate);

/**
 * @swagger
 * /api/reservations:
 *   post:
 *     summary: Create a reservation
 *     tags: [Reservation Management]
 *     description: Book a reservation at a business
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - business_id
 *               - reservation_type
 *               - date
 *               - time
 *               - duration
 *               - number_of_people
 *               - payment_method
 *             properties:
 *               business_id:
 *                 type: string
 *                 description: Business ID where reservation is made
 *                 example: "60d5ecb74b24c72b8c8b4567"
 *               reservation_type:
 *                 type: string
 *                 enum: [table, activity, medical, beauty]
 *                 description: Type of reservation
 *                 example: "table"
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Reservation date (YYYY-MM-DD)
 *                 example: "2024-01-20"
 *               time:
 *                 type: string
 *                 pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *                 description: Reservation start time (HH:MM)
 *                 example: "19:30"
 *               duration:
 *                 type: integer
 *                 minimum: 15
 *                 maximum: 480
 *                 description: Reservation duration in minutes
 *                 example: 120
 *               number_of_people:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 50
 *                 description: Number of people for reservation
 *                 example: 4
 *               payment_method:
 *                 type: string
 *                 enum: [cash, online]
 *                 description: Payment method for reservation
 *                 example: "online"
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *                 description: Additional notes for reservation
 *                 example: "Window seat preferred"
 *               specialty:
 *                 type: string
 *                 description: Specialty required (for medical/beauty reservations)
 *                 example: "Cardiology"
 *     responses:
 *       201:
 *         description: Reservation created successfully
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
 *                   example: "Reservation created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     reservation:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         business_id:
 *                           type: string
 *                         reservation_type:
 *                           type: string
 *                         date:
 *                           type: string
 *                           format: date
 *                         time:
 *                           type: string
 *                         duration:
 *                           type: integer
 *                         number_of_people:
 *                           type: integer
 *                         status:
 *                           type: string
 *                         payment_status:
 *                           type: string
 *                         created_at:
 *                           type: string
 *                           format: date-time
 */
router.post('/',
  reservationLimiter,
  validateReservationCreation,
  handleValidationErrors,
  reservationController.createReservation
);

/**
 * @swagger
 * /api/reservations:
 *   get:
 *     summary: Get user reservations
 *     tags: [Reservation Management]
 *     description: Retrieve reservations for the authenticated user
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
 *           enum: [pending, confirmed, cancelled, completed, expired]
 *         description: Filter by reservation status
 *       - in: query
 *         name: upcoming
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Show only upcoming reservations
 *     responses:
 *       200:
 *         description: Reservations retrieved successfully
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
 *                   example: "Reservations retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     reservations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         description: Reservation data with business information
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
router.get('/',
  generalLimiter,
  reservationController.getUserReservations
);

/**
 * @swagger
 * /api/reservations/{id}:
 *   get:
 *     summary: Get reservation details
 *     tags: [Reservation Management]
 *     description: Retrieve detailed information about a specific reservation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reservation ID
 *         example: "60d5ecb74b24c72b8c8b4567"
 *     responses:
 *       200:
 *         description: Reservation details retrieved successfully
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
 *                   example: "Reservation details retrieved successfully"
 *                 data:
 *                   type: object
 *                   description: Complete reservation data with business and rating information
 */
router.get('/:id',
  generalLimiter,
  ...validateUUID,
  reservationController.getReservation
);

/**
 * @swagger
 * /api/reservations/{id}:
 *   put:
 *     summary: Update reservation
 *     tags: [Reservation Management]
 *     description: Update reservation details (time, duration, number of people, notes)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reservation ID
 *         example: "60d5ecb74b24c72b8c8b4567"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               time:
 *                 type: string
 *                 pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *                 description: New reservation time (HH:MM)
 *                 example: "20:00"
 *               duration:
 *                 type: integer
 *                 minimum: 15
 *                 maximum: 480
 *                 description: New reservation duration in minutes
 *                 example: 90
 *               number_of_people:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 50
 *                 description: New number of people
 *                 example: 6
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *                 description: Updated notes
 *                 example: "Birthday celebration - please add candles"
 *     responses:
 *       200:
 *         description: Reservation updated successfully
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
 *                   example: "Reservation updated successfully"
 *                 data:
 *                   type: object
 *                   description: Updated reservation data
 */
router.put('/:id',
  generalLimiter,
  ...validateUUID,
  reservationController.updateReservation
);

/**
 * @swagger
 * /api/reservations/{id}/cancel:
 *   delete:
 *     summary: Cancel reservation
 *     tags: [Reservation Management]
 *     description: Cancel a reservation with optional reason
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reservation ID
 *         example: "60d5ecb74b24c72b8c8b4567"
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *                 description: Reason for cancellation
 *                 example: "Emergency situation"
 *     responses:
 *       200:
 *         description: Reservation cancelled successfully
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
 *                   example: "Reservation cancelled successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     reservationId:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: "cancelled"
 *                     cancelled_at:
 *                       type: string
 *                       format: date-time
 *                     refund_eligible:
 *                       type: boolean
 *                       description: Whether refund is eligible
 */
router.delete('/:id/cancel',
  generalLimiter,
  ...validateUUID,
  reservationController.cancelReservation
);

/**
 * @swagger
 * /api/reservations/availability:
 *   get:
 *     summary: Get available time slots
 *     tags: [Reservation Management]
 *     description: Retrieve available reservation time slots for a business
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *         description: Business ID
 *         example: "60d5ecb74b24c72b8c8b4567"
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date to check availability (YYYY-MM-DD)
 *         example: "2024-01-20"
 *       - in: query
 *         name: duration
 *         schema:
 *           type: integer
 *           minimum: 15
 *           maximum: 480
 *           default: 60
 *         description: Reservation duration in minutes
 *     responses:
 *       200:
 *         description: Available time slots retrieved successfully
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
 *                   example: "Available time slots retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     business_id:
 *                       type: string
 *                     date:
 *                       type: string
 *                       format: date
 *                     duration:
 *                       type: integer
 *                     available_slots:
 *                       type: array
 *                       items:
 *                         type: string
 *                         pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *                       description: Available time slots in HH:MM format
 *                       example: ["18:00", "18:30", "19:00", "19:30", "20:00"]
 */
router.get('/availability',
  generalLimiter,
  reservationController.getAvailableSlots
);

/**
 * @swagger
 * /api/reservations/{id}/rate:
 *   post:
 *     summary: Rate a completed reservation
 *     tags: [Reservation Management]
 *     description: Submit a rating and review for a completed reservation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reservation ID
 *         example: "60d5ecb74b24c72b8c8b4567"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stars
 *             properties:
 *               stars:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating stars (1-5)
 *                 example: 5
 *               comment:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional review comment
 *                 example: "Excellent service and great food!"
 *     responses:
 *       201:
 *         description: Reservation rated successfully
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
 *                   example: "Reservation rated successfully"
 *                 data:
 *                   type: object
 *                   description: Rating data
 */
router.post('/:id/rate',
  generalLimiter,
  ...validateUUID,
  reservationController.rateReservation
);

module.exports = router;
