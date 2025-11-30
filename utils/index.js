// Utilities Index File
// This file exports all utility modules for easy importing

const generatePassID = require('./generatePassID');
const generateOrderNumber = require('./generateOrderNumber');
const qrGenerator = require('./qrGenerator');
const tokenGenerator = require('./tokenGenerator');
const calculateFees = require('./calculateFees');
const validateAddress = require('./validateAddress');
const logger = require('./logger');

// Export all utilities
module.exports = {
  ...generatePassID,
  ...generateOrderNumber,
  ...qrGenerator,
  ...tokenGenerator,
  ...calculateFees,
  ...validateAddress,
  ...logger
};
