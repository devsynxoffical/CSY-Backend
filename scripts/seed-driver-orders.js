// Load environment variables FIRST
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { generateOrderNumber } = require('../utils');

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
 * Seed Driver Orders - Creates incoming and active orders for driver app
 * This script creates orders with different statuses:
 * - Incoming orders (waiting_driver status, no driver assigned)
 * - Active orders (assigned to Ahmed Hassan driver)
 */
async function seedDriverOrders() {
    console.log('🚀 Seeding Driver Orders...\n');

    try {
        // Test database connection
        console.log('🔌 Testing database connection...');
        try {
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
                console.error('⚠️  Railway databases are NOT accessible from local machines');
                console.error('💡 Run on Railway: railway run npm run db:seed:driver-orders\n');
            }
            throw connectionError;
        }

        // Get Ahmed Hassan driver
        console.log('🛵 Finding Ahmed Hassan driver...');
        const driver = await prisma.driver.findFirst({
            where: {
                email: 'ahmed.hassan.driver@example.com'
            }
        });

        if (!driver) {
            console.error('❌ Ahmed Hassan driver not found!');
            console.error('💡 Please run the driver seed script first: npm run db:seed:drivers-cashiers');
            throw new Error('Driver not found');
        }
        console.log(`✅ Found driver: ${driver.full_name} (${driver.id})\n`);

        // Get or create a test user
        console.log('👤 Getting/Creating test user...');
        let user = await prisma.user.findFirst({
            where: { email: { contains: '@example.com' } }
        });

        if (!user) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('password123', 12);
            user = await prisma.user.create({
                data: {
                    full_name: 'Test User',
                    email: 'test.user@example.com',
                    phone: '+201099999999',
                    password_hash: hashedPassword,
                    pass_id: 'DM-000001',
                    governorate_code: 'DM',
                    is_active: true,
                    is_verified: true
                }
            });
            console.log('✅ Created test user');
        } else {
            console.log(`✅ Using existing user: ${user.full_name}`);
        }
        console.log('');

        // Get or create user address
        console.log('📍 Getting/Creating user address...');
        let address = await prisma.address.findFirst({
            where: { user_id: user.id }
        });

        if (!address) {
            address = await prisma.address.create({
                data: {
                    user_id: user.id,
                    recipient_name: user.full_name,
                    area: 'Downtown Cairo',
                    street: 'Tahrir Square, Building 15',
                    city: 'Cairo',
                    floor: '3rd Floor',
                    phone: user.phone,
                    latitude: 30.0444,
                    longitude: 31.2357,
                    is_default: true
                }
            });
            console.log('✅ Created user address');
        } else {
            console.log(`✅ Using existing address`);
        }
        console.log('');

        // Get active businesses
        console.log('🏢 Getting active businesses...');
        const businesses = await prisma.business.findMany({
            where: { is_active: true },
            take: 5
        });

        if (businesses.length === 0) {
            console.error('❌ No active businesses found!');
            console.error('💡 Please seed businesses first');
            throw new Error('No businesses found');
        }
        console.log(`✅ Found ${businesses.length} businesses\n`);

        // Get products from businesses
        console.log('📦 Getting products...');
        const products = await prisma.product.findMany({
            where: {
                business_id: { in: businesses.map(b => b.id) },
                is_available: true
            },
            take: 20
        });

        if (products.length === 0) {
            console.error('❌ No products found!');
            console.error('💡 Please seed products first');
            throw new Error('No products found');
        }
        console.log(`✅ Found ${products.length} products\n`);

        // Group products by business
        const productsByBusiness = {};
        products.forEach(product => {
            if (!productsByBusiness[product.business_id]) {
                productsByBusiness[product.business_id] = [];
            }
            productsByBusiness[product.business_id].push(product);
        });

        // ============================================
        // CREATE INCOMING ORDERS (waiting_driver)
        // ============================================
        console.log('📥 Creating incoming orders (waiting_driver status)...\n');

        const incomingOrdersData = [
            {
                business: businesses[0],
                products: productsByBusiness[businesses[0].id]?.slice(0, 2) || [products[0]],
                payment_method: 'cash',
                delivery_fee: 25.00,
                description: 'Fast food order from downtown'
            },
            {
                business: businesses[1] || businesses[0],
                products: productsByBusiness[businesses[1]?.id || businesses[0].id]?.slice(0, 1) || [products[1]],
                payment_method: 'online',
                delivery_fee: 30.00,
                description: 'Restaurant order ready for pickup'
            },
            {
                business: businesses[0],
                products: productsByBusiness[businesses[0].id]?.slice(0, 3) || [products[0]],
                payment_method: 'cash',
                delivery_fee: 20.00,
                description: 'Multiple items from cafe'
            },
            {
                business: businesses[2] || businesses[0],
                products: productsByBusiness[businesses[2]?.id || businesses[0].id]?.slice(0, 2) || [products[2]],
                payment_method: 'online',
                delivery_fee: 35.00,
                description: 'Dessert shop order'
            },
            {
                business: businesses[0],
                products: productsByBusiness[businesses[0].id]?.slice(0, 1) || [products[0]],
                payment_method: 'cash',
                delivery_fee: 25.00,
                description: 'Quick delivery needed'
            }
        ];

        const createdIncomingOrders = [];
        for (const orderData of incomingOrdersData) {
            try {
                const orderItems = orderData.products.map(product => ({
                    product_id: product.id,
                    business_id: product.business_id,
                    quantity: Math.floor(Math.random() * 3) + 1, // 1-3 items
                    unit_price: Number(product.price),
                    total_price: Number(product.price) * (Math.floor(Math.random() * 3) + 1),
                    is_available: true
                }));

                const totalAmount = orderItems.reduce((sum, item) => sum + Number(item.total_price), 0);
                const platformFee = totalAmount * 0.02; // 2% platform fee
                const finalAmount = totalAmount + orderData.delivery_fee + platformFee;

                const order = await prisma.order.create({
                    data: {
                        order_number: generateOrderNumber(),
                        user_id: user.id,
                        address_id: address.id,
                        order_type: 'delivery',
                        payment_method: orderData.payment_method,
                        payment_status: orderData.payment_method === 'online' ? 'paid' : 'pending',
                        status: 'waiting_driver', // INCOMING ORDER - No driver assigned
                        delivery_address: {
                            recipient_name: address.recipient_name,
                            area: address.area,
                            street: address.street,
                            city: address.city,
                            floor: address.floor,
                            phone: address.phone,
                            latitude: Number(address.latitude),
                            longitude: Number(address.longitude)
                        },
                        total_amount: totalAmount,
                        discount_amount: 0,
                        platform_fee: platformFee,
                        delivery_fee: orderData.delivery_fee,
                        final_amount: finalAmount,
                        order_items: {
                            create: orderItems
                        }
                    },
                    include: {
                        order_items: {
                            include: {
                                business: {
                                    select: {
                                        id: true,
                                        business_name: true,
                                        address: true,
                                        latitude: true,
                                        longitude: true
                                    }
                                }
                            }
                        }
                    }
                });

                createdIncomingOrders.push(order);
                console.log(`  ✅ Created incoming order: ${order.order_number} (${order.final_amount} EGP)`);
            } catch (error) {
                console.error(`  ❌ Failed to create incoming order:`, error.message);
            }
        }

        console.log(`\n✅ Created ${createdIncomingOrders.length} incoming orders\n`);

        // ============================================
        // CREATE ACTIVE ORDERS (assigned to driver)
        // ============================================
        console.log('📦 Creating active orders (assigned to Ahmed Hassan)...\n');

        const activeOrdersData = [
            {
                business: businesses[0],
                products: productsByBusiness[businesses[0].id]?.slice(0, 2) || [products[0]],
                payment_method: 'cash',
                delivery_fee: 25.00,
                status: 'in_delivery',
                description: 'Currently delivering - Fast food order'
            },
            {
                business: businesses[1] || businesses[0],
                products: productsByBusiness[businesses[1]?.id || businesses[0].id]?.slice(0, 1) || [products[1]],
                payment_method: 'online',
                delivery_fee: 30.00,
                status: 'in_delivery',
                description: 'Currently delivering - Restaurant order'
            },
            {
                business: businesses[0],
                products: productsByBusiness[businesses[0].id]?.slice(0, 3) || [products[0]],
                payment_method: 'cash',
                delivery_fee: 20.00,
                status: 'accepted',
                description: 'Order accepted, preparing for pickup'
            }
        ];

        const createdActiveOrders = [];
        for (const orderData of activeOrdersData) {
            try {
                const orderItems = orderData.products.map(product => ({
                    product_id: product.id,
                    business_id: product.business_id,
                    quantity: Math.floor(Math.random() * 3) + 1,
                    unit_price: Number(product.price),
                    total_price: Number(product.price) * (Math.floor(Math.random() * 3) + 1),
                    is_available: true
                }));

                const totalAmount = orderItems.reduce((sum, item) => sum + Number(item.total_price), 0);
                const platformFee = totalAmount * 0.02;
                const finalAmount = totalAmount + orderData.delivery_fee + platformFee;

                const order = await prisma.order.create({
                    data: {
                        order_number: generateOrderNumber(),
                        user_id: user.id,
                        driver_id: driver.id, // ASSIGNED TO AHMED HASSAN
                        address_id: address.id,
                        order_type: 'delivery',
                        payment_method: orderData.payment_method,
                        payment_status: orderData.payment_method === 'online' ? 'paid' : 'pending',
                        status: orderData.status, // in_delivery or accepted
                        delivery_address: {
                            recipient_name: address.recipient_name,
                            area: address.area,
                            street: address.street,
                            city: address.city,
                            floor: address.floor,
                            phone: address.phone,
                            latitude: Number(address.latitude),
                            longitude: Number(address.longitude)
                        },
                        total_amount: totalAmount,
                        discount_amount: 0,
                        platform_fee: platformFee,
                        delivery_fee: orderData.delivery_fee,
                        final_amount: finalAmount,
                        order_items: {
                            create: orderItems
                        }
                    },
                    include: {
                        order_items: {
                            include: {
                                business: {
                                    select: {
                                        id: true,
                                        business_name: true,
                                        address: true,
                                        latitude: true,
                                        longitude: true
                                    }
                                }
                            }
                        }
                    }
                });

                createdActiveOrders.push(order);
                console.log(`  ✅ Created active order: ${order.order_number} (${order.status}, ${order.final_amount} EGP)`);
            } catch (error) {
                console.error(`  ❌ Failed to create active order:`, error.message);
            }
        }

        console.log(`\n✅ Created ${createdActiveOrders.length} active orders\n`);

        // ============================================
        // SUMMARY
        // ============================================
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 DRIVER ORDERS SEEDING SUMMARY');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        console.log(`🛵 Driver: ${driver.full_name}`);
        console.log(`   Email: ${driver.email}`);
        console.log(`   Phone: ${driver.phone}\n`);

        console.log(`📥 Incoming Orders (waiting_driver): ${createdIncomingOrders.length}`);
        createdIncomingOrders.forEach((order, index) => {
            console.log(`   ${index + 1}. ${order.order_number} - ${order.final_amount} EGP (${order.payment_method})`);
        });

        console.log(`\n📦 Active Orders (assigned to driver): ${createdActiveOrders.length}`);
        createdActiveOrders.forEach((order, index) => {
            console.log(`   ${index + 1}. ${order.order_number} - ${order.status} - ${order.final_amount} EGP (${order.payment_method})`);
        });

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Driver orders seeded successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('💡 When Ahmed Hassan logs into the driver app, he will see:');
        console.log('   - Incoming orders: Orders waiting for driver assignment');
        console.log('   - Active orders: Orders assigned to him (in_delivery/accepted)\n');

    } catch (error) {
        console.error('\n❌ Failed to seed driver orders:', error.message);
        
        if (error.code === 'P1001' || error.message.includes('Can\'t reach database server')) {
            console.error('\n💡 This is a database connection issue.');
            console.error('   Railway databases cannot be accessed from local machines.');
            console.error('   Please use Railway CLI to run this script:\n');
            console.error('   railway run npm run db:seed:driver-orders\n');
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
    seedDriverOrders()
        .then(() => {
            console.log('\n✅ Done!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Failed:', error);
            process.exit(1);
        });
}

module.exports = { seedDriverOrders };

