// Load environment variables FIRST
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Use DATABASE_URL from .env, or fallback to Railway connection string
if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgresql://postgres:rdGEkKzyfuDUqsBdvwhKzaDfHdZVOtwA@metro.proxy.rlwy.net:49988/railway';
    console.log('⚠️  Using hardcoded DATABASE_URL (should be in .env file)');
} else {
    console.log('✅ Using DATABASE_URL from .env file');
}

// Initialize PrismaClient with explicit DATABASE_URL
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    },
    log: ['error', 'warn']
});

/**
 * Seed Drivers and Cashiers with comprehensive test data
 * This script creates multiple drivers and cashiers with realistic data including profile pictures
 */
async function seedDriversAndCashiers() {
    console.log('🚀 Seeding Drivers and Cashiers with comprehensive data...\n');

    try {
        // Test database connection with timeout
        console.log('🔌 Testing database connection...');
        console.log(`📡 Database URL: ${process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@') : 'Not set'}`);
        
        try {
            // Set connection timeout
            await Promise.race([
                prisma.$connect(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
                )
            ]);
            console.log('✅ Database connection successful!\n');
        } catch (connectionError) {
            if (connectionError.message.includes('timeout') || connectionError.code === 'P1001') {
                console.error('\n❌ Database Connection Failed!');
                console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.error('⚠️  Railway databases are NOT accessible from local machines');
                console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
                console.error('💡 Solutions:');
                console.error('   1. Run on Railway using Railway CLI:');
                console.error('      railway run npm run db:seed:drivers-cashiers');
                console.error('\n   2. Or use Railway Dashboard Terminal');
                console.error('\n   3. Or set up a local PostgreSQL database');
                console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            }
            throw connectionError;
        }

        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 12);

        // Get or create businesses for cashiers
        console.log('🏢 Getting businesses for cashiers...');
        const businesses = await prisma.business.findMany({
            where: { is_active: true },
            take: 10
        });

        if (businesses.length === 0) {
            console.log('⚠️  No active businesses found. Creating a test business...');
            const testBusiness = await prisma.business.create({
                data: {
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
            businesses.push(testBusiness);
        }
        console.log(`✅ Found ${businesses.length} businesses\n`);

        // ============================================
        // CREATE DRIVERS
        // ============================================
        console.log('🛵 Creating drivers...\n');

        const driversData = [
            {
                full_name: 'Ahmed Hassan',
                email: 'ahmed.driver@example.com',
                phone: '+201012345678',
                vehicle_type: 'motorcycle',
                profile_picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
                current_latitude: 30.0444,
                current_longitude: 31.2357,
                is_available: true,
                earnings_cash: 15000,
                earnings_online: 25000,
                platform_fees_owed: 800,
                rating_average: 4.8,
                rating_count: 45
            },
            {
                full_name: 'Mohamed Ali',
                email: 'mohamed.driver@example.com',
                phone: '+201012345679',
                vehicle_type: 'car',
                profile_picture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
                current_latitude: 30.0626,
                current_longitude: 31.2497,
                is_available: true,
                earnings_cash: 22000,
                earnings_online: 35000,
                platform_fees_owed: 1140,
                rating_average: 4.9,
                rating_count: 78
            },
            {
                full_name: 'Omar Ibrahim',
                email: 'omar.driver@example.com',
                phone: '+201012345680',
                vehicle_type: 'motorcycle',
                profile_picture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
                current_latitude: 30.0131,
                current_longitude: 31.2089,
                is_available: false,
                earnings_cash: 18000,
                earnings_online: 28000,
                platform_fees_owed: 920,
                rating_average: 4.7,
                rating_count: 32
            },
            {
                full_name: 'Youssef Mahmoud',
                email: 'youssef.driver@example.com',
                phone: '+201012345681',
                vehicle_type: 'car',
                profile_picture: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
                current_latitude: 30.0875,
                current_longitude: 31.2194,
                is_available: true,
                earnings_cash: 30000,
                earnings_online: 45000,
                platform_fees_owed: 1500,
                rating_average: 4.95,
                rating_count: 120
            },
            {
                full_name: 'Khaled Samir',
                email: 'khaled.driver@example.com',
                phone: '+201012345682',
                vehicle_type: 'motorcycle',
                profile_picture: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop',
                current_latitude: 30.0333,
                current_longitude: 31.2333,
                is_available: true,
                earnings_cash: 12000,
                earnings_online: 20000,
                platform_fees_owed: 640,
                rating_average: 4.6,
                rating_count: 28
            },
            {
                full_name: 'Tarek Fawzy',
                email: 'tarek.driver@example.com',
                phone: '+201012345683',
                vehicle_type: 'car',
                profile_picture: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop',
                current_latitude: 30.0500,
                current_longitude: 31.2500,
                is_available: true,
                earnings_cash: 25000,
                earnings_online: 40000,
                platform_fees_owed: 1300,
                rating_average: 4.85,
                rating_count: 95
            },
            {
                full_name: 'Hassan Mostafa',
                email: 'hassan.driver@example.com',
                phone: '+201012345684',
                vehicle_type: 'motorcycle',
                profile_picture: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=400&h=400&fit=crop',
                current_latitude: 30.0200,
                current_longitude: 31.2200,
                is_available: false,
                earnings_cash: 14000,
                earnings_online: 23000,
                platform_fees_owed: 740,
                rating_average: 4.75,
                rating_count: 40
            },
            {
                full_name: 'Amr Nabil',
                email: 'amr.driver@example.com',
                phone: '+201012345685',
                vehicle_type: 'car',
                profile_picture: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=400&fit=crop',
                current_latitude: 30.0700,
                current_longitude: 31.2400,
                is_available: true,
                earnings_cash: 28000,
                earnings_online: 42000,
                platform_fees_owed: 1400,
                rating_average: 4.9,
                rating_count: 110
            }
        ];

        const createdDrivers = [];
        for (const driverData of driversData) {
            try {
                const existingDriver = await prisma.driver.findFirst({
                    where: {
                        OR: [
                            { email: driverData.email },
                            { phone: driverData.phone }
                        ]
                    }
                });

                if (existingDriver) {
                    const updated = await prisma.driver.update({
                        where: { id: existingDriver.id },
                        data: {
                            ...driverData,
                            password_hash: hashedPassword,
                            is_active: true
                        }
                    });
                    createdDrivers.push(updated);
                    console.log(`  ✅ Updated driver: ${driverData.full_name}`);
                } else {
                    const created = await prisma.driver.create({
                        data: {
                            ...driverData,
                            password_hash: hashedPassword,
                            is_active: true
                        }
                    });
                    createdDrivers.push(created);
                    console.log(`  ✅ Created driver: ${driverData.full_name}`);
                }
            } catch (error) {
                console.error(`  ❌ Failed to create/update driver ${driverData.full_name}:`, error.message);
            }
        }

        console.log(`\n✅ Created/Updated ${createdDrivers.length} drivers\n`);

        // ============================================
        // CREATE CASHIERS
        // ============================================
        console.log('💰 Creating cashiers...\n');

        const cashiersData = [
            {
                full_name: 'Sara Ahmed',
                email: 'sara.cashier@example.com',
                business_index: 0
            },
            {
                full_name: 'Fatima Mohamed',
                email: 'fatima.cashier@example.com',
                business_index: 0
            },
            {
                full_name: 'Mariam Ali',
                email: 'mariam.cashier@example.com',
                business_index: Math.min(1, businesses.length - 1)
            },
            {
                full_name: 'Nour Hassan',
                email: 'nour.cashier@example.com',
                business_index: Math.min(1, businesses.length - 1)
            },
            {
                full_name: 'Layla Ibrahim',
                email: 'layla.cashier@example.com',
                business_index: Math.min(2, businesses.length - 1)
            },
            {
                full_name: 'Aya Mahmoud',
                email: 'aya.cashier@example.com',
                business_index: Math.min(2, businesses.length - 1)
            },
            {
                full_name: 'Yasmin Samir',
                email: 'yasmin.cashier@example.com',
                business_index: Math.min(3, businesses.length - 1)
            },
            {
                full_name: 'Dina Fawzy',
                email: 'dina.cashier@example.com',
                business_index: Math.min(3, businesses.length - 1)
            },
            {
                full_name: 'Heba Mostafa',
                email: 'heba.cashier@example.com',
                business_index: Math.min(4, businesses.length - 1)
            },
            {
                full_name: 'Rania Nabil',
                email: 'rania.cashier@example.com',
                business_index: Math.min(4, businesses.length - 1)
            },
            {
                full_name: 'Nada Khaled',
                email: 'nada.cashier@example.com',
                business_index: Math.min(0, businesses.length - 1)
            },
            {
                full_name: 'Salma Tarek',
                email: 'salma.cashier@example.com',
                business_index: Math.min(1, businesses.length - 1)
            },
            {
                full_name: 'Reem Youssef',
                email: 'reem.cashier@example.com',
                business_index: Math.min(2, businesses.length - 1)
            },
            {
                full_name: 'Hanan Amr',
                email: 'hanan.cashier@example.com',
                business_index: Math.min(3, businesses.length - 1)
            },
            {
                full_name: 'Mona Waleed',
                email: 'mona.cashier@example.com',
                business_index: Math.min(4, businesses.length - 1)
            }
        ];

        const createdCashiers = [];
        for (const cashierData of cashiersData) {
            try {
                const business = businesses[cashierData.business_index];
                if (!business) {
                    console.log(`  ⚠️  Skipping cashier ${cashierData.full_name} - no business available`);
                    continue;
                }

                const existingCashier = await prisma.cashier.findUnique({
                    where: { email: cashierData.email }
                });

                if (existingCashier) {
                    const updated = await prisma.cashier.update({
                        where: { id: existingCashier.id },
                        data: {
                            full_name: cashierData.full_name,
                            password_hash: hashedPassword,
                            business_id: business.id,
                            is_active: true
                        }
                    });
                    createdCashiers.push(updated);
                    console.log(`  ✅ Updated cashier: ${cashierData.full_name} (${business.business_name})`);
                } else {
                    const created = await prisma.cashier.create({
                        data: {
                            full_name: cashierData.full_name,
                            email: cashierData.email,
                            password_hash: hashedPassword,
                            business_id: business.id,
                            is_active: true
                        }
                    });
                    createdCashiers.push(created);
                    console.log(`  ✅ Created cashier: ${cashierData.full_name} (${business.business_name})`);
                }
            } catch (error) {
                console.error(`  ❌ Failed to create/update cashier ${cashierData.full_name}:`, error.message);
            }
        }

        console.log(`\n✅ Created/Updated ${createdCashiers.length} cashiers\n`);

        // ============================================
        // SUMMARY
        // ============================================
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 SEEDING SUMMARY');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log(`✅ Drivers: ${createdDrivers.length}`);
        console.log(`   - Available: ${createdDrivers.filter(d => d.is_available).length}`);
        console.log(`   - Motorcycles: ${createdDrivers.filter(d => d.vehicle_type === 'motorcycle').length}`);
        console.log(`   - Cars: ${createdDrivers.filter(d => d.vehicle_type === 'car').length}\n`);
        console.log(`✅ Cashiers: ${createdCashiers.length}`);
        console.log(`   - Active: ${createdCashiers.filter(c => c.is_active).length}\n`);
        console.log('📝 Test Credentials:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n🛵 Drivers (Password: password123):');
        createdDrivers.slice(0, 3).forEach(driver => {
            console.log(`   ${driver.full_name}: ${driver.email}`);
        });
        console.log('\n💰 Cashiers (Password: password123):');
        createdCashiers.slice(0, 3).forEach(cashier => {
            console.log(`   ${cashier.full_name}: ${cashier.email}`);
        });
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('🎉 Drivers and Cashiers seeded successfully!');

    } catch (error) {
        console.error('\n❌ Failed to seed drivers and cashiers:', error.message);
        
        if (error.code === 'P1001' || error.message.includes('Can\'t reach database server')) {
            console.error('\n💡 This is a database connection issue.');
            console.error('   Railway databases cannot be accessed from local machines.');
            console.error('   Please use Railway CLI to run this script:\n');
            console.error('   railway run npm run db:seed:drivers-cashiers\n');
        } else {
            console.error('\n📋 Error Details:');
            console.error(error.stack);
        }
        
        throw error;
    } finally {
        try {
            await prisma.$disconnect();
        } catch (disconnectError) {
            // Ignore disconnect errors
        }
    }
}

// Run if executed directly
if (require.main === module) {
    seedDriversAndCashiers()
        .then(() => {
            console.log('\n✅ Done!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Failed:', error);
            process.exit(1);
        });
}

module.exports = { seedDriversAndCashiers };

