# Routes

This directory contains all route definitions for the CSY Pro API endpoints.

## Files Overview

### `auth.routes.js`
Authentication routes:
- `POST /register` - User registration
- `POST /login` - User login
- `POST /verify-email` - Email verification
- `POST /forgot-password` - Password reset request
- `POST /reset-password` - Password reset confirmation
- `POST /send-otp` - Send OTP via SMS
- `POST /verify-otp` - Verify OTP
- `POST /logout` - User logout
- `POST /refresh` - Token refresh

### `user.routes.js`
User management routes (all require authentication):
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `PUT /change-password` - Change password
- `DELETE /deactivate` - Deactivate account
- `GET /addresses` - Get user addresses
- `POST /addresses` - Add new address
- `PUT /addresses/:id` - Update address
- `DELETE /addresses/:id` - Delete address
- `GET /wallet` - Get wallet information
- `GET /points` - Get points information

## Usage

### Setting up Routes in Main App

```javascript
const express = require('express');
const { authRoutes, userRoutes } = require('./routes');

const app = express();

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    error: `Route ${req.originalUrl} not found`
  });
});

module.exports = app;
```

### Route Structure

Each route file follows this pattern:

```javascript
const express = require('express');
const router = express.Router();

// Import dependencies
const controller = require('../controllers/controllerName');
const { middleware1, middleware2 } = require('../middlewares');

// Define routes with middleware chain
router.post('/endpoint',
  middleware1,
  middleware2,
  controller.methodName
);

module.exports = router;
```

## Middleware Chain

Routes use middleware in this order:

1. **Rate Limiting** - Prevent abuse
2. **Authentication** - Verify user tokens (where required)
3. **Validation** - Validate request data
4. **Authorization** - Check permissions
5. **Controller** - Handle business logic

Example:

```javascript
router.post('/protected-endpoint',
  rateLimiter,           // 1. Rate limiting
  authenticate,          // 2. JWT verification
  validateInput,         // 3. Input validation
  checkPermission,       // 4. Permission check
  controller.method      // 5. Business logic
);
```

## Route Groups

### Public Routes
- Registration and login
- Password reset
- Email verification
- OTP operations

### Protected Routes
- All user management routes
- Require valid JWT token
- User-specific data access

## Error Handling

Routes rely on middleware for error handling:

- **Validation Errors**: Handled by `handleValidationErrors` middleware
- **Authentication Errors**: Handled by `authenticate` middleware
- **Controller Errors**: Handled within controllers
- **Global Errors**: Caught by error handler middleware

## API Documentation

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+201234567890",
  "password_hash": "password123",
  "governorate_code": "DM"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### User Management

#### Get Profile
```http
GET /api/user/profile
Authorization: Bearer <jwt_token>
```

#### Update Profile
```http
PUT /api/user/profile
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "full_name": "John Smith",
  "phone": "+201234567891"
}
```

## Security

- **HTTPS Only**: All routes should be served over HTTPS
- **Rate Limiting**: Applied to prevent brute force attacks
- **Input Validation**: All inputs are validated and sanitized
- **CORS**: Properly configured for allowed origins
- **Helmet**: Security headers applied

## Testing

Routes should be tested for:

- **HTTP Methods**: Correct status codes and responses
- **Authentication**: Token validation
- **Authorization**: Permission checks
- **Validation**: Input sanitization
- **Error Handling**: Proper error responses
- **Rate Limiting**: Request throttling

Example test:

```javascript
const request = require('supertest');
const app = require('../app');

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          full_name: 'Test User',
          email: 'test@example.com',
          phone: '+201234567890',
          password_hash: 'password123',
          governorate_code: 'DM'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });
});
```
