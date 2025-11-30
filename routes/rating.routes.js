const express = require('express');
const router = express.Router();

// Import controllers and middlewares
const ratingController = require('../controllers/rating.controller');
const {
  authenticate,
  validateRatingSubmission,
  validateUUID,
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
 *   name: Rating Management
 *   description: Rating submission and retrieval operations
 */

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/ratings:
 *   post:
 *     summary: Submit rating
 *     tags: [Rating Management]
 *     description: Submit a rating for a business, driver, reservation, or order
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stars
 *             properties:
 *               business_id:
 *                 type: string
 *                 description: Business ID to rate
 *               driver_id:
 *                 type: string
 *                 description: Driver ID to rate
 *               reservation_id:
 *                 type: string
 *                 description: Reservation ID to rate
 *               order_id:
 *                 type: string
 *                 description: Order ID to rate
 *               stars:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating stars (1-5)
 *                 example: 5
 *               comment:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional rating comment
 *                 example: "Excellent service!"
 *             oneOf:
 *               - required: [business_id]
 *               - required: [driver_id]
 *               - required: [reservation_id]
 *               - required: [order_id]
 *     responses:
 *       201:
 *         description: Rating submitted successfully
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
 *                     stars:
 *                       type: integer
 *                     comment:
 *                       type: string
 *                       nullable: true
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid request data or validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied (trying to rate something you don't own)
 *       404:
 *         description: Referenced entity not found
 *       409:
 *         description: Already rated this entity
 */
router.post('/', strictLimiter, validateRatingSubmission, handleValidationErrors, ratingController.submitRating);

/**
 * @swagger
 * /api/ratings/business/{id}:
 *   get:
 *     summary: Get business ratings
 *     tags: [Rating Management]
 *     description: Retrieve ratings and statistics for a business
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Business ID
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
 *         description: Number of ratings per page
 *       - in: query
 *         name: min_stars
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Minimum star rating filter
 *       - in: query
 *         name: max_stars
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Maximum star rating filter
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [created_at, stars]
 *           default: created_at
 *         description: Sort field
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Business ratings retrieved successfully
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
 *                     business:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         business_name:
 *                           type: string
 *                     ratings:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           stars:
 *                             type: integer
 *                           comment:
 *                             type: string
 *                             nullable: true
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           user:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: string
 *                               full_name:
 *                                 type: string
 *                               profile_image:
 *                                 type: string
 *                                 nullable: true
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         average_rating:
 *                           type: number
 *                         total_ratings:
 *                           type: integer
 *                         distribution:
 *                           type: object
 *                           properties:
 *                             1:
 *                               type: integer
 *                             2:
 *                               type: integer
 *                             3:
 *                               type: integer
 *                             4:
 *                               type: integer
 *                             5:
 *                               type: integer
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
 *       404:
 *         description: Business not found
 */
router.get('/business/:id', generalLimiter, ...validateUUID, ratingController.getBusinessRatings);

/**
 * @swagger
 * /api/ratings/driver/{id}:
 *   get:
 *     summary: Get driver ratings
 *     tags: [Rating Management]
 *     description: Retrieve ratings and statistics for a driver
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Driver ID
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
 *         description: Number of ratings per page
 *       - in: query
 *         name: min_stars
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Minimum star rating filter
 *       - in: query
 *         name: max_stars
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Maximum star rating filter
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [created_at, stars]
 *           default: created_at
 *         description: Sort field
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Driver ratings retrieved successfully
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
 *                     driver:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         full_name:
 *                           type: string
 *                         profile_image:
 *                           type: string
 *                           nullable: true
 *                     ratings:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           stars:
 *                             type: integer
 *                           comment:
 *                             type: string
 *                             nullable: true
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           order:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: string
 *                               order_number:
 *                                 type: string
 *                           user:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: string
 *                               full_name:
 *                                 type: string
 *                               profile_image:
 *                                 type: string
 *                                 nullable: true
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         average_rating:
 *                           type: number
 *                         total_ratings:
 *                           type: integer
 *                         distribution:
 *                           type: object
 *                           properties:
 *                             1:
 *                               type: integer
 *                             2:
 *                               type: integer
 *                             3:
 *                               type: integer
 *                             4:
 *                               type: integer
 *                             5:
 *                               type: integer
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
 *       404:
 *         description: Driver not found
 */
router.get('/driver/:id', generalLimiter, ...validateUUID, ratingController.getDriverRatings);

module.exports = router;
