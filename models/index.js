const { prisma } = require('../config/database');

// Export Prisma client as the main model interface
module.exports = {
  prisma,

  // Export individual models for convenience
  User: prisma.user,
  Address: prisma.address,
  Wallet: prisma.wallet,
  Points: prisma.points,
  Business: prisma.business,
  Cashier: prisma.cashier,
  Appointment: prisma.appointment,
  Product: prisma.product,
  Driver: prisma.driver,
  Reservation: prisma.reservation,
  Order: prisma.order,
  OrderItem: prisma.orderItem,
  Transaction: prisma.transaction,
  QRCode: prisma.qRCode,
  Rating: prisma.rating,
  Notification: prisma.notification,
  Subscription: prisma.subscription,
};
