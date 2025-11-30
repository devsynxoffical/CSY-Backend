const { body, param, query, validationResult } = require('express-validator');
const { VALIDATION_RULES, GOVERNORATE_CODES, BUSINESS_TYPES, APP_TYPES } = require('../config/constants');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }

  next();
};

// User validation rules
const validateUserRegistration = [
  body('full_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('phone')
    .matches(VALIDATION_RULES.PHONE_REGEX)
    .withMessage('Please provide a valid phone number'),

  body('password')
    .isLength({ min: VALIDATION_RULES.PASSWORD_MIN_LENGTH })
    .withMessage(`Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters long`),

  // pass_id is auto-generated, so we don't validate it in registration
  // body('pass_id')
  //   .matches(VALIDATION_RULES.PASS_ID_REGEX)
  //   .withMessage('Pass ID must be in format DM-XXXXXX'),

  body('governorate_code')
    .isIn(Object.keys(GOVERNORATE_CODES))
    .withMessage('Invalid governorate code'),

  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  handleValidationErrors
];

const validateUserUpdate = [
  body('full_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),

  body('phone')
    .optional()
    .matches(VALIDATION_RULES.PHONE_REGEX)
    .withMessage('Please provide a valid phone number'),

  body('profile_picture')
    .optional()
    .isURL()
    .withMessage('Profile picture must be a valid URL'),

  handleValidationErrors
];

// Business validation rules
const validateBusinessRegistration = [
  body('owner_email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid owner email address'),

  body('business_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be between 2 and 100 characters'),

  body('business_type')
    .isIn(BUSINESS_TYPES)
    .withMessage('Invalid business type'),

  body('app_type')
    .isIn(APP_TYPES)
    .withMessage('Invalid app type'),

  body('address')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Address must be between 10 and 500 characters'),

  body('city')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),

  body('governorate')
    .isIn(Object.values(GOVERNORATE_CODES))
    .withMessage('Invalid governorate'),

  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  body('password')
    .isLength({ min: VALIDATION_RULES.PASSWORD_MIN_LENGTH })
    .withMessage(`Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters long`),

  handleValidationErrors
];

// Order validation rules
const validateOrderCreation = [
  body('business_id')
    .isString()
    .notEmpty()
    .withMessage('Business ID is required'),

  body('order_type')
    .isIn(['delivery', 'pickup'])
    .withMessage('Order type must be either delivery or pickup'),

  body('payment_method')
    .isIn(['cash', 'online'])
    .withMessage('Payment method must be either cash or online'),

  body('delivery_address')
    .if(body('order_type').equals('delivery'))
    .isObject()
    .withMessage('Delivery address is required for delivery orders'),

  body('delivery_address.name')
    .if(body('order_type').equals('delivery'))
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Recipient name must be between 2 and 100 characters'),

  body('delivery_address.phone')
    .if(body('order_type').equals('delivery'))
    .matches(VALIDATION_RULES.PHONE_REGEX)
    .withMessage('Please provide a valid phone number'),

  handleValidationErrors
];

// Reservation validation rules
const validateReservationCreation = [
  body('business_id')
    .isString()
    .notEmpty()
    .withMessage('Business ID is required'),

  body('reservation_type')
    .isIn(['table', 'activity', 'medical', 'beauty'])
    .withMessage('Invalid reservation type'),

  body('date')
    .isISO8601()
    .withMessage('Please provide a valid date'),

  body('time')
    .matches(VALIDATION_RULES.TIME_FORMAT_REGEX)
    .withMessage('Time must be in HH:MM format'),

  body('duration')
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),

  body('number_of_people')
    .isInt({ min: 1, max: 50 })
    .withMessage('Number of people must be between 1 and 50'),

  body('payment_method')
    .isIn(['cash', 'online'])
    .withMessage('Payment method must be either cash or online'),

  handleValidationErrors
];

// Rating validation rules
const validateRatingCreation = [
  body('stars')
    .isInt({ min: 1, max: 5 })
    .withMessage('Stars must be between 1 and 5'),

  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment must not exceed 500 characters'),

  handleValidationErrors
];

// Address validation rules
const validateAddressCreation = [
  body('recipient_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Recipient name must be between 2 and 100 characters'),

  body('area')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Area must be between 2 and 100 characters'),

  body('street')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Street must be between 5 and 200 characters'),

  body('city')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),

  body('phone')
    .matches(VALIDATION_RULES.PHONE_REGEX)
    .withMessage('Please provide a valid phone number'),

  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  handleValidationErrors
];

// Wallet validation rules
const validateWalletTopup = [
  body('amount')
    .isFloat({ min: 10, max: 10000 })
    .withMessage('Amount must be between 10 and 10000'),

  body('payment_method')
    .isIn(['cash', 'online', 'wallet'])
    .withMessage('Invalid payment method'),

  handleValidationErrors
];

// Parameter validation
const validateObjectId = [
  param('id')
    .isString()
    .matches(/^[a-fA-F0-9]{24}$/)
    .withMessage('Invalid ID format'),

  handleValidationErrors
];

const validateUUID = [
  param('id')
    .isUUID()
    .withMessage('Invalid UUID format'),

  handleValidationErrors
];

// Order validation rules
const validateOrderUpdate = [
  body('delivery_address')
    .optional()
    .isObject()
    .withMessage('Delivery address must be an object'),

  body('delivery_address.street')
    .optional()
    .isString()
    .isLength({ min: 5, max: 255 })
    .withMessage('Street address must be between 5 and 255 characters'),

  body('delivery_address.city')
    .optional()
    .isString()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),

  body('delivery_notes')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Delivery notes cannot exceed 500 characters'),

  handleValidationErrors
];

// Payment validation rules
const validatePaymentProcessing = [
  body('order_id')
    .isString()
    .matches(/^[a-fA-F0-9]{24}$/)
    .withMessage('Invalid order ID format'),

  body('payment_method')
    .optional()
    .isIn(['stripe', 'paymob'])
    .withMessage('Payment method must be stripe or paymob'),

  body('use_wallet')
    .optional()
    .isBoolean()
    .withMessage('use_wallet must be a boolean'),

  handleValidationErrors
];

const validateRefundRequest = [
  body('order_id')
    .isString()
    .matches(/^[a-fA-F0-9]{24}$/)
    .withMessage('Invalid order ID format'),

  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Refund amount must be greater than 0'),

  body('reason')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Refund reason cannot exceed 500 characters'),

  handleValidationErrors
];

// QR validation rules
const validateQRGeneration = [
  body('type')
    .isIn(['discount', 'payment', 'reservation', 'order', 'driver_pickup'])
    .withMessage('Invalid QR type'),

  body('reference_id')
    .isString()
    .notEmpty()
    .withMessage('Reference ID is required'),

  body('additional_data')
    .optional()
    .isObject()
    .withMessage('Additional data must be an object'),

  handleValidationErrors
];

const validateQRValidation = [
  body('qr_token')
    .isString()
    .notEmpty()
    .withMessage('QR token is required'),

  handleValidationErrors
];

const validateQRScan = [
  body('qr_token')
    .isString()
    .notEmpty()
    .withMessage('QR token is required'),

  body('action')
    .optional()
    .isIn(['process', 'redeem', 'confirm_pickup'])
    .withMessage('Invalid action'),

  body('additional_data')
    .optional()
    .isObject()
    .withMessage('Additional data must be an object'),

  handleValidationErrors
];

// Rating validation rules
const validateRatingSubmission = [
  body('stars')
    .isInt({ min: 1, max: 5 })
    .withMessage('Stars must be between 1 and 5'),

  body('business_id')
    .optional()
    .isString()
    .matches(/^[a-fA-F0-9]{24}$/)
    .withMessage('Invalid business ID format'),

  body('driver_id')
    .optional()
    .isString()
    .matches(/^[a-fA-F0-9]{24}$/)
    .withMessage('Invalid driver ID format'),

  body('reservation_id')
    .optional()
    .isString()
    .matches(/^[a-fA-F0-9]{24}$/)
    .withMessage('Invalid reservation ID format'),

  body('order_id')
    .optional()
    .isString()
    .matches(/^[a-fA-F0-9]{24}$/)
    .withMessage('Invalid order ID format'),

  body('comment')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters'),

  // Ensure at least one reference is provided
  body()
    .custom((value) => {
      const { business_id, driver_id, reservation_id, order_id } = value;
      if (!business_id && !driver_id && !reservation_id && !order_id) {
        throw new Error('At least one reference (business_id, driver_id, reservation_id, or order_id) must be provided');
      }
      return true;
    }),

  handleValidationErrors
];

// Query parameter validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  handleValidationErrors
];

// Custom validation functions
const customValidators = {
  isValidGovernorate: (value) => {
    return Object.keys(GOVERNORATE_CODES).includes(value);
  },

  isValidBusinessType: (value) => {
    return BUSINESS_TYPES.includes(value);
  },

  isValidAppType: (value) => {
    return APP_TYPES.includes(value);
  },

  isStrongPassword: (value) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(value);
  }
};

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateBusinessRegistration,
  validateOrderCreation,
  validateOrderUpdate,
  validateReservationCreation,
  validateRatingCreation,
  validateAddressCreation,
  validateWalletTopup,
  validatePaymentProcessing,
  validateRefundRequest,
  validateQRGeneration,
  validateQRValidation,
  validateQRScan,
  validateRatingSubmission,
  validateObjectId,
  validateUUID,
  validatePagination,
  customValidators
};
