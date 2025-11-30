const { prisma } = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * Seed database with sample data for development and testing
 */
async function seed() {
    try {
        console.log('🌱 Starting database seeding...');

        // Clear existing data (optional - comment out if you want to keep existing data)
        console.log('🧹 Clearing existing data...');
        await prisma.notification.deleteMany();
        await prisma.rating.deleteMany();
        await prisma.qRCode.deleteMany();
        await prisma.transaction.deleteMany();
        await prisma.orderItem.deleteMany();
        await prisma.order.deleteMany();
        await prisma.reservation.deleteMany();
        await prisma.product.deleteMany();
        await prisma.appointment.deleteMany();
        await prisma.cashier.deleteMany();
        await prisma.business.deleteMany();
        await prisma.driver.deleteMany();
        await prisma.points.deleteMany();
        await prisma.wallet.deleteMany();
        await prisma.address.deleteMany();
        await prisma.subscription.deleteMany();
        await prisma.user.deleteMany();

        // Hash password for all users
        const hashedPassword = await bcrypt.hash('password123', 10);

        // Create sample users
        console.log('👤 Creating sample users...');
        const users = await Promise.all([
            prisma.user.create({
                data: {
                    full_name: 'Ahmad Hassan',
                    email: 'ahmad@example.com',
                    phone: '+963911111111',
                    password_hash: hashedPassword,
                    pass_id: 'DM-000001',
                    governorate_code: 'DM',
                    ai_assistant_name: 'Alex',
                    wallet_balance: 50000,
                    points: 150,
                    is_verified: true,
                    wallet: {
                        create: {
                            balance: 50000,
                        },
                    },
                    addresses: {
                        create: {
                            recipient_name: 'Ahmad Hassan',
                            area: 'Mazzeh',
                            street: 'Al-Jalaa Street',
                            city: 'Damascus',
                            phone: '+963911111111',
                            is_default: true,
                        },
                    },
                },
            }),
            prisma.user.create({
                data: {
                    full_name: 'Sara Ali',
                    email: 'sara@example.com',
                    phone: '+963922222222',
                    password_hash: hashedPassword,
                    pass_id: 'DM-000002',
                    governorate_code: 'DM',
                    ai_assistant_name: 'Sophia',
                    wallet_balance: 30000,
                    points: 80,
                    is_verified: true,
                    wallet: {
                        create: {
                            balance: 30000,
                        },
                    },
                },
            }),
        ]);

        console.log(`✅ Created ${users.length} users`);

        // Create sample businesses
        console.log('🏢 Creating sample businesses...');
        const businesses = await Promise.all([
            prisma.business.create({
                data: {
                    owner_email: 'restaurant1@example.com',
                    password_hash: hashedPassword,
                    business_name: 'Al-Sham Restaurant',
                    business_type: 'restaurant',
                    app_type: 'pass_go',
                    has_reservations: true,
                    has_delivery: true,
                    address: 'Abu Rummaneh, Damascus',
                    city: 'Damascus',
                    governorate: 'Damascus',
                    latitude: 33.5138,
                    longitude: 36.2765,
                    working_hours: {
                        monday: { open: '10:00', close: '23:00' },
                        tuesday: { open: '10:00', close: '23:00' },
                        wednesday: { open: '10:00', close: '23:00' },
                        thursday: { open: '10:00', close: '23:00' },
                        friday: { open: '10:00', close: '23:00' },
                        saturday: { open: '10:00', close: '23:00' },
                        sunday: { open: '10:00', close: '23:00' },
                    },
                    rating_average: 4.5,
                    rating_count: 120,
                    products: {
                        create: [
                            {
                                name: 'Shawarma Plate',
                                description: 'Traditional Syrian shawarma with rice and salad',
                                price: 15000,
                                category: 'Main Dishes',
                                is_available: true,
                            },
                            {
                                name: 'Grilled Chicken',
                                description: 'Marinated grilled chicken with vegetables',
                                price: 25000,
                                category: 'Main Dishes',
                                is_available: true,
                            },
                            {
                                name: 'Fresh Orange Juice',
                                description: 'Freshly squeezed orange juice',
                                price: 5000,
                                category: 'Beverages',
                                is_available: true,
                            },
                        ],
                    },
                },
            }),
            prisma.business.create({
                data: {
                    owner_email: 'cafe1@example.com',
                    password_hash: hashedPassword,
                    business_name: 'Coffee Corner',
                    business_type: 'cafe',
                    app_type: 'pass',
                    has_reservations: true,
                    has_delivery: false,
                    address: 'Malki, Damascus',
                    city: 'Damascus',
                    governorate: 'Damascus',
                    latitude: 33.5024,
                    longitude: 36.2811,
                    working_hours: {
                        monday: { open: '08:00', close: '22:00' },
                        tuesday: { open: '08:00', close: '22:00' },
                        wednesday: { open: '08:00', close: '22:00' },
                        thursday: { open: '08:00', close: '22:00' },
                        friday: { open: '08:00', close: '22:00' },
                        saturday: { open: '08:00', close: '22:00' },
                        sunday: { open: '08:00', close: '22:00' },
                    },
                    rating_average: 4.8,
                    rating_count: 85,
                },
            }),
            prisma.business.create({
                data: {
                    owner_email: 'clinic1@example.com',
                    password_hash: hashedPassword,
                    business_name: 'Dr. Khaled Medical Center',
                    business_type: 'clinic',
                    app_type: 'care',
                    has_reservations: true,
                    has_delivery: false,
                    address: 'Mazzeh, Damascus',
                    city: 'Damascus',
                    governorate: 'Damascus',
                    latitude: 33.5000,
                    longitude: 36.2700,
                    working_hours: {
                        monday: { open: '09:00', close: '17:00' },
                        tuesday: { open: '09:00', close: '17:00' },
                        wednesday: { open: '09:00', close: '17:00' },
                        thursday: { open: '09:00', close: '17:00' },
                        saturday: { open: '09:00', close: '14:00' },
                    },
                    rating_average: 4.9,
                    rating_count: 200,
                },
            }),
        ]);

        console.log(`✅ Created ${businesses.length} businesses`);

        // Create sample drivers
        console.log('🚗 Creating sample drivers...');
        const drivers = await Promise.all([
            prisma.driver.create({
                data: {
                    full_name: 'Mohammed Youssef',
                    email: 'driver1@example.com',
                    phone: '+963933333333',
                    password_hash: hashedPassword,
                    vehicle_type: 'Motorcycle',
                    earnings_cash: 50000,
                    earnings_online: 30000,
                    is_available: true,
                    rating_average: 4.7,
                    rating_count: 150,
                },
            }),
            prisma.driver.create({
                data: {
                    full_name: 'Omar Khalil',
                    email: 'driver2@example.com',
                    phone: '+963944444444',
                    password_hash: hashedPassword,
                    vehicle_type: 'Car',
                    earnings_cash: 80000,
                    earnings_online: 60000,
                    is_available: true,
                    rating_average: 4.9,
                    rating_count: 220,
                },
            }),
        ]);

        console.log(`✅ Created ${drivers.length} drivers`);

        // Create sample reservations
        console.log('📅 Creating sample reservations...');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const reservations = await Promise.all([
            prisma.reservation.create({
                data: {
                    user_id: users[0].id,
                    business_id: businesses[1].id, // Coffee Corner
                    reservation_type: 'table',
                    date: tomorrow,
                    time: '18:00',
                    duration: 120,
                    number_of_people: 4,
                    payment_method: 'cash',
                    payment_status: 'pending',
                    status: 'confirmed',
                    qr_code: `QR-RES-${Date.now()}-1`,
                },
            }),
            prisma.reservation.create({
                data: {
                    user_id: users[1].id,
                    business_id: businesses[2].id, // Medical Center
                    reservation_type: 'medical',
                    specialty: 'General Medicine',
                    date: tomorrow,
                    time: '10:00',
                    duration: 30,
                    number_of_people: 1,
                    payment_method: 'online',
                    payment_status: 'paid',
                    status: 'confirmed',
                    qr_code: `QR-RES-${Date.now()}-2`,
                },
            }),
        ]);

        console.log(`✅ Created ${reservations.length} reservations`);

        // Create sample orders
        console.log('🛒 Creating sample orders...');
        const order = await prisma.order.create({
            data: {
                order_number: `ORD-${Date.now()}`,
                user_id: users[0].id,
                driver_id: drivers[0].id,
                address_id: users[0].addresses[0].id,
                order_type: 'delivery',
                payment_method: 'online',
                payment_status: 'paid',
                status: 'in_delivery',
                total_amount: 45000,
                discount_amount: 4500,
                platform_fee: 900,
                delivery_fee: 0,
                final_amount: 41400,
                qr_code: `QR-ORD-${Date.now()}`,
                order_items: {
                    create: [
                        {
                            business_id: businesses[0].id,
                            product_id: businesses[0].products[0].id,
                            quantity: 2,
                            unit_price: 15000,
                            total_price: 30000,
                        },
                        {
                            business_id: businesses[0].id,
                            product_id: businesses[0].products[2].id,
                            quantity: 3,
                            unit_price: 5000,
                            total_price: 15000,
                        },
                    ],
                },
            },
        });

        console.log('✅ Created sample order');

        // Create sample ratings
        console.log('⭐ Creating sample ratings...');
        await Promise.all([
            prisma.rating.create({
                data: {
                    user_id: users[0].id,
                    business_id: businesses[0].id,
                    rating: 5,
                    comment: 'Excellent food and service!',
                },
            }),
            prisma.rating.create({
                data: {
                    user_id: users[1].id,
                    driver_id: drivers[0].id,
                    rating: 5,
                    comment: 'Very fast and professional driver',
                },
            }),
        ]);

        console.log('✅ Created sample ratings');

        console.log('\n✅ Database seeding completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - Users: ${users.length}`);
        console.log(`   - Businesses: ${businesses.length}`);
        console.log(`   - Drivers: ${drivers.length}`);
        console.log(`   - Reservations: ${reservations.length}`);
        console.log(`   - Orders: 1`);
        console.log(`   - Ratings: 2`);
        console.log('\n🔑 Login credentials for all accounts:');
        console.log('   Password: password123');

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
            console.log('\n✅ Seed process completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Seed process failed:', error);
            process.exit(1);
        });
}

module.exports = { seed };
