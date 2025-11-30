const fs = require('fs');
const path = require('path');

/**
 * Post-migration fixes for Prisma controllers
 * Fixes syntax errors and Mongoose-specific code
 */

const controllersDir = path.join(__dirname, '..', 'controllers');

const fixes = [
    // Fix incorrect findMany syntax (lines split incorrectly)
    {
        pattern: /\.findMany\(\{([^}]+)\}\)\s*,\s*select:/g,
        replacement: '.findMany({$1, select:'
    },
    {
        pattern: /,\s*orderBy:/g,
        replacement: ', orderBy:'
    },
    {
        pattern: /,\s*take:/g,
        replacement: ', take:'
    },

    // Fix $ne operator
    {
        pattern: /id:\s*{\s*\$ne:\s*(\w+)\s*}/g,
        replacement: 'id: { not: $1 }'
    },

    // Fix $or operator
    {
        pattern: /\$or:\s*\[/g,
        replacement: 'OR: ['
    },

    // Fix .save() calls - need manual review but comment them
    {
        pattern: /await\s+(\w+)\.save\(\);/g,
        replacement: '// TODO: Replace with prisma update - await $1.save();'
    },

    // Fix .toJSON() calls
    {
        pattern: /\.toJSON\(\)/g,
        replacement: ''
    },

    // Fix aggregate - needs manual replacement
    {
        pattern: /await\s+(\w+)\.aggregate\(/g,
        replacement: '// TODO: Replace with Prisma aggregate - await $1.aggregate('
    },

    // Fix model names (capitalize first letter for Prisma)
    {
        pattern: /prisma\.User\./g,
        replacement: 'prisma.user.'
    },
    {
        pattern: /prisma\.Address\./g,
        replacement: 'prisma.address.'
    },
    {
        pattern: /prisma\.Business\./g,
        replacement: 'prisma.business.'
    },
    {
        pattern: /prisma\.Order\./g,
        replacement: 'prisma.order.'
    },
    {
        pattern: /prisma\.Driver\./g,
        replacement: 'prisma.driver.'
    },
    {
        pattern: /prisma\.Reservation\./g,
        replacement: 'prisma.reservation.'
    },
    {
        pattern: /prisma\.Points\./g,
        replacement: 'prisma.points.'
    },
    {
        pattern: /prisma\.Transaction\./g,
        replacement: 'prisma.transaction.'
    },
    {
        pattern: /prisma\.Rating\./g,
        replacement: 'prisma.rating.'
    },
    {
        pattern: /prisma\.QRCode\./g,
        replacement: 'prisma.qRCode.'
    },
    {
        pattern: /prisma\.Product\./g,
        replacement: 'prisma.product.'
    },
    {
        pattern: /prisma\.Cashier\./g,
        replacement: 'prisma.cashier.'
    },
    {
        pattern: /prisma\.Wallet\./g,
        replacement: 'prisma.wallet.'
    },
    {
        pattern: /prisma\.OrderItem\./g,
        replacement: 'prisma.orderItem.'
    }
];

function fixController(filename) {
    const filePath = path.join(controllersDir, filename);

    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${filename}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Apply fixes
    fixes.forEach(({ pattern, replacement }) => {
        content = content.replace(pattern, replacement);
    });

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

console.log('🔧 Applying post-migration fixes...\n');

controllers.forEach(controller => {
    try {
        fixController(controller);
    } catch (error) {
        console.error(`❌ Error fixing ${controller}:`, error.message);
    }
});

console.log('\n✅ Post-migration fixes complete!');
console.log('\n⚠️  Manual review still needed for:');
console.log('   - Aggregate queries (marked with TODO)');
console.log('   - .save() calls (marked with TODO)');
console.log('   - Complex query logic');
