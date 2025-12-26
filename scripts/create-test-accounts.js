// Load environment variables
require('dotenv').config();

const { prisma } = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * Create test accounts for User, Business, Driver and Cashier
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

        // Create or update test user
        console.log('👤 Creating test user...');
        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: 'user@example.com' },
                    { phone: '+201234567890' }
                ]
            },
            include: { wallet: true }
        });

        if (user) {
            // Update existing user
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    email: 'user@example.com',
                    phone: '+201234567890',
                    password_hash: hashedPassword,
                    is_active: true,
                    is_verified: true,
                    full_name: 'Test User',
                    pass_id: 'DM-100001',
                    governorate_code: 'DM'
                },
                include: { wallet: true }
            });
            console.log('✅ User updated:', user.email);
        } else {
            // Create new user
            user = await prisma.user.create({
                data: {
                    full_name: 'Test User',
                    email: 'user@example.com',
                    phone: '+201234567890',
                    password_hash: hashedPassword,
                    pass_id: 'DM-100001',
                    governorate_code: 'DM',
                    is_active: true,
                    is_verified: true,
                    wallet: {
                        create: {
                            balance: 1000
                        }
                    }
                },
                include: {
                    wallet: true
                }
            });
            console.log('✅ User created:', user.email);
        }

        // Create or update test driver
        console.log('🛵 Creating test driver...');
        let driver = await prisma.driver.findFirst({
            where: {
                OR: [
                    { email: 'driver@example.com' },
                    { phone: '+201234567891' }
                ]
            }
        });

        if (driver) {
            // Update existing driver
            driver = await prisma.driver.update({
                where: { id: driver.id },
                data: {
                    email: 'driver@example.com',
                    phone: '+201234567891',
                    password_hash: hashedPassword,
                    is_active: true,
                    is_available: true,
                    full_name: 'Test Driver',
                    vehicle_type: 'motorcycle',
                    earnings_cash: 0,
                    earnings_online: 0,
                    platform_fees_owed: 0
                }
            });
            console.log('✅ Driver updated:', driver.email);
        } else {
            // Create new driver
            driver = await prisma.driver.create({
                data: {
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
            console.log('✅ Driver created:', driver.email);
        }

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
                password_hash: hashedPassword,
                is_active: true
            }
        });
        console.log('✅ Cashier created/updated:', cashier.email);

        // Create test products for the business (if they don't exist)
        console.log('\n🍕 Creating test products...');
        const productCount = await prisma.product.count({
            where: { business_id: business.id }
        });
        
        if (productCount === 0) {
            await Promise.all([
                prisma.product.create({
                    data: {
                        business_id: business.id,
                        name: 'Cheese Burger',
                        description: 'Delicious cheese burger',
                        ingredients: 'Beef, Cheese, Bun',
                        image_url: 'https://example.com/burger.jpg',
                        price: 15000,
                        category: 'Burgers',
                        is_available: true
                    }
                }),
                prisma.product.create({
                    data: {
                        business_id: business.id,
                        name: 'Margherita Pizza',
                        description: 'Classic pizza with tomato sauce and mozzarella',
                        price: 20000,
                        category: 'Pizza',
                        is_available: true
                    }
                }),
                prisma.product.create({
                    data: {
                        business_id: business.id,
                        name: 'Caesar Salad',
                        description: 'Fresh romaine lettuce with Caesar dressing',
                        price: 12000,
                        category: 'Salads',
                        is_available: true
                    }
                })
            ]);
            console.log('✅ Created 3 test products');
        } else {
            console.log(`✅ Business already has ${productCount} products`);
        }

        console.log('\n📝 Test Account Credentials:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('User:');
        console.log('  Email: user@example.com');
        console.log('  Password: password123');
        console.log('\nBusiness:');
        console.log('  Email: business@example.com');
        console.log('  Password: password123');
        console.log('\nDriver:');
        console.log('  Email: driver@example.com');
        console.log('  Password: password123');
        console.log('\nCashier:');
        console.log('  Email: cashier@example.com');
        console.log('  Password: password123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('✅ Test accounts created successfully!');
        console.log('💡 Use these credentials in Postman to test endpoints.\n');

    } catch (error) {
        console.error('\n❌ Failed to create test accounts:', error.message);
        
        // Provide helpful error messages
        if (error.code === 'P1001' || error.message.includes("Can't reach database server")) {
            console.error('\n⚠️  Database Connection Issue Detected!\n');
            console.error('The script cannot connect to the database. This could be because:');
            console.error('   1. Railway database is not accessible from your local machine');
            console.error('   2. Database server is down or not running');
            console.error('   3. Network/firewall blocking the connection\n');
            console.error('📋 Solutions:');
            console.error('   Option 1: Create test accounts via API (Recommended)');
            console.error('   - Use the production API: https://csy-backend-production.up.railway.app');
            console.error('   - Register user via: POST /api/auth/register');
            console.error('   - Register business via: POST /api/business/register\n');
            console.error('   Option 2: Use Railway CLI or Dashboard');
            console.error('   - Access Railway dashboard and run SQL commands directly');
            console.error('   - Or use Railway CLI to connect to database\n');
            console.error('   Option 3: Set up local database');
            console.error('   - Update DATABASE_URL in .env to point to local PostgreSQL');
            console.error('   - Run: npx prisma migrate dev\n');
            
            const dbUrl = process.env.DATABASE_URL || 'Not found';
            const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
            console.error('📋 Current DATABASE_URL:', maskedUrl);
        }
        
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

