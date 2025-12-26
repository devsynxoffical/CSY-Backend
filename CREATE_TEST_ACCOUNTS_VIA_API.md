# 🔧 Create Test Accounts via API

If you cannot run `npm run db:create:test-accounts` locally (database connection issues), you can create test accounts directly via the production API.

## 📋 Test Accounts to Create

You need to create these accounts:

1. **User**: `user@example.com` / `password123`
2. **Business**: `business@example.com` / `password123`
3. **Driver**: `driver@example.com` / `password123`
4. **Cashier**: `cashier@example.com` / `password123` (requires business first)

---

## 🚀 Step-by-Step: Create Accounts via Postman

### Step 1: Create User Account

**Request:**
```
POST https://csy-backend-production.up.railway.app/api/auth/register
Content-Type: application/json
```

**Body:**
```json
{
  "full_name": "Test User",
  "email": "user@example.com",
  "phone": "+201234567890",
  "password": "password123",
  "governorate_code": "DM"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { ... },
    "token": "..."
  }
}
```

---

### Step 2: Create Business Account

**Request:**
```
POST https://csy-backend-production.up.railway.app/api/business/register
Content-Type: application/json
```

**Body:**
```json
{
  "owner_email": "business@example.com",
  "password": "password123",
  "business_name": "Test Restaurant",
  "business_type": "restaurant",
  "app_type": "pass",
  "address": "123 Test Street",
  "city": "Cairo",
  "governorate": "Cairo",
  "latitude": 30.0444,
  "longitude": 31.2357,
  "has_reservations": true,
  "has_delivery": true
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Business registered successfully",
  "data": {
    "business": { ... },
    "token": "..."
  }
}
```

**⚠️ Important:** Save the `business.id` from the response - you'll need it for creating products and cashier!

---

### Step 3: Create Products for Business

After creating the business, login and create products:

**First, Login:**
```
POST https://csy-backend-production.up.railway.app/api/business/login
Content-Type: application/json
```

**Body:**
```json
{
  "email": "business@example.com",
  "password": "password123"
}
```

**Save the token from response!**

**Then Create Products:**
```
POST https://csy-backend-production.up.railway.app/api/business/products
Authorization: Bearer <YOUR_BUSINESS_TOKEN>
Content-Type: application/json
```

**Body (repeat for each product):**
```json
{
  "name": "Cheese Burger",
  "description": "Delicious cheese burger",
  "ingredients": "Beef, Cheese, Bun",
  "price": 15000,
  "category": "Burgers",
  "is_available": true
}
```

```json
{
  "name": "Margherita Pizza",
  "description": "Classic pizza with tomato sauce and mozzarella",
  "price": 20000,
  "category": "Pizza",
  "is_available": true
}
```

```json
{
  "name": "Caesar Salad",
  "description": "Fresh romaine lettuce with Caesar dressing",
  "price": 12000,
  "category": "Salads",
  "is_available": true
}
```

---

### Step 4: Create Driver Account

**Request:**
```
POST https://csy-backend-production.up.railway.app/api/driver/register
Content-Type: application/json
```

**Body:**
```json
{
  "full_name": "Test Driver",
  "email": "driver@example.com",
  "phone": "+201234567891",
  "password": "password123",
  "vehicle_type": "motorcycle"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Driver registered successfully",
  "data": {
    "driver": { ... },
    "token": "..."
  }
}
```

---

### Step 5: Create Cashier Account

**First, Login as Business:**
```
POST https://csy-backend-production.up.railway.app/api/business/login
Content-Type: application/json
```

**Body:**
```json
{
  "email": "business@example.com",
  "password": "password123"
}
```

**Save the token!**

**Then Create Cashier:**
```
POST https://csy-backend-production.up.railway.app/api/business/cashiers
Authorization: Bearer <YOUR_BUSINESS_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "full_name": "Test Cashier",
  "email": "cashier@example.com",
  "password": "password123"
}
```

---

## ✅ Verification

After creating all accounts, test login:

### Test User Login:
```
POST https://csy-backend-production.up.railway.app/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Test Business Login:
```
POST https://csy-backend-production.up.railway.app/api/business/login
Content-Type: application/json

{
  "email": "business@example.com",
  "password": "password123"
}
```

---

## 📝 Quick Reference

| Account Type | Email | Password | Registration Endpoint |
|-------------|-------|----------|----------------------|
| User | `user@example.com` | `password123` | `/api/auth/register` |
| Business | `business@example.com` | `password123` | `/api/business/register` |
| Driver | `driver@example.com` | `password123` | `/api/driver/register` |
| Cashier | `cashier@example.com` | `password123` | `/api/business/cashiers` (requires business login) |

---

## 🎯 Alternative: Use Postman Collection

You can also import the existing Postman collections and use the registration endpoints from there:

1. **Business_Module_Postman_Collection.json** - Has business registration
2. **Driver_Cashier_Endpoints_Postman_Collection.json** - Has driver registration
3. Create a new request for user registration using `/api/auth/register`

---

## ⚠️ Notes

- If an account already exists, you'll get an error. That's okay - it means the account is already created!
- Make sure to create products after business registration so orders can be created
- Cashier creation requires you to be logged in as the business owner
- All accounts use the same password: `password123` for easy testing

