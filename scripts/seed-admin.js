require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Use DATABASE_URL from .env, or fallback to provided connection string
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:rdGEkKzyfuDUqsBdvwhKzaDfHdZVOtwA@metro.proxy.rlwy.net:49988/railway';
  console.log('⚠️  Using hardcoded DATABASE_URL (should be in .env file)');
} else {
  console.log('✅ Using DATABASE_URL from .env file');
}

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@coresy.com';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 12);

    console.log(`Checking if admin ${email} exists...`);

    try {
        const admin = await prisma.admin.upsert({
            where: { email: email },
            update: {
                password_hash: hashedPassword, // Note: Schema uses password_hash, not password
                role: 'super_admin' // Enum value: super_admin
            },
            create: {
                email: email,
                full_name: 'Super Admin',
                password_hash: hashedPassword, // Schema: password_hash
                role: 'super_admin', // Enum: super_admin
                is_active: true
            },
        });
        console.log('✅ Admin user seeded successfully:', admin);
    } catch (e) {
        console.error('Error seeding admin:', e);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
