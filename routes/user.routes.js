const express = require('express');
const router = express.Router();

// Import controllers and middlewares
const userController = require('../controllers/user.controller');
const {
  authenticate,
  validateUserUpdate,
  handleValidationErrors,
  validateAddressCreation,
  validateUUID
} = require('../middlewares');

// Import rate limiters
const {
  generalLimiter
} = require('../middlewares');

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: User Management
 *   description: User profile and account management endpoints
 */

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [User Management]
 *     description: Retrieve current user's profile information including wallet and points
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
 *                   example: "Profile retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: User ID
 *                     full_name:
 *                       type: string
 *                       description: User full name
 *                     email:
 *                       type: string
 *                       description: User email
 *                     phone:
 *                       type: string
 *                       description: User phone
 *                     pass_id:
 *                       type: string
 *                       description: Unique Pass ID
 *                     governorate_code:
 *                       type: string
 *                       description: Governorate code
 *                     profile_picture:
 *                       type: string
 *                       description: Profile picture URL
 *                     ai_assistant_name:
 *                       type: string
 *                       description: AI assistant name
 *                     wallet_balance:
 *                       type: number
 *                       description: Wallet balance in piastres
 *                     points:
 *                       type: integer
 *                       description: Loyalty points
 *                     is_active:
 *                       type: boolean
 *                       description: Account active status
 *                     is_verified:
 *                       type: boolean
 *                       description: Email verification status
 *                     wallet:
 *                       type: object
 *                       properties:
 *                         balance:
 *                           type: number
 *                         currency:
 *                           type: string
 *                         total_added:
 *                           type: number
 *                         total_spent:
 *                           type: number
 *                     points_balance:
 *                       type: integer
 *                     recent_activity:
 *                       type: object
 *                       properties:
 *                         orders:
 *                           type: array
 *                           items:
 *                             type: object
 *                         reservations:
 *                           type: array
 *                           items:
 *                             type: object
 */
router.get('/profile',
  generalLimiter,
  userController.getProfile
);

/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [User Management]
 *     description: Update user profile information (name, phone, profile picture, etc.)
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
 *                 description: User's full name
 *                 example: "John Smith"
 *               phone:
 *                 type: string
 *                 pattern: '^\+?[0-9]{10,15}$'
 *                 description: User's phone number
 *                 example: "+201234567891"
 *               profile_picture:
 *                 type: string
 *                 format: uri
 *                 description: Profile picture URL
 *                 example: "https://example.com/picture.jpg"
 *               ai_assistant_name:
 *                 type: string
 *                 maxLength: 50
 *                 description: AI assistant name
 *                 example: "Alex"
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
 *                   $ref: '#/components/schemas/User'
 */
router.put('/profile',
  generalLimiter,
  validateUserUpdate,
  userController.updateProfile
);

/**
 * @swagger
 * /api/user/password:
 *   put:
 *     summary: Change user password
 *     tags: [User Management]
 *     description: Change user's password with current password verification
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Current password for verification
 *                 example: "currentpassword123"
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: New password
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Invalid current password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/password',
  generalLimiter,
  userController.changePassword
);

/**
 * @swagger
 * /api/user/deactivate:
 *   delete:
 *     summary: Deactivate user account
 *     tags: [User Management]
 *     description: Deactivate user's account with password confirmation
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 description: Current password for confirmation
 *                 example: "password123"
 *               reason:
 *                 type: string
 *                 description: Reason for deactivation (optional)
 *                 example: "No longer need the service"
 *     responses:
 *       200:
 *         description: Account deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.delete('/deactivate',
  generalLimiter,
  userController.deactivateAccount
);

/**
 * @swagger
 * /api/user/addresses:
 *   get:
 *     summary: Get user addresses
 *     tags: [User Management]
 *     description: Retrieve all addresses associated with the user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Addresses retrieved successfully
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
 *                   example: "Addresses retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Address'
 */
router.get('/addresses',
  generalLimiter,
  userController.getAddresses
);

/**
 * @swagger
 * /api/user/addresses:
 *   post:
 *     summary: Add user address
 *     tags: [User Management]
 *     description: Add a new address for the user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipient_name
 *               - area
 *               - street
 *               - city
 *               - phone
 *             properties:
 *               recipient_name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Recipient full name
 *                 example: "John Doe"
 *               area:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Area/Neighborhood
 *                 example: "Downtown"
 *               street:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 200
 *                 description: Street address
 *                 example: "123 Main Street"
 *               city:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: City name
 *                 example: "Damietta"
 *               floor:
 *                 type: string
 *                 maxLength: 50
 *                 description: Floor/Apartment number
 *                 example: "Floor 5, Apartment 12"
 *               phone:
 *                 type: string
 *                 pattern: '^\+?[0-9]{10,15}$'
 *                 description: Contact phone number
 *                 example: "+201234567890"
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
 *               is_default:
 *                 type: boolean
 *                 description: Set as default address
 *                 example: false
 *     responses:
 *       201:
 *         description: Address added successfully
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
 *                   example: "Address added successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Address'
 */
router.post('/addresses',
  generalLimiter,
  validateAddressCreation,
  userController.addAddress
);

/**
 * @swagger
 * /api/user/addresses/{id}:
 *   put:
 *     summary: Update user address
 *     tags: [User Management]
 *     description: Update an existing user address
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Address ID
 *         example: "60d5ecb74b24c72b8c8b4567"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipient_name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Recipient full name
 *               area:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Area/Neighborhood
 *               street:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 200
 *                 description: Street address
 *               city:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: City name
 *               floor:
 *                 type: string
 *                 maxLength: 50
 *                 description: Floor/Apartment number
 *               phone:
 *                 type: string
 *                 pattern: '^\+?[0-9]{10,15}$'
 *                 description: Contact phone number
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *                 description: GPS latitude
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *                 description: GPS longitude
 *               is_default:
 *                 type: boolean
 *                 description: Set as default address
 *     responses:
 *       200:
 *         description: Address updated successfully
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
 *                   example: "Address updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Address'
 */
router.put('/addresses/:id',
  generalLimiter,
  ...validateUUID,
  userController.updateAddress
);

/**
 * @swagger
 * /api/user/addresses/{id}:
 *   delete:
 *     summary: Delete user address
 *     tags: [User Management]
 *     description: Delete a user address
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Address ID
 *         example: "60d5ecb74b24c72b8c8b4567"
 *     responses:
 *       200:
 *         description: Address deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.delete('/addresses/:id',
  generalLimiter,
  ...validateUUID,
  userController.deleteAddress
);

/**
 * @swagger
 * /api/user/wallet:
 *   get:
 *     summary: Get user wallet information
 *     tags: [User Management]
 *     description: Retrieve user's wallet balance and transaction summary
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet information retrieved successfully
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
 *                   example: "Wallet information retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     balance:
 *                       type: number
 *                       description: Current wallet balance in piastres
 *                       example: 50000
 *                     currency:
 *                       type: string
 *                       example: "EGP"
 *                     total_added:
 *                       type: number
 *                       description: Total amount added to wallet
 *                       example: 100000
 *                     total_spent:
 *                       type: number
 *                       description: Total amount spent from wallet
 *                       example: 50000
 */
router.get('/wallet',
  generalLimiter,
  userController.getWallet
);

/**
 * @swagger
 * /api/user/points:
 *   get:
 *     summary: Get user points information
 *     tags: [User Management]
 *     description: Retrieve user's loyalty points balance and transaction history
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Points information retrieved successfully
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
 *                   example: "Points information retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     balance:
 *                       type: integer
 *                       description: Current points balance
 *                       example: 150
 *                     history:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           points_earned:
 *                             type: integer
 *                             example: 50
 *                           points_spent:
 *                             type: integer
 *                             example: 0
 *                           balance:
 *                             type: integer
 *                             example: 150
 *                           activity_type:
 *                             type: string
 *                             example: "order"
 *                           reference_id:
 *                             type: string
 *                             example: "60d5ecb74b24c72b8c8b4567"
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 20
 *                         total:
 *                           type: integer
 *                           example: 45
 *                         totalPages:
 *                           type: integer
 *                           example: 3
 */
router.get('/points',
  generalLimiter,
  userController.getPoints
);

/**
 * @swagger
 * /api/user/assistant-name:
 *   put:
 *     summary: Change AI assistant name
 *     tags: [User Management]
 *     description: Update the user's AI assistant name
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ai_assistant_name
 *             properties:
 *               ai_assistant_name:
 *                 type: string
 *                 maxLength: 50
 *                 description: New AI assistant name
 *                 example: "Alex"
 *     responses:
 *       200:
 *         description: AI assistant name updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.put('/assistant-name',
  generalLimiter,
  userController.updateAssistantName
);

/**
 * @swagger
 * /api/user/wallet/add:
 *   post:
 *     summary: Add balance to wallet
 *     tags: [User Management]
 *     description: Add money to user's wallet
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
 *                 minimum: 1000
 *                 description: Amount to add in piastres (minimum 10 EGP = 1000 piastres)
 *                 example: 10000
 *               payment_method:
 *                 type: string
 *                 enum: [card, mobile_wallet, bank_transfer]
 *                 description: Payment method
 *                 example: "card"
 *               payment_details:
 *                 type: object
 *                 description: Payment method specific details
 *     responses:
 *       200:
 *         description: Balance added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.post('/wallet/add',
  generalLimiter,
  userController.addWalletBalance
);

/**
 * @swagger
 * /api/user/wallet/history:
 *   get:
 *     summary: Get wallet transaction history
 *     tags: [User Management]
 *     description: Retrieve user's wallet transaction history
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
 *         description: Number of transactions per page
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
 *                   example: "Wallet history retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 */
router.get('/wallet/history',
  generalLimiter,
  userController.getWalletHistory
);

/**
 * @swagger
 * /api/user/points/history:
 *   get:
 *     summary: Get points transaction history
 *     tags: [User Management]
 *     description: Retrieve user's points transaction history
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
 *         description: Number of transactions per page
 *     responses:
 *       200:
 *         description: Points history retrieved successfully
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
 *                   example: "Points history retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 */
router.get('/points/history',
  generalLimiter,
  userController.getPointsHistory
);

/**
 * @swagger
 * /api/user/visit-history:
 *   get:
 *     summary: Get user visit history
 *     tags: [User Management]
 *     description: Retrieve user's business visit history
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
 *         description: Number of visits per page
 *     responses:
 *       200:
 *         description: Visit history retrieved successfully
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
 *                   example: "Visit history retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     visits:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 */
router.get('/visit-history',
  generalLimiter,
  userController.getVisitHistory
);

/**
 * @swagger
 * /api/user/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [User Management]
 *     description: Retrieve user's notifications
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
 *         description: Number of notifications per page
 *       - in: query
 *         name: unread_only
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Show only unread notifications
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
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
 *                   example: "Notifications retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     notifications:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *                     unread_count:
 *                       type: integer
 */
router.get('/notifications',
  generalLimiter,
  userController.getNotifications
);

/**
 * @swagger
 * /api/user/notifications/{id}:
 *   put:
 *     summary: Mark notification as read
 *     tags: [User Management]
 *     description: Mark a specific notification as read
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *         example: "60d5ecb74b24c72b8c8b4567"
 *     responses:
 *       200:
 *         description: Notification marked as read
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.put('/notifications/:id',
  generalLimiter,
  ...validateUUID,
  userController.markNotificationAsRead
);

/**
 * @swagger
 * /api/user/account:
 *   delete:
 *     summary: Delete user account
 *     tags: [User Management]
 *     description: Permanently delete user account with password confirmation
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 description: Current password for confirmation
 *                 example: "password123"
 *               reason:
 *                 type: string
 *                 description: Reason for account deletion (optional)
 *                 example: "No longer need the service"
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.delete('/account',
  generalLimiter,
  userController.deleteAccount
);

module.exports = router;
