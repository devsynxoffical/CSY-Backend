// Load environment variables
require('dotenv').config();

const { prisma } = require('../config/database');
const bcrypt = require('bcryptjs');

async function seed() {
    console.log('🌱 Seeding database with dashboard test data...\n');

    try {
        const hashedPassword = await bcrypt.hash('password123', 12);

        // ============================================
        // 1. CREATE USERS
        // ============================================
        console.log('📝 Creating users...');
        
        const users = [];
        
        // Main test user - Check if exists by email or phone, then update or create
        let user1 = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: 'user@test.com' },
                    { phone: '+201234567890' }
                ]
            }
        });

        if (user1) {
            // Update existing user
            user1 = await prisma.user.update({
                where: { id: user1.id },
                data: {
                    full_name: 'Ahmed Ali',
                    email: 'user@test.com',
                    phone: '+201234567890',
                    password_hash: hashedPassword,
                    pass_id: 'DM-100001',
                    governorate_code: 'DM',
                    wallet_balance: 25000,
                    points: 150,
                    is_active: true,
                    is_verified: true,
                    ai_assistant_name: 'CSY Assistant'
                }
            });
            console.log('✅ Updated existing user:', user1.email);
        } else {
            // Create new user
            user1 = await prisma.user.create({
                data: {
                    full_name: 'Ahmed Ali',
                    email: 'user@test.com',
                    phone: '+201234567890',
                    password_hash: hashedPassword,
                    pass_id: 'DM-100001',
                    governorate_code: 'DM',
                    wallet_balance: 25000, // 250 EGP
                    points: 150,
                    is_active: true,
                    is_verified: true,
                    ai_assistant_name: 'CSY Assistant'
                }
            });
            console.log('✅ Created user:', user1.email);
        }
        users.push(user1);

        // Additional users
        let user2 = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: 'sara@test.com' },
                    { phone: '+201234567891' }
                ]
            }
        });

        if (user2) {
            user2 = await prisma.user.update({
                where: { id: user2.id },
                data: {
                    full_name: 'Sara Mohamed',
                    email: 'sara@test.com',
                    phone: '+201234567891',
                    password_hash: hashedPassword,
                    pass_id: 'DM-100002',
                    governorate_code: 'DM',
                    wallet_balance: 15000,
                    points: 80,
                    is_active: true,
                    is_verified: true
                }
            });
            console.log('✅ Updated existing user:', user2.email);
        } else {
            user2 = await prisma.user.create({
                data: {
                    full_name: 'Sara Mohamed',
                    email: 'sara@test.com',
                    phone: '+201234567891',
                    password_hash: hashedPassword,
                    pass_id: 'DM-100002',
                    governorate_code: 'DM',
                    wallet_balance: 15000,
                    points: 80,
                    is_active: true,
                    is_verified: true
                }
            });
            console.log('✅ Created user:', user2.email);
        }
        users.push(user2);

        // ============================================
        // 2. CREATE BUSINESSES
        // ============================================
        console.log('\n🏢 Creating businesses...');
        
        const businesses = [];
        
        // Business 1
        let business1 = await prisma.business.findUnique({
            where: { owner_email: 'restaurant@test.com' }
        });

        if (business1) {
            business1 = await prisma.business.update({
                where: { id: business1.id },
                data: {
                    password_hash: hashedPassword,
                    business_name: 'Delicious Restaurant',
                    business_type: 'restaurant',
                    app_type: 'pass',
                    address: '123 Main Street, Downtown',
                    city: 'Damascus',
                    governorate: 'Damascus',
                    latitude: 33.5138,
                    longitude: 36.2765,
                    phone: '+201234567900',
                    has_reservations: true,
                    has_delivery: true,
                    rating_average: 4.5,
                    rating_count: 25,
                    is_active: true
                }
            });
            console.log('✅ Updated business:', business1.business_name);
        } else {
            business1 = await prisma.business.create({
                data: {
                    owner_email: 'restaurant@test.com',
                    password_hash: hashedPassword,
                    business_name: 'Delicious Restaurant',
                    business_type: 'restaurant',
                    app_type: 'pass',
                    address: '123 Main Street, Downtown',
                    city: 'Damascus',
                    governorate: 'Damascus',
                    latitude: 33.5138,
                    longitude: 36.2765,
                    phone: '+201234567900',
                    has_reservations: true,
                    has_delivery: true,
                    rating_average: 4.5,
                    rating_count: 25,
                    is_active: true
                }
            });
            console.log('✅ Created business:', business1.business_name);
        }
        businesses.push(business1);

        // Business 2
        let business2 = await prisma.business.findUnique({
            where: { owner_email: 'cafe@test.com' }
        });

        if (business2) {
            business2 = await prisma.business.update({
                where: { id: business2.id },
                data: {
                    password_hash: hashedPassword,
                    business_name: 'Coffee House',
                    business_type: 'cafe',
                    app_type: 'pass',
                    address: '456 Coffee Street',
                    city: 'Damascus',
                    governorate: 'Damascus',
                    latitude: 33.5200,
                    longitude: 36.2800,
                    phone: '+201234567901',
                    has_reservations: true,
                    has_delivery: false,
                    rating_average: 4.2,
                    rating_count: 18,
                    is_active: true
                }
            });
            console.log('✅ Updated business:', business2.business_name);
        } else {
            business2 = await prisma.business.create({
                data: {
                    owner_email: 'cafe@test.com',
                    password_hash: hashedPassword,
                    business_name: 'Coffee House',
                    business_type: 'cafe',
                    app_type: 'pass',
                    address: '456 Coffee Street',
                    city: 'Damascus',
                    governorate: 'Damascus',
                    latitude: 33.5200,
                    longitude: 36.2800,
                    phone: '+201234567901',
                    has_reservations: true,
                    has_delivery: false,
                    rating_average: 4.2,
                    rating_count: 18,
                    is_active: true
                }
            });
            console.log('✅ Created business:', business2.business_name);
        }
        businesses.push(business2);

        // Business 3
        let business3 = await prisma.business.findUnique({
            where: { owner_email: 'clinic@test.com' }
        });

        if (business3) {
            business3 = await prisma.business.update({
                where: { id: business3.id },
                data: {
                    password_hash: hashedPassword,
                    business_name: 'Health Clinic',
                    business_type: 'clinic',
                    app_type: 'care',
                    address: '789 Medical Street',
                    city: 'Damascus',
                    governorate: 'Damascus',
                    latitude: 33.5100,
                    longitude: 36.2750,
                    phone: '+201234567902',
                    has_reservations: true,
                    has_delivery: false,
                    rating_average: 4.8,
                    rating_count: 12,
                    is_active: true
                }
            });
            console.log('✅ Updated business:', business3.business_name);
        } else {
            business3 = await prisma.business.create({
                data: {
                    owner_email: 'clinic@test.com',
                    password_hash: hashedPassword,
                    business_name: 'Health Clinic',
                    business_type: 'clinic',
                    app_type: 'care',
                    address: '789 Medical Street',
                    city: 'Damascus',
                    governorate: 'Damascus',
                    latitude: 33.5100,
                    longitude: 36.2750,
                    phone: '+201234567902',
                    has_reservations: true,
                    has_delivery: false,
                    rating_average: 4.8,
                    rating_count: 12,
                    is_active: true
                }
            });
            console.log('✅ Created business:', business3.business_name);
        }
        businesses.push(business3);

        // ============================================
        // 3. CREATE PRODUCTS
        // ============================================
        console.log('\n🍕 Creating products...');
        
        const products = [];
        
        const product1 = await prisma.product.create({
            data: {
                business_id: business1.id,
                name: 'Margherita Pizza',
                description: 'Classic pizza with tomato and mozzarella',
                ingredients: 'Tomato sauce, mozzarella cheese, basil',
                price: 12000, // 120 EGP
                category: 'Pizza',
                is_available: true
            }
        });
        products.push(product1);
        console.log('✅ Created product:', product1.name);

        const product2 = await prisma.product.create({
            data: {
                business_id: business1.id,
                name: 'Chicken Burger',
                description: 'Juicy chicken burger with fries',
                price: 8000,
                category: 'Burgers',
                is_available: true
            }
        });
        products.push(product2);

        const product3 = await prisma.product.create({
            data: {
                business_id: business1.id,
                name: 'Caesar Salad',
                description: 'Fresh caesar salad',
                price: 6000,
                category: 'Salads',
                is_available: true
            }
        });
        products.push(product3);

        const product4 = await prisma.product.create({
            data: {
                business_id: business2.id,
                name: 'Cappuccino',
                description: 'Hot cappuccino',
                price: 5000,
                category: 'Hot Drinks',
                is_available: true
            }
        });
        products.push(product4);

        // ============================================
        // 4. CREATE ADDRESSES
        // ============================================
        console.log('\n📍 Creating addresses...');
        
        const address1 = await prisma.address.create({
            data: {
                user_id: user1.id,
                recipient_name: 'Ahmed Ali',
                area: 'Nasr City',
                street: '123 Main Street',
                city: 'Damascus',
                phone: '+201234567890',
                latitude: 33.5140,
                longitude: 36.2770,
                is_default: true
            }
        });
        console.log('✅ Created address:', address1.area);

        const address2 = await prisma.address.create({
            data: {
                user_id: user1.id,
                recipient_name: 'Ahmed Ali',
                area: 'Mazzeh',
                street: '456 Secondary Street',
                city: 'Damascus',
                phone: '+201234567890',
                latitude: 33.5150,
                longitude: 36.2780,
                is_default: false
            }
        });

        // ============================================
        // 5. CREATE ORDERS
        // ============================================
        console.log('\n📦 Creating orders...');
        
        const orders = [];
        const orderStatuses = ['completed', 'in_delivery', 'preparing', 'accepted', 'pending'];
        const paymentMethods = ['cash', 'online'];
        
        // Create orders with different statuses
        for (let i = 0; i < 10; i++) {
            const status = orderStatuses[i % orderStatuses.length];
            const paymentMethod = paymentMethods[i % paymentMethods.length];
            const daysAgo = Math.floor(i / 2);
            const createdAt = new Date();
            createdAt.setDate(createdAt.getDate() - daysAgo);
            
            const order = await prisma.order.create({
                data: {
                    order_number: `ORD-2024${String(1000 + i).padStart(4, '0')}`,
                    user_id: user1.id,
                    address_id: address1.id,
                    order_type: 'delivery',
                    payment_method: paymentMethod,
                    payment_status: status === 'completed' ? 'paid' : 'pending',
                    status: status,
                    delivery_address: {
                        name: 'Ahmed Ali',
                        phone: '+201234567890',
                        street: '123 Main Street',
                        city: 'Damascus',
                        latitude: 33.5140,
                        longitude: 36.2770
                    },
                    total_amount: 12000 + (i * 1000),
                    discount_amount: 0,
                    platform_fee: 500,
                    delivery_fee: 1500,
                    final_amount: 14000 + (i * 1000),
                    created_at: createdAt,
                    updated_at: createdAt
                }
            });
            orders.push(order);

            // Create order items
            await prisma.orderItem.create({
                data: {
                    order_id: order.id,
                    business_id: business1.id,
                    product_id: products[i % products.length].id,
                    quantity: 1 + (i % 3),
                    unit_price: products[i % products.length].price,
                    total_price: products[i % products.length].price * (1 + (i % 3))
                }
            });
        }
        console.log(`✅ Created ${orders.length} orders`);

        // ============================================
        // 6. CREATE RESERVATIONS
        // ============================================
        console.log('\n📅 Creating reservations...');
        
        const reservations = [];
        const reservationTypes = ['table', 'activity', 'medical', 'beauty'];
        const reservationStatuses = ['confirmed', 'pending', 'completed', 'cancelled'];
        
        for (let i = 0; i < 8; i++) {
            const type = reservationTypes[i % reservationTypes.length];
            const status = reservationStatuses[i % reservationStatuses.length];
            const daysAgo = Math.floor(i / 2);
            const date = new Date();
            date.setDate(date.getDate() + daysAgo);
            
            const reservation = await prisma.reservation.create({
                data: {
                    user_id: user1.id,
                    business_id: type === 'medical' ? business3.id : business1.id,
                    reservation_type: type,
                    date: date,
                    time: `${10 + (i % 12)}:${(i % 2) * 30}`.padStart(5, '0'),
                    duration: 60 + (i % 3) * 30,
                    number_of_people: 1 + (i % 4),
                    payment_method: i % 2 === 0 ? 'cash' : 'online',
                    payment_status: status === 'confirmed' ? 'paid' : 'pending',
                    status: status,
                    total_amount: 50000 + (i * 5000),
                    discount_amount: 5000 + (i * 500),
                    final_amount: 45000 + (i * 4500),
                    qr_code: `QR-RES-${Date.now()}-${i}`,
                    notes: i % 2 === 0 ? 'Window seat preferred' : null,
                    specialty: type === 'medical' ? 'Cardiology' : null
                }
            });
            reservations.push(reservation);
        }
        console.log(`✅ Created ${reservations.length} reservations`);

        // ============================================
        // 7. CREATE TRANSACTIONS
        // ============================================
        console.log('\n💳 Creating transactions...');
        
        const transactions = [];
        
        // Wallet top-up transactions
        for (let i = 0; i < 5; i++) {
            const amount = 10000 + (i * 5000); // 100-300 EGP
            const createdAt = new Date();
            createdAt.setDate(createdAt.getDate() - (10 - i));
            
            const transaction = await prisma.transaction.create({
                data: {
                    user_id: user1.id,
                    transaction_type: 'wallet_topup',
                    reference_type: 'wallet',
                    reference_id: user1.id,
                    amount: amount,
                    payment_method: 'online',
                    status: 'completed',
                    description: `Wallet top-up via online payment`,
                    created_at: createdAt
                }
            });
            transactions.push(transaction);
        }

        // Order payment transactions
        for (let i = 0; i < 5; i++) {
            if (orders[i] && orders[i].payment_status === 'paid') {
                const transaction = await prisma.transaction.create({
                    data: {
                        user_id: user1.id,
                        transaction_type: 'payment',
                        reference_type: 'order',
                        reference_id: orders[i].id,
                        amount: orders[i].final_amount,
                        payment_method: orders[i].payment_method,
                        status: 'completed',
                        description: `Payment for order ${orders[i].order_number}`,
                        created_at: orders[i].created_at
                    }
                });
                transactions.push(transaction);
            }
        }
        console.log(`✅ Created ${transactions.length} transactions`);

        // ============================================
        // 8. CREATE POINTS HISTORY
        // ============================================
        console.log('\n⭐ Creating points history...');
        
        const points = [];
        
        for (let i = 0; i < 10; i++) {
            const pointsAmount = 10 + (i % 5) * 5;
            const createdAt = new Date();
            createdAt.setDate(createdAt.getDate() - (10 - i));
            
            const point = await prisma.points.create({
                data: {
                    user_id: user1.id,
                    points: pointsAmount,
                    transaction_type: i % 2 === 0 ? 'earned' : 'spent',
                    reference_type: i % 2 === 0 ? 'order' : 'redemption',
                    reference_id: i % 2 === 0 && orders[i] ? orders[i].id : user1.id,
                    description: i % 2 === 0 
                        ? `Earned ${pointsAmount} points from order`
                        : `Redeemed ${pointsAmount} points`,
                    created_at: createdAt
                }
            });
            points.push(point);
        }
        console.log(`✅ Created ${points.length} points records`);

        // ============================================
        // 9. CREATE RATINGS
        // ============================================
        console.log('\n⭐ Creating ratings...');
        
        const ratings = [];
        
        for (let i = 0; i < 5; i++) {
            if (orders[i] && orders[i].status === 'completed') {
                const rating = await prisma.rating.create({
                    data: {
                        user_id: user1.id,
                        business_id: business1.id,
                        order_id: orders[i].id,
                        stars: 4 + (i % 2),
                        comment: i % 2 === 0 ? 'Great food and fast delivery!' : 'Good service',
                        created_at: orders[i].created_at
                    }
                });
                ratings.push(rating);
            }
        }
        console.log(`✅ Created ${ratings.length} ratings`);

        // ============================================
        // SUMMARY
        // ============================================
        console.log('\n✨ Seeding completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   👤 Users: ${users.length}`);
        console.log(`   🏢 Businesses: ${businesses.length}`);
        console.log(`   🍕 Products: ${products.length}`);
        console.log(`   📍 Addresses: 2`);
        console.log(`   📦 Orders: ${orders.length}`);
        console.log(`   📅 Reservations: ${reservations.length}`);
        console.log(`   💳 Transactions: ${transactions.length}`);
        console.log(`   ⭐ Points Records: ${points.length}`);
        console.log(`   ⭐ Ratings: ${ratings.length}`);
        
        console.log('\n🔑 Test Credentials:');
        console.log('   User: user@test.com / password123');
        console.log('   Business: restaurant@test.com / password123');
        console.log('   Business: cafe@test.com / password123');
        console.log('   Business: clinic@test.com / password123');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run seed
seed()
    .then(() => {
        console.log('\n✅ Database seeding completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    });

