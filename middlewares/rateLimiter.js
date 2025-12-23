const rateLimit = require('express-rate-limit');
const { API_LIMITS } = require('../config/constants');

// Helper function for IP key generation (handles IPv6)
const getClientIP = (req) => {
  return req.user ? req.user.id : (req.ip || req.connection.remoteAddress || 'unknown');
};

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    error: 'Rate limit exceeded'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip trust proxy validation for Railway deployment
  validate: {
    trustProxy: false
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    error: 'Authentication rate limit exceeded'
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again later.',
      error: 'Authentication rate limit exceeded',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Order creation rate limiter
const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: API_LIMITS.MAX_ORDERS_PER_HOUR || 50,
  message: {
    success: false,
    message: 'Too many orders created, please try again later.',
    error: 'Order creation rate limit exceeded'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit based on user ID if authenticated, otherwise IP
    return getClientIP(req);
  }
});

// Reservation creation rate limiter
const reservationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: API_LIMITS.MAX_RESERVATIONS_PER_DAY || 10,
  message: {
    success: false,
    message: 'Too many reservations created today, please try again tomorrow.',
    error: 'Reservation creation rate limit exceeded'
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false
  },
  keyGenerator: (req) => {
    return getClientIP(req);
  }
});

// Rating creation rate limiter
const ratingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: API_LIMITS.MAX_RATINGS_PER_HOUR || 20,
  message: {
    success: false,
    message: 'Too many ratings submitted, please try again later.',
    error: 'Rating creation rate limit exceeded'
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false
  },
  keyGenerator: (req) => {
    return getClientIP(req);
  }
});

// Notification rate limiter
const notificationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: API_LIMITS.MAX_NOTIFICATIONS_PER_DAY || 100,
  message: {
    success: false,
    message: 'Too many notifications sent, please try again tomorrow.',
    error: 'Notification rate limit exceeded'
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false
  },
  keyGenerator: (req) => {
    return getClientIP(req);
  }
});

// File upload rate limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 20 uploads per hour
  message: {
    success: false,
    message: 'Too many file uploads, please try again later.',
    error: 'File upload rate limit exceeded'
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false
  }
});

// API endpoint specific limiters
const createEndpointLimiter = (windowMs, maxRequests, message) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    message: {
      success: false,
      message,
      error: 'Rate limit exceeded'
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: {
      trustProxy: false
    },
    keyGenerator: (req) => {
      return getClientIP(req);
    }
  });
};

// Business registration limiter
const businessRegistrationLimiter = createEndpointLimiter(
  24 * 60 * 60 * 1000, // 24 hours
  3, // 3 registrations per day per IP
  'Too many business registrations, please try again tomorrow.'
);

// Wallet topup limiter
const walletTopupLimiter = createEndpointLimiter(
  60 * 60 * 1000, // 1 hour
  5, // 5 topups per hour per user
  'Too many wallet topups, please try again later.'
);

// Password reset limiter
const passwordResetLimiter = createEndpointLimiter(
  60 * 60 * 1000, // 1 hour
  3, // 3 reset requests per hour per user
  'Too many password reset requests, please try again later.'
);

// Dynamic rate limiter based on user role
const dynamicLimiter = (req, res, next) => {
  const userRole = req.user ? req.user.role : 'guest';
  let limiter;

  switch (userRole) {
    case 'admin':
      limiter = createEndpointLimiter(60 * 1000, 1000, 'Admin rate limit exceeded'); // 1000 requests per minute
      break;
    case 'business':
      limiter = createEndpointLimiter(60 * 1000, 300, 'Business rate limit exceeded'); // 300 requests per minute
      break;
    case 'driver':
      limiter = createEndpointLimiter(60 * 1000, 200, 'Driver rate limit exceeded'); // 200 requests per minute
      break;
    case 'user':
      limiter = createEndpointLimiter(60 * 1000, 100, 'User rate limit exceeded'); // 100 requests per minute
      break;
    default:
      limiter = generalLimiter;
  }

  return limiter(req, res, next);
};

// Redis-based rate limiter for distributed systems
const createRedisLimiter = (redisClient, keyPrefix, windowMs, maxRequests) => {
  return async (req, res, next) => {
    const key = `${keyPrefix}:${req.user ? req.user.id : req.ip}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      // Remove old requests outside the window
      await redisClient.zremrangebyscore(key, 0, windowStart);

      // Count requests in current window
      const requestCount = await redisClient.zcard(key);

      if (requestCount >= maxRequests) {
        const resetTime = await redisClient.zrange(key, 0, 0, 'WITHSCORES');
        const oldestRequest = resetTime.length > 0 ? parseInt(resetTime[1]) : now;

        return res.status(429).json({
          success: false,
          message: 'Rate limit exceeded',
          error: 'Too many requests',
          retryAfter: Math.ceil((oldestRequest + windowMs - now) / 1000)
        });
      }

      // Add current request
      await redisClient.zadd(key, now, now);

      // Set expiration on the key
      await redisClient.expire(key, Math.ceil(windowMs / 1000));

      next();
    } catch (error) {
      console.error('Redis rate limiter error:', error);
      // Fallback to basic limiter if Redis fails
      return generalLimiter(req, res, next);
    }
  };
};

// Strict rate limiter for sensitive operations (orders, payments, etc.)
const strictLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message: 'Too many sensitive operations, please try again later.',
    error: 'Strict rate limit exceeded'
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many sensitive operations, please try again later.',
      error: 'Strict rate limit exceeded',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  strictLimiter,
  orderLimiter,
  reservationLimiter,
  ratingLimiter,
  notificationLimiter,
  uploadLimiter,
  businessRegistrationLimiter,
  walletTopupLimiter,
  passwordResetLimiter,
  dynamicLimiter,
  createEndpointLimiter,
  createRedisLimiter
};
