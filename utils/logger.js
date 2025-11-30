const fs = require('fs').promises;
const path = require('path');

/**
 * Logger levels
 */
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

/**
 * Get current log level from environment
 */
const getCurrentLogLevel = () => {
  const level = process.env.LOG_LEVEL || 'info';
  return LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.INFO;
};

/**
 * Format log message
 */
const formatMessage = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const pid = process.pid;

  const logEntry = {
    timestamp,
    level: level.toLowerCase(),
    message,
    pid,
    ...meta
  };

  return JSON.stringify(logEntry);
};

/**
 * Write to file (if enabled)
 */
const writeToFile = async (message) => {
  if (process.env.LOG_TO_FILE !== 'true') return;

  try {
    const logDir = path.join(__dirname, '../logs');
    const logFile = path.join(logDir, `${new Date().toISOString().split('T')[0]}.log`);

    // Ensure log directory exists
    await fs.mkdir(logDir, { recursive: true });

    await fs.appendFile(logFile, message + '\n');
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
};

/**
 * Core logging function
 */
const log = (level, message, meta = {}) => {
  const currentLevel = getCurrentLogLevel();
  const messageLevel = LOG_LEVELS[level.toUpperCase()];

  if (messageLevel > currentLevel) return;

  const formattedMessage = formatMessage(level, message, meta);

  // Console output
  if (level === 'ERROR') {
    console.error(formattedMessage);
  } else if (level === 'WARN') {
    console.warn(formattedMessage);
  } else {
    console.log(formattedMessage);
  }

  // File output (async, don't wait)
  writeToFile(formattedMessage);
};

/**
 * Logger methods
 */
const logger = {
  error: (message, meta = {}) => log('ERROR', message, meta),
  warn: (message, meta = {}) => log('WARN', message, meta),
  info: (message, meta = {}) => log('INFO', message, meta),
  debug: (message, meta = {}) => log('DEBUG', message, meta),

  // Specialized logging methods
  request: (req, res, responseTime) => {
    const meta = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    };

    logger.info(`${req.method} ${req.url} - ${res.statusCode}`, meta);
  },

  database: (operation, collection, query = {}, result = null, error = null) => {
    const meta = {
      operation,
      collection,
      query: JSON.stringify(query),
      success: !error,
      duration: result?.duration
    };

    if (error) {
      logger.error(`Database ${operation} failed`, { ...meta, error: error.message });
    } else {
      logger.debug(`Database ${operation}`, meta);
    }
  },

  auth: (action, userId, success = true, details = {}) => {
    const meta = {
      action,
      userId,
      success,
      ...details
    };

    if (success) {
      logger.info(`Auth ${action}`, meta);
    } else {
      logger.warn(`Auth ${action} failed`, meta);
    }
  },

  payment: (action, amount, userId, success = true, details = {}) => {
    const meta = {
      action,
      amount,
      userId,
      success,
      ...details
    };

    if (success) {
      logger.info(`Payment ${action}`, meta);
    } else {
      logger.error(`Payment ${action} failed`, meta);
    }
  },

  order: (action, orderId, userId, details = {}) => {
    const meta = {
      action,
      orderId,
      userId,
      ...details
    };

    logger.info(`Order ${action}`, meta);
  },

  business: (action, businessId, userId, details = {}) => {
    const meta = {
      action,
      businessId,
      userId,
      ...details
    };

    logger.info(`Business ${action}`, meta);
  },

  api: (endpoint, method, status, responseTime, userId = null) => {
    const meta = {
      endpoint,
      method,
      status,
      responseTime: `${responseTime}ms`,
      userId
    };

    if (status >= 400) {
      logger.warn(`API Error: ${method} ${endpoint}`, meta);
    } else {
      logger.debug(`API Request: ${method} ${endpoint}`, meta);
    }
  },

  performance: (operation, duration, details = {}) => {
    const meta = {
      operation,
      duration: `${duration}ms`,
      ...details
    };

    if (duration > 1000) {
      logger.warn(`Slow operation: ${operation}`, meta);
    } else {
      logger.debug(`Performance: ${operation}`, meta);
    }
  },

  security: (event, userId, details = {}) => {
    const meta = {
      event,
      userId,
      ...details
    };

    logger.warn(`Security event: ${event}`, meta);
  }
};

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.request(req, res, duration);
  });

  next();
};

/**
 * Error logging middleware
 */
const errorLogger = (err, req, res, next) => {
  const meta = {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user?.id,
    userAgent: req.get('User-Agent'),
    stack: err.stack
  };

  logger.error(`Unhandled error: ${err.message}`, meta);
  next(err);
};

/**
 * Create child logger with context
 */
const createChildLogger = (context) => {
  return {
    error: (message, meta = {}) => logger.error(message, { ...context, ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { ...context, ...meta }),
    info: (message, meta = {}) => logger.info(message, { ...context, ...meta }),
    debug: (message, meta = {}) => logger.debug(message, { ...context, ...meta })
  };
};

module.exports = {
  logger,
  requestLogger,
  errorLogger,
  createChildLogger,
  LOG_LEVELS
};
