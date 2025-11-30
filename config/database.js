const { PrismaClient } = require('@prisma/client');

// Initialize Prisma Client with connection pooling
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error'] 
    : ['warn', 'error'],
  errorFormat: 'pretty',
});

// PostgreSQL Configuration
const connectPostgreSQL = async () => {
  try {
    // Test the connection
    await prisma.$connect();
    console.log('✅ PostgreSQL Connected Successfully via Prisma');

    // Log database info in development
    if (process.env.NODE_ENV === 'development') {
      const result = await prisma.$queryRaw`SELECT version()`;
      console.log('📊 PostgreSQL Version:', result[0].version.split(' ')[1]);
    }

  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const disconnectPostgreSQL = async () => {
  try {
    await prisma.$disconnect();
    console.log('✅ PostgreSQL connection closed');
  } catch (error) {
    console.error('❌ Error closing PostgreSQL connection:', error);
  }
};

// Handle application termination
process.on('SIGINT', async () => {
  await disconnectPostgreSQL();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectPostgreSQL();
  process.exit(0);
});

// Export Prisma client and connection functions
module.exports = {
  prisma,
  connectPostgreSQL,
  disconnectPostgreSQL,
};
