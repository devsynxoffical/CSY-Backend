const jwt = require('jsonwebtoken');
const { prisma } = require('../models');
const { ERROR_MESSAGES } = require('../config/constants');

// JWT Authentication Middleware
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.headers['x-access-token'] || req.query.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
        error: ERROR_MESSAGES.INVALID_CREDENTIALS
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');

    // Check if user exists and is active
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId
      }
    });

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive',
        error: ERROR_MESSAGES.USER_NOT_FOUND
      });
    }

    // Attach user to request object
    req.user = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      pass_id: user.pass_id,
      governorate_code: user.governorate_code,
      wallet_balance: user.wallet_balance,
      points: user.points,
      is_verified: user.is_verified,
      role: 'user' // Default role
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: 'Token verification failed'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        error: 'Please login again'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Authentication failed'
    });
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.headers['x-access-token'] || req.query.token;

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (user && user.is_active) {
      req.user = {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        pass_id: user.pass_id,
        governorate_code: user.governorate_code,
        wallet_balance: user.wallet_balance,
        points: user.points,
        is_verified: user.is_verified,
        role: 'user'
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    // For optional auth, just set user to null and continue
    req.user = null;
    next();
  }
};

// Business authentication middleware
const authenticateBusiness = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.headers['x-access-token'] || req.query.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
        error: ERROR_MESSAGES.INVALID_CREDENTIALS
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');

    // Check if business exists and is active
    const business = await prisma.business.findUnique({
      where: { id: decoded.userId }
    });

    if (!business || !business.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Business not found or inactive',
        error: 'Invalid business token'
      });
    }

    // Attach business to request object
    req.business = {
      id: business.id,
      owner_email: business.owner_email,
      business_name: business.business_name,
      business_type: business.business_type,
      app_type: business.app_type,
      address: business.address,
      city: business.city,
      governorate: business.governorate,
      latitude: business.latitude,
      longitude: business.longitude,
      working_hours: business.working_hours,
      photos: business.photos,
      videos: business.videos,
      rating_average: business.rating_average,
      rating_count: business.rating_count,
      has_reservations: business.has_reservations,
      has_delivery: business.has_delivery,
      is_active: business.is_active
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: 'Token verification failed'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        error: 'Please login again'
      });
    }

    console.error('Business auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Business authentication failed'
    });
  }
};

// Driver authentication middleware
const authenticateDriver = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.headers['x-access-token'] || req.query.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
        error: ERROR_MESSAGES.INVALID_CREDENTIALS
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');

    // Check if driver exists and is active
    const driver = await prisma.driver.findUnique({
      where: { id: decoded.userId }
    });

    if (!driver || !driver.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Driver not found or inactive',
        error: 'Invalid driver token'
      });
    }

    // Attach driver to request object
    req.user = {
      id: driver.id,
      full_name: driver.full_name,
      email: driver.email,
      phone: driver.phone,
      vehicle_type: driver.vehicle_type,
      profile_picture: driver.profile_picture,
      earnings_cash: driver.earnings_cash,
      earnings_online: driver.earnings_online,
      platform_fees_owed: driver.platform_fees_owed,
      current_latitude: driver.current_latitude,
      current_longitude: driver.current_longitude,
      is_available: driver.is_available,
      is_active: driver.is_active,
      rating_average: driver.rating_average,
      rating_count: driver.rating_count,
      role: 'driver'
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: 'Token verification failed'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        error: 'Please login again'
      });
    }

    console.error('Driver auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Driver authentication failed'
    });
  }
};

// Cashier authentication middleware
const authenticateCashier = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.headers['x-access-token'] || req.query.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
        error: ERROR_MESSAGES.INVALID_CREDENTIALS
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');

    // Check if cashier exists and is active
    const cashier = await prisma.cashier.findUnique({
      where: { id: decoded.userId }
    });

    if (!cashier || !cashier.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Cashier not found or inactive',
        error: 'Invalid cashier token'
      });
    }

    // Attach cashier to request object
    req.user = {
      id: cashier.id,
      business_id: cashier.business_id,
      full_name: cashier.full_name,
      email: cashier.email,
      is_active: cashier.is_active,
      role: 'cashier'
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: 'Token verification failed'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        error: 'Please login again'
      });
    }

    console.error('Cashier auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Cashier authentication failed'
    });
  }
};

// Generate JWT token
const generateToken = (userId, expiresIn = '7d') => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your_jwt_secret_key',
    { expiresIn }
  );
};

// Verify token without database check (for password reset, etc.)
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
  } catch (error) {
    throw error;
  }
};

module.exports = {
  authenticate,
  optionalAuth,
  authenticateBusiness,
  authenticateDriver,
  authenticateCashier,
  generateToken,
  verifyToken
};
