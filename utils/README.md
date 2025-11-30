# Utility Functions

This directory contains various utility functions for the CSY Pro application.

## Files Overview

### `generatePassID.js`
Functions for generating and validating unique Pass IDs for users.

### `qrGenerator.js`
QR code generation utilities for reservations, orders, payments, etc.

### `tokenGenerator.js`
Secure token generation for passwords, emails, sessions, and API keys.

### `calculateFees.js`
Fee calculation utilities for orders, delivery, commissions, and points.

### `validateAddress.js`
Address validation and geocoding utilities.

### `logger.js`
Centralized logging system with different log levels and contexts.

## Usage

### Importing Utilities

```javascript
// Import all utilities
const utils = require('./utils');

// Or import specific utilities
const { generatePassID, calculateDeliveryFee } = require('./utils');
```

### Pass ID Generation

```javascript
const { generatePassID, validatePassID } = require('./utils');

// Generate a new Pass ID
const passId = generatePassID('DM'); // Returns: "DM-123456"

// Validate Pass ID format
const isValid = validatePassID('DM-123456'); // Returns: true
```

### QR Code Generation

```javascript
const { generateReservationQR, decodeQRData } = require('./utils');

// Generate QR for reservation
const qrData = await generateReservationQR('reservation123', {
  userName: 'John Doe',
  businessName: 'Restaurant ABC'
});

// Decode QR data
const decoded = decodeQRData(qrString);
```

### Token Generation

```javascript
const { generatePasswordResetToken, generateAPIKey } = require('./utils');

// Generate password reset token
const resetToken = generatePasswordResetToken('user123');

// Generate API key
const apiKey = generateAPIKey('user123', 'Mobile App');
```

### Fee Calculations

```javascript
const { calculateDeliveryFee, calculateOrderTotals } = require('./utils');

// Calculate delivery fee
const fee = calculateDeliveryFee(5.5); // 5.5km distance

// Calculate order totals
const totals = calculateOrderTotals([
  { price: 5000, quantity: 2 },
  { price: 3000, quantity: 1 }
], 1000, 500); // items, delivery fee, discount
```

### Address Validation

```javascript
const { validateAddress, geocodeAddress } = require('./utils');

// Validate address
const validation = validateAddress({
  recipient_name: 'John Doe',
  street: '123 Main St',
  area: 'Downtown',
  city: 'Damietta',
  phone: '+201234567890',
  latitude: 31.4165,
  longitude: 31.8133
});

// Geocode address (requires Google Maps API key)
const geocoded = await geocodeAddress('123 Main St, Damietta, Egypt');
```

### Logging

```javascript
const { logger, requestLogger } = require('./utils');

// Log messages
logger.info('User logged in', { userId: '123', ip: '192.168.1.1' });
logger.error('Database connection failed', { error: 'Connection timeout' });

// Use request logger middleware
app.use(requestLogger);
```

## Examples

### Complete Order Processing Flow

```javascript
const {
  calculateOrderTotals,
  generateOrderQR,
  logger
} = require('./utils');

async function processOrder(orderData) {
  try {
    // Calculate fees
    const totals = calculateOrderTotals(orderData.items, orderData.deliveryFee);

    // Generate QR code
    const qrData = await generateOrderQR(orderData.id, {
      total: totals.finalAmount,
      items: orderData.items.length
    });

    // Log success
    logger.order('processed', orderData.id, orderData.userId, {
      total: totals.finalAmount,
      qrToken: qrData.qrToken
    });

    return { totals, qrData };
  } catch (error) {
    logger.error('Order processing failed', {
      orderId: orderData.id,
      error: error.message
    });
    throw error;
  }
}
```

### User Registration Flow

```javascript
const {
  generatePassID,
  generateEmailVerificationToken,
  validateAddress,
  logger
} = require('./utils');

async function registerUser(userData) {
  try {
    // Generate Pass ID
    const passId = await generateUniquePassID(userData.governorate_code);

    // Generate email verification token
    const verificationToken = generateEmailVerificationToken(
      userData.id,
      userData.email
    );

    // Validate address if provided
    if (userData.address) {
      const addressValidation = validateAddress(userData.address);
      if (!addressValidation.isValid) {
        throw new Error('Invalid address: ' + addressValidation.errors.join(', '));
      }
    }

    // Log registration
    logger.auth('user_registered', userData.id, true, {
      email: userData.email,
      passId
    });

    return { passId, verificationToken };
  } catch (error) {
    logger.error('User registration failed', {
      email: userData.email,
      error: error.message
    });
    throw error;
  }
}
```

## Environment Variables

Some utilities require environment variables:

```env
# For QR code generation
# (Optional - qrcode package needed for image generation)

# For address geocoding
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# For logging
LOG_LEVEL=info
LOG_TO_FILE=true
```

## Dependencies

Some utilities require additional packages:

```bash
npm install qrcode
```

Note: QR code generation will work without the `qrcode` package but won't generate images.

## Error Handling

All utilities include proper error handling and will throw descriptive errors when operations fail. Always wrap utility calls in try-catch blocks for production use.

## Testing

Each utility function is designed to be easily testable. Mock external dependencies (like Google Maps API) when testing geocoding functions.
