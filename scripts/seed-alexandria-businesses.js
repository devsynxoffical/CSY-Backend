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
                photos: ['https://example.com/restaurant1.jpg']
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
                photos: ['https://example.com/cafe1.jpg']
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
                photos: ['https://example.com/fastfood1.jpg']
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
                photos: ['https://example.com/juice1.jpg']
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
                photos: ['https://example.com/dessert1.jpg']
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
                photos: ['https://example.com/restaurant2.jpg']
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
                photos: ['https://example.com/cafe2.jpg']
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
                photos: ['https://example.com/supermarket1.jpg']
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
                photos: ['https://example.com/pharmacy1.jpg']
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
                photos: ['https://example.com/clinic1.jpg']
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
                photos: ['https://example.com/beauty1.jpg']
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
                photos: ['https://example.com/restaurant3.jpg']
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
                photos: ['https://example.com/recreational1.jpg']
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

        // Count businesses by app_type
        const passCount = await prisma.business.count({
            where: {
                city: 'Alexandria',
                app_type: 'pass'
            }
        });

        const allCount = await prisma.business.count({
            where: {
                city: 'Alexandria'
            }
        });

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

