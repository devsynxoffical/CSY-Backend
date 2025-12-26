# 🧪 Complete Testing Guide - All Fixes

This guide will help you test all the fixes that were implemented.

## 📋 What Was Fixed

1. ✅ **Multi-Country City Support** - Egypt, Syria, UAE/Dubai
2. ✅ **Order Creation Flow** - Fixed notification and order details
3. ✅ **Order Accept/Reject** - Fixed business filtering
4. ✅ **Drivers & Cashiers Seed Data** - Comprehensive test data
5. ✅ **Constants Export** - Fixed COUNTRIES undefined error

---

## 🚀 Step 1: Setup Test Accounts

### Run Seed Scripts

```bash
# 1. Create basic test accounts (User, Business, Driver, Cashier)
npm run db:create:test-accounts

# 2. Create comprehensive drivers and cashiers data
npm run db:seed:drivers-cashiers
```

**Expected Output:**
- ✅ User: `user@example.com` / `password123`
- ✅ Business: `business@example.com` / `password123`
- ✅ 8 Drivers with profile pictures
- ✅ 10 Cashiers across businesses

---

## 🌍 Step 2: Test Multi-Country City Support

### Test 1: Get All Cities (All Countries)

**Request:**
```
GET https://csy-backend-production.up.railway.app/api/cities
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Cities retrieved successfully",
  "data": {
    "cities": [
      {
        "name": "Cairo",
        "country": "Egypt",
        "latitude": 30.0444,
        "longitude": 31.2357
      },
      {
        "name": "Dubai",
        "country": "UAE",
        "emirate": "Dubai",
        "latitude": 25.2048,
        "longitude": 55.2708
      },
      ...
    ],
    "total": <number>,
    "countries": [
      {
        "code": "EG",
        "name": "Egypt",
        "currency": "EGP"
      },
      {
        "code": "AE",
        "name": "United Arab Emirates",
        "currency": "AED"
      },
      {
        "code": "SY",
        "name": "Syria",
        "currency": "SYP"
      }
    ]
  }
}
```

**✅ Check:**
- Response has `success: true`
- `cities` array contains cities from multiple countries
- `countries` array shows all 3 countries
- Dubai cities are included

---

### Test 2: Get Cities by Country (UAE/Dubai)

**Request:**
```
GET https://csy-backend-production.up.railway.app/api/cities?country=AE
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "cities": [
      {
        "name": "Dubai",
        "country": "UAE",
        "emirate": "Dubai"
      },
      {
        "name": "Abu Dhabi",
        "country": "UAE",
        "emirate": "Abu Dhabi"
      },
      {
        "name": "Dubai Marina",
        "country": "UAE",
        "emirate": "Dubai"
      },
      ...
    ]
  }
}
```

**✅ Check:**
- Only UAE cities are returned
- Dubai areas are included (Dubai Marina, Downtown Dubai, etc.)
- All 7 emirates are represented

---

### Test 3: Search Dubai Cities

**Request:**
```
GET https://csy-backend-production.up.railway.app/api/cities/search?q=dubai
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "query": "dubai",
    "cities": [
      {
        "name": "Dubai",
        "country": "UAE",
        "latitude": 25.2048,
        "longitude": 55.2708
      },
      {
        "name": "Dubai Marina",
        "country": "UAE",
        ...
      },
      ...
    ]
  }
}
```

**✅ Check:**
- Search returns Dubai-related cities
- Multiple Dubai areas are found
- Coordinates are correct

---

### Test 4: Get Cities by Country (Egypt)

**Request:**
```
GET https://csy-backend-production.up.railway.app/api/cities?country=EG
```

**✅ Check:**
- Only Egyptian cities are returned
- Cairo, Alexandria, etc. are included

---

## 🛒 Step 3: Test Order Creation Flow

### Test 1: User Login

**Request:**
```
POST https://csy-backend-production.up.railway.app/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**✅ Check:**
- Status: `200 OK`
- Response contains `token`
- Save token for next requests

---

### Test 2: Get All Businesses

**Request:**
```
GET https://csy-backend-production.up.railway.app/api/business?page=1&limit=10
```

**✅ Check:**
- Status: `200 OK`
- Response contains `businesses` array
- Save first business `id` as `businessId`

---

### Test 3: Get Business Products

**Request:**
```
GET https://csy-backend-production.up.railway.app/api/business/{{businessId}}/products
```

**✅ Check:**
- Status: `200 OK`
- Response contains products array
- Save first product `id` as `productId`

---

### Test 4: Create Order

**Request:**
```
POST https://csy-backend-production.up.railway.app/api/orders
Authorization: Bearer {{userToken}}
Content-Type: application/json

{
  "items": [
    {
      "product_id": "{{productId}}",
      "quantity": 2
    }
  ],
  "order_type": "delivery",
  "payment_method": "cash",
  "delivery_address": {
    "street": "123 Main Street",
    "city": "Cairo",
    "latitude": 30.0444,
    "longitude": 31.2357
  }
}
```

**✅ Check:**
- Status: `201 Created`
- Response contains `data.order` object (NOT null)
- Order has:
  - `id`
  - `order_number`
  - `status: "pending"`
  - `items` array
  - `total_amount`
  - `final_amount`
- No errors in Railway logs

---

## 🏢 Step 4: Test Business Order Management

### Test 1: Business Login

**Request:**
```
POST https://csy-backend-production.up.railway.app/api/business/login
Content-Type: application/json

{
  "email": "business@example.com",
  "password": "password123"
}
```

**✅ Check:**
- Status: `200 OK`
- Response contains `token`
- Save token as `businessToken`

---

### Test 2: Get Business Orders

**Request:**
```
GET https://csy-backend-production.up.railway.app/api/business/orders
Authorization: Bearer {{businessToken}}
```

**✅ Check:**
- Status: `200 OK`
- Response contains `orders` array
- Should include the order created in Step 3
- Save order `id` as `orderId`

---

### Test 3: Reject Order

**Request:**
```
PUT https://csy-backend-production.up.railway.app/api/business/orders/{{orderId}}/reject
Authorization: Bearer {{businessToken}}
Content-Type: application/json

{
  "reason": "Out of stock"
}
```

**✅ Check:**
- Status: `200 OK`
- Response: `"message": "Order rejected successfully"`
- Order status should be `"rejected"`
- No errors in Railway logs

---

### Test 4: Accept Order (Create New Order First)

**Note:** Since we rejected the previous order, create a new one first, then accept it.

**Request:**
```
PUT https://csy-backend-production.up.railway.app/api/business/orders/{{newOrderId}}/accept
Authorization: Bearer {{businessToken}}
```

**✅ Check:**
- Status: `200 OK`
- Response: `"message": "Order accepted successfully"`
- Order status should be `"accepted"`
- No errors in Railway logs

---

## 🛵 Step 5: Test Drivers Data

### Test 1: Get All Drivers

**Request:**
```
GET https://csy-backend-production.up.railway.app/api/driver
```

**✅ Check:**
- Status: `200 OK`
- Response contains multiple drivers (at least 8)
- Each driver has:
  - `full_name`
  - `email`
  - `vehicle_type` (motorcycle or car)
  - `profile_picture` (URL)
  - `is_available` (boolean)
  - `rating_average`
  - `earnings_cash` and `earnings_online`

---

### Test 2: Driver Login

**Request:**
```
POST https://csy-backend-production.up.railway.app/api/driver/login
Content-Type: application/json

{
  "email": "ahmed.driver@example.com",
  "password": "password123"
}
```

**✅ Check:**
- Status: `200 OK`
- Response contains `token`
- Driver profile is returned

---

## 💰 Step 6: Test Cashiers Data

### Test 1: Business Login (to get cashiers)

**Request:**
```
POST https://csy-backend-production.up.railway.app/api/business/login
Content-Type: application/json

{
  "email": "business@example.com",
  "password": "password123"
}
```

---

### Test 2: Get Business Cashiers

**Request:**
```
GET https://csy-backend-production.up.railway.app/api/business/cashiers
Authorization: Bearer {{businessToken}}
```

**✅ Check:**
- Status: `200 OK`
- Response contains `cashiers` array
- Should have multiple cashiers (at least 2)
- Each cashier has:
  - `full_name`
  - `email`
  - `is_active: true`

---

### Test 3: Cashier Login

**Request:**
```
POST https://csy-backend-production.up.railway.app/api/cashier/login
Content-Type: application/json

{
  "email": "sara.cashier@example.com",
  "password": "password123"
}
```

**✅ Check:**
- Status: `200 OK`
- Response contains `token`
- Cashier profile is returned

---

## 📊 Step 7: Verify Railway Logs

### Check for Errors

1. Go to Railway Dashboard → CSY-Backend → Deploy Logs
2. Look for:
   - ❌ No `COUNTRIES is not defined` errors
   - ❌ No `notificationService.sendNotification is not a function` errors
   - ❌ No `Cannot read properties of undefined` errors
   - ❌ No `_getOrderDetailsHelper` errors

### Check for Success

Look for:
- ✅ `PostgreSQL Connected Successfully`
- ✅ `Redis Connected Successfully`
- ✅ `CSY Pro API Server running on port 8080`
- ✅ `Notification sent` (when orders are created)
- ✅ `Order created successfully`

---

## 🧪 Quick Test Checklist

Use this checklist to verify everything works:

### City Support
- [ ] Get all cities returns Egypt, Syria, and UAE cities
- [ ] Filter by country=AE returns only UAE cities
- [ ] Search "dubai" returns Dubai cities
- [ ] Dubai areas (Marina, Downtown, etc.) are included

### Order Flow
- [ ] User can login
- [ ] User can get businesses list
- [ ] User can get business products
- [ ] User can create order (returns order details, not null)
- [ ] Business can login
- [ ] Business can see orders
- [ ] Business can reject order
- [ ] Business can accept order

### Drivers & Cashiers
- [ ] 8+ drivers exist with profile pictures
- [ ] Drivers can login
- [ ] 10+ cashiers exist
- [ ] Cashiers can login

### No Errors
- [ ] No COUNTRIES undefined errors
- [ ] No notification errors
- [ ] No order creation errors
- [ ] Server runs without crashing

---

## 🔧 Troubleshooting

### Issue: "COUNTRIES is not defined"
**Solution:** Wait for Railway to redeploy, or restart the service manually.

### Issue: Order creation returns `data: null`
**Solution:** Check Railway logs for specific errors. The fallback should still return basic order info.

### Issue: No cities returned for UAE
**Solution:** Make sure the maps service was updated with Dubai cities.

### Issue: Drivers/Cashiers not found
**Solution:** Run `npm run db:seed:drivers-cashiers` to create test data.

---

## 📝 Postman Collection

You can use the existing Postman collections:
1. **Order_Creation_Flow_Postman_Collection.json** - For order flow testing
2. **Business_Module_Postman_Collection.json** - For business endpoints
3. **Driver_Cashier_Endpoints_Postman_Collection.json** - For driver/cashier endpoints

Or create new requests using the examples above.

---

## ✅ Success Criteria

All tests pass if:
1. ✅ Cities API returns multi-country data
2. ✅ Order creation works and returns order details
3. ✅ Order accept/reject works without errors
4. ✅ Drivers and cashiers data is available
5. ✅ No errors in Railway logs
6. ✅ All endpoints return proper responses

---

**Happy Testing! 🎉**

