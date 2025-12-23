# CSY Backend - Complete User Role System Guide

**Version:** 2.0  
**Last Updated:** 2024  
**Document Type:** Technical Documentation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Role System Overview](#role-system-overview)
3. [Role Hierarchy and Permissions](#role-hierarchy-and-permissions)
4. [Authentication Flow](#authentication-flow)
5. [JWT Token Structure](#jwt-token-structure)
6. [User Roles in Detail](#user-roles-in-detail)
7. [Implementation Details](#implementation-details)
8. [API Endpoints by Role](#api-endpoints-by-role)
9. [Security Considerations](#security-considerations)
10. [Code Examples](#code-examples)
11. [Troubleshooting](#troubleshooting)

---

## Executive Summary

The CSY Backend implements a **comprehensive role-based access control (RBAC) system** that supports five distinct user types: **User**, **Cashier**, **Driver**, **Business**, and **Admin**. Each role has specific permissions and access levels, ensuring secure and appropriate access to system resources.

### Key Features

- ✅ **Role-based authentication** with separate login endpoints
- ✅ **JWT token-based authorization** with role embedded in token
- ✅ **Hierarchical permission system** with numeric role levels
- ✅ **Middleware-based access control** for route protection
- ✅ **Backward compatible** with fallback role assignment

---

## Role System Overview

### System Architecture

The role system operates on three main components:

1. **Authentication Layer** - Verifies user credentials and generates tokens
2. **Authorization Layer** - Checks role permissions via middleware
3. **Token Layer** - Stores role information in JWT tokens

### Role Assignment Flow

```
User Login → Token Generation (with role) → Request with Token → 
Middleware Verification → Role Extraction → Access Control
```

---

## Role Hierarchy and Permissions

### Role Levels

Roles are defined with numeric levels that determine permission hierarchy:

| Role | Level | Description | Access Level |
|------|-------|-------------|--------------|
| **User** | 1 | Regular application users | Basic user features |
| **Cashier** | 2 | Business cashiers | Business operations |
| **Driver** | 3 | Delivery drivers | Delivery management |
| **Business** | 4 | Business owners | Business management |
| **Admin** | 5 | System administrators | Full system access |

### Permission Matrix

| Feature | User | Cashier | Driver | Business | Admin |
|---------|------|---------|--------|----------|-------|
| View Profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit Profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| Place Orders | ✅ | ❌ | ❌ | ❌ | ✅ |
| Manage Orders | ❌ | ✅ | ✅ | ✅ | ✅ |
| View Business Dashboard | ❌ | ✅ | ❌ | ✅ | ✅ |
| Manage Products | ❌ | ✅ | ❌ | ✅ | ✅ |
| Accept Deliveries | ❌ | ❌ | ✅ | ❌ | ✅ |
| Manage Cashiers | ❌ | ❌ | ❌ | ✅ | ✅ |
| System Configuration | ❌ | ❌ | ❌ | ❌ | ✅ |
| User Management | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Authentication Flow

### 1. User Authentication

**Endpoint:** `POST /api/auth/login`  
**Controller:** `controllers/auth.controller.js`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Process:**
1. Validate credentials
2. Verify user exists and is active
3. Generate JWT token with `role: 'user'`
4. Return user data and token

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "full_name": "John Doe",
      "email": "user@example.com",
      "phone": "+1234567890",
      "pass_id": "DM-12345",
      "governorate_code": "DM",
      "wallet_balance": 100.00,
      "points": 500,
      "is_verified": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Business Authentication

**Endpoint:** `POST /api/business/login`  
**Controller:** `controllers/business.controller.js`

**Request:**
```json
{
  "email": "owner@business.com",
  "password": "password123"
}
```

**Process:**
1. Validate credentials
2. Verify business exists and is active
3. Generate JWT token with `role: 'business'`
4. Return business data and token

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "business": {
      "id": "uuid",
      "owner_email": "owner@business.com",
      "business_name": "Restaurant Name",
      "business_type": "restaurant",
      "app_type": "go",
      "address": "123 Main St",
      "city": "Damietta",
      "governorate": "Damietta",
      "is_active": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Driver Authentication

**Endpoint:** `POST /api/driver/login`  
**Controller:** `controllers/driver.controller.js`

**Request:**
```json
{
  "email": "driver@example.com",
  "password": "password123"
}
```

**Process:**
1. Validate credentials
2. Verify driver exists and is active
3. Generate JWT token with `role: 'driver'`
4. Return driver data and token

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "driver": {
      "id": "uuid",
      "full_name": "Driver Name",
      "email": "driver@example.com",
      "phone": "+1234567890",
      "vehicle_type": "motorcycle",
      "is_available": true,
      "rating_average": 4.5,
      "rating_count": 120
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 4. Cashier Authentication

**Endpoint:** `POST /api/cashier/login`  
**Controller:** `controllers/cashier.controller.js`

**Request:**
```json
{
  "email": "cashier@business.com",
  "password": "password123"
}
```

**Process:**
1. Validate credentials
2. Verify cashier exists and is active
3. Generate JWT token with `role: 'cashier'`
4. Return cashier data and token

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "cashier": {
      "id": "uuid",
      "business_id": "business-uuid",
      "full_name": "Cashier Name",
      "email": "cashier@business.com",
      "is_active": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## JWT Token Structure

### Token Payload

The JWT token contains the following information:

```json
{
  "userId": "uuid-of-user",
  "role": "user|business|driver|cashier|admin",
  "iat": 1234567890
}
```

### Token Generation

**Function:** `utils/tokenGenerator.js`

```javascript
const generateToken = (userId, role = 'user', payload = {}, expiresIn = '24h') => {
  const jwtPayload = {
    userId,
    role,  // Role is embedded in token
    ...payload,
    iat: Math.floor(Date.now() / 1000)
  };

  return jwt.sign(jwtPayload, JWT_SECRET, { expiresIn });
};
```

### Token Usage

**Header Format:**
```
Authorization: Bearer <token>
```

**Alternative Headers:**
```
x-access-token: <token>
```

**Query Parameter:**
```
?token=<token>
```

---

## User Roles in Detail

### 1. User Role (Level 1)

**Definition:** Regular application users who interact with the platform as customers.

**Database Model:** `User` table

**Key Features:**
- Place orders for delivery or pickup
- Make reservations at businesses
- Manage personal profile and addresses
- View order history
- Rate businesses and services
- Use wallet for payments
- Earn and redeem loyalty points
- Chat with AI assistant

**Authentication:**
- Endpoint: `POST /api/auth/login`
- Middleware: `authenticate`
- Token Role: `'user'`
- Request Object: `req.user`

**Accessible Endpoints:**
- `/api/user/*` - User profile and operations
- `/api/orders` - Order management
- `/api/reservations` - Reservation management
- `/api/ratings` - Rating submission
- `/api/qr/generate` - QR code generation
- `/api/ai/*` - AI assistant features

**Example Request:**
```javascript
// Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

// Use token
GET /api/user/profile
Headers: { "Authorization": "Bearer <token>" }
```

---

### 2. Cashier Role (Level 2)

**Definition:** Business employees who handle point-of-sale operations and order processing.

**Database Model:** `Cashier` table

**Key Features:**
- Process orders at business location
- Scan QR codes for payments
- View business orders
- Update order status
- Manage reservations
- Access business dashboard (limited)

**Authentication:**
- Endpoint: `POST /api/cashier/login`
- Middleware: `authenticateCashier`
- Token Role: `'cashier'`
- Request Object: `req.user`

**Accessible Endpoints:**
- `/api/cashier/*` - Cashier operations
- `/api/qr/scan` - QR code scanning
- `/api/orders` - Order processing (business orders only)
- `/api/reservations` - Reservation management (business only)

**Business Association:**
- Each cashier is linked to a specific business via `business_id`
- Cashiers can only access their business's data

**Example Request:**
```javascript
// Login
POST /api/cashier/login
{
  "email": "cashier@business.com",
  "password": "password123"
}

// Scan QR code
POST /api/qr/scan
Headers: { "Authorization": "Bearer <token>" }
Body: { "qr_code": "qr-data-string" }
```

---

### 3. Driver Role (Level 3)

**Definition:** Delivery personnel who transport orders from businesses to customers.

**Database Model:** `Driver` table

**Key Features:**
- Accept delivery assignments
- Update delivery status
- Track current location
- View assigned orders
- Manage availability status
- View earnings and statistics
- Rate customers

**Authentication:**
- Endpoint: `POST /api/driver/login`
- Middleware: `authenticateDriver`
- Token Role: `'driver'`
- Request Object: `req.user`

**Accessible Endpoints:**
- `/api/driver/*` - Driver operations
- `/api/orders` - Delivery order management
- `/api/driver/orders` - Assigned orders
- `/api/driver/location` - Location updates

**Status Management:**
- `is_available`: Whether driver is accepting new deliveries
- `current_latitude` / `current_longitude`: Real-time location
- `vehicle_type`: Type of vehicle (motorcycle, car, bicycle)

**Example Request:**
```javascript
// Login
POST /api/driver/login
{
  "email": "driver@example.com",
  "password": "password123"
}

// Update location
PUT /api/driver/location
Headers: { "Authorization": "Bearer <token>" }
Body: {
  "latitude": 31.4165,
  "longitude": 31.8133
}
```

---

### 4. Business Role (Level 4)

**Definition:** Business owners who manage their establishments on the platform.

**Database Model:** `Business` table

**Key Features:**
- Manage business profile and settings
- Add/edit products and services
- Manage categories and offers
- View and process orders
- Manage reservations
- Add and manage cashiers
- View business analytics
- Update business hours and availability
- Upload photos and videos

**Authentication:**
- Endpoint: `POST /api/business/login`
- Middleware: `authenticateBusiness`
- Token Role: `'business'`
- Request Object: `req.business` (not `req.user`)

**Accessible Endpoints:**
- `/api/business/*` - Business management
- `/api/business/products` - Product management
- `/api/business/categories` - Category management
- `/api/business/offers` - Offer management
- `/api/business/cashiers` - Cashier management
- `/api/business/reservations` - Reservation management
- `/api/business/orders` - Order management
- `/api/ratings` - View ratings

**Business Types:**
- `restaurant` - Restaurants and food establishments
- `cafe` - Coffee shops and cafes
- `pharmacy` - Pharmacies
- `clinic` - Medical clinics
- `beauty_center` - Beauty and wellness centers
- `juice_shop` - Juice and smoothie shops
- `dessert_shop` - Dessert and sweet shops
- `fast_food` - Fast food restaurants
- `supermarket` - Grocery stores
- `recreational` - Entertainment venues
- `other` - Other business types

**App Types:**
- `pass` - CoreSY Pass app
- `care` - CoreSY Care app
- `go` - CoreSY Go app
- `pass_go` - Pass + Go apps
- `care_go` - Care + Go apps

**Example Request:**
```javascript
// Login
POST /api/business/login
{
  "email": "owner@business.com",
  "password": "password123"
}

// Add product
POST /api/business/products
Headers: { "Authorization": "Bearer <token>" }
Body: {
  "name": "Product Name",
  "description": "Product description",
  "price": 25.99,
  "category_id": "category-uuid"
}
```

---

### 5. Admin Role (Level 5)

**Definition:** System administrators with full access to all platform features and data.

**Database Model:** `Admin` table

**Key Features:**
- Full system access
- User management
- Business management and verification
- Driver management
- System configuration
- Analytics and reporting
- Content moderation
- Financial management
- Support ticket management

**Authentication:**
- Endpoint: `POST /api/admin/login`
- Middleware: `authenticate` + role check
- Token Role: `'admin'`
- Request Object: `req.user`

**Accessible Endpoints:**
- `/api/admin/*` - All admin operations
- All user endpoints (with elevated permissions)
- All business endpoints
- All driver endpoints
- System configuration endpoints

**Admin Sub-Roles:**
- `super_admin` - Full system access
- `finance_admin` - Financial operations
- `support_admin` - Customer support
- `content_admin` - Content moderation

**Example Request:**
```javascript
// Login
POST /api/admin/login
{
  "email": "admin@csy.com",
  "password": "password123"
}

// View all users
GET /api/admin/users
Headers: { "Authorization": "Bearer <token>" }
```

---

## Implementation Details

### Middleware Structure

**File:** `middlewares/auth.js`

#### 1. User Authentication Middleware

```javascript
const authenticate = async (req, res, next) => {
  // Extract token from header
  const token = extractToken(req);
  
  // Verify JWT token
  const decoded = jwt.verify(token, JWT_SECRET);
  const role = decoded.role || 'user'; // Extract role from token
  
  // Find user in database
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId }
  });
  
  // Attach user to request with role
  req.user = {
    id: user.id,
    // ... other fields
    role: role // Role from token
  };
  
  next();
};
```

#### 2. Business Authentication Middleware

```javascript
const authenticateBusiness = async (req, res, next) => {
  const token = extractToken(req);
  const decoded = jwt.verify(token, JWT_SECRET);
  const role = decoded.role || 'business';
  
  const business = await prisma.business.findUnique({
    where: { id: decoded.userId }
  });
  
  req.business = {
    id: business.id,
    // ... other fields
    role: role // Role from token
  };
  
  next();
};
```

#### 3. Driver Authentication Middleware

```javascript
const authenticateDriver = async (req, res, next) => {
  const token = extractToken(req);
  const decoded = jwt.verify(token, JWT_SECRET);
  const role = decoded.role || 'driver';
  
  const driver = await prisma.driver.findUnique({
    where: { id: decoded.userId }
  });
  
  req.user = {
    id: driver.id,
    // ... other fields
    role: role // Role from token
  };
  
  next();
};
```

#### 4. Cashier Authentication Middleware

```javascript
const authenticateCashier = async (req, res, next) => {
  const token = extractToken(req);
  const decoded = jwt.verify(token, JWT_SECRET);
  const role = decoded.role || 'cashier';
  
  const cashier = await prisma.cashier.findUnique({
    where: { id: decoded.userId }
  });
  
  req.user = {
    id: cashier.id,
    business_id: cashier.business_id,
    // ... other fields
    role: role // Role from token
  };
  
  next();
};
```

### Role Checking Middleware

**File:** `middlewares/roleCheck.js`

```javascript
const roles = {
  user: 1,
  cashier: 2,
  driver: 3,
  business: 4,
  admin: 5
};

const checkRole = (requiredRole) => {
  return (req, res, next) => {
    const userRole = req.user?.role || req.business?.role || 'user';
    const userRoleLevel = roles[userRole];
    const requiredRoleLevel = roles[requiredRole];
    
    if (userRoleLevel < requiredRoleLevel) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        error: `Required role: ${requiredRole}, your role: ${userRole}`
      });
    }
    
    next();
  };
};
```

---

## API Endpoints by Role

### User Endpoints

| Endpoint | Method | Role Required | Description |
|----------|--------|---------------|-------------|
| `/api/user/profile` | GET | user | Get user profile |
| `/api/user/profile` | PUT | user | Update user profile |
| `/api/user/addresses` | GET | user | Get user addresses |
| `/api/user/addresses` | POST | user | Add address |
| `/api/orders` | POST | user | Create order |
| `/api/orders` | GET | user | Get user orders |
| `/api/reservations` | POST | user | Create reservation |
| `/api/qr/generate` | POST | user | Generate payment QR |

### Cashier Endpoints

| Endpoint | Method | Role Required | Description |
|----------|--------|---------------|-------------|
| `/api/cashier/profile` | GET | cashier | Get cashier profile |
| `/api/qr/scan` | POST | cashier | Scan QR code |
| `/api/orders` | GET | cashier | Get business orders |
| `/api/orders/:id/status` | PUT | cashier | Update order status |

### Driver Endpoints

| Endpoint | Method | Role Required | Description |
|----------|--------|---------------|-------------|
| `/api/driver/profile` | GET | driver | Get driver profile |
| `/api/driver/orders` | GET | driver | Get assigned orders |
| `/api/driver/orders/:id/accept` | POST | driver | Accept delivery |
| `/api/driver/location` | PUT | driver | Update location |
| `/api/driver/availability` | PUT | driver | Update availability |

### Business Endpoints

| Endpoint | Method | Role Required | Description |
|----------|--------|---------------|-------------|
| `/api/business/profile` | GET | business | Get business profile |
| `/api/business/profile` | PUT | business | Update business profile |
| `/api/business/products` | GET | business | Get products |
| `/api/business/products` | POST | business | Add product |
| `/api/business/cashiers` | GET | business | Get cashiers |
| `/api/business/cashiers` | POST | business | Add cashier |
| `/api/business/orders` | GET | business | Get business orders |
| `/api/business/analytics` | GET | business | Get analytics |

### Admin Endpoints

| Endpoint | Method | Role Required | Description |
|----------|--------|---------------|-------------|
| `/api/admin/users` | GET | admin | Get all users |
| `/api/admin/businesses` | GET | admin | Get all businesses |
| `/api/admin/drivers` | GET | admin | Get all drivers |
| `/api/admin/system/config` | GET | admin | Get system config |
| `/api/admin/system/config` | PUT | admin | Update system config |

---

## Security Considerations

### Token Security

1. **Token Expiration:** Tokens expire after 24 hours (configurable)
2. **Secret Key:** JWT_SECRET must be strong and kept secure
3. **HTTPS Only:** Tokens should only be transmitted over HTTPS
4. **Token Storage:** Clients should store tokens securely (not in localStorage for web)

### Role Validation

1. **Token Verification:** Always verify token signature
2. **Role Extraction:** Extract role from token, not from database
3. **Middleware Order:** Apply authentication before role checking
4. **Fallback Roles:** Use default role if token doesn't contain role (backward compatibility)

### Access Control

1. **Route Protection:** Protect all sensitive routes with authentication
2. **Role Checking:** Use role middleware for role-specific endpoints
3. **Resource Ownership:** Verify users can only access their own resources
4. **Business Association:** Verify cashiers can only access their business's data

---

## Code Examples

### Example 1: Protected User Route

```javascript
// routes/user.routes.js
const { authenticate } = require('../middlewares/auth');
const { isUser } = require('../middlewares/roleCheck');

router.get('/profile',
  authenticate,  // Verify token and set req.user
  isUser,       // Verify role is 'user'
  userController.getProfile
);
```

### Example 2: Protected Business Route

```javascript
// routes/business.routes.js
const { authenticateBusiness } = require('../middlewares/auth');
const { isBusiness } = require('../middlewares/roleCheck');

router.post('/products',
  authenticateBusiness,  // Verify token and set req.business
  isBusiness,            // Verify role is 'business'
  businessController.addProduct
);
```

### Example 3: Multi-Role Route

```javascript
// routes/orders.routes.js
const { authenticate } = require('../middlewares/auth');
const { hasAnyRole } = require('../middlewares/roleCheck');

router.get('/',
  authenticate,
  hasAnyRole('user', 'driver', 'business'),  // Allow multiple roles
  orderController.getAllOrders
);
```

### Example 4: Role-Based Response

```javascript
// controllers/order.controller.js
async getAllOrders(req, res) {
  const userRole = req.user?.role || req.business?.role;
  
  let orders;
  
  if (userRole === 'user') {
    // Users see only their orders
    orders = await prisma.order.findMany({
      where: { user_id: req.user.id }
    });
  } else if (userRole === 'business') {
    // Businesses see their business orders
    orders = await prisma.order.findMany({
      where: { business_id: req.business.id }
    });
  } else if (userRole === 'driver') {
    // Drivers see assigned orders
    orders = await prisma.order.findMany({
      where: { driver_id: req.user.id }
    });
  }
  
  res.json({ success: true, data: orders });
}
```

---

## Troubleshooting

### Common Issues

#### 1. "Invalid token" Error

**Cause:** Token is missing, expired, or invalid

**Solution:**
- Check token is included in Authorization header
- Verify token hasn't expired
- Ensure JWT_SECRET matches between token generation and verification

#### 2. "Insufficient permissions" Error

**Cause:** User role doesn't meet required role level

**Solution:**
- Verify user logged in with correct endpoint
- Check token contains correct role
- Ensure middleware order is correct (authenticate before roleCheck)

#### 3. "User not found" Error

**Cause:** User ID in token doesn't exist in database

**Solution:**
- Verify user exists and is active
- Check token wasn't tampered with
- Ensure correct database table is checked (User, Business, Driver, Cashier)

#### 4. Role Not Working

**Cause:** Role not in token or middleware not extracting role

**Solution:**
- Verify token generation includes role parameter
- Check middleware extracts role from decoded token
- Ensure backward compatibility fallback is working

---

## Summary

### Key Points

1. ✅ **Five distinct roles** with hierarchical permissions
2. ✅ **Role embedded in JWT token** for secure authorization
3. ✅ **Separate authentication endpoints** for each role type
4. ✅ **Middleware-based access control** for route protection
5. ✅ **Backward compatible** with fallback role assignment

### Role Assignment

- **User** → `POST /api/auth/login` → Token with `role: 'user'`
- **Business** → `POST /api/business/login` → Token with `role: 'business'`
- **Driver** → `POST /api/driver/login` → Token with `role: 'driver'`
- **Cashier** → `POST /api/cashier/login` → Token with `role: 'cashier'`
- **Admin** → `POST /api/admin/login` → Token with `role: 'admin'`

### Best Practices

1. Always use authentication middleware before role checking
2. Extract role from token, not from database lookup
3. Use appropriate middleware for each role type
4. Verify resource ownership for user-specific data
5. Implement proper error handling for unauthorized access

---

**End of Document**

*For technical support or questions, please refer to the main documentation or contact the development team.*

