const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;
const AWS = require('aws-sdk');

const execAsync = promisify(exec);

// Configure AWS S3
const s3 = new AWS.S3({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const BACKUP_BUCKET = process.env.BACKUP_S3_BUCKET || 'csy-backups';

/**
 * Restore PostgreSQL database from backup
 * @param {string} backupFilename - Name of the backup file to restore
 */
async function restoreBackup(backupFilename) {
    try {
        console.log(`🔄 Starting database restore from: ${backupFilename}`);

        // Parse DATABASE_URL
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) {
            throw new Error('DATABASE_URL environment variable is not set');
        }

        // Download backup from S3
        console.log('☁️  Downloading backup from S3...');
        const backupPath = path.join(__dirname, '..', 'temp', backupFilename);

        // Ensure temp directory exists
        await fs.mkdir(path.join(__dirname, '..', 'temp'), { recursive: true });

        const s3Params = {
            Bucket: BACKUP_BUCKET,
            Key: `backups/${backupFilename}`,
        };

        const data = await s3.getObject(s3Params).promise();
        await fs.writeFile(backupPath, data.Body);

        console.log('✅ Backup downloaded successfully');

        // Confirm before restoring
        console.log('\n⚠️  WARNING: This will overwrite the current database!');
        console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

        await new Promise(resolve => setTimeout(resolve, 5000));

        // Drop existing connections (PostgreSQL specific)
        console.log('🔌 Terminating existing database connections...');
        const terminateConnectionsQuery = `
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = current_database()
        AND pid <> pg_backend_pid();
    `;

        // Note: This requires psql to be available
        try {
            await execAsync(`psql "${dbUrl}" -c "${terminateConnectionsQuery}"`);
        } catch (err) {
            console.warn('⚠️  Could not terminate connections, continuing anyway...');
        }

        // Restore database using psql
        console.log('📥 Restoring database...');
        const psqlCommand = `psql "${dbUrl}" -f "${backupPath}"`;

        await execAsync(psqlCommand);

        console.log('✅ Database restored successfully');

        // Clean up downloaded backup file
        await fs.unlink(backupPath);
        console.log('🧹 Temporary backup file cleaned up');

        console.log('\n✅ Restore completed successfully!');
        console.log('⚠️  Remember to restart your application');

    } catch (error) {
        console.error('❌ Restore failed:', error);
        throw error;
    }
}

/**
 * List available backups for restoration
 */
async function listAvailableBackups() {
    try {
        const listParams = {
            Bucket: BACKUP_BUCKET,
            Prefix: 'backups/',
        };

        const data = await s3.listObjectsV2(listParams).promise();

        if (!data.Contents || data.Contents.length === 0) {
            console.log('No backups found');
            return [];
        }

        const backups = data.Contents.map(obj => ({
            filename: obj.Key.replace('backups/', ''),
            size: `${(obj.Size / 1024 / 1024).toFixed(2)} MB`,
            lastModified: obj.LastModified,
        }));

        console.log('\n📋 Available Backups:');
        backups.forEach((backup, index) => {
            console.log(`${index + 1}. ${backup.filename} (${backup.size}) - ${backup.lastModified}`);
        });

        return backups;

    } catch (error) {
        console.error('❌ Error listing backups:', error);
        throw error;
    }
}

// Run restore if executed directly
if (require.main === module) {
    const backupFilename = process.argv[2];

    if (!backupFilename) {
        console.error('❌ Usage: node restore.js <backup-filename>');
        console.log('\nTo see available backups, run: node backup.js --list\n');
        process.exit(1);
    }

    restoreBackup(backupFilename)
        .then(() => {
            console.log('\n✅ Restore process completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Restore process failed:', error);
            process.exit(1);
        });
}

module.exports = {
    restoreBackup,
    listAvailableBackups,
};
