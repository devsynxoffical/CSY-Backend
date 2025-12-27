const crypto = require('crypto');
const { QR_TYPES } = require('../config/constants');

/**
 * Generate unique QR token/code
 * @param {string} type - QR type (discount, payment, reservation, order, driver_pickup)
 * @param {string} referenceId - Reference ID
 * @param {number} length - Token length (default 16)
 * @returns {string} Unique QR token
 */
const generateQRToken = (type, referenceId, length = 16) => {
  if (!QR_TYPES.includes(type)) {
    throw new Error(`Invalid QR type. Allowed types: ${QR_TYPES.join(', ')}`);
  }

  // Create a unique string combining type, reference ID, and timestamp
  const uniqueString = `${type}-${referenceId}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;

  // Create hash and take first 'length' characters
  const hash = crypto.createHash('sha256').update(uniqueString).digest('hex');
  const token = hash.substring(0, length).toUpperCase();

  return token;
};

/**
 * Generate QR code data URL (for embedding in HTML)
 * Note: This requires qrcode package to be installed
 * @param {string} data - Data to encode in QR
 * @param {Object} options - QR code options
 * @returns {Promise<string>} Data URL
 */
const generateQRDataURL = async (data, options = {}) => {
  try {
    // Dynamic import to avoid errors if qrcode package is not installed
    const QRCode = await import('qrcode');

    const defaultOptions = {
      width: 256,
      height: 256,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    };

    const qrOptions = { ...defaultOptions, ...options };

    const dataURL = await QRCode.default.toDataURL(data, qrOptions);
    return dataURL;
  } catch (error) {
    // Return null instead of throwing - QR code still works without image
    console.warn('QR Code image generation failed (optional):', error.message);
    return null;
  }
};

/**
 * Generate QR code as buffer (for file storage)
 * @param {string} data - Data to encode
 * @param {Object} options - QR options
 * @returns {Promise<Buffer>} QR code buffer
 */
const generateQRBuffer = async (data, options = {}) => {
  try {
    const QRCode = await import('qrcode');

    const defaultOptions = {
      width: 256,
      height: 256,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    };

    const qrOptions = { ...defaultOptions, ...options };

    const buffer = await QRCode.default.toBuffer(data, qrOptions);
    return buffer;
  } catch (error) {
    // Return null instead of throwing - QR code still works without image
    console.warn('QR Buffer generation failed (optional):', error.message);
    return null;
  }
};

/**
 * Generate QR code for reservation
 * @param {string} reservationId - Reservation ID
 * @param {Object} reservationData - Additional reservation data
 * @returns {Promise<Object>} QR code data
 */
const generateReservationQR = async (reservationId, reservationData = {}) => {
  const qrToken = generateQRToken('reservation', reservationId);

  const qrData = {
    type: 'reservation',
    reservationId,
    qrToken,
    timestamp: Date.now(),
    ...reservationData
  };

  const qrString = JSON.stringify(qrData);

  try {
    const dataURL = await generateQRDataURL(qrString);
    const buffer = await generateQRBuffer(qrString);

    return {
      qrToken,
      qrData,
      qrString,
      dataURL,
      buffer,
      reservationId
    };
  } catch (error) {
    // Fallback if qrcode package is not available
    return {
      qrToken,
      qrData,
      qrString,
      dataURL: null,
      buffer: null,
      reservationId
    };
  }
};

/**
 * Generate QR code for order
 * @param {string} orderId - Order ID
 * @param {Object} orderData - Additional order data
 * @returns {Promise<Object>} QR code data
 */
const generateOrderQR = async (orderId, orderData = {}) => {
  const qrToken = generateQRToken('order', orderId);

  const qrData = {
    type: 'order',
    orderId,
    qrToken,
    timestamp: Date.now(),
    ...orderData
  };

  const qrString = JSON.stringify(qrData);

  try {
    const dataURL = await generateQRDataURL(qrString);
    const buffer = await generateQRBuffer(qrString);

    return {
      qrToken,
      qrData,
      qrString,
      dataURL,
      buffer,
      orderId
    };
  } catch (error) {
    return {
      qrToken,
      qrData,
      qrString,
      dataURL: null,
      buffer: null,
      orderId
    };
  }
};

/**
 * Generate QR code for payment
 * @param {string} paymentId - Payment reference ID
 * @param {number} amount - Payment amount
 * @param {Object} paymentData - Additional payment data
 * @returns {Promise<Object>} QR code data
 */
const generatePaymentQR = async (paymentId, amount, paymentData = {}) => {
  const qrToken = generateQRToken('payment', paymentId);

  const qrData = {
    type: 'payment',
    paymentId,
    amount,
    qrToken,
    currency: 'EGP',
    timestamp: Date.now(),
    ...paymentData
  };

  const qrString = JSON.stringify(qrData);

  try {
    const dataURL = await generateQRDataURL(qrString);
    const buffer = await generateQRBuffer(qrString);

    return {
      qrToken,
      qrData,
      qrString,
      dataURL,
      buffer,
      paymentId,
      amount
    };
  } catch (error) {
    return {
      qrToken,
      qrData,
      qrString,
      dataURL: null,
      buffer: null,
      paymentId,
      amount
    };
  }
};

/**
 * Generate QR code for discount/coupon
 * @param {string} discountId - Discount reference ID
 * @param {Object} discountData - Discount details
 * @returns {Promise<Object>} QR code data
 */
const generateDiscountQR = async (discountId, discountData = {}) => {
  const qrToken = generateQRToken('discount', discountId);

  const qrData = {
    type: 'discount',
    discountId,
    qrToken,
    timestamp: Date.now(),
    ...discountData
  };

  const qrString = JSON.stringify(qrData);

  try {
    const dataURL = await generateQRDataURL(qrString);
    const buffer = await generateQRBuffer(qrString);

    return {
      qrToken,
      qrData,
      qrString,
      dataURL,
      buffer,
      discountId
    };
  } catch (error) {
    return {
      qrToken,
      qrData,
      qrString,
      dataURL: null,
      buffer: null,
      discountId
    };
  }
};

/**
 * Generate QR code for driver pickup
 * @param {string} driverId - Driver ID
 * @param {string} orderId - Order ID
 * @param {Object} pickupData - Additional pickup data
 * @returns {Promise<Object>} QR code data
 */
const generateDriverPickupQR = async (driverId, orderId, pickupData = {}) => {
  const referenceId = `${driverId}-${orderId}`;
  const qrToken = generateQRToken('driver_pickup', referenceId);

  const qrData = {
    type: 'driver_pickup',
    driverId,
    orderId,
    qrToken,
    timestamp: Date.now(),
    ...pickupData
  };

  const qrString = JSON.stringify(qrData);

  try {
    const dataURL = await generateQRDataURL(qrString);
    const buffer = await generateQRBuffer(qrString);

    return {
      qrToken,
      qrData,
      qrString,
      dataURL,
      buffer,
      driverId,
      orderId
    };
  } catch (error) {
    return {
      qrToken,
      qrData,
      qrString,
      dataURL: null,
      buffer: null,
      driverId,
      orderId
    };
  }
};

/**
 * Decode QR code data
 * @param {string} qrString - QR code string data
 * @returns {Object} Decoded QR data
 */
const decodeQRData = (qrString) => {
  try {
    const data = JSON.parse(qrString);

    // Validate required fields
    if (!data.type || !data.qrToken || !data.timestamp) {
      throw new Error('Invalid QR code data format');
    }

    // Check if QR code is expired (24 hours)
    const expiryTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    if (Date.now() - data.timestamp > expiryTime) {
      throw new Error('QR code has expired');
    }

    return data;
  } catch (error) {
    console.error('QR decode error:', error);
    throw new Error('Invalid QR code data');
  }
};

/**
 * Validate QR token format
 * @param {string} token - QR token to validate
 * @returns {boolean} True if valid
 */
const validateQRToken = (token) => {
  // QR tokens are uppercase hexadecimal strings of length 16
  const tokenRegex = /^[A-F0-9]{16}$/;
  return tokenRegex.test(token);
};

module.exports = {
  generateQRToken,
  generateQRDataURL,
  generateQRBuffer,
  generateReservationQR,
  generateOrderQR,
  generatePaymentQR,
  generateDiscountQR,
  generateDriverPickupQR,
  decodeQRData,
  validateQRToken
};
