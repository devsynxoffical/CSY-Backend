# CSY Backend - Complete Technical Documentation

**Version:** 1.0.0  
**Last Updated:** December 2024  
**Author:** CSY Development Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Database Schema](#4-database-schema)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [API Modules](#6-api-modules)
   - [6.1 Authentication API](#61-authentication-api)
   - [6.2 User Management API](#62-user-management-api)
   - [6.3 Business Management API](#63-business-management-api)
   - [6.4 Driver Management API](#64-driver-management-api)
   - [6.5 Cashier Management API](#65-cashier-management-api)
   - [6.6 Order Management API](#66-order-management-api)
   - [6.7 Reservation Management API](#67-reservation-management-api)
   - [6.8 Payment Processing API](#68-payment-processing-api)
   - [6.9 QR Code Management API](#69-qr-code-management-api)
   - [6.10 Rating & Review API](#610-rating--review-api)
   - [6.11 AI Assistant API](#611-ai-assistant-api)
   - [6.12 City & Location API](#612-city--location-api)
   - [6.13 Admin Dashboard API](#613-admin-dashboard-api)
7. [Business Logic & Workflows](#7-business-logic--workflows)
8. [Services Layer](#8-services-layer)
9. [Error Handling](#9-error-handling)
10. [Security](#10-security)
11. [Testing](#11-testing)
12. [Deployment](#12-deployment)
13. [API Reference Summary](#13-api-reference-summary)

---

## 1. Executive Summary

**CSY Backend** is a comprehensive multi-sided marketplace platform that connects three primary user types:
- **Users (Customers)**: End consumers who order products, make reservations, and use services
- **Businesses (Vendors)**: Service providers who manage products, orders, and reservations
- **Drivers**: Logistics providers who deliver orders to customers

### Key Features
- 🍽️ **Food & Product Ordering**: Multi-vendor ordering system with delivery and pickup options
- 📅 **Reservation System**: Table bookings, medical appointments, beauty services, and recreational activities
- 💳 **Payment Processing**: Multiple payment methods (cash, online, wallet) with transaction tracking
- 🚗 **Delivery Management**: Real-time driver tracking and order delivery system
- 📊 **Analytics & Reporting**: Comprehensive business analytics and financial tracking
- 🤖 **AI Assistant**: Personalized recommendations and chat support
- 📱 **QR Code System**: QR codes for payments, discounts, reservations, and orders
- ⭐ **Rating System**: User ratings for businesses, drivers, orders, and reservations

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                        │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  User App    │ Business App  │ Driver App   │  Admin Panel   │
│  (Mobile/Web)│  (Dashboard)  │  (Mobile)    │   (Web)        │
└──────┬───────┴──────┬────────┴──────┬───────┴────────┬───────┘
       │              │               │                │
       └──────────────┴───────────────┴────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Express.js API Server                     │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │  Routes  │Controllers│Services │Middleware│  Utils   │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
└──────┬───────────────────────────────────────────────────────┘
       │
       ├─────────────────┬─────────────────┬─────────────────┐
       ▼                 ▼                 ▼                 ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ PostgreSQL  │  │    Redis    │  │   AWS S3    │  │ External    │
│  Database   │  │    Cache    │  │   Storage   │  │   APIs      │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

### 2.2 Request Flow

1. **Client Request** → Express.js Server
2. **Middleware Chain**: Authentication → Validation → Rate Limiting
3. **Controller**: Business logic handling
4. **Service Layer**: External API calls, complex operations
5. **Database**: Prisma ORM → PostgreSQL
6. **Response**: JSON response to client

### 2.3 Directory Structure

```
CSY-Backend/
├── config/              # Configuration files
│   ├── database.js      # PostgreSQL connection
│   ├── redis.js         # Redis connection
│   ├── swagger.js       # API documentation
│   └── constants.js     # System constants
├── controllers/         # Request handlers
│   ├── auth.controller.js
│   ├── user.controller.js
│   ├── business.controller.js
│   ├── order.controller.js
│   └── ...
├── routes/              # API endpoint definitions
│   ├── auth.routes.js
│   ├── user.routes.js
│   └── ...
├── services/            # Business logic services
│   ├── payment.service.js
│   ├── notification.service.js
│   ├── qr.service.js
│   └── ...
├── middlewares/        # Express middlewares
│   ├── auth.js         # JWT authentication
│   ├── validation.js   # Request validation
│   └── rateLimiter.js   # Rate limiting
├── models/             # Prisma client
│   └── index.js
├── utils/              # Helper functions
│   ├── calculateFees.js
│   └── generateToken.js
├── prisma/             # Database schema
│   ├── schema.prisma
│   └── migrations/
├── scripts/            # Utility scripts
│   ├── seed.js
│   └── backup.js
└── index.js            # Application entry point
```

---

## 3. Technology Stack

### 3.1 Core Technologies

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Runtime** | Node.js | v18+ | Server runtime |
| **Framework** | Express.js | v5.1.0 | Web framework |
| **Database** | PostgreSQL | Latest | Relational database |
| **ORM** | Prisma | v5.22.0 | Database toolkit |
| **Cache** | Redis | v5.10.0 | Caching & sessions |
| **Storage** | AWS S3 | v2.1692.0 | Media file storage |

### 3.2 Security & Authentication

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Authentication** | JWT (jsonwebtoken) | Token-based auth |
| **Password Hashing** | bcryptjs | Secure password storage |
| **Rate Limiting** | express-rate-limit | API protection |
| **Validation** | express-validator | Input validation |

### 3.3 External Services

| Service | Purpose |
|--------|---------|
| **AWS S3** | Image and video storage |
| **Stripe** | Payment processing |
| **Nodemailer** | Email notifications |
| **SMS Service** | SMS notifications |
| **Google Maps API** | Geocoding and distance calculation |
| **OpenAI/Anthropic** | AI assistant features |

---

## 4. Database Schema

### 4.1 Core Models

#### User Models
- **User**: Customer accounts with wallet and points
- **Address**: User delivery addresses
- **Wallet**: Digital wallet for payments
- **Points**: Loyalty points tracking
- **Subscription**: App subscription management

#### Business Models
- **Business**: Business profiles and settings
- **Cashier**: Staff accounts for businesses
- **Product**: Menu items and products
- **Category**: Product categories
- **Appointment**: Available appointment slots
- **Offer**: Promotional offers
- **CashierOperation**: Cashier activity logs

#### Driver Models
- **Driver**: Driver accounts with location tracking

#### Transaction Models
- **Order**: Customer orders
- **OrderItem**: Individual items in orders
- **Reservation**: Booking reservations
- **Transaction**: Financial transactions

#### Supporting Models
- **QRCode**: QR code generation and tracking
- **Rating**: User ratings and reviews
- **Notification**: Push notifications
- **Admin**: Admin accounts with roles

### 4.2 Key Relationships

```
User ──┬── Address
       ├── Order
       ├── Reservation
       ├── Transaction
       ├── Wallet
       ├── Points
       └── Subscription

Business ──┬── Product
           ├── Cashier
           ├── OrderItem
           ├── Reservation
           ├── Appointment
           ├── Category
           └── Offer

Driver ──┬── Order
         └── Transaction

Order ──┬── OrderItem
        └── Transaction

Reservation ── Transaction
```

### 4.3 Enums

**BusinessType**: `restaurant`, `cafe`, `pharmacy`, `clinic`, `beauty_center`, `juice_shop`, `dessert_shop`, `fast_food`, `supermarket`, `recreational`, `other`

**AppType**: `pass`, `care`, `go`, `pass_go`, `care_go`

**ReservationType**: `table`, `activity`, `medical`, `beauty`

**OrderStatus**: `pending`, `accepted`, `preparing`, `waiting_driver`, `in_delivery`, `completed`, `cancelled`

**PaymentMethod**: `cash`, `online`, `wallet`

**PaymentStatus**: `pending`, `paid`, `refunded`, `failed`

---

## 5. Authentication & Authorization

### 5.1 Authentication Flow

```
1. User Registration/Login
   ↓
2. Server validates credentials
   ↓
3. Generate JWT token with user role
   ↓
4. Return token to client
   ↓
5. Client stores token
   ↓
6. Client includes token in Authorization header
   ↓
7. Server validates token on each request
```

### 5.2 JWT Token Structure

```json
{
  "userId": "uuid",
  "role": "user|business|driver|cashier|admin",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### 5.3 User Roles

| Role | Access Level | Description |
|------|-------------|-------------|
| **user** | Customer | Can place orders, make reservations |
| **business** | Vendor | Can manage products, orders, reservations |
| **driver** | Logistics | Can accept and deliver orders |
| **cashier** | Staff | Can process payments, scan QR codes |
| **admin** | System | Full system access |

### 5.4 Middleware Chain

```javascript
// Example protected route
router.get('/profile',
  authenticate,        // 1. Verify JWT token
  validateUUID,        // 2. Validate parameters
  rateLimiter,         // 3. Rate limiting
  controller.getProfile // 4. Handle request
);
```

---

## 6. API Modules

### 6.1 Authentication API

**Base URL**: `/api/auth`

**Total Endpoints**: 10

#### 6.1.1 User Registration
**Endpoint**: `POST /api/auth/register`

**Rate Limiter**: `generalLimiter` (100 requests per 15 minutes)

**Authentication**: Not required

**Request Body**:
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+201234567890",
  "password_hash": "securepassword123",
  "governorate_code": "DM"
}
```

**Validation Rules**:
- `full_name`: Required, 2-100 characters
- `email`: Required, valid email format, unique
- `phone`: Required, pattern `^\+?[0-9]{10,15}$`, unique
- `password_hash`: Required, minimum 8 characters
- `governorate_code`: Required, enum: DM, HS, HM, LK, TS, HL, DL, SD, DR, KR, HK, RQ, DZ

**Response** (201):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "john@example.com",
      "pass_id": "DM-100001",
      "full_name": "John Doe",
      "phone": "+201234567890",
      "governorate_code": "DM",
      "is_verified": false,
      "is_active": true
    },
    "token": "jwt_token_here",
    "requiresVerification": true
  }
}
```

**Workflow**:
1. Validate input data using `validateUserRegistration` middleware
2. Check email/phone uniqueness in database
3. Hash password with bcrypt (12 salt rounds)
4. Generate unique `pass_id` based on governorate code
5. Create user record in database
6. Create associated wallet record with balance 0
7. Initialize points balance at 0
8. Generate JWT token with user role
9. Send verification email to user
10. Return user data and token

**Error Responses**:
- `400`: Validation error
- `409`: Email or phone already exists
- `500`: Server error

---

#### 6.1.2 User Login
**Endpoint**: `POST /api/auth/login`

**Rate Limiter**: `authLimiter` (5 requests per 15 minutes)

**Authentication**: Not required

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Validation Rules**:
- `email`: Required, valid email format
- `password`: Required

**Response** (200):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "john@example.com",
      "full_name": "John Doe",
      "pass_id": "DM-100001",
      "wallet_balance": 25000,
      "points": 150,
      "is_verified": true,
      "is_active": true
    },
    "token": "jwt_token_here"
  }
}
```

**Workflow**:
1. Validate email and password format
2. Find user by email
3. Verify password using bcrypt compare
4. Check if user is active
5. Update last login timestamp (if tracked)
6. Generate JWT token with user role
7. Return user data and token

**Error Responses**:
- `400`: Validation error
- `401`: Invalid credentials
- `403`: Account inactive
- `404`: User not found

---

#### 6.1.3 Email Verification
**Endpoint**: `POST /api/auth/verify-email`

**Rate Limiter**: `generalLimiter`

**Authentication**: Not required

**Request Body**:
```json
{
  "token": "verification_token_from_email"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**Workflow**:
1. Validate token format
2. Decode and verify JWT token
3. Find user by token payload
4. Update `is_verified` to `true`
5. Return success message

**Error Responses**:
- `400`: Invalid or expired token
- `404`: User not found

---

#### 6.1.4 Resend Verification Email
**Endpoint**: `POST /api/auth/resend-verification`

**Rate Limiter**: `generalLimiter`

**Authentication**: Not required

**Request Body**:
```json
{
  "email": "john@example.com"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Verification email sent"
}
```

**Workflow**:
1. Find user by email
2. Generate new verification token
3. Send verification email
4. Return success message

---

#### 6.1.5 Forgot Password
**Endpoint**: `POST /api/auth/forgot-password`

**Rate Limiter**: `authLimiter` (5 requests per 15 minutes)

**Authentication**: Not required

**Request Body**:
```json
{
  "email": "john@example.com"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Password reset email sent (if account exists)"
}
```

**Workflow**:
1. Find user by email (don't reveal if not found for security)
2. Generate password reset token
3. Send password reset email with token
4. Return success message (always, for security)

---

#### 6.1.6 Reset Password
**Endpoint**: `POST /api/auth/reset-password`

**Rate Limiter**: `generalLimiter`

**Authentication**: Not required

**Request Body**:
```json
{
  "token": "reset_token_from_email",
  "newPassword": "newpassword123"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

**Workflow**:
1. Validate token and new password
2. Decode and verify reset token
3. Find user by token payload
4. Hash new password
5. Update user password
6. Invalidate reset token
7. Return success message

**Error Responses**:
- `400`: Invalid or expired token
- `404`: User not found

---

#### 6.1.7 Logout
**Endpoint**: `POST /api/auth/logout`

**Rate Limiter**: None (authenticated endpoint)

**Authentication**: Required (User, Business, Driver, Cashier, Admin)

**Request Headers**:
```
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Workflow**:
1. Verify JWT token
2. Optionally blacklist token (if using token blacklist)
3. Clear session data (if using sessions)
4. Return success message

---

#### 6.1.8 Refresh Token
**Endpoint**: `POST /api/auth/refresh`

**Rate Limiter**: None (authenticated endpoint)

**Authentication**: Required

**Request Headers**:
```
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "new_jwt_token_here"
  }
}
```

**Workflow**:
1. Verify current token
2. Generate new JWT token with same user data
3. Return new token

---

#### 6.1.9 Send OTP
**Endpoint**: `POST /api/auth/send-otp`

**Rate Limiter**: `generalLimiter`

**Authentication**: Not required

**Request Body**:
```json
{
  "phone": "+201234567890"
}
```

**Validation Rules**:
- `phone`: Required, pattern `^\+?[0-9]{10,15}$`

**Response** (200):
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "phone": "+201234567890",
    "sentAt": "2024-12-25T10:00:00Z",
    "expiresIn": 600
  }
}
```

**Workflow**:
1. Validate phone number format
2. Generate 6-digit OTP code
3. Store OTP in cache (Redis) with expiration (10 minutes)
4. Send OTP via SMS service
5. Return success with expiration time

**Note**: For testing, OTP "123456" is accepted

---

#### 6.1.10 Verify OTP
**Endpoint**: `POST /api/auth/verify-otp`

**Rate Limiter**: `generalLimiter`

**Authentication**: Not required

**Request Body**:
```json
{
  "phone": "+201234567890",
  "otp": "123456"
}
```

**Validation Rules**:
- `phone`: Required, pattern `^\+?[0-9]{10,15}$`
- `otp`: Required, pattern `^[0-9]{6}$`

**Response** (200):
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "userId": "uuid",
    "phone": "+201234567890",
    "token": "jwt_token_here",
    "verifiedAt": "2024-12-25T10:05:00Z"
  }
}
```

**Workflow**:
1. Validate phone and OTP format
2. Find user by phone number
3. Verify OTP from cache (or accept "123456" for testing)
4. If valid, generate JWT token
5. Clear OTP from cache
6. Return user data and token

**Error Responses**:
- `400`: Invalid OTP format
- `404`: User not found
- `400`: Invalid or expired OTP

---

### 6.2 User Management API

**Base URL**: `/api/user`

**Authentication**: Required (User role)

**Total Endpoints**: 15

#### 6.2.1 Get User Profile
**Endpoint**: `GET /api/user/profile`

**Rate Limiter**: `generalLimiter`

**Response** (200):
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "uuid",
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "+201234567890",
    "pass_id": "DM-100001",
    "governorate_code": "DM",
    "profile_picture": "https://s3.amazonaws.com/profile.jpg",
    "ai_assistant_name": "Alex",
    "wallet_balance": 25000,
    "points": 150,
    "is_active": true,
    "is_verified": true,
    "wallet": {
      "balance": 25000,
      "currency": "EGP",
      "total_added": 100000,
      "total_spent": 75000
    },
    "points_balance": 150,
    "recent_activity": {
      "orders": [],
      "reservations": []
    }
  }
}
```

---

#### 6.2.2 Update User Profile
**Endpoint**: `PUT /api/user/profile`

**Rate Limiter**: `generalLimiter`

**Request Body**:
```json
{
  "full_name": "John Updated",
  "phone": "+201234567891",
  "profile_picture": "https://s3.amazonaws.com/new-profile.jpg",
  "ai_assistant_name": "Alex"
}
```

**Validation Rules**:
- `full_name`: Optional, 2-100 characters
- `phone`: Optional, pattern `^\+?[0-9]{10,15}$`, must be unique
- `profile_picture`: Optional, valid URL
- `ai_assistant_name`: Optional, max 50 characters

**Response** (200):
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { /* updated user data */ }
}
```

---

#### 6.2.3 Change Password
**Endpoint**: `PUT /api/user/password`

**Rate Limiter**: `generalLimiter`

**Request Body**:
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

**Validation Rules**:
- `currentPassword`: Required
- `newPassword`: Required, minimum 8 characters

**Response** (200):
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses**:
- `401`: Invalid current password

---

#### 6.2.4 Deactivate Account
**Endpoint**: `DELETE /api/user/deactivate`

**Rate Limiter**: `generalLimiter`

**Request Body**:
```json
{
  "password": "password123",
  "reason": "No longer need the service"
}
```

**Validation Rules**:
- `password`: Required (for confirmation)
- `reason`: Optional, string

**Response** (200):
```json
{
  "success": true,
  "message": "Account deactivated successfully"
}
```

**Workflow**:
1. Verify password
2. Set `is_active` to `false`
3. Optionally log deactivation reason
4. Return success

---

#### 6.2.5 Get Addresses
**Endpoint**: `GET /api/user/addresses`

**Rate Limiter**: `generalLimiter`

**Response** (200):
```json
{
  "success": true,
  "message": "Addresses retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "recipient_name": "John Doe",
      "area": "Downtown",
      "street": "123 Main St",
      "city": "Damascus",
      "floor": "3rd Floor",
      "phone": "+201234567890",
      "latitude": 33.5138,
      "longitude": 36.2765,
      "is_default": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

#### 6.2.6 Add Address
**Endpoint**: `POST /api/user/addresses`

**Rate Limiter**: `generalLimiter`

**Request Body**:
```json
{
  "recipient_name": "John Doe",
  "area": "Downtown",
  "street": "123 Main St",
  "city": "Damascus",
  "floor": "3rd Floor",
  "phone": "+201234567890",
  "latitude": 33.5138,
  "longitude": 36.2765,
  "is_default": true
}
```

**Validation Rules**:
- `recipient_name`: Required, 2-100 characters
- `area`: Required, 2-100 characters
- `street`: Required, 5-200 characters
- `city`: Required, 2-100 characters
- `floor`: Optional, max 50 characters
- `phone`: Required, pattern `^\+?[0-9]{10,15}$`
- `latitude`: Optional, -90 to 90
- `longitude`: Optional, -180 to 180
- `is_default`: Optional, boolean

**Response** (201):
```json
{
  "success": true,
  "message": "Address added successfully",
  "data": { /* address data */ }
}
```

**Workflow**:
1. Validate all required fields
2. If `is_default` is true, unset other default addresses
3. Create address record
4. Return address data

---

#### 6.2.7 Update Address
**Endpoint**: `PUT /api/user/addresses/:id`

**Rate Limiter**: `generalLimiter`

**Path Parameters**:
- `id`: Address ID (UUID)

**Request Body**: Same as Add Address (all fields optional)

**Response** (200):
```json
{
  "success": true,
  "message": "Address updated successfully",
  "data": { /* updated address data */ }
}
```

**Error Responses**:
- `404`: Address not found
- `403`: Address does not belong to user

---

#### 6.2.8 Delete Address
**Endpoint**: `DELETE /api/user/addresses/:id`

**Rate Limiter**: `generalLimiter`

**Path Parameters**:
- `id`: Address ID (UUID)

**Response** (200):
```json
{
  "success": true,
  "message": "Address deleted successfully"
}
```

---

#### 6.2.9 Get Wallet Information
**Endpoint**: `GET /api/user/wallet`

**Rate Limiter**: `generalLimiter`

**Response** (200):
```json
{
  "success": true,
  "message": "Wallet information retrieved successfully",
  "data": {
    "balance": 25000,
    "currency": "EGP",
    "total_added": 100000,
    "total_spent": 75000
  }
}
```

---

#### 6.2.10 Get Points Information
**Endpoint**: `GET /api/user/points`

**Rate Limiter**: `generalLimiter`

**Response** (200):
```json
{
  "success": true,
  "message": "Points information retrieved successfully",
  "data": {
    "balance": 150,
    "history": [
      {
        "points_earned": 50,
        "points_redeemed": 0,
        "balance": 150,
        "activity_type": "order",
        "reference_id": "uuid",
        "created_at": "2024-12-25T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

**Points Earning Rules**:
- Order completion: 10 points per 1000 EGP spent
- Reservation completion: 5 points
- Rating submission: 2 points
- First order bonus: 50 points

---

#### 6.2.11 Update AI Assistant Name
**Endpoint**: `PUT /api/user/assistant-name`

**Rate Limiter**: `generalLimiter`

**Request Body**:
```json
{
  "ai_assistant_name": "Alex"
}
```

**Validation Rules**:
- `ai_assistant_name`: Required, max 50 characters

**Response** (200):
```json
{
  "success": true,
  "message": "AI assistant name updated successfully"
}
```

---

#### 6.2.12 Add Wallet Balance
**Endpoint**: `POST /api/user/wallet/add`

**Rate Limiter**: `generalLimiter`

**Request Body**:
```json
{
  "amount": 10000,
  "payment_method": "card"
}
```

**Validation Rules**:
- `amount`: Required, minimum 1000 (10 EGP)
- `payment_method`: Required, enum: `card`, `mobile_wallet`, `bank_transfer`
- `payment_details`: Optional, object

**Response** (200):
```json
{
  "success": true,
  "message": "Balance added successfully",
  "data": {
    "transaction_id": "uuid",
    "amount": 10000,
    "new_balance": 35000,
    "currency": "EGP"
  }
}
```

**Workflow**:
1. Validate amount (minimum 1000 piastres = 10 EGP)
2. Process payment through payment gateway
3. Update wallet balance
4. Create transaction record
5. Send confirmation notification

---

#### 6.2.13 Get Wallet History
**Endpoint**: `GET /api/user/wallet/history?page=1&limit=20`

**Rate Limiter**: `generalLimiter`

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response** (200):
```json
{
  "success": true,
  "message": "Wallet history retrieved successfully",
  "data": {
    "transactions": [
      {
        "id": "uuid",
        "type": "wallet_topup",
        "amount": 10000,
        "status": "completed",
        "description": "Wallet top-up",
        "created_at": "2024-12-25T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

---

#### 6.2.14 Get Points History
**Endpoint**: `GET /api/user/points/history?page=1&limit=20`

**Rate Limiter**: `generalLimiter`

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response** (200):
```json
{
  "success": true,
  "message": "Points history retrieved successfully",
  "data": {
    "transactions": [
      {
        "id": "uuid",
        "points_earned": 50,
        "points_redeemed": 0,
        "reference_type": "order",
        "reference_id": "uuid",
        "description": "Order completion",
        "created_at": "2024-12-25T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

---

#### 6.2.15 Get Visit History
**Endpoint**: `GET /api/user/visit-history?page=1&limit=20`

**Rate Limiter**: `generalLimiter`

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response** (200):
```json
{
  "success": true,
  "message": "Visit history retrieved successfully",
  "data": {
    "visits": [
      {
        "business_id": "uuid",
        "business_name": "Delicious Restaurant",
        "visit_count": 5,
        "last_visit": "2024-12-25T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 30,
      "totalPages": 2
    }
  }
}
```

---

#### 6.2.16 Get Notifications
**Endpoint**: `GET /api/user/notifications?page=1&limit=20&unread_only=false`

**Rate Limiter**: `generalLimiter`

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `unread_only`: Show only unread (default: false)

**Response** (200):
```json
{
  "success": true,
  "message": "Notifications retrieved successfully",
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "type": "order",
        "title": "Order Status Update",
        "message": "Your order has been accepted",
        "data": { /* additional data */ },
        "is_read": false,
        "created_at": "2024-12-25T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    },
    "unread_count": 5
  }
}
```

---

#### 6.2.17 Mark Notification as Read
**Endpoint**: `PUT /api/user/notifications/:id`

**Rate Limiter**: `generalLimiter`

**Path Parameters**:
- `id`: Notification ID (UUID)

**Response** (200):
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

#### 6.2.18 Delete Account
**Endpoint**: `DELETE /api/user/account`

**Rate Limiter**: `generalLimiter`

**Request Body**:
```json
{
  "password": "password123",
  "reason": "No longer need the service"
}
```

**Validation Rules**:
- `password`: Required (for confirmation)
- `reason`: Optional, string

**Response** (200):
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

**Workflow**:
1. Verify password
2. Permanently delete user account and all related data
3. Return success message

**Warning**: This action is irreversible!

---

### 6.3 Business Management API

**Base URL**: `/api/business`

**Total Endpoints**: 38

#### 6.3.1 Register Business
**Endpoint**: `POST /api/business/register`

**Rate Limiter**: `businessRegistrationLimiter`

**Authentication**: Not required

**Request Body**:
```json
{
  "owner_email": "owner@restaurant.com",
  "business_name": "Delicious Restaurant",
  "business_type": "restaurant",
  "app_type": "pass",
  "address": "123 Main Street",
  "city": "Damietta",
  "governorate": "Damietta",
  "latitude": 31.4165,
  "longitude": 31.8133,
  "password": "securepassword123"
}
```

**Validation Rules**:
- `owner_email`: Required, valid email, unique
- `business_name`: Required, 2-200 characters, unique
- `business_type`: Required, enum: `restaurant`, `cafe`, `pharmacy`, `clinic`, `beauty_center`, `juice_shop`, `dessert_shop`, `fast_food`, `supermarket`, `recreational`, `other`
- `app_type`: Required, enum: `pass`, `care`, `go`, `pass_go`, `care_go`
- `address`: Required, string
- `city`: Required, string
- `governorate`: Required, string (2-100 characters)
- `latitude`: Required, number (-90 to 90)
- `longitude`: Required, number (-180 to 180)
- `password`: Required, minimum 8 characters

**Response** (201):
```json
{
  "success": true,
  "message": "Business registered successfully",
  "data": {
    "business": {
      "id": "uuid",
      "owner_email": "owner@restaurant.com",
      "business_name": "Delicious Restaurant",
      "business_type": "restaurant",
      "app_type": "pass",
      "is_active": true
    },
    "token": "jwt_token_here"
  }
}
```

**Workflow**:
1. Validate all required fields
2. Check email and business name uniqueness
3. Hash password with bcrypt
4. Create business record
5. Generate JWT token with business role
6. Send welcome email
7. Return business data and token

---

#### 6.3.2 Login Business
**Endpoint**: `POST /api/business/login`

**Rate Limiter**: `generalLimiter`

**Authentication**: Not required

**Request Body**:
```json
{
  "email": "owner@restaurant.com",
  "password": "securepassword123"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "business": {
      "id": "uuid",
      "owner_email": "owner@restaurant.com",
      "business_name": "Delicious Restaurant",
      "business_type": "restaurant",
      "app_type": "pass",
      "is_active": true
    },
    "token": "jwt_token_here"
  }
}
```

---

#### 6.3.3 Get All Businesses (Public)
**Endpoint**: `GET /api/business?city=Alexandria&app_type=pass&page=1&limit=20`

**Rate Limiter**: `generalLimiter`

**Authentication**: Not required

**Query Parameters**:
- `city`: Filter by city name
- `type`: Filter by business type
- `app_type`: Filter by app type (`pass`, `care`, `go`, `pass_go`, `care_go`)
- `search`: Search by business name
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response** (200):
```json
{
  "success": true,
  "message": "Businesses retrieved successfully",
  "data": {
    "businesses": [
      {
        "id": "uuid",
        "business_name": "Delicious Restaurant",
        "business_type": "restaurant",
        "app_type": "pass",
        "address": "123 Main Street",
        "city": "Alexandria",
        "governorate": "Alexandria",
        "latitude": 31.2001,
        "longitude": 29.9187,
        "rating_average": 4.5,
        "rating_count": 120,
        "has_reservations": true,
        "has_delivery": true,
        "is_active": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

---

#### 6.3.4 Get Cashiers
**Endpoint**: `GET /api/business/cashiers?page=1&limit=20`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Business role)

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response** (200):
```json
{
  "success": true,
  "message": "Cashiers retrieved successfully",
  "data": {
    "cashiers": [
      {
        "id": "uuid",
        "email": "cashier@restaurant.com",
        "full_name": "John Smith",
        "is_active": true,
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

---

#### 6.3.5 Get Financial Records
**Endpoint**: `GET /api/business/financials?page=1&limit=20&startDate=2024-01-01&endDate=2024-12-31&type=payment`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Business role)

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `startDate`: Start date filter (YYYY-MM-DD)
- `endDate`: End date filter (YYYY-MM-DD)
- `type`: Filter by transaction type (`payment`, `discount`, `refund`, `wallet_topup`, `earnings`)

**Response** (200):
```json
{
  "success": true,
  "message": "Financial records retrieved successfully",
  "data": {
    "transactions": [
      {
        "id": "uuid",
        "transaction_type": "payment",
        "amount": 100000,
        "platform_fee": 2000,
        "discount_amount": 10000,
        "payment_method": "online",
        "status": "completed",
        "created_at": "2024-12-25T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

---

#### 6.3.6 Get Offers
**Endpoint**: `GET /api/business/offers`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Business role)

**Response** (200):
```json
{
  "success": true,
  "message": "Offers retrieved successfully",
  "data": {
    "offers": [
      {
        "id": "uuid",
        "title": "20% Off on Main Course",
        "description": "Get 20% discount",
        "discount_percentage": 20,
        "start_date": "2024-12-01",
        "end_date": "2024-12-31",
        "is_active": true
      }
    ]
  }
}
```

---

#### 6.3.7 Get Public Business Profile
**Endpoint**: `GET /api/business/:id`

**Rate Limiter**: `generalLimiter`

**Authentication**: Not required

**Path Parameters**:
- `id`: Business ID (UUID)

**Response** (200):
```json
{
  "success": true,
  "message": "Business profile retrieved successfully",
  "data": {
    "id": "uuid",
    "business_name": "Delicious Restaurant",
    "business_type": "restaurant",
    "app_type": "pass",
    "address": "123 Main Street",
    "city": "Alexandria",
    "governorate": "Alexandria",
    "latitude": 31.2001,
    "longitude": 29.9187,
    "working_hours": {
      "monday": "9:00-22:00",
      "tuesday": "9:00-22:00",
      "wednesday": "9:00-22:00",
      "thursday": "9:00-22:00",
      "friday": "9:00-22:00",
      "saturday": "10:00-18:00",
      "sunday": "closed"
    },
    "photos": ["https://s3.amazonaws.com/photo1.jpg"],
    "rating_average": 4.5,
    "rating_count": 120,
    "has_reservations": true,
    "has_delivery": true
  }
}
```

---

#### 6.3.8 Get Public Business Products
**Endpoint**: `GET /api/business/:id/products?category=Main Course`

**Rate Limiter**: `generalLimiter`

**Authentication**: Not required

**Path Parameters**:
- `id`: Business ID (UUID)

**Query Parameters**:
- `category`: Filter by product category

**Response** (200):
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "products": [
      {
        "id": "uuid",
        "name": "Grilled Chicken",
        "description": "Tender grilled chicken",
        "price": 75000,
        "category": "Main Course",
        "image_url": "https://s3.amazonaws.com/chicken.jpg",
        "is_available": true
      }
    ]
  }
}
```

---

#### 6.3.9 Get Business Profile (Authenticated)
**Endpoint**: `GET /api/business/profile`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Business role)

**Response** (200):
```json
{
  "success": true,
  "message": "Business profile retrieved successfully",
  "data": {
    "id": "uuid",
    "owner_email": "owner@restaurant.com",
    "business_name": "Delicious Restaurant",
    "business_type": "restaurant",
    "app_type": "pass",
    "address": "123 Main Street",
    "city": "Alexandria",
    "governorate": "Alexandria",
    "latitude": 31.2001,
    "longitude": 29.9187,
    "working_hours": { /* working hours object */ },
    "photos": ["https://s3.amazonaws.com/photo1.jpg"],
    "videos": [],
    "has_reservations": true,
    "has_delivery": true,
    "rating_average": 4.5,
    "rating_count": 120,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

#### 6.3.10 Update Business Profile
**Endpoint**: `PUT /api/business/profile`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Business role)

**Request Body**:
```json
{
  "business_name": "Updated Restaurant Name",
  "address": "456 New Street",
  "city": "Cairo",
  "governorate": "Cairo",
  "latitude": 30.0444,
  "longitude": 31.2357,
  "working_hours": {
    "monday": "9:00-22:00",
    "tuesday": "9:00-22:00",
    "wednesday": "9:00-22:00",
    "thursday": "9:00-22:00",
    "friday": "9:00-22:00",
    "saturday": "10:00-18:00",
    "sunday": "closed"
  },
  "photos": ["https://s3.amazonaws.com/photo1.jpg"],
  "videos": [],
  "has_reservations": true,
  "has_delivery": true
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Business profile updated successfully",
  "data": { /* updated business data */ }
}
```

---

#### 6.3.11 Update Working Hours
**Endpoint**: `PUT /api/business/working-hours`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Business role)

**Request Body**:
```json
{
  "working_hours": {
    "monday": "9:00-18:00",
    "tuesday": "9:00-18:00",
    "wednesday": "9:00-18:00",
    "thursday": "9:00-18:00",
    "friday": "9:00-18:00",
    "saturday": "10:00-16:00",
    "sunday": "closed"
  }
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Working hours updated successfully"
}
```

---

#### 6.3.12 Upload Photos
**Endpoint**: `POST /api/business/photos`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Business role)

**Request Body**:
```json
{
  "photos": [
    "https://s3.amazonaws.com/photo1.jpg",
    "https://s3.amazonaws.com/photo2.jpg"
  ]
}
```

**Validation Rules**:
- `photos`: Required, array of valid URLs

**Response** (200):
```json
{
  "success": true,
  "message": "Photos uploaded successfully",
  "data": {
    "photos": [
      "https://s3.amazonaws.com/photo1.jpg",
      "https://s3.amazonaws.com/photo2.jpg"
    ]
  }
}
```

---

#### 6.3.13 Delete Photo
**Endpoint**: `DELETE /api/business/photos/:id`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Business role)

**Path Parameters**:
- `id`: Photo index (0-based) or photo URL

**Response** (200):
```json
{
  "success": true,
  "message": "Photo deleted successfully"
}
```

**Workflow**:
1. Get business profile
2. Remove photo from photos array by index
3. Update business record
4. Return success

---

#### 6.3.14 Create Cashier
**Endpoint**: `POST /api/business/cashiers`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Business role)

**Request Body**:
```json
{
  "email": "cashier@restaurant.com",
  "full_name": "John Smith",
  "password_hash": "cashierpassword123"
}
```

**Validation Rules**:
- `email`: Required, valid email, unique
- `full_name`: Optional, string
- `password_hash`: Required, minimum 8 characters

**Response** (201):
```json
{
  "success": true,
  "message": "Cashier created successfully",
  "data": {
    "id": "uuid",
    "email": "cashier@restaurant.com",
    "full_name": "John Smith",
    "business_id": "uuid",
    "is_active": true
  }
}
```

---

#### 6.3.15 Update Cashier
**Endpoint**: `PUT /api/business/cashiers/:id`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Business role)

**Path Parameters**:
- `id`: Cashier ID (UUID)

**Request Body**:
```json
{
  "full_name": "John Updated Smith",
  "is_active": true
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Cashier updated successfully",
  "data": { /* updated cashier data */ }
}
```

---

#### 6.3.16 Delete Cashier
**Endpoint**: `DELETE /api/business/cashiers/:id`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Business role)

**Path Parameters**:
- `id`: Cashier ID (UUID)

**Response** (200):
```json
{
  "success": true,
  "message": "Cashier deleted successfully"
}
```

---

#### 6.3.17 Accept Order
**Endpoint**: `PUT /api/business/orders/:id/accept`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Business role)

**Path Parameters**:
- `id`: Order ID (UUID)

**Response** (200):
```json
{
  "success": true,
  "message": "Order accepted successfully",
  "data": {
    "orderId": "uuid",
    "status": "accepted",
    "updated_at": "2024-12-25T10:00:00Z"
  }
}
```

**Workflow**:
1. Verify order belongs to business
2. Check order status is `pending`
3. Update order status to `accepted`
4. Notify user
5. Return success

---

#### 6.3.18 Reject Order
**Endpoint**: `PUT /api/business/orders/:id/reject`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Business role)

**Path Parameters**:
- `id`: Order ID (UUID)

**Request Body**:
```json
{
  "reason": "Item out of stock"
}
```

**Validation Rules**:
- `reason`: Optional, string

**Response** (200):
```json
{
  "success": true,
  "message": "Order rejected successfully",
  "data": {
    "orderId": "uuid",
    "status": "cancelled",
    "rejection_reason": "Item out of stock"
  }
}
```

**Workflow**:
1. Verify order belongs to business
2. Check order status is `pending`
3. Update order status to `cancelled`
4. Refund payment if already paid
5. Notify user with rejection reason
6. Return success

---

#### 6.3.19 Get Appointments
**Endpoint**: `GET /api/business/appointments?page=1&limit=20&date=2024-12-25&service_name=Hair Cut`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Business role)

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `date`: Filter by date (YYYY-MM-DD)
- `service_name`: Filter by service name

**Response** (200):
```json
{
  "success": true,
  "message": "Appointments retrieved successfully",
  "data": {
    "appointments": [
      {
        "id": "uuid",
        "service_name": "Hair Cut",
        "description": "Professional hair cutting",
        "duration": 60,
        "price": 50000,
        "date": "2024-12-25",
        "time": "10:00",
        "is_available": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 30,
      "totalPages": 2
    }
  }
}
```

---

#### 6.3.20 Add Appointment
**Endpoint**: `POST /api/business/appointments`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Business role)

**Request Body**:
```json
{
  "service_name": "Hair Cut",
  "description": "Professional hair cutting service",
  "duration": 60,
  "price": 50000,
  "date": "2024-12-25",
  "start_time": "10:00",
  "end_time": "11:00",
  "is_available": true
}
```

**Validation Rules**:
- `service_name`: Optional, string
- `description`: Optional, string
- `duration`: Required, integer (minutes)
- `price`: Optional, number
- `date`: Required, date (YYYY-MM-DD)
- `time`: Required, time (HH:MM)
- `is_available`: Optional, boolean (default: true)

**Response** (201):
```json
{
  "success": true,
  "message": "Appointment created successfully",
  "data": {
    "id": "uuid",
    "service_name": "Hair Cut",
    "duration": 60,
    "price": 50000,
    "date": "2024-12-25",
    "time": "10:00",
    "is_available": true
  }
}
```

---

#### 6.3.21 Update Appointment
**Endpoint**: `PUT /api/business/appointments/:id`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Business role)

**Path Parameters**:
- `id`: Appointment ID (UUID)

**Request Body**:
```json
{
  "service_name": "Updated Hair Cut",
  "duration": 90,
  "price": 60000,
  "is_available": false
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Appointment updated successfully",
  "data": { /* updated appointment data */ }
}
```

---

#### 6.3.22 Delete Appointment
**Endpoint**: `DELETE /api/business/appointments/:id`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Business role)

**Path Parameters**:
- `id`: Appointment ID (UUID)

**Response** (200):
```json
{
  "success": true,
  "message": "Appointment deleted successfully"
}
```

---

#### 6.3.23 Add Product
**Endpoint**: `POST /api/business/products`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Business role)

**Request Body**:
```json
{
  "category": "Main Course",
  "name": "Grilled Chicken",
  "description": "Tender grilled chicken with herbs",
  "ingredients": "Chicken breast, herbs, olive oil, garlic",
  "image": "https://s3.amazonaws.com/chicken.jpg",
  "price": 75000,
  "weight": "300g",
  "add_ons": [
    {
      "name": "Extra Cheese",
      "price": 5000
    },
    {
      "name": "Bacon",
      "price": 10000
    }
  ]
}
```

**Validation Rules**:
- `name`: Required, string
- `price`: Required, number (positive)
- `category`: Optional, string
- `description`: Optional, string
- `ingredients`: Optional, string
- `image`: Optional, valid URL
- `weight`: Optional, string
- `add_ons`: Optional, array of objects

**Response** (201):
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": "uuid",
    "name": "Grilled Chicken",
    "price": 75000,
    "category": "Main Course",
    "is_available": true
  }
}
```

---

#### 6.3.24 Get Products (Authenticated)
**Endpoint**: `GET /api/business/products?page=1&limit=20&category=Main Course&available=true`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Business role)

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `category`: Filter by category
- `available`: Filter by availability (`true`/`false`)

**Response** (200):
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "products": [
      {
        "id": "uuid",
        "name": "Grilled Chicken",
        "price": 75000,
        "category": "Main Course",
        "is_available": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

---

#### 6.3.25 Update Product
**Endpoint**: `PUT /api/business/products/:id`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Business role)

**Path Parameters**:
- `id`: Product ID (UUID)

**Request Body**:
```json
{
  "name": "Updated Grilled Chicken",
  "price": 80000,
  "is_available": true
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": { /* updated product data */ }
}
```

---

#### 6.3.26 Delete Product
**Endpoint**: `DELETE /api/business/products/:id`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Business role)

**Path Parameters**:
- `id`: Product ID (UUID)

**Response** (200):
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

**Note**: Product will be soft-deleted or removed. Check if product has active orders before deletion.

---

#### 6.3.27 Get Analytics
**Endpoint**: `GET /api/business/analytics?reportType=summary&startDate=2024-01-01&endDate=2024-12-31`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Business role)

**Query Parameters**:
- `reportType`: Report type (`summary`, `detailed`, `revenue`, `orders`)
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)

**Response** (200):
```json
{
  "success": true,
  "message": "Analytics retrieved successfully",
  "data": {
    "period": {
      "start": "2024-01-01",
      "end": "2024-12-31"
    },
    "summary": {
      "total_orders": 500,
      "completed_orders": 450,
      "total_revenue": 5000000,
      "average_order_value": 10000,
      "total_reservations": 200,
      "completed_reservations": 180
    },
    "revenue_breakdown": {
      "by_payment_method": {
        "cash": 2000000,
        "online": 2500000,
        "wallet": 500000
      },
      "by_month": [
        {
          "month": "January",
          "revenue": 400000
        }
      ]
    }
  }
}
```

---

#### 6.3.28 Get Operations Log
**Endpoint**: `GET /api/business/operations-log?page=1&limit=50&startDate=2024-01-01&endDate=2024-12-31&operation_type=order`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Business role)

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 100)
- `startDate`: Start date filter (YYYY-MM-DD)
- `endDate`: End date filter (YYYY-MM-DD)
- `operation_type`: Filter by operation type

**Response** (200):
```json
{
  "success": true,
  "message": "Operations log retrieved successfully",
  "data": {
    "operations": [
      {
        "id": "uuid",
        "operation_type": "order",
        "description": "Order accepted",
        "created_at": "2024-12-25T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 200,
      "totalPages": 4
    }
  }
}
```

---

#### 6.3.29 Get Dashboard
**Endpoint**: `GET /api/business/dashboard?startDate=2024-01-01&endDate=2024-12-31`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Business role)

**Query Parameters**:
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)

**Response** (200):
```json
{
  "success": true,
  "message": "Dashboard data retrieved successfully",
  "data": {
    "overview": {
      "total_orders": 500,
      "pending_orders": 10,
      "total_revenue": 5000000,
      "total_reservations": 200
    },
    "recent_orders": [ /* recent orders */ ],
    "recent_reservations": [ /* recent reservations */ ],
    "top_products": [ /* top selling products */ ],
    "revenue_chart": [ /* revenue chart data */ ]
  }
}
```

---

#### 6.3.30 Create Category
**Endpoint**: `POST /api/business/categories`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Business role)

**Request Body**:
```json
{
  "name": "Main Course",
  "description": "Main course items",
  "image_url": "https://s3.amazonaws.com/category.jpg",
  "order": 1
}
```

**Validation Rules**:
- `name`: Required, string
- `description`: Optional, string
- `image_url`: Optional, valid URL
- `order`: Optional, integer (for sorting)

**Response** (201):
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "id": "uuid",
    "name": "Main Course",
    "is_active": true
  }
}
```

---

#### 6.3.31 Get Categories
**Endpoint**: `GET /api/business/categories`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Business role)

**Response** (200):
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": {
    "categories": [
      {
        "id": "uuid",
        "name": "Main Course",
        "description": "Main course items",
        "image_url": "https://s3.amazonaws.com/category.jpg",
        "order": 1,
        "is_active": true,
        "products_count": 15
      }
    ]
  }
}
```

---

#### 6.3.32 Update Category
**Endpoint**: `PUT /api/business/categories/:id`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Business role)

**Path Parameters**:
- `id`: Category ID (UUID)

**Request Body**:
```json
{
  "name": "Updated Category Name",
  "description": "Updated description",
  "is_active": true
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": { /* updated category data */ }
}
```

---

#### 6.3.33 Delete Category
**Endpoint**: `DELETE /api/business/categories/:id`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Business role)

**Path Parameters**:
- `id`: Category ID (UUID)

**Response** (200):
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

**Note**: Check if category has products before deletion.

---

#### 6.3.34 Create Offer
**Endpoint**: `POST /api/business/offers`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Business role)

**Request Body**:
```json
{
  "title": "20% Off on Main Course",
  "description": "Get 20% discount on all main course items",
  "discount_percentage": 20,
  "start_date": "2024-12-01",
  "end_date": "2024-12-31",
  "image_url": "https://s3.amazonaws.com/offer.jpg",
  "is_active": true
}
```

**Validation Rules**:
- `title`: Required, string
- `description`: Optional, string
- `discount_percentage`: Required, number (0-100)
- `start_date`: Required, date (YYYY-MM-DD)
- `end_date`: Required, date (YYYY-MM-DD), must be after start_date
- `image_url`: Optional, valid URL
- `is_active`: Optional, boolean (default: true)

**Response** (201):
```json
{
  "success": true,
  "message": "Offer created successfully",
  "data": {
    "id": "uuid",
    "title": "20% Off on Main Course",
    "discount_percentage": 20,
    "is_active": true
  }
}
```

---

#### 6.3.35 Update Offer
**Endpoint**: `PUT /api/business/offers/:id`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Business role)

**Path Parameters**:
- `id`: Offer ID (UUID)

**Request Body**:
```json
{
  "title": "Updated Offer Title",
  "is_active": false
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Offer updated successfully",
  "data": { /* updated offer data */ }
}
```

---

#### 6.3.36 Delete Offer
**Endpoint**: `DELETE /api/business/offers/:id`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Business role)

**Path Parameters**:
- `id`: Offer ID (UUID)

**Response** (200):
```json
{
  "success": true,
  "message": "Offer deleted successfully"
}
```

---

#### 6.3.37 Get Orders
**Endpoint**: `GET /api/business/orders?page=1&limit=20&status=pending&startDate=2024-01-01&endDate=2024-12-31`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Business role)

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `status`: Filter by status (`pending`, `accepted`, `preparing`, `waiting_driver`, `in_delivery`, `completed`, `cancelled`)
- `startDate`: Start date filter (YYYY-MM-DD)
- `endDate`: End date filter (YYYY-MM-DD)

**Response** (200):
```json
{
  "success": true,
  "message": "Orders retrieved successfully",
  "data": {
    "orders": [
      {
        "id": "uuid",
        "order_number": "ORD-20241225-001",
        "status": "pending",
        "total_amount": 100000,
        "final_amount": 97000,
        "user": {
          "id": "uuid",
          "full_name": "John Doe"
        },
        "order_items": [ /* order items */ ],
        "created_at": "2024-12-25T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

---

#### 6.3.38 Get Reservations
**Endpoint**: `GET /api/business/reservations?page=1&limit=20&status=pending&date=2024-12-25`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Business role)

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `status`: Filter by status (`pending`, `confirmed`, `cancelled`, `completed`, `expired`)
- `date`: Filter by date (YYYY-MM-DD)

**Response** (200):
```json
{
  "success": true,
  "message": "Reservations retrieved successfully",
  "data": {
    "reservations": [
      {
        "id": "uuid",
        "reservation_type": "table",
        "date": "2024-12-25",
        "time": "19:30",
        "duration": 120,
        "number_of_people": 4,
        "status": "pending",
        "user": {
          "id": "uuid",
          "full_name": "John Doe"
        },
        "created_at": "2024-12-25T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```


---

### 6.4 Driver Management API

**Base URL**: `/api/driver`

**Total Endpoints**: 12

#### 6.4.1 Register Driver
**Endpoint**: `POST /api/driver/register`

**Rate Limiter**: `generalLimiter`

**Authentication**: Not required

**Request Body**:
```json
{
  "full_name": "Ahmed Driver",
  "email": "driver@example.com",
  "phone": "+201234567891",
  "password_hash": "driverpassword123",
  "vehicle_type": "motorcycle"
}
```

**Validation Rules**:
- `full_name`: Required, 2-100 characters
- `email`: Required, valid email, unique
- `phone`: Required, pattern `^\+?[0-9]{10,15}$`, unique
- `password_hash`: Required, minimum 8 characters
- `vehicle_type`: Required, string (e.g., `car`, `motorcycle`, `bicycle`)

**Response** (201):
```json
{
  "success": true,
  "message": "Driver registered successfully",
  "data": {
    "driver": {
      "id": "uuid",
      "full_name": "Ahmed Driver",
      "email": "driver@example.com",
      "phone": "+201234567891",
      "vehicle_type": "motorcycle",
      "is_available": false,
      "is_active": true,
      "earnings_cash": 0,
      "earnings_online": 0,
      "platform_fees_owed": 0
    },
    "token": "jwt_token_here"
  }
}
```

---

#### 6.4.2 Login Driver
**Endpoint**: `POST /api/driver/login`

**Rate Limiter**: `generalLimiter`

**Authentication**: Not required

**Request Body**:
```json
{
  "email": "driver@example.com",
  "password": "driverpassword123"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "driver": { /* driver data */ },
    "token": "jwt_token_here"
  }
}
```

---

#### 6.4.3 Get Driver Profile
**Endpoint**: `GET /api/driver/profile`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Driver role)

**Response** (200):
```json
{
  "success": true,
  "message": "Driver profile retrieved successfully",
  "data": {
    "id": "uuid",
    "full_name": "Ahmed Driver",
    "email": "driver@example.com",
    "phone": "+201234567891",
    "vehicle_type": "motorcycle",
    "profile_picture": "https://s3.amazonaws.com/driver.jpg",
    "earnings_cash": 50000,
    "earnings_online": 30000,
    "platform_fees_owed": 5000,
    "current_latitude": 33.5138,
    "current_longitude": 36.2765,
    "is_available": true,
    "is_active": true,
    "rating_average": 4.5,
    "rating_count": 25,
    "stats": {
      "active_orders": 2,
      "completed_today": 10,
      "ratings_summary": {
        "average": 4.5,
        "total": 25
      }
    },
    "active_orders": [ /* active orders */ ]
  }
}
```

---

#### 6.4.4 Update Driver Profile
**Endpoint**: `PUT /api/driver/profile`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Driver role)

**Request Body**:
```json
{
  "full_name": "Ahmed Updated Driver",
  "phone": "+201234567892",
  "vehicle_type": "car",
  "profile_picture": "https://s3.amazonaws.com/new-driver.jpg"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { /* updated driver data */ }
}
```

---

#### 6.4.5 Update Location
**Endpoint**: `PUT /api/driver/location`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Driver role)

**Request Body**:
```json
{
  "latitude": 33.5138,
  "longitude": 36.2765
}
```

**Validation Rules**:
- `latitude`: Required, -90 to 90
- `longitude`: Required, -180 to 180

**Response** (200):
```json
{
  "success": true,
  "message": "Location updated successfully",
  "data": {
    "latitude": 33.5138,
    "longitude": 36.2765,
    "updated_at": "2024-12-25T10:00:00Z"
  }
}
```

**Workflow**:
1. Update driver's current location
2. Used for order assignment (finding nearest driver)
3. Return success

---

#### 6.4.6 Update Availability
**Endpoint**: `PUT /api/driver/availability`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Driver role)

**Request Body**:
```json
{
  "is_available": true
}
```

**Validation Rules**:
- `is_available`: Required, boolean

**Response** (200):
```json
{
  "success": true,
  "message": "Driver is now available",
  "data": {
    "is_available": true,
    "updated_at": "2024-12-25T10:00:00Z"
  }
}
```

**Workflow**:
1. Update driver availability status
2. If `is_available: false`, driver won't receive new order assignments
3. Return success

---

#### 6.4.7 Get Incoming Orders
**Endpoint**: `GET /api/driver/orders/incoming?page=1&limit=10&latitude=33.5138&longitude=36.2765`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Driver role)

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 50)
- `latitude`: Driver's current latitude (for location-based filtering)
- `longitude`: Driver's current longitude (for location-based filtering)

**Response** (200):
```json
{
  "success": true,
  "message": "Incoming orders retrieved successfully",
  "data": {
    "orders": [
      {
        "id": "uuid",
        "order_number": "ORD-20241225-001",
        "status": "waiting_driver",
        "total_amount": 100000,
        "delivery_fee": 5000,
        "business": {
          "id": "uuid",
          "business_name": "Delicious Restaurant",
          "address": "123 Main Street",
          "latitude": 33.5200,
          "longitude": 36.2800
        },
        "delivery_address": { /* delivery address */ },
        "distance": 2.5,
        "estimated_delivery_time": 15
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

**Workflow**:
1. Find orders with status `waiting_driver`
2. Filter by driver availability and location proximity
3. Calculate distance from driver to business
4. Return available orders sorted by distance

---

#### 6.4.8 Get Accepted Orders
**Endpoint**: `GET /api/driver/orders/accepted?page=1&limit=20`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Driver role)

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response** (200):
```json
{
  "success": true,
  "message": "Accepted orders retrieved successfully",
  "data": {
    "orders": [
      {
        "id": "uuid",
        "order_number": "ORD-20241225-001",
        "status": "preparing",
        "business": { /* business data */ },
        "delivery_address": { /* delivery address */ }
      }
    ],
    "pagination": { /* pagination data */ }
  }
}
```

**Note**: Returns orders accepted by driver that are in `preparing` or `waiting_driver` status

---

#### 6.4.9 Get In-Delivery Orders
**Endpoint**: `GET /api/driver/orders/in-delivery?page=1&limit=20`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Driver role)

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response** (200):
```json
{
  "success": true,
  "message": "Orders in delivery retrieved successfully",
  "data": {
    "orders": [
      {
        "id": "uuid",
        "order_number": "ORD-20241225-001",
        "status": "in_delivery",
        "business": { /* business data */ },
        "delivery_address": { /* delivery address */ },
        "customer": { /* customer data */ }
      }
    ],
    "pagination": { /* pagination data */ }
  }
}
```

---

#### 6.4.10 Get All Orders
**Endpoint**: `GET /api/driver/orders?page=1&limit=20&status=completed`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Driver role)

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `status`: Filter by status

**Response** (200):
```json
{
  "success": true,
  "message": "Driver orders retrieved successfully",
  "data": {
    "orders": [ /* order history */ ],
    "pagination": { /* pagination data */ }
  }
}
```

---

#### 6.4.11 Accept Order
**Endpoint**: `POST /api/driver/orders/:id/accept`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Driver role)

**Path Parameters**:
- `id`: Order ID (UUID)

**Response** (200):
```json
{
  "success": true,
  "message": "Order accepted successfully",
  "data": {
    "orderId": "uuid",
    "status": "in_delivery",
    "accepted_at": "2024-12-25T10:00:00Z"
  }
}
```

**Workflow**:
1. Verify order status is `waiting_driver`
2. Check driver is available
3. Assign driver to order
4. Update order status to `in_delivery`
5. Notify business and user
6. Return success

**Error Responses**:
- `400`: Order not available or driver not available
- `404`: Order not found
- `409`: Order already assigned

---

#### 6.4.12 Mark Order as Delivered
**Endpoint**: `POST /api/driver/orders/:id/deliver`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Driver role)

**Path Parameters**:
- `id`: Order ID (UUID)

**Response** (200):
```json
{
  "success": true,
  "message": "Order marked as delivered successfully",
  "data": {
    "orderId": "uuid",
    "status": "completed",
    "delivered_at": "2024-12-25T10:30:00Z"
  }
}
```

**Workflow**:
1. Verify order is assigned to driver
2. Check order status is `in_delivery`
3. Update order status to `completed`
4. Calculate driver earnings (delivery fee)
5. Update driver earnings
6. Award points to user
7. Send rating request to user
8. Notify business and user
9. Return success

**Note**: Status should be `completed`, not `delivered` (as per schema)

---

#### 6.4.13 Get Earnings
**Endpoint**: `GET /api/driver/earnings?startDate=2024-01-01&endDate=2024-12-31`

**Rate Limiter**: `generalLimiter`

**Authentication**: Required (Driver role)

**Query Parameters**:
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)

**Response** (200):
```json
{
  "success": true,
  "message": "Driver earnings retrieved successfully",
  "data": {
    "period": {
      "start": "2024-01-01",
      "end": "2024-12-31"
    },
    "summary": {
      "total_orders": 150,
      "total_earnings": 750000,
      "platform_fees": 150000,
      "net_earnings": 600000
    },
    "breakdown": {
      "cash_earnings": 300000,
      "online_earnings": 450000,
      "platform_fees_owed": 150000
    },
    "orders": [
      {
        "order_id": "uuid",
        "order_number": "ORD-20241225-001",
        "delivery_fee": 5000,
        "payment_method": "cash",
        "completed_at": "2024-12-25T10:30:00Z"
      }
    ]
  }
}
```

---

### 6.5 Cashier Management API

**Base URL**: `/api/cashier`

#### 6.5.1 Authentication

**Login Cashier**: `POST /api/cashier/login`
```json
{
  "email": "cashier@restaurant.com",
  "password": "cashierpassword123"
}
```

#### 6.5.2 Profile

**Get Profile**: `GET /api/cashier/profile`
- Returns cashier profile with business information

#### 6.5.3 Order Management

**Get Orders**: `GET /api/cashier/orders?page=1&limit=20&status=pending`
- Returns orders for cashier's business

**Update Order Status**: `PUT /api/cashier/orders/:id/status`
```json
{
  "status": "preparing"
}
```

#### 6.5.4 Product Management

**Get Products**: `GET /api/cashier/products?page=1&limit=20`
**Update Product Availability**: `PUT /api/cashier/products/:id/availability`
```json
{
  "is_available": false
}
```

#### 6.5.5 Payment Processing

**Process Payment**: `POST /api/cashier/orders/:id/payment`
```json
{
  "payment_method": "cash",
  "amount": 50000
}
```

#### 6.5.6 QR Code Scanning

**Scan QR Code**: `POST /api/cashier/qr/scan`
```json
{
  "qr_code": "QR_CODE_STRING"
}
```
- Validates and processes QR codes for payments, discounts, reservations, orders

#### 6.5.7 Reports

**Daily Reports**: `GET /api/cashier/reports/daily?date=2024-12-25`
**Statistics**: `GET /api/cashier/statistics?startDate=2024-01-01&endDate=2024-12-31`
**Operations**: `GET /api/cashier/operations?page=1&limit=50`

---

### 6.6 Order Management API

**Base URL**: `/api/orders`

**Authentication**: Required (User role)

#### 6.6.1 Create Order

**Endpoint**: `POST /api/orders`

**Request Body**:
```json
{
  "business_id": "uuid",
  "order_type": "delivery",
  "payment_method": "online",
  "address_id": "uuid",
  "items": [
    {
      "product_id": "uuid",
      "quantity": 2,
      "preferences": {
        "size": "large",
        "extras": ["cheese", "bacon"]
      }
    }
  ],
  "delivery_notes": "Ring doorbell"
}
```

**Workflow**:
1. Validate business exists and is active
2. Validate products exist and are available
3. Calculate subtotal (sum of item prices)
4. Apply partner discount (10% of subtotal)
5. Calculate platform fee (2% of subtotal)
6. Calculate delivery fee (if delivery type)
7. Calculate final amount
8. Create order with status `pending`
9. Create order items
10. Generate unique order number
11. Create transaction record
12. Notify business
13. Return order details

**Response** (201):
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order": {
      "id": "uuid",
      "order_number": "ORD-20241225-001",
      "status": "pending",
      "total_amount": 100000,
      "discount_amount": 10000,
      "platform_fee": 2000,
      "delivery_fee": 5000,
      "final_amount": 97000
    }
  }
}
```

#### 6.6.2 Get Order Details

**Endpoint**: `GET /api/orders/:id`

**Response**: Complete order details with items, business, driver, and payment information

#### 6.6.3 Update Order

**Endpoint**: `PUT /api/orders/:id`

**Allowed Updates** (only if status is `pending`):
- `delivery_address`
- `delivery_notes`

#### 6.6.4 Cancel Order

**Endpoint**: `DELETE /api/orders/:id`

**Workflow**:
1. Check order status (only `pending` or `accepted` can be cancelled)
2. Update status to `cancelled`
3. Refund payment if already paid
4. Create refund transaction
5. Notify business and driver (if assigned)

#### 6.6.5 Get User Orders

**Endpoint**: `GET /api/orders/user?page=1&limit=20&status=completed`

**Query Parameters**:
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status

#### 6.6.6 Calculate Cart Total

**Endpoint**: `POST /api/orders/cart`

**Request Body**:
```json
{
  "items": [
    {
      "product_id": "uuid",
      "quantity": 2
    }
  ],
  "order_type": "delivery",
  "address_id": "uuid"
}
```

**Response**: Calculated totals (subtotal, discount, fees, final amount)

#### 6.6.7 Track Order

**Endpoint**: `GET /api/orders/track/:id`

**Response**: Real-time order status and driver location (if in delivery)

---

### 6.7 Reservation Management API

**Base URL**: `/api/reservations`

**Authentication**: Required (User role)

#### 6.7.1 Create Reservation

**Endpoint**: `POST /api/reservations`

**Request Body**:
```json
{
  "business_id": "uuid",
  "reservation_type": "table",
  "date": "2024-12-25",
  "time": "19:30",
  "duration": 120,
  "number_of_people": 4,
  "payment_method": "online",
  "notes": "Window seat preferred",
  "amount": 50000
}
```

**Reservation Types**:
- `table`: Restaurant/cafe table reservation
- `activity`: Recreational activity booking
- `medical`: Medical appointment
- `beauty`: Beauty salon appointment

**Workflow**:
1. Validate business exists and accepts reservations
2. Check availability for date/time slot
3. Calculate discount (10% if applicable)
4. Generate unique QR code
5. Create reservation with status `pending`
6. Create transaction record
7. Send notification to business
8. Award points to user
9. Return reservation details

**Response** (201):
```json
{
  "success": true,
  "message": "Reservation created successfully",
  "data": {
    "reservation": {
      "id": "uuid",
      "business_id": "uuid",
      "reservation_type": "table",
      "date": "2024-12-25",
      "time": "19:30",
      "duration": 120,
      "number_of_people": 4,
      "status": "pending",
      "payment_status": "pending",
      "qr_code": "RES-20241225-ABC123",
      "total_amount": 50000,
      "discount_amount": 5000,
      "final_amount": 45000
    }
  }
}
```

#### 6.7.2 Get User Reservations

**Endpoint**: `GET /api/reservations?page=1&limit=20&status=pending&upcoming=true`

**Query Parameters**:
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status (`pending`, `confirmed`, `cancelled`, `completed`, `expired`)
- `upcoming`: Show only upcoming (`true`/`false`)

#### 6.7.3 Get Reservation Details

**Endpoint**: `GET /api/reservations/:id`

**Response**: Complete reservation details with business information and QR code

#### 6.7.4 Update Reservation

**Endpoint**: `PUT /api/reservations/:id`

**Allowed Updates** (only if status is `pending` or `confirmed`):
- `time`: New reservation time (must be at least 2 hours in advance)
- `duration`: New duration
- `number_of_people`: New number of people
- `notes`: Updated notes

#### 6.7.5 Cancel Reservation

**Endpoint**: `DELETE /api/reservations/:id/cancel`

**Request Body** (optional):
```json
{
  "reason": "Emergency situation"
}
```

**Workflow**:
1. Update status to `cancelled`
2. Determine refund eligibility based on cancellation policy
3. Create refund transaction if eligible
4. Notify business

#### 6.7.6 Check Availability

**Endpoint**: `GET /api/reservations/availability?businessId=uuid&date=2024-12-25&duration=60`

**Response**:
```json
{
  "success": true,
  "data": {
    "business_id": "uuid",
    "date": "2024-12-25",
    "duration": 60,
    "available_slots": ["18:00", "18:30", "19:00", "19:30", "20:00"]
  }
}
```

#### 6.7.7 Rate Reservation

**Endpoint**: `POST /api/reservations/:id/rate`

**Request Body**:
```json
{
  "stars": 5,
  "comment": "Excellent service and great food!"
}
```

**Workflow**:
1. Verify reservation is `completed`
2. Create rating record
3. Update business rating average
4. Award points to user (2 points)

---

### 6.8 Payment Processing API

**Base URL**: `/api/payments`

**Authentication**: Required

#### 6.8.1 Wallet Top-up

**Endpoint**: `POST /api/payments/wallet/topup`

**Request Body**:
```json
{
  "amount": 50000,
  "payment_method": "online"
}
```

**Workflow**:
1. Process payment through payment gateway
2. Update wallet balance
3. Create transaction record
4. Send confirmation notification

#### 6.8.2 Process Payment

**Endpoint**: `POST /api/payments/process`

**Request Body**:
```json
{
  "reference_type": "order",
  "reference_id": "uuid",
  "payment_method": "wallet",
  "amount": 97000
}
```

**Workflow**:
1. Validate reference (order/reservation) exists
2. Check payment method
3. If `wallet`: Deduct from user wallet
4. If `online`: Process through payment gateway
5. Update payment status
6. Create transaction record
7. Send confirmation notification

#### 6.8.3 Verify Payment

**Endpoint**: `POST /api/payments/verify`

**Request Body**:
```json
{
  "transaction_id": "uuid",
  "payment_reference": "payment_gateway_reference"
}
```

#### 6.8.4 Process Refund

**Endpoint**: `POST /api/payments/refund`

**Request Body**:
```json
{
  "transaction_id": "uuid",
  "amount": 50000,
  "reason": "Order cancelled"
}
```

#### 6.8.5 Get Wallet Balance

**Endpoint**: `GET /api/payments/wallet/balance`

#### 6.8.6 Get Wallet History

**Endpoint**: `GET /api/payments/wallet/history?page=1&limit=20`

---

### 6.9 QR Code Management API

**Base URL**: `/api/qr`

**Authentication**: Required

#### 6.9.1 Generate QR Code

**Endpoint**: `POST /api/qr/generate`

**Request Body**:
```json
{
  "type": "payment",
  "reference_id": "uuid",
  "amount": 50000,
  "expires_in": 3600
}
```

**QR Code Types**:
- `payment`: Payment QR code
- `discount`: Discount QR code
- `reservation`: Reservation QR code
- `order`: Order QR code
- `driver_pickup`: Driver pickup QR code

**Response**:
```json
{
  "success": true,
  "data": {
    "qr_code": "QR_CODE_STRING",
    "type": "payment",
    "expires_at": "2024-12-25T20:00:00Z"
  }
}
```

#### 6.9.2 Validate QR Code

**Endpoint**: `POST /api/qr/validate`

**Request Body**:
```json
{
  "qr_code": "QR_CODE_STRING"
}
```

#### 6.9.3 Scan QR Code

**Endpoint**: `POST /api/qr/scan`

**Request Body**:
```json
{
  "qr_code": "QR_CODE_STRING",
  "scanner_type": "cashier"
}
```

**Workflow**:
1. Validate QR code exists and is not expired
2. Check if already used
3. Process based on QR type:
   - `payment`: Process payment
   - `discount`: Apply discount
   - `reservation`: Confirm reservation
   - `order`: Confirm order pickup
4. Mark QR code as used
5. Create cashier operation log (if scanned by cashier)

---

### 6.10 Rating & Review API

**Base URL**: `/api/ratings`

**Authentication**: Required (User role)

#### 6.10.1 Submit Rating

**Endpoint**: `POST /api/ratings`

**Request Body**:
```json
{
  "business_id": "uuid",
  "order_id": "uuid",
  "reservation_id": null,
  "driver_id": null,
  "rating": 5,
  "comment": "Excellent service!"
}
```

**Workflow**:
1. Validate order/reservation is completed
2. Check if user already rated
3. Create rating record
4. Update business/driver rating average
5. Award points to user (2 points)

#### 6.10.2 Get Business Ratings

**Endpoint**: `GET /api/ratings/business/:id?page=1&limit=20`

#### 6.10.3 Get Driver Ratings

**Endpoint**: `GET /api/ratings/driver/:id?page=1&limit=20`

---

### 6.11 AI Assistant API

**Base URL**: `/api/ai`

**Authentication**: Required (User role)

#### 6.11.1 Get Recommendations

**Endpoint**: `GET /api/ai/recommendations?city=Alexandria&preferences=food`

**Response**: Personalized business and product recommendations

#### 6.11.2 Chat with AI

**Endpoint**: `POST /api/ai/chat`

**Request Body**:
```json
{
  "message": "What restaurants are open near me?",
  "context": {
    "location": {
      "latitude": 31.2001,
      "longitude": 29.9187
    }
  }
}
```

**Response**: AI-generated response with recommendations

---

### 6.12 City & Location API

**Base URL**: `/api/cities`

**Public Endpoint** (No authentication required)

#### 6.12.1 Get All Cities

**Endpoint**: `GET /api/cities`

#### 6.12.2 Search Cities

**Endpoint**: `GET /api/cities/search?query=Alex`

#### 6.12.3 Get Governorates

**Endpoint**: `GET /api/cities/governorates`

#### 6.12.4 Get Cities by Governorate

**Endpoint**: `GET /api/cities/governorate/:governorate_code`

#### 6.12.5 Get City Details

**Endpoint**: `GET /api/cities/:cityName`

---

### 6.13 Admin Dashboard API

**Base URL**: `/api/admin`

**Authentication**: Required (Admin role)

**Note**: Admin routes are in `Admin-Dashboard/admin.routes.js`

**Common Endpoints**:
- User management
- Business management
- Driver management
- Financial reports
- System analytics
- Content moderation

---

## 7. Business Logic & Workflows

### 7.1 Order Processing Workflow

```
1. User creates order
   ↓
2. Order status: PENDING
   ↓
3. Business receives notification
   ↓
4. Business accepts/rejects order
   ├─ REJECTED → Order cancelled, refund processed
   └─ ACCEPTED → Order status: ACCEPTED
       ↓
5. Business prepares order
   ↓
6. Order status: PREPARING
   ↓
7. If delivery type:
   ├─ Find available driver
   ├─ Assign driver to order
   ├─ Order status: WAITING_DRIVER
   ├─ Driver accepts order
   ├─ Order status: IN_DELIVERY
   ├─ Driver delivers order
   └─ Order status: COMPLETED
   ↓
8. If pickup type:
   ├─ Order status: PREPARING
   ├─ User picks up order
   └─ Order status: COMPLETED
   ↓
9. Payment processed
10. Points awarded to user
11. Rating request sent
```

### 7.2 Reservation Processing Workflow

```
1. User creates reservation
   ↓
2. Check business availability
   ↓
3. Reservation status: PENDING
   ↓
4. Generate QR code
   ↓
5. Business receives notification
   ↓
6. Business confirms reservation
   ├─ Reservation status: CONFIRMED
   └─ Payment processed (if required)
   ↓
7. User arrives at business
   ↓
8. Cashier scans QR code
   ↓
9. Reservation status: COMPLETED
   ↓
10. Points awarded to user
11. Rating request sent
```

### 7.3 Payment Processing Workflow

```
1. Payment request received
   ↓
2. Determine payment method
   ├─ CASH: Mark as pending, complete on delivery
   ├─ WALLET: Check balance, deduct amount
   └─ ONLINE: Process through payment gateway
       ↓
3. Payment gateway response
   ├─ SUCCESS: Update payment status to PAID
   └─ FAILED: Update payment status to FAILED
   ↓
4. Create transaction record
   ↓
5. Update order/reservation payment status
   ↓
6. Send confirmation notification
```

### 7.4 Financial Calculations

#### Order Financial Flow

```
Subtotal = Σ(item_price × quantity)
Partner Discount = Subtotal × 10%
Platform Fee = Subtotal × 2%
Delivery Fee = calculateDeliveryFee(distance)
Final Amount = Subtotal - Partner Discount + Platform Fee + Delivery Fee
```

#### Reservation Financial Flow

```
Total Amount = reservation_amount (if provided)
Partner Discount = Total Amount × 10%
Final Amount = Total Amount - Partner Discount
```

#### Driver Earnings

```
Driver Earnings = Delivery Fee
Platform Fee Owed = Delivery Fee × 20% (example)
Net Earnings = Driver Earnings - Platform Fee Owed
```

### 7.5 Points System

**Points Earning**:
- Order completion: 10 points per 1000 EGP spent
- Reservation completion: 5 points
- Rating submission: 2 points
- First order bonus: 50 points

**Points Redemption**:
- 100 points = 10 EGP discount
- Can be used for orders and reservations

---

## 8. Services Layer

### 8.1 Payment Service

**File**: `services/payment.service.js`

**Functions**:
- `processPayment()`: Process payment through gateway
- `processRefund()`: Process refunds
- `verifyPayment()`: Verify payment status

### 8.2 Notification Service

**File**: `services/notification.service.js`

**Functions**:
- `sendOrderNotification()`: Send order updates
- `sendReservationNotification()`: Send reservation updates
- `sendPaymentNotification()`: Send payment confirmations

**Channels**:
- Email (via Nodemailer)
- SMS (via SMS service)
- Push notifications (future)

### 8.3 QR Code Service

**File**: `services/qr.service.js`

**Functions**:
- `generateQRCode()`: Generate unique QR codes
- `validateQRCode()`: Validate QR code
- `processQRScan()`: Process QR code scan

### 8.4 Maps Service

**File**: `services/maps.service.js`

**Functions**:
- `calculateDistance()`: Calculate distance between two points
- `geocodeAddress()`: Convert address to coordinates
- `reverseGeocode()`: Convert coordinates to address

### 8.5 AI Assistant Service

**File**: `services/ai-assistant.service.js`

**Functions**:
- `getRecommendations()`: Get personalized recommendations
- `chat()`: Handle AI chat interactions

### 8.6 Cache Service

**File**: `services/cache.service.js`

**Functions**:
- `get()`: Get cached data
- `set()`: Set cached data
- `delete()`: Delete cached data

### 8.7 Points Service

**File**: `services/points.service.js`

**Functions**:
- `awardPoints()`: Award points to user
- `redeemPoints()`: Redeem points for discount
- `getPointsBalance()`: Get user points balance

---

## 9. Error Handling

### 9.1 Error Response Format

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error description",
  "code": "ERROR_CODE"
}
```

### 9.2 HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Validation errors |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., duplicate) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server errors |

### 9.3 Common Error Codes

- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_ERROR`: Authentication failed
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `DUPLICATE_ENTRY`: Duplicate resource
- `PAYMENT_ERROR`: Payment processing failed
- `DATABASE_ERROR`: Database operation failed

---

## 10. Security

### 10.1 Authentication

- **JWT Tokens**: Stateless authentication
- **Token Expiration**: Configurable (default: 24 hours)
- **Password Hashing**: bcrypt with salt rounds (12)

### 10.2 Authorization

- **Role-Based Access Control (RBAC)**: Different roles have different permissions
- **Resource Ownership**: Users can only access their own resources
- **Business Access**: Businesses can only access their own data

### 10.3 Rate Limiting

**Rate Limiters**:
- `generalLimiter`: 100 requests per 15 minutes
- `authLimiter`: 5 requests per 15 minutes (login/register)
- `orderLimiter`: 20 requests per 15 minutes
- `reservationLimiter`: 10 requests per 15 minutes
- `strictLimiter`: 50 requests per 15 minutes

### 10.4 Input Validation

- All inputs validated using `express-validator`
- SQL injection prevention via Prisma ORM
- XSS prevention via input sanitization

### 10.5 CORS

- Configured for specific origins
- Credentials enabled for authenticated requests

---

## 11. Testing

### 11.1 Test Data

**Seed Scripts**:
- `scripts/seed.js`: Main seed script
- `scripts/seed-dashboard-data.js`: Dashboard test data
- `scripts/seed-alexandria-businesses.js`: Alexandria businesses

### 11.2 Test Credentials

**User**:
- Email: `user@test.com`
- Password: `password123`

**Business**:
- Email: `restaurant@test.com`
- Password: `password123`

**Driver**:
- Email: `driver@test.com`
- Password: `password123`

### 11.3 Postman Collections

- `Business_Module_Postman_Collection.json`: Business API endpoints
- `Reservation_API_Postman_Collection.json`: Reservation API endpoints

---

## 12. Deployment

### 12.1 Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=24h

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_BUCKET_NAME=your_bucket_name
AWS_REGION=your_region

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password

# Payment Gateway
STRIPE_SECRET_KEY=your_stripe_key

# Server
PORT=3119
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-url.com
```

### 12.2 Deployment Steps

1. **Database Setup**:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start Server**:
   ```bash
   npm start
   ```

### 12.3 Production Considerations

- Use environment variables for all secrets
- Enable HTTPS
- Set up proper logging
- Configure monitoring
- Set up backup strategy
- Use process manager (PM2)

---

## 13. API Reference Summary

### Complete Endpoint List

This section provides a comprehensive list of all API endpoints in the CSY Backend system.

#### 13.1 Authentication API (`/api/auth`) - 10 Endpoints

1. `POST /api/auth/register` - Register new user
2. `POST /api/auth/login` - User login
3. `POST /api/auth/verify-email` - Verify email address
4. `POST /api/auth/resend-verification` - Resend verification email
5. `POST /api/auth/forgot-password` - Request password reset
6. `POST /api/auth/reset-password` - Reset password with token
7. `POST /api/auth/logout` - Logout user (authenticated)
8. `POST /api/auth/refresh` - Refresh access token (authenticated)
9. `POST /api/auth/send-otp` - Send OTP to phone
10. `POST /api/auth/verify-otp` - Verify OTP code

#### 13.2 User Management API (`/api/user`) - 18 Endpoints

1. `GET /api/user/profile` - Get user profile
2. `PUT /api/user/profile` - Update user profile
3. `PUT /api/user/password` - Change password
4. `DELETE /api/user/deactivate` - Deactivate account
5. `GET /api/user/addresses` - Get all addresses
6. `POST /api/user/addresses` - Add new address
7. `PUT /api/user/addresses/:id` - Update address
8. `DELETE /api/user/addresses/:id` - Delete address
9. `GET /api/user/wallet` - Get wallet information
10. `GET /api/user/points` - Get points information
11. `PUT /api/user/assistant-name` - Update AI assistant name
12. `POST /api/user/wallet/add` - Add wallet balance
13. `GET /api/user/wallet/history` - Get wallet transaction history
14. `GET /api/user/points/history` - Get points transaction history
15. `GET /api/user/visit-history` - Get business visit history
16. `GET /api/user/notifications` - Get notifications
17. `PUT /api/user/notifications/:id` - Mark notification as read
18. `DELETE /api/user/account` - Delete account permanently

#### 13.3 Business Management API (`/api/business`) - 38 Endpoints

**Public Endpoints (3):**
1. `POST /api/business/register` - Register new business
2. `POST /api/business/login` - Business login
3. `GET /api/business` - Get all businesses (public)
4. `GET /api/business/:id` - Get public business profile
5. `GET /api/business/:id/products` - Get public business products

**Authenticated Endpoints (33):**
6. `GET /api/business/profile` - Get business profile
7. `PUT /api/business/profile` - Update business profile
8. `PUT /api/business/working-hours` - Update working hours
9. `POST /api/business/photos` - Upload photos
10. `DELETE /api/business/photos/:id` - Delete photo
11. `GET /api/business/cashiers` - Get cashiers
12. `POST /api/business/cashiers` - Create cashier
13. `PUT /api/business/cashiers/:id` - Update cashier
14. `DELETE /api/business/cashiers/:id` - Delete cashier
15. `GET /api/business/financials` - Get financial records
16. `GET /api/business/offers` - Get offers
17. `POST /api/business/offers` - Create offer
18. `PUT /api/business/offers/:id` - Update offer
19. `DELETE /api/business/offers/:id` - Delete offer
20. `PUT /api/business/orders/:id/accept` - Accept order
21. `PUT /api/business/orders/:id/reject` - Reject order
22. `GET /api/business/orders` - Get orders
23. `GET /api/business/appointments` - Get appointments
24. `POST /api/business/appointments` - Add appointment
25. `PUT /api/business/appointments/:id` - Update appointment
26. `DELETE /api/business/appointments/:id` - Delete appointment
27. `POST /api/business/products` - Add product
28. `GET /api/business/products` - Get products
29. `PUT /api/business/products/:id` - Update product
30. `DELETE /api/business/products/:id` - Delete product
31. `GET /api/business/analytics` - Get analytics
32. `GET /api/business/operations-log` - Get operations log
33. `GET /api/business/dashboard` - Get dashboard data
34. `POST /api/business/categories` - Create category
35. `GET /api/business/categories` - Get categories
36. `PUT /api/business/categories/:id` - Update category
37. `DELETE /api/business/categories/:id` - Delete category
38. `GET /api/business/reservations` - Get reservations

#### 13.4 Driver Management API (`/api/driver`) - 12 Endpoints

**Public Endpoints (2):**
1. `POST /api/driver/register` - Register new driver
2. `POST /api/driver/login` - Driver login

**Authenticated Endpoints (10):**
3. `GET /api/driver/profile` - Get driver profile
4. `PUT /api/driver/profile` - Update driver profile
5. `PUT /api/driver/location` - Update location
6. `PUT /api/driver/availability` - Update availability
7. `GET /api/driver/orders/incoming` - Get incoming orders
8. `GET /api/driver/orders/accepted` - Get accepted orders
9. `GET /api/driver/orders/in-delivery` - Get in-delivery orders
10. `GET /api/driver/orders` - Get all orders
11. `POST /api/driver/orders/:id/accept` - Accept order
12. `POST /api/driver/orders/:id/deliver` - Mark order as delivered
13. `GET /api/driver/earnings` - Get earnings

#### 13.5 Cashier Management API (`/api/cashier`) - 10 Endpoints

**Public Endpoints (1):**
1. `POST /api/cashier/login` - Cashier login

**Authenticated Endpoints (9):**
2. `GET /api/cashier/profile` - Get cashier profile
3. `GET /api/cashier/orders` - Get business orders
4. `PUT /api/cashier/orders/:id/status` - Update order status
5. `GET /api/cashier/products` - Get business products
6. `PUT /api/cashier/products/:id/availability` - Update product availability
7. `POST /api/cashier/orders/:id/payment` - Process payment
8. `GET /api/cashier/reports/daily` - Get daily sales report
9. `GET /api/cashier/statistics` - Get cashier statistics
10. `POST /api/cashier/qr/scan` - Scan QR code
11. `GET /api/cashier/operations` - Get operations history

#### 13.6 Order Management API (`/api/orders`) - 7 Endpoints

**All endpoints require authentication:**
1. `POST /api/orders` - Create new order
2. `GET /api/orders/:id` - Get order details
3. `PUT /api/orders/:id` - Update order
4. `DELETE /api/orders/:id` - Cancel order
5. `GET /api/orders/user` - Get user orders
6. `POST /api/orders/cart` - Calculate cart total
7. `GET /api/orders/track/:id` - Track order location

#### 13.7 Reservation Management API (`/api/reservations`) - 7 Endpoints

**All endpoints require authentication:**
1. `POST /api/reservations` - Create reservation
2. `GET /api/reservations` - Get user reservations
3. `GET /api/reservations/:id` - Get reservation details
4. `PUT /api/reservations/:id` - Update reservation
5. `DELETE /api/reservations/:id/cancel` - Cancel reservation
6. `GET /api/reservations/availability` - Get available time slots
7. `POST /api/reservations/:id/rate` - Rate reservation

#### 13.8 Payment Processing API (`/api/payments`) - 6 Endpoints

**All endpoints require authentication:**
1. `POST /api/payments/wallet/topup` - Add balance to wallet
2. `POST /api/payments/process` - Process payment for order
3. `POST /api/payments/verify` - Verify payment status
4. `POST /api/payments/refund` - Process refund
5. `GET /api/payments/wallet/balance` - Get wallet balance
6. `GET /api/payments/wallet/history` - Get wallet transaction history

#### 13.9 QR Code Management API (`/api/qr`) - 3 Endpoints

**All endpoints require authentication:**
1. `POST /api/qr/generate` - Generate QR code
2. `POST /api/qr/validate` - Validate QR code
3. `POST /api/qr/scan` - Scan and process QR code

#### 13.10 Rating & Review API (`/api/ratings`) - 3 Endpoints

**All endpoints require authentication:**
1. `POST /api/ratings` - Submit rating
2. `GET /api/ratings/business/:id` - Get business ratings
3. `GET /api/ratings/driver/:id` - Get driver ratings

#### 13.11 AI Assistant API (`/api/ai`) - 2 Endpoints

**All endpoints require authentication:**
1. `GET /api/ai/recommendations` - Get personalized recommendations
2. `POST /api/ai/chat` - Chat with AI assistant

#### 13.12 City & Location API (`/api/cities`) - 5 Endpoints

**All endpoints are public (no authentication required):**
1. `GET /api/cities` - Get all cities
2. `GET /api/cities/search` - Search cities
3. `GET /api/cities/governorates` - Get all governorates with cities
4. `GET /api/cities/governorate/:governorate_code` - Get cities by governorate
5. `GET /api/cities/:cityName` - Get city details

#### 13.13 Admin Dashboard API (`/api/admin`) - 20 Endpoints

**Public Endpoints (2):**
1. `POST /api/admin/login` - Admin login
2. `GET /api/admin/system/health` - Get system health

**Authenticated Endpoints (18):**
3. `GET /api/admin/me` - Get admin profile
4. `PATCH /api/admin/update-activestatus` - Update active status
5. `PATCH /api/admin/update-password` - Update password
6. `GET /api/admin/dashboard/stats` - Get dashboard statistics
7. `GET /api/admin/dashboard/revenue-chart` - Get revenue chart data
8. `GET /api/admin/dashboard/user-growth` - Get user growth data
9. `GET /api/admin/users` - Get all users
10. `GET /api/admin/users/:id` - Get user by ID
11. `PATCH /api/admin/users/:id/status` - Update user status
12. `DELETE /api/admin/users/:id` - Delete user
13. `GET /api/admin/businesses` - Get all businesses
14. `GET /api/admin/businesses/:id` - Get business by ID
15. `PATCH /api/admin/businesses/:id/status` - Update business status
16. `DELETE /api/admin/businesses/:id` - Delete business
17. `GET /api/admin/drivers` - Get all drivers
18. `GET /api/admin/drivers/:id` - Get driver by ID
19. `PATCH /api/admin/drivers/:id/status` - Update driver status
20. `GET /api/admin/transactions` - Get all transactions
21. `GET /api/admin/transactions/:id` - Get transaction by ID
22. `GET /api/admin/subscriptions` - Get all subscriptions

### 13.14 Total Endpoint Count

**Summary by Module:**
- Authentication API: 10 endpoints
- User Management API: 18 endpoints
- Business Management API: 38 endpoints
- Driver Management API: 12 endpoints
- Cashier Management API: 10 endpoints
- Order Management API: 7 endpoints
- Reservation Management API: 7 endpoints
- Payment Processing API: 6 endpoints
- QR Code Management API: 3 endpoints
- Rating & Review API: 3 endpoints
- AI Assistant API: 2 endpoints
- City & Location API: 5 endpoints
- Admin Dashboard API: 20 endpoints

**Total: 141 API Endpoints**

### 13.15 Authentication Requirements

**Public Endpoints (No Authentication Required):**
- All `/api/auth` endpoints (except logout and refresh)
- `/api/business/register`, `/api/business/login`
- `/api/business` (GET - list businesses)
- `/api/business/:id` (GET - public profile)
- `/api/business/:id/products` (GET - public products)
- `/api/driver/register`, `/api/driver/login`
- `/api/cashier/login`
- `/api/admin/login`, `/api/admin/system/health`
- All `/api/cities` endpoints

**Authenticated Endpoints (Require JWT Token):**
- All other endpoints require valid JWT token in `Authorization: Bearer <token>` header
- Role-based access control applies (User, Business, Driver, Cashier, Admin)

### 13.16 Rate Limiting

All endpoints are protected by rate limiters:
- `generalLimiter`: 100 requests per 15 minutes (most endpoints)
- `authLimiter`: 5 requests per 15 minutes (authentication endpoints)
- `strictLimiter`: 10 requests per 15 minutes (sensitive operations)
- `businessRegistrationLimiter`: 3 requests per hour (business registration)
- `orderLimiter`: 50 requests per 15 minutes (order operations)

### 13.17 Response Format

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

### 13.18 HTTP Status Codes

- `200 OK`: Successful GET, PUT, PATCH, DELETE requests
- `201 Created`: Successful POST requests (resource created)
- `400 Bad Request`: Invalid request data or validation error
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate email)
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### 13.1 Endpoint Summary

| Module | Base URL | Endpoints | Auth Required |
|--------|----------|-----------|---------------|
| **Auth** | `/api/auth` | 10 | No (except refresh/logout) |
| **User** | `/api/user` | 15 | Yes (User) |
| **Business** | `/api/business` | 35+ | Mixed |
| **Driver** | `/api/driver` | 12 | Yes (Driver) |
| **Cashier** | `/api/cashier` | 10 | Yes (Cashier) |
| **Orders** | `/api/orders` | 7 | Yes (User) |
| **Reservations** | `/api/reservations` | 7 | Yes (User) |
| **Payments** | `/api/payments` | 6 | Yes |
| **QR Codes** | `/api/qr` | 3 | Yes |
| **Ratings** | `/api/ratings` | 3 | Yes (User) |
| **AI** | `/api/ai` | 2 | Yes (User) |
| **Cities** | `/api/cities` | 5 | No |
| **Admin** | `/api/admin` | Multiple | Yes (Admin) |

### 13.2 Total Endpoints

**Approximately 125+ API endpoints** across all modules.

### 13.3 API Documentation

- **Swagger UI**: Available at `/api-docs` when server is running
- **Health Check**: `GET /health`

---

## Conclusion

This documentation provides a comprehensive overview of the CSY Backend system. For specific implementation details, refer to the source code and inline comments.

**For Support**: Contact the development team or refer to the project repository.

---

**Document Version**: 1.0.0  
**Last Updated**: December 2024

