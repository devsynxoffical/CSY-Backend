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

        // Comprehensive driver data with detailed information
        // 25 drivers with varied profiles, locations, earnings, and ratings
        const driversData = [
            // Top Performers (High Ratings & Earnings)
            {
                full_name: 'Ahmed Hassan',
                email: 'ahmed.hassan.driver@example.com',
                phone: '+201012345678',
                vehicle_type: 'motorcycle',
                profile_picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
                current_latitude: 30.0444,
                current_longitude: 31.2357,
                is_available: true,
                earnings_cash: 18500,
                earnings_online: 32000,
                platform_fees_owed: 1010,
                rating_average: 4.85,
                rating_count: 127
            },
            {
                full_name: 'Mohamed Ali',
                email: 'mohamed.ali.driver@example.com',
                phone: '+201012345679',
                vehicle_type: 'car',
                profile_picture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
                current_latitude: 30.0626,
                current_longitude: 31.2497,
                is_available: true,
                earnings_cash: 32000,
                earnings_online: 48000,
                platform_fees_owed: 1600,
                rating_average: 4.92,
                rating_count: 189
            },
            {
                full_name: 'Youssef Mahmoud',
                email: 'youssef.mahmoud.driver@example.com',
                phone: '+201012345681',
                vehicle_type: 'car',
                profile_picture: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
                current_latitude: 30.0875,
                current_longitude: 31.2194,
                is_available: true,
                earnings_cash: 35000,
                earnings_online: 52000,
                platform_fees_owed: 1740,
                rating_average: 4.96,
                rating_count: 215
            },
            {
                full_name: 'Tarek Fawzy',
                email: 'tarek.fawzy.driver@example.com',
                phone: '+201012345683',
                vehicle_type: 'car',
                profile_picture: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop',
                current_latitude: 30.0500,
                current_longitude: 31.2500,
                is_available: true,
                earnings_cash: 28000,
                earnings_online: 42000,
                platform_fees_owed: 1400,
                rating_average: 4.88,
                rating_count: 156
            },
            {
                full_name: 'Amr Nabil',
                email: 'amr.nabil.driver@example.com',
                phone: '+201012345685',
                vehicle_type: 'car',
                profile_picture: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=400&fit=crop',
                current_latitude: 30.0700,
                current_longitude: 31.2400,
                is_available: true,
                earnings_cash: 31000,
                earnings_online: 46000,
                platform_fees_owed: 1540,
                rating_average: 4.91,
                rating_count: 178
            },
            // Experienced Motorcycle Drivers
            {
                full_name: 'Omar Ibrahim',
                email: 'omar.ibrahim.driver@example.com',
                phone: '+201012345680',
                vehicle_type: 'motorcycle',
                profile_picture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
                current_latitude: 30.0131,
                current_longitude: 31.2089,
                is_available: false,
                earnings_cash: 19500,
                earnings_online: 31000,
                platform_fees_owed: 1010,
                rating_average: 4.78,
                rating_count: 89
            },
            {
                full_name: 'Khaled Samir',
                email: 'khaled.samir.driver@example.com',
                phone: '+201012345682',
                vehicle_type: 'motorcycle',
                profile_picture: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop',
                current_latitude: 30.0333,
                current_longitude: 31.2333,
                is_available: true,
                earnings_cash: 16500,
                earnings_online: 28000,
                platform_fees_owed: 890,
                rating_average: 4.72,
                rating_count: 67
            },
            {
                full_name: 'Hassan Mostafa',
                email: 'hassan.mostafa.driver@example.com',
                phone: '+201012345684',
                vehicle_type: 'motorcycle',
                profile_picture: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=400&h=400&fit=crop',
                current_latitude: 30.0200,
                current_longitude: 31.2200,
                is_available: false,
                earnings_cash: 15200,
                earnings_online: 26500,
                platform_fees_owed: 834,
                rating_average: 4.68,
                rating_count: 54
            },
            {
                full_name: 'Mahmoud Sayed',
                email: 'mahmoud.sayed.driver@example.com',
                phone: '+201012345686',
                vehicle_type: 'motorcycle',
                profile_picture: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
                current_latitude: 30.0555,
                current_longitude: 31.2222,
                is_available: true,
                earnings_cash: 14200,
                earnings_online: 24000,
                platform_fees_owed: 764,
                rating_average: 4.65,
                rating_count: 43
            },
            {
                full_name: 'Ibrahim Reda',
                email: 'ibrahim.reda.driver@example.com',
                phone: '+201012345687',
                vehicle_type: 'motorcycle',
                profile_picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
                current_latitude: 30.0666,
                current_longitude: 31.2111,
                is_available: true,
                earnings_cash: 13800,
                earnings_online: 23500,
                platform_fees_owed: 746,
                rating_average: 4.63,
                rating_count: 38
            },
            // Mid-Level Car Drivers
            {
                full_name: 'Waleed Kamel',
                email: 'waleed.kamel.driver@example.com',
                phone: '+201012345688',
                vehicle_type: 'car',
                profile_picture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
                current_latitude: 30.0777,
                current_longitude: 31.2333,
                is_available: true,
                earnings_cash: 24000,
                earnings_online: 38000,
                platform_fees_owed: 1240,
                rating_average: 4.79,
                rating_count: 112
            },
            {
                full_name: 'Samy Farid',
                email: 'samy.farid.driver@example.com',
                phone: '+201012345689',
                vehicle_type: 'car',
                profile_picture: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop',
                current_latitude: 30.0888,
                current_longitude: 31.2444,
                is_available: false,
                earnings_cash: 22000,
                earnings_online: 35000,
                platform_fees_owed: 1140,
                rating_average: 4.76,
                rating_count: 98
            },
            {
                full_name: 'Hany Magdy',
                email: 'hany.magdy.driver@example.com',
                phone: '+201012345690',
                vehicle_type: 'car',
                profile_picture: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=400&h=400&fit=crop',
                current_latitude: 30.0999,
                current_longitude: 31.2555,
                is_available: true,
                earnings_cash: 26000,
                earnings_online: 40000,
                platform_fees_owed: 1320,
                rating_average: 4.82,
                rating_count: 134
            },
            {
                full_name: 'Sherif Adel',
                email: 'sherif.adel.driver@example.com',
                phone: '+201012345691',
                vehicle_type: 'car',
                profile_picture: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=400&fit=crop',
                current_latitude: 30.0111,
                current_longitude: 31.2666,
                is_available: true,
                earnings_cash: 23000,
                earnings_online: 36000,
                platform_fees_owed: 1180,
                rating_average: 4.74,
                rating_count: 87
            },
            {
                full_name: 'Karim Osama',
                email: 'karim.osama.driver@example.com',
                phone: '+201012345692',
                vehicle_type: 'car',
                profile_picture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
                current_latitude: 30.0222,
                current_longitude: 31.2777,
                is_available: false,
                earnings_cash: 21000,
                earnings_online: 33000,
                platform_fees_owed: 1080,
                rating_average: 4.71,
                rating_count: 76
            },
            // Newer Drivers (Lower Earnings, Building Reputation)
            {
                full_name: 'Mostafa Ashraf',
                email: 'mostafa.ashraf.driver@example.com',
                phone: '+201012345693',
                vehicle_type: 'motorcycle',
                profile_picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
                current_latitude: 30.0333,
                current_longitude: 31.2888,
                is_available: true,
                earnings_cash: 8500,
                earnings_online: 15000,
                platform_fees_owed: 470,
                rating_average: 4.55,
                rating_count: 22
            },
            {
                full_name: 'Bassem Tamer',
                email: 'bassem.tamer.driver@example.com',
                phone: '+201012345694',
                vehicle_type: 'motorcycle',
                profile_picture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
                current_latitude: 30.0444,
                current_longitude: 31.2999,
                is_available: true,
                earnings_cash: 9200,
                earnings_online: 16500,
                platform_fees_owed: 514,
                rating_average: 4.58,
                rating_count: 28
            },
            {
                full_name: 'Ramy Hossam',
                email: 'ramy.hossam.driver@example.com',
                phone: '+201012345695',
                vehicle_type: 'car',
                profile_picture: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop',
                current_latitude: 30.0555,
                current_longitude: 31.3000,
                is_available: true,
                earnings_cash: 12000,
                earnings_online: 20000,
                platform_fees_owed: 640,
                rating_average: 4.62,
                rating_count: 35
            },
            {
                full_name: 'Adel Nader',
                email: 'adel.nader.driver@example.com',
                phone: '+201012345696',
                vehicle_type: 'car',
                profile_picture: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=400&h=400&fit=crop',
                current_latitude: 30.0666,
                current_longitude: 31.3111,
                is_available: false,
                earnings_cash: 11000,
                earnings_online: 18500,
                platform_fees_owed: 590,
                rating_average: 4.59,
                rating_count: 31
            },
            {
                full_name: 'Fady Emad',
                email: 'fady.emad.driver@example.com',
                phone: '+201012345697',
                vehicle_type: 'motorcycle',
                profile_picture: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=400&fit=crop',
                current_latitude: 30.0777,
                current_longitude: 31.3222,
                is_available: true,
                earnings_cash: 7800,
                earnings_online: 14000,
                platform_fees_owed: 436,
                rating_average: 4.52,
                rating_count: 19
            },
            // Experienced but Currently Unavailable
            {
                full_name: 'Nader Yasser',
                email: 'nader.yasser.driver@example.com',
                phone: '+201012345698',
                vehicle_type: 'car',
                profile_picture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
                current_latitude: 30.0888,
                current_longitude: 31.3333,
                is_available: false,
                earnings_cash: 27000,
                earnings_online: 41000,
                platform_fees_owed: 1360,
                rating_average: 4.83,
                rating_count: 145
            },
            {
                full_name: 'Yasser Zaki',
                email: 'yasser.zaki.driver@example.com',
                phone: '+201012345699',
                vehicle_type: 'motorcycle',
                profile_picture: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
                current_latitude: 30.0999,
                current_longitude: 31.3444,
                is_available: false,
                earnings_cash: 18800,
                earnings_online: 30500,
                platform_fees_owed: 986,
                rating_average: 4.77,
                rating_count: 102
            },
            {
                full_name: 'Zaki Mounir',
                email: 'zaki.mounir.driver@example.com',
                phone: '+201012345700',
                vehicle_type: 'car',
                profile_picture: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop',
                current_latitude: 30.0100,
                current_longitude: 31.3555,
                is_available: false,
                earnings_cash: 25000,
                earnings_online: 39000,
                platform_fees_owed: 1280,
                rating_average: 4.81,
                rating_count: 123
            },
            // Active High-Performers
            {
                full_name: 'Mounir Fawzy',
                email: 'mounir.fawzy.driver@example.com',
                phone: '+201012345701',
                vehicle_type: 'motorcycle',
                profile_picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
                current_latitude: 30.0200,
                current_longitude: 31.3666,
                is_available: true,
                earnings_cash: 17200,
                earnings_online: 29000,
                platform_fees_owed: 924,
                rating_average: 4.73,
                rating_count: 81
            },
            {
                full_name: 'Fawzy Sameh',
                email: 'fawzy.sameh.driver@example.com',
                phone: '+201012345702',
                vehicle_type: 'car',
                profile_picture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
                current_latitude: 30.0300,
                current_longitude: 31.3777,
                is_available: true,
                earnings_cash: 29000,
                earnings_online: 44000,
                platform_fees_owed: 1460,
                rating_average: 4.87,
                rating_count: 167
            },
            {
                full_name: 'Sameh Medhat',
                email: 'sameh.medhat.driver@example.com',
                phone: '+201012345703',
                vehicle_type: 'motorcycle',
                profile_picture: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop',
                current_latitude: 30.0400,
                current_longitude: 31.3888,
                is_available: true,
                earnings_cash: 14800,
                earnings_online: 25000,
                platform_fees_owed: 796,
                rating_average: 4.66,
                rating_count: 49
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
        // Calculate statistics
        const availableDrivers = createdDrivers.filter(d => d.is_available);
        const unavailableDrivers = createdDrivers.filter(d => !d.is_available);
        const motorcycleDrivers = createdDrivers.filter(d => d.vehicle_type === 'motorcycle');
        const carDrivers = createdDrivers.filter(d => d.vehicle_type === 'car');
        const totalEarningsCash = createdDrivers.reduce((sum, d) => sum + Number(d.earnings_cash), 0);
        const totalEarningsOnline = createdDrivers.reduce((sum, d) => sum + Number(d.earnings_online), 0);
        const totalPlatformFees = createdDrivers.reduce((sum, d) => sum + Number(d.platform_fees_owed), 0);
        const avgRating = createdDrivers.reduce((sum, d) => sum + Number(d.rating_average), 0) / createdDrivers.length;
        const totalRatings = createdDrivers.reduce((sum, d) => sum + d.rating_count, 0);

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 SEEDING SUMMARY');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        console.log(`✅ Drivers: ${createdDrivers.length} total`);
        console.log(`   📍 Available: ${availableDrivers.length}`);
        console.log(`   🚫 Unavailable: ${unavailableDrivers.length}`);
        console.log(`   🏍️  Motorcycles: ${motorcycleDrivers.length}`);
        console.log(`   🚗 Cars: ${carDrivers.length}`);
        console.log(`   ⭐ Average Rating: ${avgRating.toFixed(2)}/5.0`);
        console.log(`   📝 Total Reviews: ${totalRatings}`);
        console.log(`   💵 Total Cash Earnings: EGP ${totalEarningsCash.toLocaleString()}`);
        console.log(`   💳 Total Online Earnings: EGP ${totalEarningsOnline.toLocaleString()}`);
        console.log(`   💰 Total Platform Fees Owed: EGP ${totalPlatformFees.toLocaleString()}\n`);
        
        console.log(`✅ Cashiers: ${createdCashiers.length} total`);
        console.log(`   ✅ Active: ${createdCashiers.filter(c => c.is_active).length}\n`);
        
        console.log('📝 Test Credentials (Password: password123):');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n🛵 Top 5 Drivers:');
        createdDrivers
            .sort((a, b) => Number(b.rating_average) - Number(a.rating_average))
            .slice(0, 5)
            .forEach((driver, index) => {
                console.log(`   ${index + 1}. ${driver.full_name}`);
                console.log(`      📧 ${driver.email}`);
                console.log(`      📱 ${driver.phone}`);
                console.log(`      🚗 ${driver.vehicle_type === 'car' ? 'Car' : 'Motorcycle'}`);
                console.log(`      ⭐ ${Number(driver.rating_average).toFixed(2)} (${driver.rating_count} reviews)`);
                console.log(`      ${driver.is_available ? '✅ Available' : '❌ Unavailable'}`);
                console.log(`      💵 Earnings: EGP ${(Number(driver.earnings_cash) + Number(driver.earnings_online)).toLocaleString()}`);
                console.log('');
            });
        
        console.log('💰 Top 5 Cashiers:');
        createdCashiers.slice(0, 5).forEach((cashier, index) => {
            const business = businesses.find(b => b.id === cashier.business_id);
            console.log(`   ${index + 1}. ${cashier.full_name}`);
            console.log(`      📧 ${cashier.email}`);
            console.log(`      🏢 ${business ? business.business_name : 'N/A'}`);
            console.log('');
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

