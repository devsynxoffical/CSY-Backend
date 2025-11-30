// Services Index File
// This file exports all service modules for easy importing

const emailService = require('./email.service');
const smsService = require('./sms.service');
const notificationService = require('./notification.service');
const paymentService = require('./payment.service');
const qrService = require('./qr.service');
const pointsService = require('./points.service');
const aiAssistantService = require('./ai-assistant.service');
const mapsService = require('./maps.service');

// Export all services
module.exports = {
  emailService,
  smsService,
  notificationService,
  paymentService,
  qrService,
  pointsService,
  aiAssistantService,
  mapsService
};
