require('dotenv').config();
const express = require("express");
const cors = require("cors");

// Import configurations
const { connectPostgreSQL } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { setupSwagger } = require('./config/swagger');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const businessRoutes = require('./routes/business.routes');
const driverRoutes = require('./routes/driver.routes');
const cashierRoutes = require('./routes/cashier.routes');
const reservationRoutes = require('./routes/reservation.routes');
const orderRoutes = require('./routes/order.routes');
const paymentRoutes = require('./routes/payment.routes');
const qrRoutes = require('./routes/qr.routes');
const ratingRoutes = require('./routes/rating.routes');
const adminRoutes = require('./Admin-Dashboard/admin.routes');

// Import middlewares
const { errorHandler, requestLogger } = require('./middlewares');

const app = express();
const PORT = process.env.PORT || 3119;

// Middleware setup
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3119',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
if (requestLogger) {
  app.use(requestLogger);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'CSY Pro API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: 'PostgreSQL',
    cache: 'Redis',
    endpoints: {
      auth: '/api/auth',
      users: '/api/user',
      businesses: '/api/business',
      drivers: '/api/driver',
      cashiers: '/api/cashier',
      reservations: '/api/reservations',
      orders: '/api/orders',
      payments: '/api/payments',
      qr: '/api/qr',
      ratings: '/api/ratings',
      admin: '/api/admin',
      docs: '/api-docs'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/cashier', cashierRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/ratings', ratingRoutes);

// Admin Dashboard routes
app.use('/api/admin', adminRoutes);

// Setup Swagger documentation (before 404 handler)
setupSwagger(app);

// 404 handler (must be after routes and swagger)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    error: `Route ${req.originalUrl} not found`,
    available_endpoints: {
      auth: '/api/auth',
      users: '/api/user',
      businesses: '/api/business',
      drivers: '/api/driver',
      cashiers: '/api/cashier',
      reservations: '/api/reservations',
      orders: '/api/orders',
      payments: '/api/payments',
      qr: '/api/qr',
      ratings: '/api/ratings',
      docs: '/api-docs'
    }
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Start server function
const startServer = async () => {
  try {
    // Connect to PostgreSQL
    await connectPostgreSQL();

    // Connect to Redis
    await connectRedis();

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 CSY Pro API Server running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/health`);

    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;
