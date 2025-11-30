# Middleware Files

This directory contains all middleware functions for the CSY Pro application.

## Files Overview

### `auth.js`
JWT authentication middleware for user verification and token management.

### `roleCheck.js`
Role-based access control middleware for different user types (user, cashier, driver, business, admin).

### `validation.js`
Request validation middleware using express-validator with custom validation rules.

### `errorHandler.js`
Global error handling middleware with custom error classes and response helpers.

### `rateLimiter.js`
Rate limiting middleware for API endpoints to prevent abuse.

### `upload.js`
File upload middleware using Multer for handling images, videos, and documents.

## Usage

### Importing Middlewares

```javascript
// Import all middlewares
const middleware = require('./middlewares');

// Or import specific middlewares
const { authenticate, isAdmin, validateUserRegistration } = require('./middlewares');
```

### Authentication

```javascript
const { authenticate, optionalAuth } = require('./middlewares');

// Require authentication
app.get('/api/profile', authenticate, getProfile);

// Optional authentication
app.get('/api/public-data', optionalAuth, getPublicData);
```

### Role-Based Access

```javascript
const { isAdmin, isBusiness, hasAnyRole } = require('./middlewares');

// Admin only
app.post('/api/admin/users', authenticate, isAdmin, createUser);

// Business owner only
app.put('/api/business/:id', authenticate, isBusiness, updateBusiness);

// Multiple roles allowed
app.get('/api/orders', authenticate, hasAnyRole('business', 'driver'), getOrders);
```

### Validation

```javascript
const { validateUserRegistration, validateOrderCreation } = require('./middlewares');

// User registration with validation
app.post('/api/auth/register',
  validateUserRegistration,
  registerUser
);

// Order creation with validation
app.post('/api/orders',
  authenticate,
  validateOrderCreation,
  createOrder
);
```

### Error Handling

```javascript
const { errorHandler, asyncHandler, AppError } = require('./middlewares');

// Apply global error handler (must be last)
app.use(errorHandler);

// Wrap async route handlers
app.get('/api/users', asyncHandler(async (req, res) => {
  const users = await User.find();
  res.json(users);
}));

// Throw custom errors
app.post('/api/users', asyncHandler(async (req, res) => {
  const existingUser = await User.findOne({ email: req.body.email });
  if (existingUser) {
    throw new AppError('User already exists', 409);
  }
  // ... create user
}));
```

### Rate Limiting

```javascript
const { generalLimiter, authLimiter, orderLimiter } = require('./middlewares');

// General API rate limiting
app.use(generalLimiter);

// Strict rate limiting for auth endpoints
app.post('/api/auth/login', authLimiter, login);

// Rate limiting for order creation
app.post('/api/orders', authenticate, orderLimiter, createOrder);
```

### File Uploads

```javascript
const { uploadImage, uploadBusinessPhotos, handleMulterError } = require('./middlewares');

// Single image upload
app.post('/api/upload/image',
  authenticate,
  uploadImage,
  handleMulterError,
  uploadImageHandler
);

// Multiple business photos
app.post('/api/business/photos',
  authenticate,
  uploadBusinessPhotos,
  handleMulterError,
  uploadBusinessPhotosHandler
);
```

## Middleware Order

Always apply middlewares in this order:

```javascript
// 1. Rate limiting (early)
app.use(generalLimiter);

// 2. CORS, body parsing, etc.
// app.use(cors());
// app.use(express.json());

// 3. Authentication (if needed)
app.use('/api/protected', authenticate);

// 4. Role checking (after authentication)
app.use('/api/admin', isAdmin);

// 5. Validation (before route handler)
app.post('/api/users', validateUserRegistration, createUser);

// 6. Error handling (last)
app.use(errorHandler);
```

## Custom Error Responses

```javascript
const { sendErrorResponse, sendValidationError } = require('./middlewares');

// Send custom error
return sendErrorResponse(res, 400, 'Invalid input');

// Send validation errors
return sendValidationError(res, validationErrors);
```

## File Upload Examples

### Profile Picture Upload

```javascript
const { uploadProfilePicture, handleMulterError } = require('./middlewares');

app.post('/api/user/profile-picture', authenticate, (req, res) => {
  uploadProfilePicture(req, res, (err) => {
    if (err) return handleMulterError(err, req, res);

    // File uploaded successfully
    const imageUrl = req.file.location || getFileUrl(req.file.filename);
    res.json({ success: true, imageUrl });
  });
});
```

### Business Photos Upload

```javascript
const { uploadBusinessPhotos, handleMulterError } = require('./middlewares');

app.post('/api/business/photos', authenticate, (req, res) => {
  uploadBusinessPhotos(req, res, (err) => {
    if (err) return handleMulterError(err, req, res);

    // Files uploaded successfully
    const photoUrls = req.files.map(file =>
      file.location || getFileUrl(file.filename)
    );
    res.json({ success: true, photoUrls });
  });
});
```

## Environment Variables

Make sure to set these environment variables:

```env
# JWT
JWT_SECRET=your_jwt_secret_key

# AWS S3 (for production uploads)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET_NAME=your_bucket_name

# Rate Limiting
REDIS_URL=redis://localhost:6379 (optional, for distributed rate limiting)
```

## Error Handling Best Practices

1. **Use asyncHandler** for all async route handlers
2. **Throw custom AppError** instances for known errors
3. **Let unknown errors bubble up** to the global error handler
4. **Validate input** before processing
5. **Handle file upload errors** properly
6. **Log errors** for debugging but don't expose sensitive information in production
