# Services

This directory contains all business logic services for the CSY Pro application.

## Files Overview

### `email.service.js`
Email sending service with templates for welcome, verification, orders, etc.

### `sms.service.js`
SMS sending service via AWS SNS with OTP and notification templates.

### `notification.service.js`
Push notification service with multi-channel support (push, email, SMS).

### `payment.service.js`
Payment processing service supporting Paymob, Stripe, and wallet payments.

### `qr.service.js`
QR code generation, scanning, and management for orders, reservations, etc.

### `points.service.js`
Loyalty points system with earning, redemption, and expiry management.

### `ai-assistant.service.js`
AI-powered assistant using OpenAI/Anthropic for user support and recommendations.

### `maps.service.js`
Location services with geocoding, routing, and delivery area validation.

## Usage

### Importing Services

```javascript
// Import all services
const services = require('./services');

// Or import specific services
const { emailService, paymentService } = require('./services');
```

### Email Service

```javascript
const { emailService } = require('./services');

// Send welcome email
await emailService.sendWelcomeEmail(user);

// Send order confirmation
await emailService.sendOrderConfirmation(user, order);
```

### SMS Service

```javascript
const { smsService } = require('./services');

// Send OTP
await smsService.sendOTP(phoneNumber, '123456');

// Send order confirmation
await smsService.sendOrderConfirmationSMS(phoneNumber, orderNumber, total);
```

### Payment Service

```javascript
const { paymentService } = require('./services');

// Create payment
const payment = await paymentService.createPayment({
  userId,
  amount: 5000, // 50 EGP in piastres
  orderId,
  paymentMethod: 'online'
});

// Process webhook
await paymentService.processPaymentCallback('paymob', webhookData);
```

### QR Service

```javascript
const { qrService } = require('./services');

// Generate QR for order
const qrData = await qrService.generateQR('order', orderId);

// Scan QR code
const result = await qrService.scanQR(qrToken, scannerUserId);
```

### Points Service

```javascript
const { pointsService } = require('./services');

// Award points for order
await pointsService.awardOrderPoints(userId, orderTotal, orderId);

// Redeem points
const redemption = await pointsService.redeemPoints(userId, pointsToRedeem, referenceId);
```

### AI Assistant

```javascript
const { aiAssistantService } = require('./services');

// Generate response
const response = await aiAssistantService.generateResponse(userId, userMessage);

// Get recommendations
const recommendations = await aiAssistantService.generateRecommendations(userId, preferences);
```

### Maps Service

```javascript
const { mapsService } = require('./services');

// Geocode address
const location = await mapsService.geocodeAddress('123 Main St, Cairo');

// Calculate route
const route = await mapsService.calculateRouteInfo(originLat, originLng, destLat, destLng);
```

## Environment Variables

### Email Service
```env
EMAIL_FROM=noreply@csypro.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
USE_SES=false
```

### SMS Service
```env
# Uses AWS SNS - configured in config/aws.js
```

### Payment Service
```env
# Paymob
PAYMOB_API_KEY=your_paymob_key
PAYMOB_INTEGRATION_ID=your_integration_id
PAYMOB_IFRAME_ID=your_iframe_id

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_key

# Paymob URLs
PAYMOB_BASE_URL=https://accept.paymob.com/api
```

### AI Assistant
```env
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```

### Maps Service
```env
GOOGLE_MAPS_API_KEY=your_google_maps_key
HERE_API_KEY=your_here_api_key
MAPBOX_TOKEN=your_mapbox_token
```

## Dependencies

Install required packages:

```bash
npm install nodemailer stripe openai @anthropic-ai/sdk
```

Note: AWS SDK is already included in config/aws.js

## Error Handling

All services include comprehensive error handling and logging. Failed operations are logged with appropriate error levels and user context is preserved for debugging.

## Initialization

Some services require initialization:

```javascript
const { emailService } = require('./services');

// Initialize email service
await emailService.initialize();
```

## Testing

Each service is designed to be testable with mocked external dependencies. Use environment variables to configure test credentials and mock responses where appropriate.

## Security Considerations

- API keys are stored as environment variables
- Payment data is never stored in application logs
- QR codes include expiration and single-use validation
- AI responses are moderated for inappropriate content
- Location data is validated against Egypt boundaries
