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
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10);

/**
 * Create PostgreSQL database backup using pg_dump
 */
async function createBackup() {
    try {
        console.log('🔄 Starting database backup...');

        // Parse DATABASE_URL
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) {
            throw new Error('DATABASE_URL environment variable is not set');
        }

        // Generate backup filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFilename = `csy-backup-${timestamp}.sql`;
        const backupPath = path.join(__dirname, '..', 'temp', backupFilename);

        // Ensure temp directory exists
        await fs.mkdir(path.join(__dirname, '..', 'temp'), { recursive: true });

        // Create pg_dump command
        const pgDumpCommand = `pg_dump "${dbUrl}" -F p -f "${backupPath}"`;

        console.log('📦 Creating database dump...');
        await execAsync(pgDumpCommand);

        console.log('✅ Database dump created successfully');

        // Upload to S3
        console.log('☁️  Uploading backup to S3...');
        const fileContent = await fs.readFile(backupPath);

        await s3.putObject({
            Bucket: BACKUP_BUCKET,
            Key: `backups/${backupFilename}`,
            Body: fileContent,
            ContentType: 'application/sql',
            Metadata: {
                'backup-date': new Date().toISOString(),
                'database': 'csy_db',
            },
        }).promise();

        console.log(`✅ Backup uploaded to S3: s3://${BACKUP_BUCKET}/backups/${backupFilename}`);

        // Clean up local backup file
        await fs.unlink(backupPath);
        console.log('🧹 Local backup file cleaned up');

        // Clean old backups
        await cleanOldBackups();

        console.log('✅ Backup completed successfully!');
        return backupFilename;

    } catch (error) {
        console.error('❌ Backup failed:', error);
        throw error;
    }
}

/**
 * Clean up old backups based on retention policy
 */
async function cleanOldBackups() {
    try {
        console.log('🧹 Cleaning old backups...');

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

        // List all backups
        const listParams = {
            Bucket: BACKUP_BUCKET,
            Prefix: 'backups/',
        };

        const data = await s3.listObjectsV2(listParams).promise();

        if (!data.Contents || data.Contents.length === 0) {
            console.log('No backups found to clean');
            return;
        }

        // Filter old backups
        const oldBackups = data.Contents.filter(obj => {
            return new Date(obj.LastModified) < cutoffDate;
        });

        if (oldBackups.length === 0) {
            console.log('No old backups to delete');
            return;
        }

        // Delete old backups
        console.log(`Found ${oldBackups.length} old backup(s) to delete`);

        for (const backup of oldBackups) {
            await s3.deleteObject({
                Bucket: BACKUP_BUCKET,
                Key: backup.Key,
            }).promise();

            console.log(`🗑️  Deleted: ${backup.Key}`);
        }

        console.log(`✅ Cleaned up ${oldBackups.length} old backup(s)`);

    } catch (error) {
        console.error('❌ Error cleaning old backups:', error);
        // Don't throw - this is not critical
    }
}

/**
 * List available backups
 */
async function listBackups() {
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

// Run backup if executed directly
if (require.main === module) {
    createBackup()
        .then(() => {
            console.log('\n✅ Backup process completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Backup process failed:', error);
            process.exit(1);
        });
}

module.exports = {
    createBackup,
    cleanOldBackups,
    listBackups,
};
