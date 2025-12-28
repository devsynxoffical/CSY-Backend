require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

console.log('🔍 Checking database connection...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ SET' : '❌ NOT SET');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in .env file!');
  console.log('\n📝 Please add this to your .env file:');
  console.log('DATABASE_URL=postgresql://postgres:rdGEkKzyfuDUqsBdvwhKzaDfHdZVOtwA@metro.proxy.rlwy.net:49988/railway');
  process.exit(1);
}

const prisma = new PrismaClient({
  log: ['error'],
});

async function testConnection() {
  try {
    console.log('\n🔄 Attempting to connect...');
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('📊 PostgreSQL Version:', result[0].version.split(' ')[1]);
    
    // Check if Admin table exists
    const adminCount = await prisma.admin.count();
    console.log(`👤 Admin users in database: ${adminCount}`);
    
    await prisma.$disconnect();
    console.log('\n✅ Connection test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database connection failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('timeout')) {
      console.error('\n💡 Possible solutions:');
      console.error('1. Check if DATABASE_URL is correct');
      console.error('2. Check if database server is accessible');
      console.error('3. Check firewall/network settings');
      console.error('4. Try increasing connection timeout in Prisma config');
    }
    
    await prisma.$disconnect();
    process.exit(1);
  }
}

testConnection();

