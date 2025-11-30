const fs = require('fs');
const path = require('path');

/**
 * Automated Mongoose to Prisma Controller Migration Script
 * This script converts Mongoose queries to Prisma in controller files
 */

const controllersDir = path.join(__dirname, '..', 'controllers');
const backupDir = path.join(__dirname, '..', 'controllers_backup');

// Create backup directory
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

// Controllers to migrate (excluding auth which is already done)
const controllersToMigrate = [
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

// Conversion patterns
const conversions = [
    // Import statements
    {
        pattern: /const\s+{\s*([^}]+)\s*}\s*=\s*require\(['"]\.\.\/models['"]\);/g,
        replacement: "const { prisma } = require('../models');\nconst CacheService = require('../services/cache.service');"
    },

    // findOne with id
    {
        pattern: /(\w+)\.findOne\(\{\s*id:\s*(\w+)\s*\}\)/g,
        replacement: 'prisma.$1.findUnique({ where: { id: $2 } })'
    },

    // findOne with other fields
    {
        pattern: /(\w+)\.findOne\(\{\s*(\w+):\s*([^}]+)\s*\}\)/g,
        replacement: 'prisma.$1.findUnique({ where: { $2: $3 } })'
    },

    // find with conditions
    {
        pattern: /(\w+)\.find\(\{\s*([^}]+)\s*\}\)/g,
        replacement: 'prisma.$1.findMany({ where: { $2 } })'
    },

    // find all
    {
        pattern: /(\w+)\.find\(\)/g,
        replacement: 'prisma.$1.findMany()'
    },

    // create
    {
        pattern: /(\w+)\.create\(\{([^}]+)\}\)/g,
        replacement: 'prisma.$1.create({ data: {$2} })'
    },

    // findByIdAndUpdate
    {
        pattern: /(\w+)\.findByIdAndUpdate\(([^,]+),\s*\{([^}]+)\},\s*\{\s*new:\s*true\s*\}\)/g,
        replacement: 'prisma.$1.update({ where: { id: $2 }, data: {$3} })'
    },

    // findOneAndUpdate
    {
        pattern: /(\w+)\.findOneAndUpdate\(\{\s*id:\s*([^}]+)\},\s*\{([^}]+)\},\s*\{\s*new:\s*true\s*\}\)/g,
        replacement: 'prisma.$1.update({ where: { id: $2 }, data: {$3} })'
    },

    // deleteOne
    {
        pattern: /(\w+)\.deleteOne\(\{\s*id:\s*([^}]+)\}\)/g,
        replacement: 'prisma.$1.delete({ where: { id: $2 } })'
    },

    // deleteMany
    {
        pattern: /(\w+)\.deleteMany\(\{([^}]+)\}\)/g,
        replacement: 'prisma.$1.deleteMany({ where: {$2} })'
    },

    // countDocuments
    {
        pattern: /(\w+)\.countDocuments\(\{([^}]+)\}\)/g,
        replacement: 'prisma.$1.count({ where: {$2} })'
    },

    // sort
    {
        pattern: /\.sort\(\{\s*([^:]+):\s*(-1|1)\s*\}\)/g,
        replacement: (match, field, order) => {
            const direction = order === '-1' ? 'desc' : 'asc';
            return `, orderBy: { ${field}: '${direction}' }`;
        }
    },

    // limit
    {
        pattern: /\.limit\((\d+)\)/g,
        replacement: ', take: $1'
    },

    // select
    {
        pattern: /\.select\(['"]([^'"]+)['"]\)/g,
        replacement: (match, fields) => {
            const fieldArray = fields.split(' ');
            const selectObj = fieldArray.map(f => `${f}: true`).join(', ');
            return `, select: { ${selectObj} }`;
        }
    }
];

function migrateController(filename) {
    const filePath = path.join(controllersDir, filename);

    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${filename}`);
        return;
    }

    // Backup original file
    const backupPath = path.join(backupDir, filename);
    fs.copyFileSync(filePath, backupPath);
    console.log(`📦 Backed up: ${filename}`);

    // Read file content
    let content = fs.readFileSync(filePath, 'utf8');

    // Apply conversions
    conversions.forEach(({ pattern, replacement }) => {
        content = content.replace(pattern, replacement);
    });

    // Additional manual fixes needed
    console.log(`\n⚠️  Manual review needed for ${filename}:`);
    console.log(`   - Check complex aggregations`);
    console.log(`   - Verify relation includes`);
    console.log(`   - Add cache integration`);
    console.log(`   - Test all endpoints\n`);

    // Write migrated content
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Migrated: ${filename}`);
}

// Run migration
console.log('🚀 Starting Mongoose to Prisma migration...\n');

controllersToMigrate.forEach(controller => {
    try {
        migrateController(controller);
    } catch (error) {
        console.error(`❌ Error migrating ${controller}:`, error.message);
    }
});

console.log('\n✅ Migration complete!');
console.log(`📁 Backups saved to: ${backupDir}`);
console.log('\n⚠️  IMPORTANT: Manual review and testing required for all controllers!');
