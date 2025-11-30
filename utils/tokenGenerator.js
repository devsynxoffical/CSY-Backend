const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * Generate JWT access token
 * @param {string} userId - User ID
 * @param {Object} payload - Additional payload data
 * @param {string} expiresIn - Token expiration (default '24h')
 * @returns {string} JWT token
 */
const generateToken = (userId, payload = {}, expiresIn = '24h') => {
  const jwtPayload = {
    userId,
    ...payload,
    iat: Math.floor(Date.now() / 1000)
  };

  return jwt.sign(jwtPayload, process.env.JWT_SECRET || 'your_jwt_secret_key', {
    expiresIn
  });
};

/**
 * Generate secure random token
 * @param {number} length - Token length in bytes (default 32)
 * @returns {string} Hexadecimal token
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate URL-safe token (base64url encoding)
 * @param {number} length - Token length in bytes (default 32)
 * @returns {string} URL-safe token
 */
const generateURLSafeToken = (length = 32) => {
  return crypto.randomBytes(length).toString('base64url');
};

/**
 * Generate alphanumeric token
 * @param {number} length - Token length (default 16)
 * @returns {string} Alphanumeric token
 */
const generateAlphanumericToken = (length = 16) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    token += chars[randomIndex];
  }

  return token;
};

/**
 * Generate password reset token
 * @param {string} userId - User ID
 * @param {number} expiresIn - Expiration time in hours (default 24)
 * @returns {Object} Token data
 */
const generatePasswordResetToken = (userId, expiresIn = 24) => {
  const token = generateSecureToken(32);
  const expiresAt = new Date(Date.now() + (expiresIn * 60 * 60 * 1000));

  return {
    token,
    tokenHash: hashToken(token),
    userId,
    expiresAt,
    type: 'password_reset'
  };
};

/**
 * Generate email verification token
 * @param {string} userId - User ID
 * @param {string} email - Email address
 * @param {number} expiresIn - Expiration time in hours (default 48)
 * @returns {Object} Token data
 */
const generateEmailVerificationToken = (userId, email, expiresIn = 48) => {
  const token = generateURLSafeToken(32);
  const expiresAt = new Date(Date.now() + (expiresIn * 60 * 60 * 1000));

  return {
    token,
    tokenHash: hashToken(token),
    userId,
    email,
    expiresAt,
    type: 'email_verification'
  };
};

/**
 * Generate business verification token
 * @param {string} businessId - Business ID
 * @param {string} ownerEmail - Owner email
 * @param {number} expiresIn - Expiration time in hours (default 72)
 * @returns {Object} Token data
 */
const generateBusinessVerificationToken = (businessId, ownerEmail, expiresIn = 72) => {
  const token = generateSecureToken(32);
  const expiresAt = new Date(Date.now() + (expiresIn * 60 * 60 * 1000));

  return {
    token,
    tokenHash: hashToken(token),
    businessId,
    ownerEmail,
    expiresAt,
    type: 'business_verification'
  };
};

/**
 * Generate API key
 * @param {string} userId - User ID
 * @param {string} name - API key name
 * @returns {Object} API key data
 */
const generateAPIKey = (userId, name) => {
  const apiKey = `ak_${generateURLSafeToken(24)}`;
  const secretKey = `sk_${generateSecureToken(32)}`;

  return {
    apiKey,
    secretKey,
    secretKeyHash: hashToken(secretKey),
    userId,
    name,
    createdAt: new Date(),
    type: 'api_key'
  };
};

/**
 * Generate refresh token
 * @param {string} userId - User ID
 * @param {string} deviceId - Device identifier
 * @param {number} expiresIn - Expiration time in days (default 30)
 * @returns {Object} Refresh token data
 */
const generateRefreshToken = (userId, deviceId, expiresIn = 30) => {
  const token = generateSecureToken(64);
  const expiresAt = new Date(Date.now() + (expiresIn * 24 * 60 * 60 * 1000));

  return {
    token,
    tokenHash: hashToken(token),
    userId,
    deviceId,
    expiresAt,
    type: 'refresh_token'
  };
};

/**
 * Generate session token
 * @param {string} userId - User ID
 * @param {Object} sessionData - Additional session data
 * @param {number} expiresIn - Expiration time in minutes (default 60)
 * @returns {Object} Session token data
 */
const generateSessionToken = (userId, sessionData = {}, expiresIn = 60) => {
  const token = generateURLSafeToken(32);
  const expiresAt = new Date(Date.now() + (expiresIn * 60 * 1000));

  return {
    token,
    tokenHash: hashToken(token),
    userId,
    sessionData,
    expiresAt,
    type: 'session_token'
  };
};

/**
 * Hash token for secure storage
 * @param {string} token - Token to hash
 * @returns {string} Hashed token
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Verify token against hash
 * @param {string} token - Plain token
 * @param {string} hash - Stored hash
 * @returns {boolean} True if token matches hash
 */
const verifyToken = (token, hash) => {
  const tokenHash = hashToken(token);
  return crypto.timingSafeEqual(Buffer.from(tokenHash, 'hex'), Buffer.from(hash, 'hex'));
};

/**
 * Check if token is expired
 * @param {Date} expiresAt - Expiration date
 * @returns {boolean} True if expired
 */
const isTokenExpired = (expiresAt) => {
  return new Date() > new Date(expiresAt);
};

/**
 * Generate OTP (One-Time Password)
 * @param {number} length - OTP length (default 6)
 * @param {boolean} numericOnly - Use only numbers (default true)
 * @returns {string} OTP
 */
const generateOTP = (length = 6, numericOnly = true) => {
  if (numericOnly) {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return crypto.randomInt(min, max).toString();
  } else {
    return generateAlphanumericToken(length);
  }
};

/**
 * Generate invitation token
 * @param {string} inviterId - User ID of the inviter
 * @param {string} email - Email to invite
 * @param {string} role - Role to assign (default 'user')
 * @param {number} expiresIn - Expiration time in hours (default 168 = 7 days)
 * @returns {Object} Invitation token data
 */
const generateInvitationToken = (inviterId, email, role = 'user', expiresIn = 168) => {
  const token = generateURLSafeToken(32);
  const expiresAt = new Date(Date.now() + (expiresIn * 60 * 60 * 1000));

  return {
    token,
    tokenHash: hashToken(token),
    inviterId,
    email,
    role,
    expiresAt,
    type: 'invitation'
  };
};

/**
 * Generate coupon code
 * @param {string} prefix - Code prefix (default 'CSY')
 * @param {number} length - Random part length (default 8)
 * @returns {string} Coupon code
 */
const generateCouponCode = (prefix = 'CSY', length = 8) => {
  const randomPart = generateAlphanumericToken(length).toUpperCase();
  return `${prefix}-${randomPart}`;
};

/**
 * Generate referral code
 * @param {string} userId - User ID
 * @param {number} length - Code length (default 8)
 * @returns {string} Referral code
 */
const generateReferralCode = (userId, length = 8) => {
  // Use part of userId hash for consistency
  const userHash = crypto.createHash('md5').update(userId).digest('hex').substring(0, 4);
  const randomPart = generateAlphanumericToken(length - 4).toUpperCase();
  return `${userHash}${randomPart}`;
};

module.exports = {
  generateToken,
  generateSecureToken,
  generateURLSafeToken,
  generateAlphanumericToken,
  generatePasswordResetToken,
  generateEmailVerificationToken,
  generateBusinessVerificationToken,
  generateAPIKey,
  generateRefreshToken,
  generateSessionToken,
  hashToken,
  verifyToken,
  isTokenExpired,
  generateOTP,
  generateInvitationToken,
  generateCouponCode,
  generateReferralCode
};
