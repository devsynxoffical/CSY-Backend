// Middleware Index File
// This file exports all middleware modules for easy importing

const auth = require('./auth');
const roleCheck = require('./roleCheck');
const validation = require('./validation');
const errorHandler = require('./errorHandler');
const rateLimiter = require('./rateLimiter');
const upload = require('./upload');

// Export all middlewares
module.exports = {
  ...auth,
  ...roleCheck,
  ...validation,
  ...errorHandler,
  ...rateLimiter,
  ...upload
};
