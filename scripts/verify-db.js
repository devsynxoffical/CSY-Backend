const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Connecting to database...');
        await prisma.$connect();
        console.log('✅ Connected to database');

        console.log('Checking for User table...');
        const count = await prisma.user.count();
        console.log(`✅ User table exists. Count: ${count}`);

        console.log('Checking for Business table...');
        const businessCount = await prisma.business.count();
        console.log(`✅ Business table exists. Count: ${businessCount}`);

    } catch (error) {
        console.error('❌ Error:', error);
        if (error.code === 'P2021') {
            console.error('❌ Table does not exist');
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
