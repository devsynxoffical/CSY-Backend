const express = require('express');
const router = express.Router();

// Import controllers and middlewares
const businessController = require('../controllers/business.controller');
const {
  authenticate,
  authenticateBusiness,
  isBusiness,
  isBusinessOwner,
  validateBusinessRegistration,
  validateAppointmentCreation,
  handleValidationErrors,
  validateUUID
} = require('../middlewares');

// Import rate limiters
const {
  generalLimiter,
  businessRegistrationLimiter
} = require('../middlewares');

/**
 * @swagger
 * tags:
 *   name: Business Management
 *   description: Business registration, profile management, and analytics endpoints
 */

// Public routes
/**
 * @swagger
 * /api/business/register:
 *   post:
 *     summary: Register a new business
 *     tags: [Business Management]
 *     description: Create a new business account with owner details
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - owner_email
 *               - business_name
 *               - business_type
 *               - app_type
 *               - address
 *               - city
 *               - governorate
 *               - latitude
 *               - longitude
 *               - password_hash
 *             properties:
 *               owner_email:
 *                 type: string
 *                 format: email
 *                 description: Business owner email address
 *                 example: "owner@restaurant.com"
 *               business_name:
 *                 type: string
 *                 description: Business name
 *                 example: "Delicious Restaurant"
 *               business_type:
 *                 type: string
 *                 enum: [restaurant, cafe, pharmacy, clinic, beauty_center]
 *                 description: Type of business
 *                 example: "restaurant"
 *               app_type:
 *                 type: string
 *                 enum: [pass, care, go, pass_go, care_go]
 *                 description: App service type
 *                 example: "pass"
 *               address:
 *                 type: string
 *                 description: Business address
 *                 example: "123 Main Street"
 *               city:
 *                 type: string
 *                 description: City name
 *                 example: "Damietta"
 *               governorate:
 *                 type: string
 *                 description: Governorate name
 *                 example: "Damietta"
 *               latitude:
 *                 type: number
 *                 description: GPS latitude
 *                 example: 31.4165
 *               longitude:
 *                 type: number
 *                 description: GPS longitude
 *                 example: 31.8133
 *               password_hash:
 *                 type: string
 *                 minLength: 8
 *                 description: Account password
 *                 example: "securepassword123"
 *     responses:
 *       201:
 *         description: Business registered successfully
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
 *                     business:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         owner_email:
 *                           type: string
 *                         business_name:
 *                           type: string
 *                         business_type:
 *                           type: string
 *                         app_type:
 *                           type: string
 *                         address:
 *                           type: string
 *                         city:
 *                           type: string
 *                         governorate:
 *                           type: string
 *                         latitude:
 *                           type: number
 *                         longitude:
 *                           type: number
 *                         rating_average:
 *                           type: number
 *                         rating_count:
 *                           type: integer
 *                         is_active:
 *                           type: boolean
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                     token:
 *                       type: string
 *                       description: JWT access token
 */
router.post('/register',
  businessRegistrationLimiter,
  validateBusinessRegistration,
  businessController.register
);

/**
 * @swagger
 * /api/business/login:
 *   post:
 *     summary: Business login
 *     tags: [Business Management]
 *     description: Authenticate business owner
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
 *                 description: Business owner email
 *                 example: "owner@restaurant.com"
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
 *                     business:
 *                       type: object
 *                       description: Business profile data
 *                     token:
 *                       type: string
 *                       description: JWT access token
 */
router.post('/login',
  generalLimiter,
  businessController.login
);

/**
 * @swagger
 * /api/business:
 *   get:
 *     summary: Get all businesses
 *     tags: [Business Management]
 *     description: Retrieve a list of businesses with optional filtering
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by business type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of businesses retrieved successfully
 */
router.get('/',
  generalLimiter,
  businessController.getAllBusinesses
);

/**
 * @swagger
 * /api/business/cashiers:
 *   get:
 *     summary: Get business cashiers
 *     tags: [Business Management]
 *     description: Retrieve all cashiers for the business
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
 *         description: Cashiers retrieved successfully
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
 *                   example: "Cashiers retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     cashiers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         description: Cashier information
 *                     pagination:
 *                       type: object
 */
router.get('/cashiers',
  generalLimiter,
  authenticateBusiness,
  businessController.getCashiers
);

/**
 * @swagger
 * /api/business/financials:
 *   get:
 *     summary: Get financial records
 *     tags: [Business Management]
 *     description: Retrieve business financial transactions and records
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
 *         description: Start date filter (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Financial records retrieved successfully
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
 *                   example: "Financial records retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     financials:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 */
router.get('/financials',
  generalLimiter,
  authenticateBusiness,
  businessController.getFinancials
);

/**
 * @swagger
 * /api/business/offers:
 *   get:
 *     summary: Get offers
 *     tags: [Business Management]
 */
router.get('/offers',
  generalLimiter,
  authenticateBusiness,
  businessController.getOffers
);

/**
 * @swagger
 * /api/business/{id}:
 *   get:
 *     summary: Get public business details
 *     tags: [Business Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Business ID
 *     responses:
 *       200:
 *         description: Business details retrieved
 */
router.get('/:id',
  generalLimiter,
  validateUUID,
  businessController.getPublicBusinessProfile
);

/**
 * @swagger
 * /api/business/{id}/products:
 *   get:
 *     summary: Get business products (Public Menu)
 *     tags: [Business Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Business ID
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: Products retrieved
 */
router.get('/:id/products',
  generalLimiter,
  validateUUID,
  businessController.getBusinessProducts
);


// All routes below require business authentication
router.use(authenticateBusiness);

/**
 * @swagger
 * /api/business/profile:
 *   get:
 *     summary: Get business profile
 *     tags: [Business Management]
 *     description: Retrieve business profile and statistics
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
 *                   example: "Business profile retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     owner_email:
 *                       type: string
 *                     business_name:
 *                       type: string
 *                     business_type:
 *                       type: string
 *                     app_type:
 *                       type: string
 *                     address:
 *                       type: string
 *                     city:
 *                       type: string
 *                     governorate:
 *                       type: string
 *                     latitude:
 *                       type: number
 *                     longitude:
 *                       type: number
 *                     working_hours:
 *                       type: object
 *                       description: Business working hours
 *                     photos:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Business photo URLs
 *                     videos:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Business video URLs
 *                     rating_average:
 *                       type: number
 *                     rating_count:
 *                       type: integer
 *                     has_reservations:
 *                       type: boolean
 *                     has_delivery:
 *                       type: boolean
 *                     is_active:
 *                       type: boolean
 *                     stats:
 *                       type: object
 *                       properties:
 *                         products_count:
 *                           type: integer
 *                         orders_count:
 *                           type: integer
 *                         reservations_count:
 *                           type: integer
 *                         ratings_summary:
 *                           type: object
 */
router.get('/profile',
  generalLimiter,
  businessController.getProfile
);

/**
 * @swagger
 * /api/business/profile:
 *   put:
 *     summary: Update business profile
 *     tags: [Business Management]
 *     description: Update business information and settings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               business_name:
 *                 type: string
 *                 description: Business name
 *                 example: "Updated Restaurant Name"
 *               address:
 *                 type: string
 *                 description: Business address
 *                 example: "456 New Street"
 *               city:
 *                 type: string
 *                 description: City name
 *                 example: "Damietta"
 *               governorate:
 *                 type: string
 *                 description: Governorate name
 *                 example: "Damietta"
 *               latitude:
 *                 type: number
 *                 description: GPS latitude
 *                 example: 31.4165
 *               longitude:
 *                 type: number
 *                 description: GPS longitude
 *                 example: 31.8133
 *               working_hours:
 *                 type: object
 *                 description: Business working hours by day
 *                 example: {"monday": "9:00-22:00", "tuesday": "9:00-22:00"}
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of photo URLs
 *               videos:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of video URLs
 *               has_reservations:
 *                 type: boolean
 *                 description: Whether business accepts reservations
 *                 example: true
 *               has_delivery:
 *                 type: boolean
 *                 description: Whether business offers delivery
 *                 example: true
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
 *                   description: Updated business profile
 */
router.put('/profile',
  generalLimiter,
  businessController.updateProfile
);

/**
 * @swagger
 * /api/business/working-hours:
 *   put:
 *     summary: Update business working hours
 *     tags: [Business Management]
 *     description: Update the business working hours for each day of the week
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               working_hours:
 *                 type: object
 *                 properties:
 *                   monday:
 *                     type: string
 *                     example: "9:00-18:00"
 *                   tuesday:
 *                     type: string
 *                     example: "9:00-18:00"
 *                   wednesday:
 *                     type: string
 *                     example: "9:00-18:00"
 *                   thursday:
 *                     type: string
 *                     example: "9:00-18:00"
 *                   friday:
 *                     type: string
 *                     example: "9:00-18:00"
 *                   saturday:
 *                     type: string
 *                     example: "10:00-16:00"
 *                   sunday:
 *                     type: string
 *                     example: "closed"
 *     responses:
 *       200:
 *         description: Working hours updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.put('/working-hours',
  generalLimiter,
  businessController.updateWorkingHours
);

/**
 * @swagger
 * /api/business/photos:
 *   post:
 *     summary: Upload business photos
 *     tags: [Business Management]
 *     description: Upload multiple photos for the business
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - photos
 *             properties:
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *                 description: Array of photo URLs
 *                 example: ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"]
 *     responses:
 *       201:
 *         description: Photos uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.post('/photos',
  generalLimiter,
  businessController.uploadPhotos
);

/**
 * @swagger
 * /api/business/photos/{id}:
 *   delete:
 *     summary: Delete business photo
 *     tags: [Business Management]
 *     description: Delete a specific photo by index
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Photo index to delete
 *         example: 0
 *     responses:
 *       200:
 *         description: Photo deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.delete('/photos/:id',
  generalLimiter,
  businessController.deletePhoto
);

/**
 * @swagger
 * /api/business/cashiers:
 *   post:
 *     summary: Create cashier account
 *     tags: [Business Management]
 *     description: Create a new cashier account for the business
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - full_name
 *               - password_hash
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Cashier email address
 *                 example: "cashier@restaurant.com"
 *               full_name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Cashier full name
 *                 example: "John Smith"
 *               password_hash:
 *                 type: string
 *                 minLength: 8
 *                 description: Cashier password
 *                 example: "securepassword123"
 *     responses:
 *       201:
 *         description: Cashier account created successfully
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
 *                   example: "Cashier account created successfully"
 *                 data:
 *                   type: object
 *                   description: Cashier account information
 */
router.post('/cashiers',
  generalLimiter,
  authenticateBusiness,
  businessController.createCashier
);


/**
 * @swagger
 * /api/business/cashiers/{id}:
 *   put:
 *     summary: Update cashier
 *     tags: [Business Management]
 *     description: Update cashier information
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Cashier ID
 *         example: "60d5ecb74b24c72b8c8b4567"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 description: Updated full name
 *               is_active:
 *                 type: boolean
 *                 description: Account active status
 *     responses:
 *       200:
 *         description: Cashier updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.put('/cashiers/:id',
  generalLimiter,
  ...validateUUID,
  businessController.updateCashier
);

/**
 * @swagger
 * /api/business/cashiers/{id}:
 *   delete:
 *     summary: Delete cashier
 *     tags: [Business Management]
 *     description: Delete a cashier account
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Cashier ID
 *         example: "60d5ecb74b24c72b8c8b4567"
 *     responses:
 *       200:
 *         description: Cashier deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.delete('/cashiers/:id',
  generalLimiter,
  ...validateUUID,
  businessController.deleteCashier
);

/**
 * @swagger
 * /api/business/orders/{id}/accept:
 *   put:
 *     summary: Accept order
 *     tags: [Business Management]
 *     description: Accept a pending order
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
 *               $ref: '#/components/schemas/Success'
 */
router.put('/orders/:id/accept',
  generalLimiter,
  ...validateUUID,
  businessController.acceptOrder
);

/**
 * @swagger
 * /api/business/orders/{id}/reject:
 *   put:
 *     summary: Reject order
 *     tags: [Business Management]
 *     description: Reject a pending order
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
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for rejection
 *                 example: "Item out of stock"
 *     responses:
 *       200:
 *         description: Order rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.put('/orders/:id/reject',
  generalLimiter,
  ...validateUUID,
  businessController.rejectOrder
);

/**
 * @swagger
 * /api/business/appointments:
 *   get:
 *     summary: Get business appointments
 *     tags: [Business Management]
 *     description: Retrieve appointments for the business
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
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by specific date (YYYY-MM-DD)
 *       - in: query
 *         name: service_name
 *         schema:
 *           type: string
 *         description: Filter by service name
 *     responses:
 *       200:
 *         description: Appointments retrieved successfully
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
 *                   example: "Appointments retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     appointments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         description: Appointment data
 *                     pagination:
 *                       type: object
 */
router.get('/appointments',
  generalLimiter,
  businessController.getAppointments
);

/**
 * @swagger
 * /api/business/appointments:
 *   post:
 *     summary: Add appointment
 *     tags: [Business Management]
 *     description: Create a new appointment slot
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - service_name
 *               - duration
 *               - price
 *               - date
 *               - start_time
 *               - end_time
 *             properties:
 *               service_name:
 *                 type: string
 *                 description: Service name
 *                 example: "Hair Cut"
 *               description:
 *                 type: string
 *                 description: Service description
 *                 example: "Professional hair cutting service"
 *               duration:
 *                 type: integer
 *                 minimum: 15
 *                 maximum: 480
 *                 description: Duration in minutes
 *                 example: 60
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 description: Service price in piastres
 *                 example: 50000
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Appointment date
 *                 example: "2024-12-25"
 *               start_time:
 *                 type: string
 *                 pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *                 description: Start time (HH:MM)
 *                 example: "10:00"
 *               end_time:
 *                 type: string
 *                 pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *                 description: End time (HH:MM)
 *                 example: "11:00"
 *               is_available:
 *                 type: boolean
 *                 description: Whether the slot is available
 *                 example: true
 *     responses:
 *       201:
 *         description: Appointment added successfully
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
 *                   example: "Appointment added successfully"
 *                 data:
 *                   type: object
 *                   description: Created appointment data
 */
router.post('/appointments',
  generalLimiter,
  authenticateBusiness,
  validateAppointmentCreation,
  handleValidationErrors,
  businessController.addAppointment
);

/**
 * @swagger
 * /api/business/appointments/{id}:
 *   put:
 *     summary: Update appointment
 *     tags: [Business Management]
 *     description: Update an existing appointment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment ID
 *         example: "60d5ecb74b24c72b8c8b4567"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               service_name:
 *                 type: string
 *                 description: Service name
 *               description:
 *                 type: string
 *                 description: Service description
 *               duration:
 *                 type: integer
 *                 minimum: 15
 *                 maximum: 480
 *                 description: Duration in minutes
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 description: Service price in piastres
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Appointment date
 *               start_time:
 *                 type: string
 *                 pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *                 description: Start time (HH:MM)
 *               end_time:
 *                 type: string
 *                 pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *                 description: End time (HH:MM)
 *               is_available:
 *                 type: boolean
 *                 description: Whether the slot is available
 *     responses:
 *       200:
 *         description: Appointment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.put('/appointments/:id',
  generalLimiter,
  ...validateUUID,
  businessController.updateAppointment
);

/**
 * @swagger
 * /api/business/appointments/{id}:
 *   delete:
 *     summary: Delete appointment
 *     tags: [Business Management]
 *     description: Delete an appointment slot
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment ID
 *         example: "60d5ecb74b24c72b8c8b4567"
 *     responses:
 *       200:
 *         description: Appointment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.delete('/appointments/:id',
  generalLimiter,
  ...validateUUID,
  businessController.deleteAppointment
);

/**
 * @swagger
 * /api/business/products:
 *   post:
 *     summary: Add product
 *     tags: [Business Management]
 *     description: Add a new product to the business menu
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               category:
 *                 type: string
 *                 description: Product category
 *                 example: "Main Course"
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Product name
 *                 example: "Grilled Chicken"
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Product description
 *                 example: "Tender grilled chicken with herbs"
 *               ingredients:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Product ingredients
 *                 example: "Chicken breast, herbs, olive oil, garlic"
 *               image:
 *                 type: string
 *                 format: uri
 *                 description: Product image URL
 *                 example: "https://example.com/chicken.jpg"
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 description: Product price in piastres
 *                 example: 75000
 *               add_ons:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     price:
 *                       type: number
 *                 description: Additional items that can be added
 *                 example: [{"name": "Extra Cheese", "price": 5000}, {"name": "Bacon", "price": 10000}]
 *     responses:
 *       201:
 *         description: Product added successfully
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
 *                   example: "Product added successfully"
 *                 data:
 *                   type: object
 *                   description: Created product data
 */
router.post('/products',
  generalLimiter,
  businessController.addProduct
);

/**
 * @swagger
 * /api/business/products/{id}:
 *   put:
 *     summary: Update product
 *     tags: [Business Management]
 *     description: Update an existing product
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
 *             properties:
 *               category:
 *                 type: string
 *                 description: Product category
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Product name
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Product description
 *               ingredients:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Product ingredients
 *               image:
 *                 type: string
 *                 format: uri
 *                 description: Product image URL
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 description: Product price in piastres
 *               add_ons:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: Additional items that can be added
 *               is_available:
 *                 type: boolean
 *                 description: Product availability
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.put('/products/:id',
  generalLimiter,
  ...validateUUID,
  businessController.updateProduct
);

/**
 * @swagger
 * /api/business/products/{id}:
 *   delete:
 *     summary: Delete product
 *     tags: [Business Management]
 *     description: Delete a product from the menu
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
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.delete('/products/:id',
  generalLimiter,
  ...validateUUID,
  businessController.deleteProduct
);

/**
 * @swagger
 * /api/business/analytics:
 *   get:
 *     summary: Get business analytics
 *     tags: [Business Management]
 *     description: Retrieve detailed business analytics and reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics (YYYY-MM-DD)
 *         example: "2024-01-31"
 *       - in: query
 *         name: reportType
 *         schema:
 *           type: string
 *           enum: [summary, orders, revenue, customers, products]
 *           default: summary
 *         description: Type of analytics report
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
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
 *                   example: "Analytics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     period:
 *                       type: object
 *                       properties:
 *                         start:
 *                           type: string
 *                         end:
 *                           type: string
 *                         report_type:
 *                           type: string
 *                     analytics:
 *                       type: object
 *                       description: Analytics data based on report type
 */
router.get('/analytics',
  generalLimiter,
  businessController.getAnalytics
);

/**
 * @swagger
 * /api/business/financials:
 *   get:
 *     summary: Get financial records
 *     tags: [Business Management]
 *     description: Retrieve business financial transactions and records
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
 *         description: Start date filter (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter (YYYY-MM-DD)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [payment, discount, refund, wallet_topup, earnings]
 *         description: Transaction type filter
 *     responses:
 *       200:
 *         description: Financial records retrieved successfully
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
 *                   example: "Financial records retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         description: Transaction data
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total_amount:
 *                           type: number
 *                         total_platform_fee:
 *                           type: number
 *                         total_discount:
 *                           type: number
 *                     pagination:
 *                       type: object
 */

/**
 * @swagger
 * /api/business/operations-log:
 *   get:
 *     summary: Get operations history
 *     tags: [Business Management]
 *     description: Retrieve business operations and activity log
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
 *           default: 50
 *         description: Items per page
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
 *       - in: query
 *         name: operation_type
 *         schema:
 *           type: string
 *           enum: [order, reservation, product]
 *         description: Filter by operation type
 *     responses:
 *       200:
 *         description: Operations log retrieved successfully
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
 *                   example: "Operations log retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     operations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           type:
 *                             type: string
 *                           operation:
 *                             type: string
 *                           timestamp:
 *                             type: string
 *                           reference_id:
 *                             type: string
 *                     pagination:
 *                       type: object
 */
router.get('/operations-log',
  generalLimiter,
  businessController.getOperationsLog
);

/**
 * @swagger
 * /api/business/dashboard:
 *   get:
 *     summary: Get business dashboard
 *     tags: [Business Management]
 *     description: Retrieve business analytics and performance metrics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics (YYYY-MM-DD)
 *         example: "2024-01-31"
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
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
 *                   example: "Dashboard data retrieved successfully"
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
 *                         orders:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: integer
 *                             completed:
 *                               type: integer
 *                             cancelled:
 *                               type: integer
 *                             completion_rate:
 *                               type: number
 *                             total_revenue:
 *                               type: integer
 *                         reservations:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: integer
 *                             completed:
 *                               type: integer
 *                             cancelled:
 *                               type: integer
 *                             completion_rate:
 *                               type: number
 *                         ratings:
 *                           type: object
 *                           properties:
 *                             average:
 *                               type: number
 *                             count:
 *                               type: integer
 *                         revenue:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: integer
 *                             average:
 *                               type: number
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total_orders:
 *                           type: integer
 *                         total_reservations:
 *                           type: integer
 *                         average_rating:
 *                           type: number
 *                         total_revenue:
 *                           type: integer
 */
router.get('/dashboard',
  generalLimiter,
  businessController.getDashboard
);

/**
 * @swagger
 * /api/business/categories:
 *   post:
 *     summary: Create category
 *     tags: [Business Management]
 */
router.post('/categories',
  generalLimiter,
  businessController.createCategory
);

router.get('/categories',
  generalLimiter,
  businessController.getCategories
);

router.put('/categories/:id',
  generalLimiter,
  ...validateUUID,
  businessController.updateCategory
);

router.delete('/categories/:id',
  generalLimiter,
  ...validateUUID,
  businessController.deleteCategory
);

/**
 * @swagger
 * /api/business/offers:
 *   post:
 *     summary: Create offer
 *     tags: [Business Management]
 */
router.post('/offers',
  generalLimiter,
  businessController.createOffer
);


router.put('/offers/:id',
  generalLimiter,
  ...validateUUID,
  businessController.updateOffer
);

router.delete('/offers/:id',
  generalLimiter,
  ...validateUUID,
  businessController.deleteOffer
);

/**
 * @swagger
 * /api/business/products:
 *   get:
 *     summary: Get business products
 *     tags: [Business Management]
 *     description: Retrieve business menu items and products
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
  generalLimiter,
  businessController.getProducts
);

/**
 * @swagger
 * /api/business/orders:
 *   get:
 *     summary: Get business orders
 *     tags: [Business Management]
 *     description: Retrieve orders for the business
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
 *                         description: Order data with user information
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
  generalLimiter,
  businessController.getOrders
);

/**
 * @swagger
 * /api/business/reservations:
 *   get:
 *     summary: Get business reservations
 *     tags: [Business Management]
 *     description: Retrieve reservations for the business
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
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by specific date (YYYY-MM-DD)
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
 *                         description: Reservation data with user information
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
router.get('/reservations',
  generalLimiter,
  businessController.getReservations
);

module.exports = router;
