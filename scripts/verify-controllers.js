const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// Mock logger if not available
if (!logger.info) {
    console.log('Logger not found, using console');
    global.logger = {
        info: console.log,
        error: console.error,
        warn: console.warn,
        debug: console.log
    };
}

const controllersDir = path.join(__dirname, '../controllers');

async function verifyControllers() {
    console.log('🔍 Verifying controllers...');

    try {
        const files = fs.readdirSync(controllersDir);
        let errorCount = 0;

        for (const file of files) {
            if (file.endsWith('.js')) {
                try {
                    const controllerPath = path.join(controllersDir, file);
                    require(controllerPath);
                    console.log(`✅ Loaded ${file}`);
                } catch (error) {
                    console.error(`❌ Error loading ${file}:`, error.message);
                    errorCount++;
                }
            }
        }

        if (errorCount === 0) {
            console.log('\n🎉 All controllers verified successfully!');
            process.exit(0);
        } else {
            console.error(`\n⚠️ Found ${errorCount} errors in controllers.`);
            process.exit(1);
        }
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

verifyControllers();
