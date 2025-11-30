const { Business } = require('../models');
const { ERROR_MESSAGES } = require('../config/constants');

// Role-based Access Control Middleware
const roles = {
  user: 1,
  cashier: 2,
  driver: 3,
  business: 4,
  admin: 5
};

// Check if user has required role
const checkRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: ERROR_MESSAGES.INVALID_CREDENTIALS
      });
    }

    const userRole = req.user.role || 'user';
    const userRoleLevel = roles[userRole];
    const requiredRoleLevel = roles[requiredRole];

    if (!userRoleLevel || !requiredRoleLevel) {
      return res.status(403).json({
        success: false,
        message: 'Invalid role configuration',
        error: 'Role access denied'
      });
    }

    if (userRoleLevel < requiredRoleLevel) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        error: `Required role: ${requiredRole}, your role: ${userRole}`
      });
    }

    next();
  };
};

// Specific role checkers
const isUser = checkRole('user');
const isCashier = checkRole('cashier');
const isDriver = checkRole('driver');
const isBusiness = checkRole('business');
const isAdmin = checkRole('admin');

// Business ownership check
const isBusinessOwner = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: ERROR_MESSAGES.INVALID_CREDENTIALS
      });
    }

    const businessId = req.params.businessId || req.body.business_id || req.query.business_id;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Business ID is required',
        error: 'Missing business identifier'
      });
    }

    const business = await Business.findOne({ id: businessId });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
        error: ERROR_MESSAGES.BUSINESS_NOT_FOUND
      });
    }

    // Check if user is the business owner
    if (business.owner_email !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        error: 'You are not the owner of this business'
      });
    }

    // Attach business to request
    req.business = business;
    next();
  } catch (error) {
    console.error('Business owner check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Authorization check failed'
    });
  }
};

// Resource ownership check (user can only access their own resources)
const isResourceOwner = (resourceField = 'user_id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: ERROR_MESSAGES.INVALID_CREDENTIALS
      });
    }

    const resourceId = req.params.id || req.params.userId || req.body[resourceField];

    if (!resourceId) {
      return res.status(400).json({
        success: false,
        message: 'Resource ID is required',
        error: 'Missing resource identifier'
      });
    }

    // Check if the resource belongs to the authenticated user
    if (resourceId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        error: 'You can only access your own resources'
      });
    }

    next();
  };
};

// Admin or resource owner check
const isAdminOrResourceOwner = (resourceField = 'user_id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: ERROR_MESSAGES.INVALID_CREDENTIALS
      });
    }

    // If user is admin, allow access
    if (req.user.role === 'admin') {
      return next();
    }

    const resourceId = req.params.id || req.params.userId || req.body[resourceField];

    if (!resourceId) {
      return res.status(400).json({
        success: false,
        message: 'Resource ID is required',
        error: 'Missing resource identifier'
      });
    }

    // Check if the resource belongs to the authenticated user
    if (resourceId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        error: 'Admin access or resource ownership required'
      });
    }

    next();
  };
};

// Multiple role checker
const hasAnyRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: ERROR_MESSAGES.INVALID_CREDENTIALS
      });
    }

    const userRole = req.user.role || 'user';

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        error: `Required roles: ${allowedRoles.join(', ')}, your role: ${userRole}`
      });
    }

    next();
  };
};

module.exports = {
  checkRole,
  isUser,
  isCashier,
  isDriver,
  isBusiness,
  isAdmin,
  isBusinessOwner,
  isResourceOwner,
  isAdminOrResourceOwner,
  hasAnyRole,
  roles
};
