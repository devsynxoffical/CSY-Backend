# Driver Registration Flow - Complete Documentation

## Overview
This document describes the complete driver registration flow, including validation, authentication, and response handling.

---

## 1. Registration Endpoint

**Endpoint:** `POST /api/driver/register`

**Rate Limiting:** General limiter applied

**Authentication:** Not required (public endpoint)

---

## 2. Request Flow

### 2.1 Request Body

```json
{
  "full_name": "Ahmed Mohamed",
  "email": "ahmed@example.com",
  "phone": "+201234567890",
  "vehicle_type": "car",
  "password": "securepassword123"
}
```

### 2.2 Required Fields

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| `full_name` | string | 2-100 characters, trimmed | Driver's full name |
| `email` | string | Valid email format, normalized | Driver's email address (unique) |
| `phone` | string | Phone regex pattern `^\+?[0-9]{10,15}$` | Driver's phone number (unique) |
| `vehicle_type` | string | Not empty, trimmed | Type of vehicle (car, motorcycle, bicycle, etc.) |
| `password` | string | Minimum 8 characters | Account password (will be hashed) |

---

## 3. Validation Process

### 3.1 Input Validation (Middleware)

Before the request reaches the controller, validation middleware checks:

1. **Full Name Validation:**
   - Must be between 2 and 100 characters
   - Automatically trimmed of whitespace
   - Error: `"Full name must be between 2 and 100 characters"`

2. **Email Validation:**
   - Must be a valid email format
   - Automatically normalized (lowercase)
   - Error: `"Please provide a valid email address"`

3. **Phone Validation:**
   - Must match pattern: `^\+?[0-9]{10,15}$`
   - Allows optional `+` prefix
   - Must be 10-15 digits
   - Error: `"Please provide a valid phone number"`

4. **Vehicle Type Validation:**
   - Must not be empty
   - Automatically trimmed
   - Error: `"Vehicle type is required"`

5. **Password Validation:**
   - Minimum 8 characters
   - Error: `"Password must be at least 8 characters long"`

### 3.2 Validation Error Response

If validation fails, the API returns:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

**HTTP Status:** `400 Bad Request`

---

## 4. Controller Processing

### 4.1 Duplicate Check

The controller checks if a driver with the same email or phone already exists:

```javascript
const existingDriver = await prisma.driver.findFirst({
  where: {
    OR: [
      { email: email.toLowerCase() },
      { phone: phone }
    ]
  }
});
```

**If duplicate found:**
- **HTTP Status:** `409 Conflict`
- **Response:**
  ```json
  {
    "success": false,
    "message": "Driver already exists",
    "error": "Email already registered" // or "Phone number already registered"
  }
  ```

### 4.2 Password Hashing

The password is hashed using bcrypt with 12 salt rounds:

```javascript
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);
```

**Security Note:** The original password is never stored in the database.

### 4.3 Driver Creation

A new driver record is created in the database:

```javascript
const driver = await prisma.driver.create({
  data: {
    full_name,
    email: email.toLowerCase(), // Normalized to lowercase
    phone,
    vehicle_type,
    password_hash: hashedPassword,
    is_active: true,        // Account is active by default
    is_available: false     // Driver starts as offline
  }
});
```

**Default Values:**
- `is_active`: `true` (account is active)
- `is_available`: `false` (driver is offline)
- `earnings_cash`: `0`
- `earnings_online`: `0`
- `platform_fees_owed`: `0`
- `rating_average`: `0`
- `rating_count`: `0`
- `current_latitude`: `null`
- `current_longitude`: `null`
- `profile_picture`: `null`

### 4.4 Token Generation

A JWT token is generated with the driver's role:

```javascript
const token = generateToken(driver.id, 'driver');
```

**Token Payload:**
```json
{
  "userId": "driver-uuid",
  "role": "driver",
  "iat": 1234567890
}
```

**Token Expiration:** 24 hours (default)

---

## 5. Success Response

### 5.1 Response Structure

**HTTP Status:** `201 Created`

```json
{
  "success": true,
  "message": "Driver registered successfully",
  "data": {
    "driver": {
      "id": "uuid",
      "full_name": "Ahmed Mohamed",
      "email": "ahmed@example.com",
      "phone": "+201234567890",
      "vehicle_type": "car",
      "profile_picture": null,
      "earnings_cash": 0,
      "earnings_online": 0,
      "platform_fees_owed": 0,
      "is_available": false,
      "is_active": true,
      "rating_average": 0,
      "rating_count": 0,
      "created_at": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 5.2 Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `true` for successful registration |
| `message` | string | Success message |
| `data.driver` | object | Driver profile (password excluded) |
| `data.driver.id` | string | Unique driver UUID |
| `data.driver.full_name` | string | Driver's full name |
| `data.driver.email` | string | Normalized email (lowercase) |
| `data.driver.phone` | string | Phone number |
| `data.driver.vehicle_type` | string | Vehicle type |
| `data.driver.profile_picture` | string\|null | Profile picture URL (if set) |
| `data.driver.earnings_cash` | number | Cash earnings (default: 0) |
| `data.driver.earnings_online` | number | Online earnings (default: 0) |
| `data.driver.platform_fees_owed` | number | Platform fees owed (default: 0) |
| `data.driver.is_available` | boolean | Availability status (default: false) |
| `data.driver.is_active` | boolean | Account active status (default: true) |
| `data.driver.rating_average` | number | Average rating (default: 0) |
| `data.driver.rating_count` | integer | Number of ratings (default: 0) |
| `data.driver.created_at` | string | Registration timestamp (ISO 8601) |
| `data.token` | string | JWT access token for authentication |

---

## 6. Error Handling

### 6.1 Validation Errors

**HTTP Status:** `400 Bad Request`

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

### 6.2 Duplicate Registration

**HTTP Status:** `409 Conflict`

```json
{
  "success": false,
  "message": "Driver already exists",
  "error": "Email already registered"
}
```

or

```json
{
  "success": false,
  "message": "Driver already exists",
  "error": "Phone number already registered"
}
```

### 6.3 Server Errors

**HTTP Status:** `500 Internal Server Error`

```json
{
  "success": false,
  "message": "Driver registration failed",
  "error": "Detailed error message"
}
```

**Logging:** All errors are logged with:
- Email address (if provided)
- Error message
- Timestamp

---

## 7. Complete Registration Flow Diagram

```
┌─────────────────┐
│  Client Request │
│  POST /register │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Rate Limiting   │
│ (General)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Input Validation│
│ Middleware      │
└────────┬────────┘
         │
    ┌────┴────┐
    │ Valid?  │
    └────┬────┘
         │
    ┌────┴────┐
    │   NO    │───► 400 Bad Request
    └────┬────┘
         │
    ┌────┴────┐
    │  YES    │
    └────┬────┘
         │
         ▼
┌─────────────────┐
│ Check Duplicate │
│ (Email/Phone)   │
└────────┬────────┘
         │
    ┌────┴────┐
    │ Exists? │
    └────┬────┘
         │
    ┌────┴────┐
    │  YES    │───► 409 Conflict
    └────┬────┘
         │
    ┌────┴────┐
    │   NO    │
    └────┬────┘
         │
         ▼
┌─────────────────┐
│ Hash Password   │
│ (bcrypt, 12)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Create Driver   │
│ (Prisma)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Generate Token │
│ (JWT, role)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Success Response│
│ 201 Created     │
└─────────────────┘
```

---

## 8. Post-Registration Steps

After successful registration, the driver should:

1. **Store the Token:**
   - Save the JWT token securely (e.g., in secure storage or keychain)
   - Include token in subsequent API requests: `Authorization: Bearer {token}`

2. **Update Profile (Optional):**
   - `PUT /api/driver/profile` - Update profile picture, vehicle details

3. **Set Location:**
   - `PUT /api/driver/location` - Set initial GPS coordinates

4. **Go Online:**
   - `PUT /api/driver/availability` - Set `is_available: true` to receive orders

5. **View Available Orders:**
   - `GET /api/driver/orders/incoming` - See orders waiting for drivers

---

## 9. Security Considerations

### 9.1 Password Security
- Passwords are hashed using bcrypt with 12 salt rounds
- Original passwords are never stored or logged
- Minimum password length: 8 characters

### 9.2 Email Normalization
- All emails are converted to lowercase before storage
- Prevents duplicate registrations with different cases

### 9.3 Token Security
- JWT tokens include role information
- Tokens expire after 24 hours
- Tokens should be stored securely on the client

### 9.4 Rate Limiting
- General rate limiter applied to prevent abuse
- Protects against brute force registration attempts

---

## 10. Database Schema

### Driver Model

```prisma
model Driver {
  id                 String   @id @default(uuid())
  full_name          String
  email              String   @unique
  phone              String   @unique
  password_hash      String
  vehicle_type       String
  profile_picture    String?
  earnings_cash      Decimal  @default(0)
  earnings_online    Decimal  @default(0)
  platform_fees_owed Decimal  @default(0)
  current_latitude   Decimal?
  current_longitude  Decimal?
  is_available       Boolean  @default(false)
  is_active          Boolean  @default(true)
  rating_average     Decimal  @default(0)
  rating_count       Int      @default(0)
  created_at         DateTime @default(now())
  updated_at         DateTime @updatedAt
}
```

### Unique Constraints
- `email`: Must be unique across all drivers
- `phone`: Must be unique across all drivers

### Indexes
- `email`: For fast email lookups
- `phone`: For fast phone lookups
- `is_available`: For filtering available drivers
- `current_latitude, current_longitude`: For location-based queries

---

## 11. Example cURL Request

```bash
curl -X POST https://api.example.com/api/driver/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Ahmed Mohamed",
    "email": "ahmed@example.com",
    "phone": "+201234567890",
    "vehicle_type": "car",
    "password": "securepassword123"
  }'
```

### Success Response:
```json
{
  "success": true,
  "message": "Driver registered successfully",
  "data": {
    "driver": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "full_name": "Ahmed Mohamed",
      "email": "ahmed@example.com",
      "phone": "+201234567890",
      "vehicle_type": "car",
      "profile_picture": null,
      "earnings_cash": 0,
      "earnings_online": 0,
      "platform_fees_owed": 0,
      "is_available": false,
      "is_active": true,
      "rating_average": 0,
      "rating_count": 0,
      "created_at": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 12. Testing Checklist

- [ ] Valid registration with all required fields
- [ ] Validation error for missing fields
- [ ] Validation error for invalid email format
- [ ] Validation error for invalid phone format
- [ ] Validation error for short password (< 8 characters)
- [ ] Duplicate email registration (409 Conflict)
- [ ] Duplicate phone registration (409 Conflict)
- [ ] Email normalization (uppercase → lowercase)
- [ ] Password hashing (not stored in plain text)
- [ ] Token generation with correct role
- [ ] Default values set correctly
- [ ] Response excludes password_hash
- [ ] Error logging for server errors

---

## 13. Integration Notes

### 13.1 Mobile App Integration
1. Collect driver information in registration form
2. Validate inputs client-side before API call
3. Display validation errors from API
4. Store JWT token securely after successful registration
5. Navigate to driver dashboard/home screen

### 13.2 Web App Integration
1. Create registration form with validation
2. Handle async registration request
3. Store token in secure HTTP-only cookie or localStorage
4. Redirect to driver dashboard on success

---

**End of Documentation**

