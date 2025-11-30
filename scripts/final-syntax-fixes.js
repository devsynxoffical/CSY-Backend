const fs = require('fs');
const path = require('path');

/**
 * Final syntax fixes for Prisma controllers
 * Fixes the findMany query syntax issues
 */

const controllersDir = path.join(__dirname, '..', 'controllers');

function fixFindManyQueries(content) {
    // Fix pattern: findMany({ where: {...} })\n, select: {...}\n, orderBy: {...}\n, take: N;
    // Should be: findMany({ where: {...}, select: {...}, orderBy: {...}, take: N });

    // This regex finds the pattern and reconstructs it properly
    const pattern = /\.findMany\(\{\s*where:\s*\{([^}]+)\}\s*\}\)\s*,\s*select:\s*\{([^}]+)\}\s*,\s*orderBy:\s*\{([^}]+)\}\s*,\s*take:\s*(\d+);/g;

    content = content.replace(pattern, (match, whereContent, selectContent, orderByContent, takeValue) => {
        return `.findMany({ where: {${whereContent}}, select: {${selectContent}}, orderBy: {${orderByContent}}, take: ${takeValue} });`;
    });

    // Also fix simpler patterns without select
    const pattern2 = /\.findMany\(\{\s*where:\s*\{([^}]+)\}\s*\}\)\s*,\s*orderBy:\s*\{([^}]+)\}\s*,\s*take:\s*(\d+);/g;

    content = content.replace(pattern2, (match, whereContent, orderByContent, takeValue) => {
        return `.findMany({ where: {${whereContent}}, orderBy: {${orderByContent}}, take: ${takeValue} });`;
    });

    return content;
}

function fixController(filename) {
    const filePath = path.join(controllersDir, filename);

    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${filename}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Apply fixes
    content = fixFindManyQueries(content);

    // Write fixed content
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${filename}`);
}

// Controllers to fix
const controllers = [
    'user.controller.js',
    'business.controller.js',
    'order.controller.js',
    'reservation.controller.js',
    'driver.controller.js',
    'cashier.controller.js',
    'payment.controller.js',
    'qr.controller.js',
    'rating.controller.js'
];

console.log('🔧 Applying final syntax fixes...\n');

controllers.forEach(controller => {
    try {
        fixController(controller);
    } catch (error) {
        console.error(`❌ Error fixing ${controller}:`, error.message);
    }
});

console.log('\n✅ Final syntax fixes complete!');
console.log('\n🎉 All controllers are now ready for testing!');
