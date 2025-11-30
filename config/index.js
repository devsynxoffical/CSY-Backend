// Configuration Index File
// This file exports all configuration modules for easy importing

const database = require('./database');
const redis = require('./redis');
const aws = require('./aws');
const constants = require('./constants');

// Export all configurations
module.exports = {
  ...database,
  ...redis,
  ...aws,
  ...constants
};
