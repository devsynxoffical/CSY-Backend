// Load environment variables
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

// Use DATABASE_URL from .env, or fallback to Railway connection string
if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgresql://postgres:rdGEkKzyfuDUqsBdvwhKzaDfHdZVOtwA@metro.proxy.rlwy.net:49988/railway';
    console.log('⚠️  Using hardcoded DATABASE_URL (should be in .env file)');
} else {
    console.log('✅ Using DATABASE_URL from .env file');
}

const prisma = new PrismaClient();

/**
 * Seed Business Reservations
 * Creates realistic reservations for businesses that support reservations
 */
async function seedBusinessReservations() {
    console.log('📅 Seeding Business Reservations...\n');

    try {
        // Test database connection
        console.log('🔌 Testing database connection...');
        await prisma.$connect();
        console.log('✅ Database connection successful!\n');

        // Get all businesses that support reservations
        console.log('🏢 Fetching businesses with reservations enabled...');
        const businesses = await prisma.business.findMany({
            where: {
                has_reservations: true,
                is_active: true
            },
            include: {
                products: {
                    take: 1
                }
            }
        });

        if (businesses.length === 0) {
            console.log('⚠️  No businesses found with reservations enabled.');
            console.log('💡 Tip: Run seed scripts to create businesses first.\n');
            return;
        }

        console.log(`✅ Found ${businesses.length} businesses with reservations\n`);

        // Get all active users
        console.log('👤 Fetching active users...');
        const users = await prisma.user.findMany({
            where: {
                is_active: true
            },
            take: 50 // Limit to 50 users for performance
        });

        if (users.length === 0) {
            console.log('⚠️  No active users found.');
            console.log('💡 Tip: Run create-test-accounts.js to create users first.\n');
            return;
        }

        console.log(`✅ Found ${users.length} active users\n`);

        // Determine reservation type based on business type
        const getReservationType = (businessType) => {
            switch (businessType) {
                case 'restaurant':
                case 'cafe':
                case 'fast_food':
                    return 'table';
                case 'clinic':
                    return 'medical';
                case 'beauty_center':
                    return 'beauty';
                case 'recreational':
                    return 'activity';
                default:
                    return 'table';
            }
        };

        // Generate specialty for medical reservations
        const medicalSpecialties = [
            'Cardiology', 'Dermatology', 'Orthopedics', 'Pediatrics',
            'General Medicine', 'Dentistry', 'Ophthalmology', 'Neurology'
        ];

        // Generate notes for different reservation types
        const tableNotes = [
            'Window seat preferred',
            'Quiet corner please',
            'Birthday celebration',
            'Anniversary dinner',
            'Business meeting',
            'Family gathering',
            null
        ];

        const medicalNotes = [
            'Follow-up appointment',
            'First time visit',
            'Annual checkup',
            'Urgent consultation',
            null
        ];

        const beautyNotes = [
            'Haircut and styling',
            'Facial treatment',
            'Manicure and pedicure',
            'Full beauty package',
            null
        ];

        const activityNotes = [
            'Group booking',
            'Birthday party',
            'Team building event',
            null
        ];

        const getNotes = (reservationType) => {
            switch (reservationType) {
                case 'table':
                    return tableNotes[Math.floor(Math.random() * tableNotes.length)];
                case 'medical':
                    return medicalNotes[Math.floor(Math.random() * medicalNotes.length)];
                case 'beauty':
                    return beautyNotes[Math.floor(Math.random() * beautyNotes.length)];
                case 'activity':
                    return activityNotes[Math.floor(Math.random() * activityNotes.length)];
                default:
                    return null;
            }
        };

        // Generate time slots (9 AM to 10 PM)
        const generateTime = () => {
            const hour = 9 + Math.floor(Math.random() * 13); // 9-21
            const minute = Math.random() < 0.5 ? 0 : 30;
            return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        };

        // Generate duration based on reservation type
        const getDuration = (reservationType) => {
            switch (reservationType) {
                case 'table':
                    return 60 + (Math.floor(Math.random() * 4) * 30); // 60-180 minutes
                case 'medical':
                    return 30 + (Math.floor(Math.random() * 3) * 15); // 30-60 minutes
                case 'beauty':
                    return 60 + (Math.floor(Math.random() * 4) * 30); // 60-180 minutes
                case 'activity':
                    return 90 + (Math.floor(Math.random() * 3) * 30); // 90-180 minutes
                default:
                    return 60;
            }
        };

        // Generate number of people based on reservation type
        const getNumberOfPeople = (reservationType) => {
            switch (reservationType) {
                case 'table':
                    return 1 + Math.floor(Math.random() * 6); // 1-6 people
                case 'medical':
                    return 1; // Usually 1 person
                case 'beauty':
                    return 1; // Usually 1 person
                case 'activity':
                    return 2 + Math.floor(Math.random() * 8); // 2-10 people
                default:
                    return 1 + Math.floor(Math.random() * 4);
            }
        };

        // Generate amounts based on reservation type
        const getAmounts = (reservationType) => {
            let baseAmount, discountAmount, finalAmount;

            switch (reservationType) {
                case 'table':
                    baseAmount = 5000 + (Math.floor(Math.random() * 20) * 500); // 5000-15000
                    discountAmount = Math.random() < 0.3 ? Math.floor(baseAmount * 0.1) : 0; // 10% discount sometimes
                    finalAmount = baseAmount - discountAmount;
                    break;
                case 'medical':
                    baseAmount = 20000 + (Math.floor(Math.random() * 30) * 500); // 20000-35000
                    discountAmount = Math.random() < 0.2 ? Math.floor(baseAmount * 0.15) : 0; // 15% discount sometimes
                    finalAmount = baseAmount - discountAmount;
                    break;
                case 'beauty':
                    baseAmount = 15000 + (Math.floor(Math.random() * 25) * 500); // 15000-27500
                    discountAmount = Math.random() < 0.25 ? Math.floor(baseAmount * 0.12) : 0; // 12% discount sometimes
                    finalAmount = baseAmount - discountAmount;
                    break;
                case 'activity':
                    baseAmount = 10000 + (Math.floor(Math.random() * 20) * 500); // 10000-20000
                    discountAmount = Math.random() < 0.3 ? Math.floor(baseAmount * 0.1) : 0; // 10% discount sometimes
                    finalAmount = baseAmount - discountAmount;
                    break;
                default:
                    baseAmount = 10000;
                    discountAmount = 0;
                    finalAmount = 10000;
            }

            return { baseAmount, discountAmount, finalAmount };
        };

        // Generate QR code
        const generateQRCode = () => {
            return `QR-RES-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        };

        // Create reservations
        console.log('📅 Creating reservations...\n');
        const reservations = [];
        const reservationStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
        const paymentMethods = ['cash', 'online', 'wallet'];
        const paymentStatuses = ['pending', 'paid'];

        // Create 3-5 reservations per business
        for (const business of businesses) {
            const reservationType = getReservationType(business.business_type);
            const numReservations = 3 + Math.floor(Math.random() * 3); // 3-5 reservations per business

            console.log(`   Creating ${numReservations} reservations for ${business.business_name} (${reservationType})...`);

            for (let i = 0; i < numReservations; i++) {
                // Random user
                const user = users[Math.floor(Math.random() * users.length)];

                // Date: mix of past, today, and future dates
                const dateOffset = Math.floor(Math.random() * 30) - 10; // -10 to +19 days
                const reservationDate = new Date();
                reservationDate.setDate(reservationDate.getDate() + dateOffset);
                reservationDate.setHours(0, 0, 0, 0);

                // Status and payment
                const status = reservationStatuses[Math.floor(Math.random() * reservationStatuses.length)];
                const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
                const paymentStatus = status === 'confirmed' || status === 'completed' 
                    ? (Math.random() < 0.8 ? 'paid' : 'pending')
                    : 'pending';

                // Amounts
                const { baseAmount, discountAmount, finalAmount } = getAmounts(reservationType);

                // Create reservation
                try {
                    const reservation = await prisma.reservation.create({
                        data: {
                            user_id: user.id,
                            business_id: business.id,
                            reservation_type: reservationType,
                            specialty: reservationType === 'medical' 
                                ? medicalSpecialties[Math.floor(Math.random() * medicalSpecialties.length)]
                                : null,
                            date: reservationDate,
                            time: generateTime(),
                            duration: getDuration(reservationType),
                            number_of_people: getNumberOfPeople(reservationType),
                            payment_method: paymentMethod,
                            payment_status: paymentStatus,
                            status: status,
                            total_amount: baseAmount,
                            discount_amount: discountAmount,
                            final_amount: finalAmount,
                            qr_code: generateQRCode(),
                            notes: getNotes(reservationType)
                        }
                    });

                    reservations.push(reservation);
                } catch (error) {
                    console.error(`   ❌ Failed to create reservation ${i + 1} for ${business.business_name}:`, error.message);
                }
            }
        }

        console.log(`\n✅ Successfully created ${reservations.length} reservations!\n`);

        // Summary by type
        const summary = {
            table: 0,
            medical: 0,
            beauty: 0,
            activity: 0
        };

        reservations.forEach(r => {
            summary[r.reservation_type] = (summary[r.reservation_type] || 0) + 1;
        });

        console.log('📊 Reservation Summary:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`   Table Reservations:    ${summary.table}`);
        console.log(`   Medical Reservations:  ${summary.medical}`);
        console.log(`   Beauty Reservations:   ${summary.beauty}`);
        console.log(`   Activity Reservations: ${summary.activity}`);
        console.log(`   Total:                 ${reservations.length}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Status summary
        const statusSummary = {
            pending: 0,
            confirmed: 0,
            completed: 0,
            cancelled: 0
        };

        reservations.forEach(r => {
            statusSummary[r.status] = (statusSummary[r.status] || 0) + 1;
        });

        console.log('📈 Status Summary:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`   Pending:   ${statusSummary.pending}`);
        console.log(`   Confirmed: ${statusSummary.confirmed}`);
        console.log(`   Completed: ${statusSummary.completed}`);
        console.log(`   Cancelled: ${statusSummary.cancelled}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('✅ Business reservations seeded successfully!\n');

    } catch (error) {
        console.error('\n❌ Failed to seed business reservations:', error.message);
        console.error(error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run if executed directly
if (require.main === module) {
    seedBusinessReservations()
        .then(() => {
            console.log('✅ Done!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Failed:', error);
            process.exit(1);
        });
}

module.exports = { seedBusinessReservations };

