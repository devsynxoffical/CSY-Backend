# Controllers

This directory contains all controller classes that handle business logic for the CSY Pro application.

## Files Overview

### `auth.controller.js`
Handles user authentication and authorization:
- User registration with email verification
- Login/logout functionality
- Password reset via email
- Email verification
- OTP (SMS) authentication
- Token refresh

### `user.controller.js`
Handles user profile and account management:
- Profile retrieval and updates
- Password changes
- Account deactivation
- Address management
- Wallet and points information

## Usage

### Importing Controllers

```javascript
// Import specific controllers
const { authController, userController } = require('./controllers');

// Or import all
const controllers = require('./controllers');
```

### Controller Structure

Each controller follows this pattern:

```javascript
class ControllerName {
  async methodName(req, res) {
    try {
      // Business logic here
      // Input validation
      // Database operations
      // Response formatting

      res.json({
        success: true,
        message: 'Operation successful',
        data: resultData
      });
    } catch (error) {
      // Error logging
      logger.error('Operation failed', { error: error.message });

      res.status(500).json({
        success: false,
        message: 'Operation failed',
        error: error.message
      });
    }
  }
}
```

## Error Handling

All controllers include comprehensive error handling:

- **Input Validation**: Using express-validator
- **Database Errors**: Proper error catching and logging
- **Authentication Errors**: JWT verification failures
- **Business Logic Errors**: Custom validation errors
- **External Service Errors**: API call failures

## Response Format

All controllers return responses in this format:

```json
{
  "success": true|false,
  "message": "Human readable message",
  "data": {
    // Response data
  },
  "error": "Error message (only on failure)"
}
```

## Security Considerations

- **Password Hashing**: Using bcrypt with salt rounds
- **Token Management**: JWT with expiration
- **Input Sanitization**: Validation and sanitization
- **Rate Limiting**: Applied at route level
- **Audit Logging**: All operations are logged

## Dependencies

Controllers use these services and utilities:

- **Models**: Database operations
- **Services**: Email, SMS, notifications, etc.
- **Utils**: Token generation, validation, etc.
- **Config**: Constants and configuration
- **Logger**: Request/response logging

## Testing

Each controller method should be tested for:

- Successful operations
- Input validation failures
- Database errors
- Authentication failures
- External service failures

Example test structure:

```javascript
describe('AuthController', () => {
  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Test implementation
    });

    it('should return error for duplicate email', async () => {
      // Test implementation
    });
  });
});
```
