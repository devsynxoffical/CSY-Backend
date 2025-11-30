// Routes Index File
// This file exports all route modules for easy importing

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const businessRoutes = require('./business.routes');
const driverRoutes = require('./driver.routes');
const cashierRoutes = require('./cashier.routes');
const reservationRoutes = require('./reservation.routes');
const orderRoutes = require('./order.routes');
const paymentRoutes = require('./payment.routes');
const qrRoutes = require('./qr.routes');
const ratingRoutes = require('./rating.routes');

module.exports = {
  authRoutes,
  userRoutes,
  businessRoutes,
  driverRoutes,
  cashierRoutes,
  reservationRoutes,
  orderRoutes,
  paymentRoutes,
  qrRoutes,
  ratingRoutes
};
