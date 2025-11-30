const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'test@example.com'; // Replace with the email the user is testing with if known, or just list all
    console.log('Checking users...');

    const users = await prisma.user.findMany({
        take: 5,
        orderBy: { created_at: 'desc' }
    });

    console.log(`Found ${users.length} users.`);

    users.forEach(user => {
        console.log('---------------------------------------------------');
        console.log(`User ID: ${user.id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Password Hash: ${user.password_hash ? user.password_hash.substring(0, 10) + '...' : 'MISSING'}`);
        console.log(`Hash Length: ${user.password_hash ? user.password_hash.length : 0}`);
        console.log(`Is Active: ${user.is_active}`);
        console.log(`Is Verified: ${user.is_verified}`);
    });

    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
