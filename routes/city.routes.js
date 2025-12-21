const express = require('express');
const router = express.Router();

// Import controllers and middlewares
const cityController = require('../controllers/city.controller');
const { generalLimiter } = require('../middlewares');

/**
 * @swagger
 * tags:
 *   name: Cities
 *   description: City and location management endpoints
 */

// Public routes (no authentication required)

/**
 * @swagger
 * /api/cities:
 *   get:
 *     summary: Get all cities
 *     tags: [Cities]
 *     description: Retrieve a list of all available cities from businesses and predefined major cities
 *     parameters:
 *       - in: query
 *         name: governorate
 *         schema:
 *           type: string
 *         description: Filter by governorate name
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search cities by name
 *     responses:
 *       200:
 *         description: Cities retrieved successfully
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
 *                   example: "Cities retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     cities:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "Damietta"
 *                           key:
 *                             type: string
 *                             example: "damietta"
 *                           governorate:
 *                             type: string
 *                             example: "Damietta"
 *                           latitude:
 *                             type: number
 *                             example: 31.4165
 *                           longitude:
 *                             type: number
 *                             example: 31.8133
 *                           source:
 *                             type: string
 *                             enum: [predefined, business]
 *                     total:
 *                       type: integer
 *                       example: 20
 */
router.get('/',
  generalLimiter,
  cityController.getAllCities
);

/**
 * @swagger
 * /api/cities/search:
 *   get:
 *     summary: Search cities
 *     tags: [Cities]
 *     description: Search for cities by name
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search query (minimum 2 characters)
 *         example: "dam"
 *       - in: query
 *         name: governorate
 *         schema:
 *           type: string
 *         description: Filter by governorate
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: Cities found successfully
 *       400:
 *         description: Invalid search query
 */
router.get('/search',
  generalLimiter,
  cityController.searchCities
);

/**
 * @swagger
 * /api/cities/governorates:
 *   get:
 *     summary: Get all governorates with their cities
 *     tags: [Cities]
 *     description: Retrieve all governorates with their associated cities
 *     responses:
 *       200:
 *         description: Governorates retrieved successfully
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
 *                   example: "Governorates with cities retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     governorates:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "Damietta"
 *                           code:
 *                             type: string
 *                             example: "DM"
 *                           cities:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["Damietta", "Ras El Bar"]
 *                           cities_count:
 *                             type: integer
 *                             example: 2
 *                     total:
 *                       type: integer
 *                       example: 14
 */
router.get('/governorates',
  generalLimiter,
  cityController.getGovernoratesWithCities
);

/**
 * @swagger
 * /api/cities/governorate/{governorate_code}:
 *   get:
 *     summary: Get cities by governorate
 *     tags: [Cities]
 *     description: Retrieve all cities in a specific governorate
 *     parameters:
 *       - in: path
 *         name: governorate_code
 *         required: true
 *         schema:
 *           type: string
 *           enum: [DM, HS, HM, HI, LA, QA, RA, SU, TA, AL, DA, DR, DE, ID, RI]
 *         description: Governorate code
 *         example: "DM"
 *     responses:
 *       200:
 *         description: Cities retrieved successfully
 *       400:
 *         description: Invalid governorate code
 */
router.get('/governorate/:governorate_code',
  generalLimiter,
  cityController.getCitiesByGovernorate
);

/**
 * @swagger
 * /api/cities/{cityName}:
 *   get:
 *     summary: Get city details
 *     tags: [Cities]
 *     description: Get detailed information about a specific city including businesses
 *     parameters:
 *       - in: path
 *         name: cityName
 *         required: true
 *         schema:
 *           type: string
 *         description: City name
 *         example: "Damietta"
 *     responses:
 *       200:
 *         description: City details retrieved successfully
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
 *                   example: "City details retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Damietta"
 *                     coordinates:
 *                       type: object
 *                       properties:
 *                         latitude:
 *                           type: number
 *                           example: 31.4165
 *                         longitude:
 *                           type: number
 *                           example: 31.8133
 *                     governorates:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Damietta"]
 *                     businesses_count:
 *                       type: integer
 *                       example: 15
 *                     businesses:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: City name is required
 */
router.get('/:cityName',
  generalLimiter,
  cityController.getCityDetails
);

module.exports = router;

