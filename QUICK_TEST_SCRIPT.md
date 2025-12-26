# ⚡ Quick Test Script

Run these commands in Postman or use curl to quickly verify all fixes.

## 🌍 Test 1: Multi-Country Cities (30 seconds)

```bash
# Test all cities
curl https://csy-backend-production.up.railway.app/api/cities

# Test UAE cities only
curl https://csy-backend-production.up.railway.app/api/cities?country=AE

# Search Dubai
curl https://csy-backend-production.up.railway.app/api/cities/search?q=dubai
```

**✅ Expected:** Should return cities from Egypt, Syria, and UAE (including Dubai)

---

## 🛒 Test 2: Order Creation (2 minutes)

### Step 1: Login
```bash
curl -X POST https://csy-backend-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

**Save the token from response**

### Step 2: Get Businesses
```bash
curl https://csy-backend-production.up.railway.app/api/business?limit=1
```

**Save the first business ID**

### Step 3: Get Products
```bash
curl https://csy-backend-production.up.railway.app/api/business/{BUSINESS_ID}/products
```

**Save the first product ID**

### Step 4: Create Order
```bash
curl -X POST https://csy-backend-production.up.railway.app/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {USER_TOKEN}" \
  -d '{
    "items": [{"product_id": "{PRODUCT_ID}", "quantity": 1}],
    "order_type": "delivery",
    "payment_method": "cash",
    "delivery_address": {
      "street": "123 Test St",
      "city": "Cairo",
      "latitude": 30.0444,
      "longitude": 31.2357
    }
  }'
```

**✅ Expected:** 
- Status: `201 Created`
- Response has `data.order` (NOT null)
- Order has `id`, `order_number`, `items`, etc.

---

## 🏢 Test 3: Business Order Management (1 minute)

### Step 1: Business Login
```bash
curl -X POST https://csy-backend-production.up.railway.app/api/business/login \
  -H "Content-Type: application/json" \
  -d '{"email":"business@example.com","password":"password123"}'
```

**Save the business token**

### Step 2: Get Orders
```bash
curl https://csy-backend-production.up.railway.app/api/business/orders \
  -H "Authorization: Bearer {BUSINESS_TOKEN}"
```

**Save an order ID**

### Step 3: Accept Order
```bash
curl -X PUT https://csy-backend-production.up.railway.app/api/business/orders/{ORDER_ID}/accept \
  -H "Authorization: Bearer {BUSINESS_TOKEN}"
```

**✅ Expected:** 
- Status: `200 OK`
- Message: "Order accepted successfully"
- No errors in logs

---

## 🛵 Test 4: Drivers (30 seconds)

```bash
# Get all drivers
curl https://csy-backend-production.up.railway.app/api/driver

# Login as driver
curl -X POST https://csy-backend-production.up.railway.app/api/driver/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ahmed.driver@example.com","password":"password123"}'
```

**✅ Expected:**
- Multiple drivers returned (8+)
- Drivers have profile pictures
- Login successful

---

## 💰 Test 5: Cashiers (30 seconds)

```bash
# Login as business first, then:
curl https://csy-backend-production.up.railway.app/api/business/cashiers \
  -H "Authorization: Bearer {BUSINESS_TOKEN}"

# Login as cashier
curl -X POST https://csy-backend-production.up.railway.app/api/cashier/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sara.cashier@example.com","password":"password123"}'
```

**✅ Expected:**
- Multiple cashiers returned (10+)
- Login successful

---

## ✅ All Tests Pass If:

1. ✅ Cities API returns Dubai/UAE cities
2. ✅ Order creation returns order details (not null)
3. ✅ Order accept/reject works
4. ✅ 8+ drivers with pictures exist
5. ✅ 10+ cashiers exist
6. ✅ No errors in Railway logs

**Total Testing Time: ~5 minutes**

