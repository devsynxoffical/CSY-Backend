# Configuration Files

This directory contains all configuration files for the CSY Pro application.

## Files Overview

### `database.js`
Contains database connection configurations for:
- **MongoDB** (Currently in use) - Main database for application data
- **PostgreSQL** (Future use) - For complex queries and analytics
- **DynamoDB** (Future use) - For high-performance, NoSQL data

### `redis.js`
Redis configuration for:
- Caching frequently accessed data
- Session management
- Rate limiting
- Real-time features

### `aws.js`
AWS services configuration for:
- **S3** - File storage (images, videos, documents)
- **SNS** - Push notifications and SMS
- **SES** - Email sending

### `constants.js`
Application constants including:
- Governorate codes and business types
- Fee structures and rates
- Validation rules and limits
- Error and success messages

## Usage

### Importing Configurations

```javascript
// Import all configurations
const config = require('./config');

// Or import specific modules
const { connectMongoDB, cacheHelpers } = require('./config');
const { GOVERNORATE_CODES, FEES } = require('./config');
```

### Database Connection

```javascript
const { connectMongoDB } = require('./config');

// Connect to MongoDB
await connectMongoDB();
```

### Redis Usage

```javascript
const { cacheHelpers } = require('./config');

// Set cache
await cacheHelpers.set('user:123', userData, 300); // 5 minutes TTL

// Get cache
const cachedData = await cacheHelpers.get('user:123');
```

### AWS Services

```javascript
const { s3Helpers, snsHelpers, sesHelpers } = require('./config');

// Upload file to S3
const result = await s3Helpers.uploadFile(buffer, 'image.jpg', 'image/jpeg', 'profiles');

// Send SMS
await snsHelpers.sendSMS('+201234567890', 'Your order is ready!');

// Send email
await sesHelpers.sendEmail('user@example.com', 'Welcome!', '<h1>Welcome</h1>');
```

### Using Constants

```javascript
const { GOVERNORATE_CODES, BUSINESS_TYPES, FEES } = require('./config');

// Validate governorate code
if (!GOVERNATE_CODES[code]) {
  throw new Error('Invalid governorate code');
}

// Calculate platform fee
const platformFee = amount * FEES.PLATFORM_FEE_PERCENTAGE;
```

## Environment Variables

Make sure to set the following environment variables in your `.env` file:

### Database
- `MONGODB_URI` - MongoDB connection string
- `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`

### Redis
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`

### AWS
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET_NAME`, `AWS_SES_FROM_EMAIL`

### Other
- `JWT_SECRET` - For authentication
- `NODE_ENV` - Environment (development/production)

## Error Handling

All configuration functions include proper error handling and logging. Connection failures will be logged to the console with appropriate error messages.
