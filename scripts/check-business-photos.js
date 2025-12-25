// Load environment variables
require('dotenv').config();

const { prisma } = require('../config/database');

/**
 * Script to check which businesses have photos
 */
async function checkBusinessPhotos() {
    console.log('🔍 Checking business photos in database...\n');

    try {
        // Test database connection first
        console.log('🔌 Testing database connection...');
        const maxRetries = 3;
        let retryCount = 0;
        let connected = false;

        while (retryCount < maxRetries && !connected) {
            try {
                await prisma.$connect();
                console.log('✅ Database connection successful!\n');
                connected = true;
            } catch (connError) {
                retryCount++;
                if (retryCount < maxRetries) {
                    console.log(`⚠️  Connection attempt ${retryCount} failed. Retrying in ${retryCount * 2} seconds...`);
                    await new Promise(resolve => setTimeout(resolve, retryCount * 2000));
                } else {
                    console.error('\n❌ Database Connection Failed!\n');
                    throw new Error('Database connection failed. Please ensure the Railway database is active.');
                }
            }
        }

        // Get all businesses
        const businesses = await prisma.business.findMany({
            select: {
                id: true,
                business_name: true,
                city: true,
                app_type: true,
                photos: true,
                videos: true
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        console.log(`📊 Total Businesses: ${businesses.length}\n`);

        // Categorize businesses
        const withPhotos = [];
        const withoutPhotos = [];
        const withVideos = [];
        const alexandriaBusinesses = [];

        businesses.forEach(business => {
            const photoCount = business.photos ? business.photos.length : 0;
            const videoCount = business.videos ? business.videos.length : 0;

            if (photoCount > 0) {
                withPhotos.push({
                    name: business.business_name,
                    city: business.city,
                    app_type: business.app_type,
                    photoCount: photoCount,
                    videoCount: videoCount
                });
            } else {
                withoutPhotos.push({
                    name: business.business_name,
                    city: business.city,
                    app_type: business.app_type
                });
            }

            if (videoCount > 0) {
                withVideos.push({
                    name: business.business_name,
                    videoCount: videoCount
                });
            }

            if (business.city === 'Alexandria') {
                alexandriaBusinesses.push({
                    name: business.business_name,
                    app_type: business.app_type,
                    photoCount: photoCount,
                    videoCount: videoCount,
                    photos: business.photos
                });
            }
        });

        // Display results
        console.log('📸 Businesses WITH Photos:');
        console.log(`   Total: ${withPhotos.length} businesses\n`);
        if (withPhotos.length > 0) {
            withPhotos.forEach((b, index) => {
                console.log(`   ${index + 1}. ${b.name} (${b.city}, ${b.app_type})`);
                console.log(`      Photos: ${b.photoCount} | Videos: ${b.videoCount}`);
            });
        }

        console.log('\n❌ Businesses WITHOUT Photos:');
        console.log(`   Total: ${withoutPhotos.length} businesses\n`);
        if (withoutPhotos.length > 0) {
            withoutPhotos.forEach((b, index) => {
                console.log(`   ${index + 1}. ${b.name} (${b.city}, ${b.app_type})`);
            });
        }

        console.log('\n🎬 Businesses WITH Videos:');
        console.log(`   Total: ${withVideos.length} businesses\n`);
        if (withVideos.length > 0) {
            withVideos.forEach((b, index) => {
                console.log(`   ${index + 1}. ${b.name} - ${b.videoCount} video(s)`);
            });
        }

        // Alexandria specific check
        console.log('\n📍 Alexandria Businesses:');
        console.log(`   Total: ${alexandriaBusinesses.length} businesses\n`);
        if (alexandriaBusinesses.length > 0) {
            alexandriaBusinesses.forEach((b, index) => {
                const status = b.photoCount > 0 ? '✅' : '❌';
                console.log(`   ${status} ${index + 1}. ${b.name} (${b.app_type})`);
                console.log(`      Photos: ${b.photoCount} | Videos: ${b.videoCount}`);
                if (b.photoCount > 0 && b.photos) {
                    console.log(`      Photo URLs: ${b.photos.slice(0, 2).join(', ')}${b.photos.length > 2 ? '...' : ''}`);
                }
            });
        }

        // Summary statistics
        console.log('\n📈 Summary Statistics:');
        console.log(`   ✅ Businesses with photos: ${withPhotos.length} (${((withPhotos.length / businesses.length) * 100).toFixed(1)}%)`);
        console.log(`   ❌ Businesses without photos: ${withoutPhotos.length} (${((withoutPhotos.length / businesses.length) * 100).toFixed(1)}%)`);
        console.log(`   🎬 Businesses with videos: ${withVideos.length} (${((withVideos.length / businesses.length) * 100).toFixed(1)}%)`);
        
        const alexandriaWithPhotos = alexandriaBusinesses.filter(b => b.photoCount > 0).length;
        console.log(`\n   📍 Alexandria businesses: ${alexandriaBusinesses.length}`);
        console.log(`   ✅ Alexandria with photos: ${alexandriaWithPhotos} (${alexandriaBusinesses.length > 0 ? ((alexandriaWithPhotos / alexandriaBusinesses.length) * 100).toFixed(1) : 0}%)`);

        // Check photo URLs validity
        console.log('\n🔗 Photo URL Check:');
        let validUrls = 0;
        let invalidUrls = 0;
        
        withPhotos.forEach(business => {
            const businessData = businesses.find(b => b.business_name === business.name);
            if (businessData && businessData.photos) {
                businessData.photos.forEach(url => {
                    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
                        validUrls++;
                    } else {
                        invalidUrls++;
                    }
                });
            }
        });

        console.log(`   ✅ Valid photo URLs: ${validUrls}`);
        console.log(`   ❌ Invalid photo URLs: ${invalidUrls}`);

        console.log('\n✨ Check completed successfully!');

    } catch (error) {
        console.error('❌ Check failed:', error.message);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run if executed directly
if (require.main === module) {
    checkBusinessPhotos()
        .then(() => {
            console.log('\n✅ Done!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Failed:', error);
            process.exit(1);
        });
}

module.exports = { checkBusinessPhotos };


