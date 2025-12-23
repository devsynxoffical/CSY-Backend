# User Role System Documentation

## Overview

The CSY Backend uses a **role-based authentication system** where different user types (User, Business, Driver, Cashier, Admin) have separate authentication endpoints and middleware. Roles are **not stored in the database** but are **assigned dynamically** based on which authentication middleware is used.

---

## Role Hierarchy

Roles are defined with numeric levels in `middlewares/roleCheck.js`:

```javascript
const roles = {
  user: 1,        // Regular app users
  cashier: 2,     // Business cashiers
  driver: 3,      // Delivery drivers
  business: 4,    // Business owners
  admin: 5        // System administrators
};
```

**Higher number = Higher permissions**

---

## How Roles Are Assigned

### **Important:** Roles are NOT stored in the database

Roles are **dynamically assigned** based on:
1. **Which authentication endpoint is used** (login endpoint)
2. **Which authentication middleware is applied** to the route

---

## Authentication Endpoints & Role Assignment

### 1. **User Authentication** (Role: `user`)

**Endpoint:** `POST /api/auth/login` or `POST /api/auth/verify-otp`

**Controller:** `controllers/auth.controller.js`

**Login Flow:**
```javascript
// 1. User logs in with email/password or phone/OTP
// 2. Token is generated with userId
const token = generateToken(user.id);

// 3. Response includes user data
{
  success: true,
  data: {
    user: { ... },
    token: "jwt_token_here"
  }
}
```

**Authentication Middleware:** `authenticate` (in `middlewares/auth.js`)

**Role Assignment:**
```javascript
// In authenticate middleware (line 41-52)
req.user = {
  id: user.id,
  full_name: user.full_name,
  email: user.email,
  // ... other fields
  role: 'user' // ← Hardcoded as 'user'
};
```

**Database Model:** `User` table (no role field)

---

### 2. **Business Authentication** (Role: `business`)

**Endpoint:** `POST /api/business/login`

**Controller:** `controllers/business.controller.js`

**Login Flow:**
```javascript
// 1. Business logs in with owner_email/password
// 2. Token is generated with business.id
const token = generateToken(business.id);

// 3. Response includes business data
{
  success: true,
  data: {
    business: { ... },
    token: "jwt_token_here"
  }
}
```

**Authentication Middleware:** `authenticateBusiness` (in `middlewares/auth.js`)

**Role Assignment:**
```javascript
// In authenticateBusiness middleware (line 159-178)
req.business = {
  id: business.id,
  business_name: business.business_name,
  // ... other fields
  // Note: No role assigned to req.business
  // Role is checked via separate middleware
};
```

**Database Model:** `Business` table (separate from User)

**Note:** Business uses `req.business` (not `req.user`), so role checking works differently.

---

### 3. **Driver Authentication** (Role: `driver`)

**Endpoint:** `POST /api/driver/login`

**Controller:** `controllers/driver.controller.js`

**Login Flow:**
```javascript
// 1. Driver logs in with email/password
// 2. Token is generated with driver.id
const token = generateToken(driver.id);

// 3. Response includes driver data
{
  success: true,
  data: {
    driver: { ... },
    token: "jwt_token_here"
  }
}
```

**Authentication Middleware:** `authenticateDriver` (in `middlewares/auth.js`)

**Role Assignment:**
```javascript
// In authenticateDriver middleware (line 241-258)
req.user = {
  id: driver.id,
  full_name: driver.full_name,
  // ... other fields
  role: 'driver' // ← Hardcoded as 'driver'
};
```

**Database Model:** `Driver` table (separate from User)

---

### 4. **Cashier Authentication** (Role: `cashier`)

**Endpoint:** `POST /api/cashier/login` (if exists)

**Controller:** `controllers/cashier.controller.js`

**Authentication Middleware:** `authenticateCashier` (in `middlewares/auth.js`)

**Role Assignment:**
```javascript
// In authenticateCashier middleware (line 321-328)
req.user = {
  id: cashier.id,
  business_id: cashier.business_id,
  full_name: cashier.full_name,
  // ... other fields
  role: 'cashier' // ← Hardcoded as 'cashier'
};
```

**Database Model:** `Cashier` table (separate from User)

---

### 5. **Admin Authentication** (Role: `admin`)

**Endpoint:** `POST /api/admin/login` (if exists)

**Authentication Middleware:** Uses `authenticate` but checks for admin role

**Database Model:** `Admin` table (separate from User)

---

## JWT Token Structure

### Token Payload

**Current Implementation:**
```javascript
// In utils/tokenGenerator.js
const generateToken = (userId, payload = {}, expiresIn = '24h') => {
  const jwtPayload = {
    userId,  // ← Only userId is stored
    ...payload
  };
  
  return jwt.sign(jwtPayload, JWT_SECRET, { expiresIn });
};
```

**Important:** The JWT token **does NOT contain the role**. The role is determined by:
1. Which table the `userId` belongs to (User, Business, Driver, Cashier)
2. Which authentication middleware is used to verify the token

---

## Role-Based Access Control (RBAC)

### Using Role Middleware

**File:** `middlewares/roleCheck.js`

**Available Middleware:**

1. **`checkRole(requiredRole)`** - Check if user has specific role
   ```javascript
   router.get('/protected', authenticate, checkRole('admin'), controller.method);
   ```

2. **`isUser`** - Check if role is 'user'
   ```javascript
   router.get('/user-only', authenticate, isUser, controller.method);
   ```

3. **`isCashier`** - Check if role is 'cashier'
   ```javascript
   router.get('/cashier-only', authenticate, isCashier, controller.method);
   ```

4. **`isDriver`** - Check if role is 'driver'
   ```javascript
   router.get('/driver-only', authenticateDriver, isDriver, controller.method);
   ```

5. **`isBusiness`** - Check if role is 'business'
   ```javascript
   router.get('/business-only', authenticateBusiness, isBusiness, controller.method);
   ```

6. **`isAdmin`** - Check if role is 'admin'
   ```javascript
   router.get('/admin-only', authenticate, isAdmin, controller.method);
   ```

7. **`hasAnyRole(...roles)`** - Check if user has any of the specified roles
   ```javascript
   router.get('/multi-role', authenticate, hasAnyRole('user', 'driver'), controller.method);
   ```

### Example Usage:

```javascript
// In routes/user.routes.js
const { authenticate } = require('../middlewares/auth');
const { isUser, checkRole } = require('../middlewares/roleCheck');

// User-only route
router.get('/profile', 
  authenticate,  // ← Sets req.user with role: 'user'
  isUser,        // ← Verifies role is 'user'
  userController.getProfile
);

// Route requiring specific role level
router.get('/premium', 
  authenticate,
  checkRole('user'),  // ← Any role >= 'user' (all roles)
  userController.getPremiumContent
);
```

---

## How Role Detection Works

### Step-by-Step Flow:

1. **User logs in** via endpoint (e.g., `/api/auth/login`)
2. **Token generated** with `userId` only
3. **User makes request** with token in header: `Authorization: Bearer <token>`
4. **Authentication middleware runs:**
   - Extracts token
   - Verifies JWT
   - Looks up user in database using `userId`
   - Determines which table to check based on middleware:
     - `authenticate` → checks `User` table → sets `role: 'user'`
     - `authenticateBusiness` → checks `Business` table → uses `req.business`
     - `authenticateDriver` → checks `Driver` table → sets `role: 'driver'`
     - `authenticateCashier` → checks `Cashier` table → sets `role: 'cashier'`
5. **Role middleware checks** if `req.user.role` matches required role

---

## Current Limitations

### ❌ **Issues with Current Implementation:**

1. **No role in database** - Roles are hardcoded in middleware
2. **No role in JWT token** - Token only contains `userId`
3. **Role determined by middleware** - Same token could work for different roles if wrong middleware is used
4. **Business uses `req.business`** - Different from other roles that use `req.user`
5. **No multi-role support** - User can't have multiple roles

---

## Recommended Improvements

### 1. **Add Role to JWT Token**

```javascript
// In utils/tokenGenerator.js
const generateToken = (userId, role, expiresIn = '24h') => {
  const jwtPayload = {
    userId,
    role,  // ← Add role to token
    iat: Math.floor(Date.now() / 1000)
  };
  
  return jwt.sign(jwtPayload, JWT_SECRET, { expiresIn });
};

// Usage in controllers:
const token = generateToken(user.id, 'user');
const token = generateToken(business.id, 'business');
const token = generateToken(driver.id, 'driver');
```

### 2. **Add Role to Database (Optional)**

```prisma
model User {
  // ... existing fields
  role UserRole @default(USER)
}

enum UserRole {
  USER
  ADMIN
  PREMIUM_USER
}
```

### 3. **Extract Role from Token**

```javascript
// In authenticate middleware
const decoded = jwt.verify(token, JWT_SECRET);
const role = decoded.role || 'user'; // Get role from token

req.user = {
  id: user.id,
  // ... other fields
  role: role  // Use role from token
};
```

---

## Example: Complete Login Flow

### User Login:

```javascript
// 1. POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

// 2. Controller generates token
const token = generateToken(user.id); // No role in token

// 3. Response
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}

// 4. User makes request with token
GET /api/user/profile
Headers: { "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }

// 5. authenticate middleware:
//    - Verifies token
//    - Extracts userId
//    - Looks up in User table
//    - Sets req.user.role = 'user'

// 6. Route handler receives req.user with role
```

### Business Login:

```javascript
// 1. POST /api/business/login
{
  "email": "owner@business.com",
  "password": "password123"
}

// 2. Controller generates token
const token = generateToken(business.id); // Same function, no role

// 3. Response
{
  "success": true,
  "data": {
    "business": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}

// 4. Business makes request with token
GET /api/business/profile
Headers: { "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }

// 5. authenticateBusiness middleware:
//    - Verifies token
//    - Extracts userId (which is actually business.id)
//    - Looks up in Business table
//    - Sets req.business (NOT req.user)

// 6. Route handler receives req.business
```

---

## Summary

### Key Points:

1. ✅ **Roles are defined** in `middlewares/roleCheck.js` with numeric levels
2. ✅ **Roles are assigned** dynamically in authentication middleware
3. ❌ **Roles are NOT stored** in database or JWT token
4. ✅ **Different endpoints** for different user types (User, Business, Driver, Cashier)
5. ✅ **Different middleware** for different user types
6. ✅ **Role checking** via `roleCheck.js` middleware functions

### Role Assignment:

- **User** → `authenticate` middleware → `req.user.role = 'user'`
- **Business** → `authenticateBusiness` middleware → `req.business` (no role field)
- **Driver** → `authenticateDriver` middleware → `req.user.role = 'driver'`
- **Cashier** → `authenticateCashier` middleware → `req.user.role = 'cashier'`
- **Admin** → `authenticate` middleware + role check → `req.user.role = 'admin'`

---

## Testing Roles

### Test User Role:
```bash
# 1. Login as user
POST /api/auth/login
{ "email": "user@test.com", "password": "pass123" }

# 2. Use token
GET /api/user/profile
Authorization: Bearer <token>
# req.user.role = 'user'
```

### Test Business Role:
```bash
# 1. Login as business
POST /api/business/login
{ "email": "owner@business.com", "password": "pass123" }

# 2. Use token
GET /api/business/profile
Authorization: Bearer <token>
# req.business (no role field, but protected by authenticateBusiness)
```

### Test Driver Role:
```bash
# 1. Login as driver
POST /api/driver/login
{ "email": "driver@test.com", "password": "pass123" }

# 2. Use token
GET /api/driver/profile
Authorization: Bearer <token>
# req.user.role = 'driver'
```

---

## Files Reference

- **Authentication:** `middlewares/auth.js`
- **Role Checking:** `middlewares/roleCheck.js`
- **Token Generation:** `utils/tokenGenerator.js`
- **User Login:** `controllers/auth.controller.js` → `login()`
- **Business Login:** `controllers/business.controller.js` → `login()`
- **Driver Login:** `controllers/driver.controller.js` → `login()`
- **Cashier Login:** `controllers/cashier.controller.js` → `login()`

