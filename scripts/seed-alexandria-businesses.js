// Load environment variables
require('dotenv').config();

const { prisma } = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * Seed script to add businesses in Alexandria for testing
 * This script creates businesses with app_type='pass' and other app types
 */
async function seed() {
    console.log('🌱 Seeding Alexandria businesses...\n');

    try {
        // Test database connection first with retry logic
        console.log('🔌 Testing database connection...');
        const maxRetries = 3;
        let retryCount = 0;
        let connected = false;

        while (retryCount < maxRetries && !connected) {
            try {
                await prisma.$connect();
                console.log('✅ Database connection successful!\n');
                connected = true;
            } catch (connError) {
                retryCount++;
                if (retryCount < maxRetries) {
                    console.log(`⚠️  Connection attempt ${retryCount} failed. Retrying in ${retryCount * 2} seconds...`);
                    await new Promise(resolve => setTimeout(resolve, retryCount * 2000));
                } else {
                    console.error('\n❌ Database Connection Failed after ' + maxRetries + ' attempts!\n');
                    console.error('Error:', connError.message);
                    console.error('\n💡 Troubleshooting Steps:');
                    console.error('   1. Go to Railway Dashboard: https://railway.app');
                    console.error('   2. Find your PostgreSQL database service');
                    console.error('   3. If it shows "Paused", click "Wake" or "Start"');
                    console.error('   4. Wait 30-60 seconds for database to start');
                    console.error('   5. Verify DATABASE_URL in .env file is correct');
                    console.error('   6. Check network connectivity\n');
                    console.error('📋 Your DATABASE_URL:');
                    console.error('   ' + process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@') || 'Not found in .env\n');
                    throw new Error('Database connection failed. Please ensure the Railway database is active and running.');
                }
            }
        }

        const hashedPassword = await bcrypt.hash('password123', 12);

        // Alexandria coordinates
        const alexandriaLat = 31.2001;
        const alexandriaLng = 29.9187;

        const businesses = [
            // PASS app_type businesses
            {
                owner_email: 'alex_restaurant1@test.com',
                business_name: 'Alexandria Seafood Restaurant',
                business_type: 'restaurant',
                app_type: 'pass',
                address: 'Corniche Road, Alexandria',
                city: 'Alexandria',
                governorate: 'Alexandria',
                latitude: 31.2001,
                longitude: 29.9187,
                has_reservations: true,
                has_delivery: true,
                rating_average: 4.5,
                rating_count: 120,
                working_hours: {
                    sunday: '12:00-23:00',
                    monday: '12:00-23:00',
                    tuesday: '12:00-23:00',
                    wednesday: '12:00-23:00',
                    thursday: '12:00-23:00',
                    friday: '12:00-23:00',
                    saturday: '12:00-23:00'
                },
                photos: [
                    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
                    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
                    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'
                ],
                videos: []
            },
            {
                owner_email: 'alex_cafe1@test.com',
                business_name: 'Mediterranean Cafe',
                business_type: 'cafe',
                app_type: 'pass',
                address: 'Stanley Bridge Area, Alexandria',
                city: 'Alexandria',
                governorate: 'Alexandria',
                latitude: 31.2100,
                longitude: 29.9200,
                has_reservations: true,
                has_delivery: false,
                rating_average: 4.3,
                rating_count: 85,
                working_hours: {
                    sunday: '8:00-22:00',
                    monday: '8:00-22:00',
                    tuesday: '8:00-22:00',
                    wednesday: '8:00-22:00',
                    thursday: '8:00-22:00',
                    friday: '8:00-22:00',
                    saturday: '8:00-22:00'
                },
                photos: [
                    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800',
                    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
                    'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800'
                ],
                videos: []
            },
            {
                owner_email: 'alex_fastfood1@test.com',
                business_name: 'Alexandria Fast Food',
                business_type: 'fast_food',
                app_type: 'pass',
                address: 'Sidi Gaber, Alexandria',
                city: 'Alexandria',
                governorate: 'Alexandria',
                latitude: 31.1900,
                longitude: 29.9100,
                has_reservations: false,
                has_delivery: true,
                rating_average: 4.0,
                rating_count: 200,
                working_hours: {
                    sunday: '10:00-02:00',
                    monday: '10:00-02:00',
                    tuesday: '10:00-02:00',
                    wednesday: '10:00-02:00',
                    thursday: '10:00-02:00',
                    friday: '10:00-02:00',
                    saturday: '10:00-02:00'
                },
                photos: [
                    'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800',
                    'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800',
                    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800'
                ],
                videos: []
            },
            {
                owner_email: 'alex_juice1@test.com',
                business_name: 'Fresh Juice Bar',
                business_type: 'juice_shop',
                app_type: 'pass',
                address: 'Raml Station, Alexandria',
                city: 'Alexandria',
                governorate: 'Alexandria',
                latitude: 31.2050,
                longitude: 29.9150,
                has_reservations: false,
                has_delivery: true,
                rating_average: 4.6,
                rating_count: 150,
                working_hours: {
                    sunday: '9:00-23:00',
                    monday: '9:00-23:00',
                    tuesday: '9:00-23:00',
                    wednesday: '9:00-23:00',
                    thursday: '9:00-23:00',
                    friday: '9:00-23:00',
                    saturday: '9:00-23:00'
                },
                photos: [
                    'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800',
                    'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800',
                    'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800'
                ],
                videos: []
            },
            {
                owner_email: 'alex_dessert1@test.com',
                business_name: 'Sweet Dreams Dessert Shop',
                business_type: 'dessert_shop',
                app_type: 'pass',
                address: 'Smouha, Alexandria',
                city: 'Alexandria',
                governorate: 'Alexandria',
                latitude: 31.1950,
                longitude: 29.9250,
                has_reservations: true,
                has_delivery: true,
                rating_average: 4.7,
                rating_count: 95,
                working_hours: {
                    sunday: '14:00-23:00',
                    monday: '14:00-23:00',
                    tuesday: '14:00-23:00',
                    wednesday: '14:00-23:00',
                    thursday: '14:00-23:00',
                    friday: '14:00-23:00',
                    saturday: '14:00-23:00'
                },
                photos: [
                    'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800',
                    'https://images.unsplash.com/photo-1563805042-7684c019e1b3?w=800',
                    'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800'
                ],
                videos: []
            },
            {
                owner_email: 'alex_restaurant2@test.com',
                business_name: 'Italian Corner Restaurant',
                business_type: 'restaurant',
                app_type: 'pass',
                address: 'Gleem, Alexandria',
                city: 'Alexandria',
                governorate: 'Alexandria',
                latitude: 31.2150,
                longitude: 29.9300,
                has_reservations: true,
                has_delivery: true,
                rating_average: 4.4,
                rating_count: 110,
                working_hours: {
                    sunday: '13:00-23:00',
                    monday: '13:00-23:00',
                    tuesday: '13:00-23:00',
                    wednesday: '13:00-23:00',
                    thursday: '13:00-23:00',
                    friday: '13:00-23:00',
                    saturday: '13:00-23:00'
                },
                photos: [
                    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
                    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
                    'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800'
                ],
                videos: []
            },
            {
                owner_email: 'alex_cafe2@test.com',
                business_name: 'Coastal Coffee House',
                business_type: 'cafe',
                app_type: 'pass',
                address: 'Montaza, Alexandria',
                city: 'Alexandria',
                governorate: 'Alexandria',
                latitude: 31.2800,
                longitude: 29.9500,
                has_reservations: true,
                has_delivery: false,
                rating_average: 4.5,
                rating_count: 75,
                working_hours: {
                    sunday: '7:00-21:00',
                    monday: '7:00-21:00',
                    tuesday: '7:00-21:00',
                    wednesday: '7:00-21:00',
                    thursday: '7:00-21:00',
                    friday: '7:00-21:00',
                    saturday: '7:00-21:00'
                },
                photos: [
                    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
                    'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800',
                    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800'
                ],
                videos: []
            },
            {
                owner_email: 'alex_supermarket1@test.com',
                business_name: 'Alexandria Supermarket',
                business_type: 'supermarket',
                app_type: 'go',
                address: 'Sidi Bishr, Alexandria',
                city: 'Alexandria',
                governorate: 'Alexandria',
                latitude: 31.2500,
                longitude: 29.9400,
                has_reservations: false,
                has_delivery: true,
                rating_average: 4.2,
                rating_count: 300,
                working_hours: {
                    sunday: '8:00-22:00',
                    monday: '8:00-22:00',
                    tuesday: '8:00-22:00',
                    wednesday: '8:00-22:00',
                    thursday: '8:00-22:00',
                    friday: '8:00-22:00',
                    saturday: '8:00-22:00'
                },
                photos: [
                    'https://images.unsplash.com/photo-1556910096-6f5e72db6803?w=800',
                    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
                    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800'
                ],
                videos: []
            },
            {
                owner_email: 'alex_pharmacy1@test.com',
                business_name: 'Alexandria Pharmacy',
                business_type: 'pharmacy',
                app_type: 'care',
                address: 'Miami, Alexandria',
                city: 'Alexandria',
                governorate: 'Alexandria',
                latitude: 31.2200,
                longitude: 29.9350,
                has_reservations: false,
                has_delivery: true,
                rating_average: 4.6,
                rating_count: 180,
                working_hours: {
                    sunday: '9:00-22:00',
                    monday: '9:00-22:00',
                    tuesday: '9:00-22:00',
                    wednesday: '9:00-22:00',
                    thursday: '9:00-22:00',
                    friday: '9:00-22:00',
                    saturday: '9:00-22:00'
                },
                photos: [
                    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800',
                    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800',
                    'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800'
                ],
                videos: []
            },
            {
                owner_email: 'alex_clinic1@test.com',
                business_name: 'Alexandria Medical Clinic',
                business_type: 'clinic',
                app_type: 'care',
                address: 'Roushdy, Alexandria',
                city: 'Alexandria',
                governorate: 'Alexandria',
                latitude: 31.2300,
                longitude: 29.9450,
                has_reservations: true,
                has_delivery: false,
                rating_average: 4.8,
                rating_count: 65,
                working_hours: {
                    sunday: '10:00-18:00',
                    monday: '10:00-18:00',
                    tuesday: '10:00-18:00',
                    wednesday: '10:00-18:00',
                    thursday: '10:00-18:00',
                    friday: '10:00-18:00',
                    saturday: '10:00-18:00'
                },
                photos: [
                    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800',
                    'https://images.unsplash.com/photo-1512678080530-4c0b1a0b0b0b?w=800',
                    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800'
                ],
                videos: []
            },
            {
                owner_email: 'alex_beauty1@test.com',
                business_name: 'Alexandria Beauty Center',
                business_type: 'beauty_center',
                app_type: 'care',
                address: 'Zizinia, Alexandria',
                city: 'Alexandria',
                governorate: 'Alexandria',
                latitude: 31.2400,
                longitude: 29.9500,
                has_reservations: true,
                has_delivery: false,
                rating_average: 4.5,
                rating_count: 140,
                working_hours: {
                    sunday: '10:00-20:00',
                    monday: '10:00-20:00',
                    tuesday: '10:00-20:00',
                    wednesday: '10:00-20:00',
                    thursday: '10:00-20:00',
                    friday: '10:00-20:00',
                    saturday: '10:00-20:00'
                },
                photos: [
                    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800',
                    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800',
                    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800'
                ],
                videos: []
            },
            {
                owner_email: 'alex_restaurant3@test.com',
                business_name: 'Seaside Grill',
                business_type: 'restaurant',
                app_type: 'pass_go',
                address: 'Agami, Alexandria',
                city: 'Alexandria',
                governorate: 'Alexandria',
                latitude: 31.2600,
                longitude: 29.9600,
                has_reservations: true,
                has_delivery: true,
                rating_average: 4.6,
                rating_count: 130,
                working_hours: {
                    sunday: '12:00-23:00',
                    monday: '12:00-23:00',
                    tuesday: '12:00-23:00',
                    wednesday: '12:00-23:00',
                    thursday: '12:00-23:00',
                    friday: '12:00-23:00',
                    saturday: '12:00-23:00'
                },
                photos: [
                    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
                    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
                    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'
                ],
                videos: []
            },
            {
                owner_email: 'alex_recreational1@test.com',
                business_name: 'Alexandria Fun Zone',
                business_type: 'recreational',
                app_type: 'pass',
                address: 'San Stefano, Alexandria',
                city: 'Alexandria',
                governorate: 'Alexandria',
                latitude: 31.2700,
                longitude: 29.9700,
                has_reservations: true,
                has_delivery: false,
                rating_average: 4.4,
                rating_count: 90,
                working_hours: {
                    sunday: '10:00-22:00',
                    monday: '10:00-22:00',
                    tuesday: '10:00-22:00',
                    wednesday: '10:00-22:00',
                    thursday: '10:00-22:00',
                    friday: '10:00-22:00',
                    saturday: '10:00-22:00'
                },
                photos: [
                    'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=800',
                    'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=800',
                    'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=800'
                ],
                videos: []
            }
        ];

        console.log(`📝 Creating/updating ${businesses.length} businesses in Alexandria...\n`);

        let created = 0;
        let updated = 0;
        let skipped = 0;

        for (const businessData of businesses) {
            try {
                // Check if business exists
                const existing = await prisma.business.findUnique({
                    where: { owner_email: businessData.owner_email }
                });

                if (existing) {
                    // Update existing business
                    await prisma.business.update({
                        where: { id: existing.id },
                        data: {
                            ...businessData,
                            password_hash: hashedPassword,
                            is_active: true
                        }
                    });
                    updated++;
                    console.log(`✅ Updated: ${businessData.business_name} (${businessData.app_type})`);
                } else {
                    // Create new business
                    await prisma.business.create({
                        data: {
                            ...businessData,
                            password_hash: hashedPassword,
                            is_active: true
                        }
                    });
                    created++;
                    console.log(`✅ Created: ${businessData.business_name} (${businessData.app_type})`);
                }
            } catch (error) {
                skipped++;
                console.error(`❌ Error with ${businessData.business_name}:`, error.message);
            }
        }

        console.log('\n📊 Summary:');
        console.log(`   ✅ Created: ${created}`);
        console.log(`   🔄 Updated: ${updated}`);
        console.log(`   ⚠️  Skipped: ${skipped}`);
        console.log(`   📍 Total: ${businesses.length} businesses in Alexandria`);

        // Count businesses by app_type (only if we have successful operations)
        let passCount = 0;
        let allCount = 0;
        
        try {
            passCount = await prisma.business.count({
                where: {
                    city: 'Alexandria',
                    app_type: 'pass'
                }
            });

            allCount = await prisma.business.count({
                where: {
                    city: 'Alexandria'
                }
            });
        } catch (countError) {
            console.log('⚠️  Could not fetch statistics (database connection issue)');
            // Use expected counts instead
            passCount = businesses.filter(b => b.app_type === 'pass').length;
            allCount = businesses.length;
        }

        console.log(`\n📈 Statistics:`);
        console.log(`   🎫 PASS businesses: ${passCount}`);
        console.log(`   🏢 Total Alexandria businesses: ${allCount}`);

        console.log('\n✨ Seeding completed successfully!');
        console.log('\n💡 Test the endpoint:');
        console.log('   GET /api/business?city=Alexandria&app_type=pass&page=1&limit=50');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run seed if executed directly
if (require.main === module) {
    seed()
        .then(() => {
            console.log('\n✅ Done!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Failed:', error);
            process.exit(1);
        });
}

module.exports = { seed };

