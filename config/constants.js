// Application Constants

// Governorate Codes
const GOVERNORATE_CODES = {
  DM: 'Damietta',
  HS: 'Al-Hasakah', // Adding more common Syrian governorates
  HM: 'Homs',
  HI: 'Hama',
  LA: 'Latakia',
  QA: 'Qamishli',
  RA: 'Raqqa',
  SU: 'Suwayda',
  TA: 'Tartus',
  AL: 'Aleppo',
  DA: 'Damascus',
  DR: 'Daraa',
  DE: 'Deir ez-Zor',
  ID: 'Idlib',
  RI: 'Rif Dimashq'
};

// Business Types
const BUSINESS_TYPES = [
  'restaurant',
  'cafe',
  'pharmacy',
  'clinic',
  'beauty_center'
];

// App Types
const APP_TYPES = [
  'pass',
  'care',
  'go',
  'pass_go',
  'care_go'
];

// Order Types
const ORDER_TYPES = [
  'delivery',
  'pickup'
];

// Payment Methods
const PAYMENT_METHODS = [
  'cash',
  'online',
  'wallet'
];

// Payment Status
const PAYMENT_STATUS = [
  'pending',
  'paid',
  'refunded'
];

// Order Status
const ORDER_STATUS = [
  'pending',
  'accepted',
  'preparing',
  'waiting_driver',
  'in_delivery',
  'completed',
  'cancelled'
];

// Reservation Types
const RESERVATION_TYPES = [
  'table',
  'activity',
  'medical',
  'beauty'
];

// Reservation Status
const RESERVATION_STATUS = [
  'pending',
  'confirmed',
  'cancelled',
  'completed',
  'expired'
];

// Transaction Types
const TRANSACTION_TYPES = [
  'payment',
  'discount',
  'refund',
  'wallet_topup',
  'earnings'
];

// Reference Types for Transactions
const REFERENCE_TYPES = [
  'reservation',
  'order',
  'wallet'
];

// Transaction Status
const TRANSACTION_STATUS = [
  'pending',
  'completed',
  'failed',
  'refunded'
];

// QR Types
const QR_TYPES = [
  'discount',
  'payment',
  'reservation',
  'order',
  'driver_pickup'
];

// Notification Types
const NOTIFICATION_TYPES = [
  'order_status',
  'reservation_confirmed',
  'payment_received',
  'driver_assigned',
  'rating_received',
  'promotion',
  'system_alert'
];

// Recipient Types for Notifications
const RECIPIENT_TYPES = [
  'user',
  'business',
  'driver',
  'cashier'
];

// Rating Targets
const RATING_TARGET_TYPES = [
  'business',
  'driver',
  'reservation',
  'order'
];

// Subscription Status
const SUBSCRIPTION_STATUS = [
  'active',
  'pending',
  'expired'
];

// Fees and Rates
const FEES = {
  // Platform fees
  PLATFORM_FEE_PERCENTAGE: 0.05, // 5%
  DELIVERY_FEE_BASE: 5000, // 50 EGP in piastres
  DELIVERY_FEE_PER_KM: 1000, // 10 EGP per km in piastres

  // Driver earnings
  DRIVER_EARNINGS_PERCENTAGE: 0.70, // 70% of delivery fee
  DRIVER_PLATFORM_FEE_PERCENTAGE: 0.30, // 30% platform fee

  // Minimum amounts
  MINIMUM_ORDER_AMOUNT: 10000, // 100 EGP in piastres
  MINIMUM_WALLET_TOPUP: 5000, // 50 EGP in piastres

  // Points system
  POINTS_PER_EGP_SPENT: 1, // 1 point per EGP spent
  EGP_PER_POINT_REDEEMED: 100, // 100 piastres per point redeemed
  POINTS_EXPIRY_DAYS: 365 // Points expire after 1 year
};

// Cache TTL (in seconds)
const CACHE_TTL = {
  USER_PROFILE: 300, // 5 minutes
  BUSINESS_PROFILE: 600, // 10 minutes
  PRODUCTS_LIST: 1800, // 30 minutes
  RATINGS_CACHE: 3600, // 1 hour
  LOCATION_DATA: 7200, // 2 hours
  NOTIFICATIONS: 300, // 5 minutes
  WALLET_BALANCE: 60 // 1 minute
};

// API Limits
const API_LIMITS = {
  MAX_ORDERS_PER_HOUR: 50,
  MAX_RESERVATIONS_PER_DAY: 10,
  MAX_RATINGS_PER_HOUR: 20,
  MAX_NOTIFICATIONS_PER_DAY: 100,
  MAX_ADDRESS_ENTRIES: 10,
  MAX_FILE_UPLOAD_SIZE_MB: 5,
  MAX_FILES_PER_UPLOAD: 10
};

// Validation Rules
const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  PHONE_REGEX: /^\+?[0-9]{10,15}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASS_ID_REGEX: /^DM-\d{6}$/,
  TIME_FORMAT_REGEX: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  DATE_FORMAT_REGEX: /^\d{4}-\d{2}-\d{2}$/
};

// Error Messages
const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  BUSINESS_NOT_FOUND: 'Business not found',
  ORDER_NOT_FOUND: 'Order not found',
  INSUFFICIENT_BALANCE: 'Insufficient wallet balance',
  INVALID_PAYMENT_METHOD: 'Invalid payment method',
  ORDER_ALREADY_COMPLETED: 'Order is already completed',
  RESERVATION_NOT_AVAILABLE: 'Reservation slot not available',
  FILE_TOO_LARGE: 'File size exceeds limit',
  INVALID_FILE_TYPE: 'Invalid file type',
  RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later'
};

// Success Messages
const SUCCESS_MESSAGES = {
  ORDER_PLACED: 'Order placed successfully',
  PAYMENT_PROCESSED: 'Payment processed successfully',
  RESERVATION_CONFIRMED: 'Reservation confirmed successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
  WALLET_TOPPED_UP: 'Wallet topped up successfully',
  NOTIFICATION_SENT: 'Notification sent successfully'
};

module.exports = {
  GOVERNORATE_CODES,
  BUSINESS_TYPES,
  APP_TYPES,
  ORDER_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  ORDER_STATUS,
  RESERVATION_TYPES,
  RESERVATION_STATUS,
  TRANSACTION_TYPES,
  REFERENCE_TYPES,
  TRANSACTION_STATUS,
  QR_TYPES,
  NOTIFICATION_TYPES,
  RECIPIENT_TYPES,
  RATING_TARGET_TYPES,
  SUBSCRIPTION_STATUS,
  FEES,
  CACHE_TTL,
  API_LIMITS,
  VALIDATION_RULES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
};
