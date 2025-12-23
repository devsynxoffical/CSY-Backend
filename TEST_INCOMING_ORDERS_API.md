# Complete Testing Procedure: Driver Incoming Orders API

## Overview
This guide walks you through testing the `GET /api/driver/orders/incoming` API endpoint step by step.

---

## Prerequisites

1. **Database Setup**: Ensure your database is running and migrations are applied
2. **API Server**: Start your backend server
3. **Test Accounts**: You'll need accounts for:
   - User (to create orders)
   - Business (to accept orders and mark as ready)
   - Driver (to view incoming orders)

---

## Step-by-Step Testing Procedure

### **STEP 1: Register/Login as User**

**Endpoint:** `POST /api/auth/register` or `POST /api/auth/login`

**Request:**
```json
POST /api/auth/register
{
  "full_name": "Test User",
  "email": "user@test.com",
  "phone": "+201234567890",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "user_jwt_token_here"
  }
}
```

**Save:** `USER_TOKEN` = `user_jwt_token_here`

---

### **STEP 2: Register/Login as Business**

**Endpoint:** `POST /api/business/register` or `POST /api/business/login`

**Request:**
```json
POST /api/business/register
{
  "business_name": "Test Restaurant",
  "owner_email": "business@test.com",
  "owner_phone": "+201234567891",
  "password": "password123",
  "business_type": "restaurant",
  "address": "123 Business St",
  "city": "Cairo",
  "latitude": 31.4165,
  "longitude": 31.8133
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "business": { ... },
    "token": "business_jwt_token_here"
  }
}
```

**Save:** `BUSINESS_TOKEN` = `business_jwt_token_here`  
**Save:** `BUSINESS_ID` = `business.id`

---

### **STEP 3: Add Product to Business**

**Endpoint:** `POST /api/business/products`

**Headers:**
```
Authorization: Bearer {BUSINESS_TOKEN}
```

**Request:**
```json
{
  "name": "Margherita Pizza",
  "price": 12000,
  "category": "Pizza",
  "description": "Classic pizza",
  "image": "https://example.com/pizza.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "product-uuid-here",
    "name": "Margherita Pizza",
    "price": 12000,
    ...
  }
}
```

**Save:** `PRODUCT_ID` = `product.id`

---

### **STEP 4: Create Order as User**

**Endpoint:** `POST /api/orders`

**Headers:**
```
Authorization: Bearer {USER_TOKEN}
```

**Request:**
```json
{
  "items": [
    {
      "product_id": "{PRODUCT_ID}",
      "quantity": 2
    }
  ],
  "order_type": "delivery",
  "payment_method": "cash",
  "delivery_address": {
    "name": "Ahmed Ali",
    "phone": "03001234567",
    "street": "123 Main St",
    "city": "Cairo",
    "latitude": 30.0444,
    "longitude": 31.2357
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order-uuid-here",
    "order_number": "ORD-20240115-001",
    "status": "pending",
    ...
  }
}
```

**Save:** `ORDER_ID` = `order.id`  
**Note:** Order status is now `pending`

---

### **STEP 5: Business Accepts Order**

**Option A: Using Business Endpoint (if available)**

**Endpoint:** `PUT /api/business/orders/{ORDER_ID}/accept`

**Headers:**
```
Authorization: Bearer {BUSINESS_TOKEN}
```

**Response:**
```json
{
  "success": true,
  "message": "Order accepted successfully",
  "data": {
    "order_id": "{ORDER_ID}",
    "status": "accepted"
  }
}
```

**Option B: Using Cashier Endpoint**

**First, create a cashier:**

**Endpoint:** `POST /api/business/cashiers`

**Headers:**
```
Authorization: Bearer {BUSINESS_TOKEN}
```

**Request:**
```json
{
  "email": "cashier@test.com",
  "full_name": "Test Cashier",
  "password": "password123"
}
```

**Save:** `CASHIER_TOKEN` = `cashier.token`

**Then update order status:**

**Endpoint:** `PUT /api/cashier/orders/{ORDER_ID}/status`

**Headers:**
```
Authorization: Bearer {CASHIER_TOKEN}
```

**Request:**
```json
{
  "status": "accepted"
}
```

**Note:** Order status is now `accepted`

---

### **STEP 6: Update Order Status to 'preparing'**

**Endpoint:** `PUT /api/cashier/orders/{ORDER_ID}/status`

**Headers:**
```
Authorization: Bearer {CASHIER_TOKEN}
```

**Request:**
```json
{
  "status": "preparing"
}
```

**Note:** Order status is now `preparing`

---

### **STEP 7: Update Order Status to 'waiting_driver'**

**IMPORTANT:** The cashier controller only allows these statuses: `['pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled']`

**You need to update the order directly in the database OR add 'waiting_driver' to the cashier's valid statuses.**

**Option A: Direct Database Update (for testing)**

```sql
UPDATE orders 
SET status = 'waiting_driver', updated_at = NOW() 
WHERE id = '{ORDER_ID}';
```

**Option B: Update Cashier Controller (recommended)**

Add `'waiting_driver'` to the valid statuses array in `controllers/cashier.controller.js`:

```javascript
const validStatuses = ['pending', 'accepted', 'preparing', 'waiting_driver', 'ready', 'completed', 'cancelled'];
```

Then use:

**Endpoint:** `PUT /api/cashier/orders/{ORDER_ID}/status`

**Headers:**
```
Authorization: Bearer {CASHIER_TOKEN}
```

**Request:**
```json
{
  "status": "waiting_driver"
}
```

**Note:** Order status is now `waiting_driver` and `driver_id` is `null`

---

### **STEP 8: Register/Login as Driver**

**Endpoint:** `POST /api/driver/register` or `POST /api/driver/login`

**Request:**
```json
POST /api/driver/register
{
  "full_name": "Test Driver",
  "email": "driver@test.com",
  "phone": "+201234567892",
  "vehicle_type": "motorcycle",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "driver": { ... },
    "token": "driver_jwt_token_here"
  }
}
```

**Save:** `DRIVER_TOKEN` = `driver_jwt_token_here`

---

### **STEP 9: Update Driver Location (Optional but Recommended)**

**Endpoint:** `PUT /api/driver/location`

**Headers:**
```
Authorization: Bearer {DRIVER_TOKEN}
```

**Request:**
```json
{
  "latitude": 31.4165,
  "longitude": 31.8133
}
```

**Response:**
```json
{
  "success": true,
  "message": "Location updated successfully"
}
```

---

### **STEP 10: Set Driver as Available**

**Endpoint:** `PUT /api/driver/availability`

**Headers:**
```
Authorization: Bearer {DRIVER_TOKEN}
```

**Request:**
```json
{
  "is_available": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Driver is now available"
}
```

---

### **STEP 11: Test Incoming Orders API**

**Endpoint:** `GET /api/driver/orders/incoming`

**Headers:**
```
Authorization: Bearer {DRIVER_TOKEN}
```

**Query Parameters (all optional):**
- `page=1` (default: 1)
- `limit=10` (default: 10, max: 50)
- `latitude=31.4165` (optional)
- `longitude=31.8133` (optional)

**Full URL Example:**
```
GET /api/driver/orders/incoming?page=1&limit=10&latitude=31.4165&longitude=31.8133
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Incoming orders retrieved successfully",
  "data": {
    "orders": [
      {
        "id": "{ORDER_ID}",
        "order_number": "ORD-20240115-001",
        "status": "waiting_driver",
        "order_type": "delivery",
        "total_amount": 24000,
        "delivery_fee": 1500,
        "final_amount": 25500,
        "delivery_address": {
          "name": "Ahmed Ali",
          "phone": "03001234567",
          "street": "123 Main St",
          "city": "Cairo",
          "latitude": 30.0444,
          "longitude": 31.2357
        },
        "user": {
          "id": "user-uuid",
          "full_name": "Test User",
          "phone": "+201234567890"
        },
        "business": {
          "id": "{BUSINESS_ID}",
          "business_name": "Test Restaurant",
          "address": "123 Business St",
          "latitude": 31.4165,
          "longitude": 31.8133
        },
        "created_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

**Expected Response (No Orders):**
```json
{
  "success": true,
  "message": "Incoming orders retrieved successfully",
  "data": {
    "orders": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

---

## Testing Checklist

- [ ] User account created/logged in
- [ ] Business account created/logged in
- [ ] Product added to business
- [ ] Order created by user (status: `pending`)
- [ ] Order accepted by business (status: `accepted`)
- [ ] Order status updated to `preparing`
- [ ] Order status updated to `waiting_driver`
- [ ] Driver account created/logged in
- [ ] Driver location updated (optional)
- [ ] Driver set as available
- [ ] Incoming orders API tested
- [ ] Response includes order with correct status
- [ ] Response includes business info
- [ ] Response includes user info
- [ ] Response includes delivery address

---

## Common Issues & Solutions

### **Issue 1: Empty Orders Array**
**Problem:** API returns empty orders array

**Solutions:**
- Verify order status is `waiting_driver`
- Verify order type is `delivery`
- Verify `driver_id` is `null`
- Check if order exists in database

### **Issue 2: Business Info Missing**
**Problem:** `business` field is `null` in response

**Solutions:**
- Verify order has at least one order item
- Check if order item has `business_id`
- Verify business exists in database

### **Issue 3: Status Not Updating**
**Problem:** Cannot update order to `waiting_driver`

**Solutions:**
- Update cashier controller to include `'waiting_driver'` in valid statuses
- Or update directly in database for testing

### **Issue 4: Authentication Error**
**Problem:** 401 Unauthorized

**Solutions:**
- Verify driver token is valid
- Check token expiration
- Ensure token is in `Authorization: Bearer {token}` format

---

## Quick Test Script (cURL)

```bash
# 1. Login as Driver
DRIVER_TOKEN=$(curl -X POST "https://your-api.com/api/driver/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"driver@test.com","password":"password123"}' \
  | jq -r '.data.token')

# 2. Get Incoming Orders
curl -X GET "https://your-api.com/api/driver/orders/incoming?page=1&limit=10" \
  -H "Authorization: Bearer $DRIVER_TOKEN" \
  -H "Content-Type: application/json"
```

---

## Postman Collection

Import these requests into Postman:

1. **Driver Login**
   - Method: `POST`
   - URL: `/api/driver/login`
   - Body: `{ "email": "...", "password": "..." }`

2. **Get Incoming Orders**
   - Method: `GET`
   - URL: `/api/driver/orders/incoming?page=1&limit=10`
   - Headers: `Authorization: Bearer {{driver_token}}`

---

## Next Steps After Testing

Once you confirm the API works:

1. **Accept Order:** `POST /api/driver/orders/{ORDER_ID}/accept`
2. **Update to In Delivery:** Order status changes to `in_delivery`
3. **Mark as Delivered:** `POST /api/driver/orders/{ORDER_ID}/deliver`

---

**End of Testing Procedure**

