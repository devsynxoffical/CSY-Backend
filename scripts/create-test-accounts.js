// Load environment variables
require('dotenv').config();

const { prisma } = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * Create test accounts for Driver and Cashier
 * Run this script to create test accounts if they don't exist
 */
async function createTestAccounts() {
    console.log('🔧 Creating test accounts...\n');

    try {
        // Test database connection
        console.log('🔌 Testing database connection...');
        await prisma.$connect();
        console.log('✅ Database connection successful!\n');

        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create or update test driver
        console.log('🛵 Creating test driver...');
        const driver = await prisma.driver.upsert({
            where: { email: 'driver@example.com' },
            update: {
                password_hash: hashedPassword,
                is_active: true,
                is_available: true
            },
            create: {
                full_name: 'Test Driver',
                email: 'driver@example.com',
                phone: '+201234567891',
                password_hash: hashedPassword,
                vehicle_type: 'motorcycle',
                is_available: true,
                is_active: true,
                earnings_cash: 0,
                earnings_online: 0,
                platform_fees_owed: 0
            }
        });
        console.log('✅ Driver created/updated:', driver.email);

        // Get or create a test business first
        console.log('\n🏢 Creating test business...');
        const business = await prisma.business.upsert({
            where: { owner_email: 'business@example.com' },
            update: {},
            create: {
                owner_email: 'business@example.com',
                password_hash: hashedPassword,
                business_name: 'Test Restaurant',
                business_type: 'restaurant',
                app_type: 'pass',
                address: '123 Test Street',
                city: 'Cairo',
                governorate: 'Cairo',
                latitude: 30.0444,
                longitude: 31.2357,
                has_reservations: true,
                has_delivery: true,
                is_active: true
            }
        });
        console.log('✅ Business created/updated:', business.business_name);

        // Create or update test cashier
        console.log('\n💰 Creating test cashier...');
        const cashier = await prisma.cashier.upsert({
            where: { email: 'cashier@example.com' },
            update: {
                password_hash: hashedPassword,
                is_active: true,
                business_id: business.id
            },
            create: {
                business_id: business.id,
                full_name: 'Test Cashier',
                email: 'cashier@example.com',
                phone: '+201234567892',
                password_hash: hashedPassword,
                is_active: true
            }
        });
        console.log('✅ Cashier created/updated:', cashier.email);

        console.log('\n📝 Test Account Credentials:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Driver:');
        console.log('  Email: driver@example.com');
        console.log('  Password: password123');
        console.log('\nCashier:');
        console.log('  Email: cashier@example.com');
        console.log('  Password: password123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('✅ Test accounts created successfully!');
        console.log('💡 Use these credentials in Postman to test endpoints.\n');

    } catch (error) {
        console.error('❌ Failed to create test accounts:', error.message);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run if executed directly
if (require.main === module) {
    createTestAccounts()
        .then(() => {
            console.log('✅ Done!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Failed:', error);
            process.exit(1);
        });
}

module.exports = { createTestAccounts };

