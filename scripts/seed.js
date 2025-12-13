const { prisma } = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * Seed database with detailed sample data for all application sections
 */
async function seed() {
    try {
        console.log('🌱 Starting detailed database seeding...');

        // Clear existing data (Order matters due to foreign keys)
        console.log('🧹 Clearing existing data...');
        // Delete in reverse order of dependencies
        await prisma.notification.deleteMany();
        await prisma.rating.deleteMany();
        await prisma.cashierOperation.deleteMany();
        await prisma.qRCode.deleteMany();
        await prisma.transaction.deleteMany();
        await prisma.orderItem.deleteMany();
        await prisma.order.deleteMany();
        await prisma.reservation.deleteMany();
        await prisma.appointment.deleteMany();
        await prisma.product.deleteMany();
        await prisma.cashier.deleteMany();
        await prisma.business.deleteMany();
        await prisma.driver.deleteMany();
        await prisma.points.deleteMany();
        await prisma.wallet.deleteMany();
        await prisma.address.deleteMany();
        await prisma.subscription.deleteMany();
        await prisma.user.deleteMany();
        await prisma.admin.deleteMany();

        console.log('✨ Database cleared');

        // Hash password for all users
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);

        // ============================================
        // 1. ADMINS
        // ============================================
        console.log('🛡️ Creating admins...');
        const admins = await Promise.all([
            prisma.admin.create({
                data: {
                    full_name: 'Super Admin',
                    email: 'admin@coresy.com',
                    password_hash: hashedPassword,
                    role: 'super_admin',
                    is_active: true,
                }
            }),
            prisma.admin.create({
                data: {
                    full_name: 'Finance Manager',
                    email: 'finance@coresy.com',
                    password_hash: hashedPassword,
                    role: 'finance_admin',
                    is_active: true,
                }
            }),
            prisma.admin.create({
                data: {
                    full_name: 'Support Team',
                    email: 'support@coresy.com',
                    password_hash: hashedPassword,
                    role: 'support_admin',
                    is_active: true,
                }
            })
        ]);
        console.log(`✅ Created ${admins.length} admins`);

        // ============================================
        // 2. USERS & WALLETS & ADDRESSES
        // ============================================
        console.log('👤 Creating users...');
        const usersData = [
            { name: 'Ahmad Hassan', email: 'ahmad@example.com', phone: '+963911111111', city: 'Damascus', gov: 'DM' },
            { name: 'Sara Ali', email: 'sara@example.com', phone: '+963922222222', city: 'Aleppo', gov: 'HL' },
            { name: 'Rami Kabbani', email: 'rami@example.com', phone: '+963933333333', city: 'Homs', gov: 'HS' },
            { name: 'Nour Al-Zein', email: 'nour@example.com', phone: '+963944444444', city: 'Latakia', gov: 'LK' },
            { name: 'Omar Sy', email: 'omar@example.com', phone: '+963955555555', city: 'Damascus', gov: 'DM' },
        ];

        const users = await Promise.all(usersData.map((u, index) =>
            prisma.user.create({
                data: {
                    full_name: u.name,
                    email: u.email,
                    phone: u.phone,
                    password_hash: hashedPassword,
                    pass_id: `${u.gov}-00000${index + 1}`,
                    governorate_code: u.gov,
                    ai_assistant_name: 'CoreAI',
                    wallet_balance: 100000,
                    points: index * 50,
                    is_verified: true,
                    wallet: {
                        create: { balance: 100000 }
                    },
                    addresses: {
                        create: {
                            recipient_name: u.name,
                            area: 'City Center',
                            street: 'Main Street',
                            city: u.city,
                            phone: u.phone,
                            is_default: true,
                            latitude: 33.5138 + (index * 0.01),
                            longitude: 36.2765 + (index * 0.01),
                        }
                    }
                },
                include: { addresses: true } // Return addresses for later use
            })
        ));
        console.log(`✅ Created ${users.length} users`);

        // ============================================
        // 3. SUBSCRIPTIONS
        // ============================================
        console.log('🎟️ Creating subscriptions...');
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        await Promise.all([
            prisma.subscription.create({
                data: {
                    user_id: users[0].id,
                    app_type: 'pass',
                    start_date: new Date(),
                    end_date: nextMonth,
                    is_active: true,
                    discount_enabled: true
                }
            }),
            prisma.subscription.create({
                data: {
                    user_id: users[0].id,
                    app_type: 'care',
                    start_date: new Date(),
                    end_date: nextMonth,
                    is_active: true,
                    discount_enabled: true
                }
            }),
            prisma.subscription.create({
                data: {
                    user_id: users[1].id,
                    app_type: 'go',
                    start_date: new Date(),
                    end_date: nextMonth,
                    is_active: true,
                    discount_enabled: true
                }
            })
        ]);
        console.log('✅ Created 3 subscriptions');

        // ============================================
        // 4. BUSINESSES & PRODUCTS & APPOINTMENTS
        // ============================================
        console.log('🏢 Creating businesses...');

        // 4.1 Restaurant (PASS + GO)
        const restaurant = await prisma.business.create({
            data: {
                owner_email: 'rest_owner@example.com',
                password_hash: hashedPassword,
                business_name: 'Al-Sham Restaurant',
                business_type: 'restaurant',
                app_type: 'pass_go',
                has_reservations: true,
                has_delivery: true,
                address: 'Old Damascus',
                city: 'Damascus',
                governorate: 'Damascus',
                latitude: 33.5100,
                longitude: 36.2800,
                working_hours: { daily: "10:00 - 23:00" },
                rating_average: 4.5,
                rating_count: 120,
                products: {
                    create: [
                        { name: 'Kebab Mix', price: 45000, category: 'Main', description: 'Mixed meat platter' },
                        { name: 'Hummus', price: 12000, category: 'Appetizer', description: 'Creamy chickpea dip' },
                        { name: 'Falafel Plate', price: 15000, category: 'Appetizer', description: '6 pieces with tahini' },
                        { name: 'Cola', price: 5000, category: 'Drink', description: '330ml can' },
                    ]
                }
            },
            include: { products: true }
        });

        // 4.2 Cafe (PASS)
        const cafe = await prisma.business.create({
            data: {
                owner_email: 'cafe_owner@example.com',
                password_hash: hashedPassword,
                business_name: 'Morning Brew',
                business_type: 'cafe',
                app_type: 'pass',
                has_reservations: true,
                has_delivery: false,
                address: 'Malki Street',
                city: 'Damascus',
                governorate: 'Damascus',
                latitude: 33.5200,
                longitude: 36.2900,
                working_hours: { daily: "08:00 - 22:00" },
                rating_average: 4.8,
                rating_count: 55,
                products: {
                    create: [
                        { name: 'Latte', price: 12000, category: 'Coffee', description: 'Espresso with steamed milk' },
                        { name: 'Cheesecake', price: 18000, category: 'Dessert', description: 'Strawberry topping' },
                    ]
                }
            }
        });

        // 4.3 Clinic (CARE)
        const clinic = await prisma.business.create({
            data: {
                owner_email: 'clinic_owner@example.com',
                password_hash: hashedPassword,
                business_name: 'Healing Hands Clinic',
                business_type: 'clinic',
                app_type: 'care',
                has_reservations: true,
                has_delivery: false,
                address: 'Mazzeh Highway',
                city: 'Damascus',
                governorate: 'Damascus',
                latitude: 33.5000,
                longitude: 36.2700,
                working_hours: { daily: "09:00 - 17:00" },
                rating_average: 4.9,
                rating_count: 200,
                appointments: {
                    create: [
                        { service_name: 'General Consultation', duration: 30, price: 50000, date: nextMonth, time: "10:00" },
                        { service_name: 'Dental Checkup', duration: 45, price: 75000, date: nextMonth, time: "11:00" },
                        { service_name: 'Skin Care', duration: 60, price: 100000, date: nextMonth, time: "14:00" },
                    ]
                }
            },
            include: { appointments: true }
        });

        // 4.4 Supermarket (GO)
        const supermarket = await prisma.business.create({
            data: {
                owner_email: 'market_owner@example.com',
                password_hash: hashedPassword,
                business_name: 'Mega Mart',
                business_type: 'supermarket',
                app_type: 'go',
                has_reservations: false,
                has_delivery: true,
                address: 'Sabaa Bahrat',
                city: 'Aleppo',
                governorate: 'Aleppo',
                latitude: 36.2021,
                longitude: 37.1343,
                working_hours: { daily: "08:00 - 24:00" },
                rating_average: 4.2,
                rating_count: 30,
                products: {
                    create: [
                        { name: 'Milk 1L', price: 8000, category: 'Dairy', description: 'Full fat milk' },
                        { name: 'Bread Pack', price: 4000, category: 'Bakery', description: 'White bread' },
                        { name: 'Eggs (30)', price: 25000, category: 'Dairy', description: 'Fresh eggs' },
                        { name: 'Rice 1kg', price: 15000, category: 'Grains', description: 'Long grain rice' },
                    ]
                }
            },
            include: { products: true }
        });

        // 4.5 Beauty Center (CARE)
        const beauty = await prisma.business.create({
            data: {
                owner_email: 'beauty_owner@example.com',
                password_hash: hashedPassword,
                business_name: 'Glamour Salon',
                business_type: 'beauty_center',
                app_type: 'care',
                has_reservations: true,
                has_delivery: false,
                address: 'Shaalan',
                city: 'Damascus',
                governorate: 'Damascus',
                latitude: 33.5150,
                longitude: 36.2850,
                working_hours: { daily: "10:00 - 20:00" },
                rating_average: 4.6,
                rating_count: 88,
                appointments: {
                    create: [
                        { service_name: 'Haircut & Style', duration: 60, price: 80000, date: nextMonth, time: "12:00" },
                        { service_name: 'Manicure', duration: 40, price: 40000, date: nextMonth, time: "13:30" },
                    ]
                }
            },
            include: { appointments: true }
        });

        const businesses = [restaurant, cafe, clinic, supermarket, beauty];
        console.log(`✅ Created ${businesses.length} businesses with products/appointments`);

        // ============================================
        // 5. CASHIERS
        // ============================================
        console.log('💻 Creating cashiers...');
        await Promise.all(businesses.map((b, i) =>
            prisma.cashier.create({
                data: {
                    business_id: b.id,
                    full_name: `Cashier ${b.business_name}`,
                    email: `cashier${i + 1}@${b.business_name.split(' ')[0].toLowerCase()}.com`,
                    password_hash: hashedPassword,
                    is_active: true
                }
            })
        ));
        console.log(`✅ Created ${businesses.length} cashiers`);

        // ============================================
        // 6. DRIVERS
        // ============================================
        console.log('🛵 Creating drivers...');
        const driverData = [
            { name: 'Driver Bike', email: 'driver_bike@example.com', type: 'Motorcycle' },
            { name: 'Driver Car', email: 'driver_car@example.com', type: 'Car' },
            { name: 'Driver Van', email: 'driver_van@example.com', type: 'Van' },
        ];

        const drivers = await Promise.all(driverData.map((d, i) =>
            prisma.driver.create({
                data: {
                    full_name: d.name,
                    email: d.email,
                    phone: `+96398888888${i}`,
                    password_hash: hashedPassword,
                    vehicle_type: d.type,
                    earnings_cash: 25000,
                    earnings_online: 50000,
                    is_available: true,
                    current_latitude: 33.5138,
                    current_longitude: 36.2765,
                    rating_average: 4.5 + (i * 0.1),
                    rating_count: 20 + (i * 5)
                }
            })
        ));
        console.log(`✅ Created ${drivers.length} drivers`);

        // ============================================
        // 7. ORDERS
        // ============================================
        console.log('📦 Creating orders...');
        // 7.1 Completed Order (Restaurant)
        await prisma.order.create({
            data: {
                order_number: `ORD-${Date.now()}-1`,
                user_id: users[0].id,
                driver_id: drivers[0].id,
                address_id: users[0].addresses[0].id,
                order_type: 'delivery',
                payment_method: 'online',
                payment_status: 'paid',
                status: 'completed',
                total_amount: 60000,
                final_amount: 60000,
                order_items: {
                    create: [
                        { business_id: restaurant.id, product_id: restaurant.products[0].id, quantity: 1, unit_price: 45000, total_price: 45000 },
                        { business_id: restaurant.id, product_id: restaurant.products[2].id, quantity: 1, unit_price: 15000, total_price: 15000 },
                    ]
                }
            }
        });

        // 7.2 Active Order (Supermarket)
        await prisma.order.create({
            data: {
                order_number: `ORD-${Date.now()}-2`,
                user_id: users[1].id,
                driver_id: drivers[2].id, // Van
                address_id: users[1].addresses[0].id,
                order_type: 'delivery',
                payment_method: 'cash',
                payment_status: 'pending',
                status: 'in_delivery',
                total_amount: 58000,
                final_amount: 58000,
                order_items: {
                    create: [
                        { business_id: supermarket.id, product_id: supermarket.products[0].id, quantity: 2, unit_price: 8000, total_price: 16000 },
                        { business_id: supermarket.id, product_id: supermarket.products[2].id, quantity: 1, unit_price: 25000, total_price: 25000 },
                        { business_id: supermarket.id, product_id: supermarket.products[3].id, quantity: 1, unit_price: 15000, total_price: 17000 },
                    ]
                }
            }
        });

        // 7.3 Pickup Order (Restaurant)
        await prisma.order.create({
            data: {
                order_number: `ORD-${Date.now()}-3`,
                user_id: users[2].id,
                order_type: 'pickup',
                payment_method: 'wallet',
                payment_status: 'paid',
                status: 'preparing',
                total_amount: 15000,
                final_amount: 15000,
                order_items: {
                    create: [
                        { business_id: restaurant.id, product_id: restaurant.products[2].id, quantity: 1, unit_price: 15000, total_price: 15000 },
                    ]
                }
            }
        });
        console.log('✅ Created 3 diverse orders');

        // ============================================
        // 8. RESERVATIONS
        // ============================================
        console.log('📅 Creating reservations...');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        // 8.1 Table Reservation
        await prisma.reservation.create({
            data: {
                user_id: users[3].id,
                business_id: restaurant.id,
                reservation_type: 'table',
                date: tomorrow,
                time: '20:00',
                duration: 90,
                number_of_people: 4,
                status: 'confirmed',
                payment_method: 'cash',
                qr_code: `RES-TBL-${Date.now()}`,
            }
        });

        // 8.2 Medical Appointment
        await prisma.reservation.create({
            data: {
                user_id: users[0].id,
                business_id: clinic.id,
                reservation_type: 'medical',
                specialty: 'General Medicine',
                date: tomorrow,
                time: '10:00',
                duration: 30,
                number_of_people: 1,
                status: 'pending',
                payment_method: 'online',
                qr_code: `RES-MED-${Date.now()}`,
                final_amount: 50000
            }
        });
        console.log('✅ Created reservations');

        // ============================================
        // 9. TRANSACTIONS
        // ============================================
        console.log('💸 Creating transaction history...');
        await Promise.all([
            // Wallet Top-up
            prisma.transaction.create({
                data: {
                    user_id: users[0].id,
                    amount: 50000,
                    transaction_type: 'wallet_topup',
                    reference_type: 'wallet',
                    reference_id: users[0].id,
                    payment_method: 'cash',
                    status: 'completed',
                    description: 'Initial wallet charge'
                }
            }),
            // Order Payment
            prisma.transaction.create({
                data: {
                    user_id: users[0].id,
                    business_id: restaurant.id,
                    amount: 60000,
                    transaction_type: 'payment',
                    reference_type: 'order',
                    reference_id: `ORD-REF-001`,
                    payment_method: 'online',
                    status: 'completed',
                    description: 'Order payment'
                }
            })
        ]);
        console.log('✅ Created transaction history');

        // ============================================
        // 10. NOTIFICATIONS
        // ============================================
        console.log('🔔 Creating notifications...');
        await prisma.notification.create({
            data: {
                user_id: users[0].id,
                type: 'system',
                title: 'Welcome to CoreSY',
                message: 'Thank you for joining our platform!',
                is_read: false
            }
        });

        console.log('\n✅✅✅ Detailed Database Seeding Completed Successfully! ✅✅✅');
        console.log('\n🔐 Credentials Summary:');
        console.log('   Default Password: password123');
        console.log('   Super Admin: admin@coresy.com');
        console.log('   Users: ahmad@example.com (Pass+Care Sub), sara@example.com (Go Sub)');
        console.log('   Businesses:');
        console.log('     - Restaurant: rest_owner@example.com (Pass+Go)');
        console.log('     - Cafe: cafe_owner@example.com (Pass)');
        console.log('     - Clinic: clinic_owner@example.com (Care)');
        console.log('     - Supermarket: market_owner@example.com (Go)');
        console.log('     - Beauty: beauty_owner@example.com (Care)');
        console.log('   Drivers: driver_bike@example.com, driver_car@example.com');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run seed if executed directly
if (require.main === module) {
    seed();
}

module.exports = { seed };
