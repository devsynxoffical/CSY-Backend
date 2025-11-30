const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function seed() {
    console.log('🌱 Seeding database with test data...\n');

    try {
        // Create test user
        const hashedPassword = await bcrypt.hash('password123', 12);

        const user = await prisma.user.upsert({
            where: { email: 'test@example.com' },
            update: {},
            create: {
                full_name: 'Test User',
                email: 'test@example.com',
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
        console.log('✅ Created test user:', user.email);

        // Create test business
        const business = await prisma.business.upsert({
            where: { owner_email: 'business@example.com' },
            update: {},
            create: {
                owner_email: 'business@example.com',
                password_hash: hashedPassword,
                business_name: 'Test Restaurant',
                business_type: 'restaurant',
                app_type: 'pass',
                address: '123 Test Street, Downtown',
                city: 'Damascus',
                governorate: 'Damascus',
                latitude: 33.5138,
                longitude: 36.2765,
                has_reservations: true,
                has_delivery: true,
                is_active: true
            }
        });
        console.log('✅ Created test business:', business.business_name);

        // Create test products for the business
        const products = await Promise.all([
            prisma.product.create({
                data: {
                    business_id: business.id,
                    name: 'Margherita Pizza',
                    description: 'Classic pizza with tomato sauce, mozzarella, and basil',
                    price: 15.99,
                    category: 'Pizza',
                    is_available: true
                }
            }),
            prisma.product.create({
                data: {
                    business_id: business.id,
                    name: 'Caesar Salad',
                    description: 'Fresh romaine lettuce with Caesar dressing',
                    price: 8.99,
                    category: 'Salads',
                    is_available: true
                }
            }),
            prisma.product.create({
                data: {
                    business_id: business.id,
                    name: 'Grilled Chicken',
                    description: 'Tender grilled chicken breast with vegetables',
                    price: 12.99,
                    category: 'Main Course',
                    is_available: true
                }
            })
        ]);
        console.log(`✅ Created ${products.length} test products`);

        // Create test driver
        const driver = await prisma.driver.upsert({
            where: { email: 'driver@example.com' },
            update: {},
            create: {
                full_name: 'Test Driver',
                email: 'driver@example.com',
                phone: '+201234567891',
                password_hash: hashedPassword,
                vehicle_type: 'motorcycle',
                is_available: true,
                is_active: true
            }
        });
        console.log('✅ Created test driver:', driver.email);

        // Create test address for user
        const address = await prisma.address.create({
            data: {
                user_id: user.id,
                recipient_name: 'Test User',
                area: 'Downtown',
                street: '456 Home Street',
                city: 'Damascus',
                phone: '+201234567890',
                latitude: 33.5138,
                longitude: 36.2765,
                is_default: true
            }
        });
        console.log('✅ Created test address');

        console.log('\n🎉 Database seeded successfully!\n');
        console.log('📝 Test Credentials:');
        console.log('   User: test@example.com / password123');
        console.log('   Business: business@example.com / password123');
        console.log('   Driver: driver@example.com / password123\n');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seed()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
