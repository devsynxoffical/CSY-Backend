# 🧪 Quick Test Guide - All Fixed Endpoints

This guide helps you quickly test all the fixes we made.

## 🚀 Quick Start

### Option 1: Use Postman Collection (Recommended)

1. **Import Collection:**
   - Open Postman
   - Click **Import**
   - Select `Order_Management_Test_Collection.json`
   - Collection will be imported with all endpoints

2. **Set Environment Variables:**
   ```
   base_url = https://csy-backend-production.up.railway.app
   ```
   (Other variables like tokens will be set automatically)

3. **Run Tests in Order:**
   - 1. Authentication → User Login
   - 1. Authentication → Business Login
   - 2. Get Business Orders (to get orderId)
   - 3. User Order Endpoints → Test all
   - 4. Business Order Management → Test accept/reject

---

## 📋 Test Each Fixed Endpoint

### ✅ 1. Get User Orders (Fixed: Route Ordering)

**Endpoint:**
```
GET /api/orders/user?page=1&limit=10
```

**Headers:**
```
Authorization: Bearer {{userToken}}
```

**Expected Result:**
- ✅ Status: `200 OK`
- ✅ No "Invalid UUID format" error
- ✅ Returns orders array

**Test in Postman:**
1. Run "User Login" first (saves token automatically)
2. Run "Get User Orders"
3. Should work without UUID error

---

### ✅ 2. Get Order Details (Fixed: Business Phone Field)

**Endpoint:**
```
GET /api/orders/{orderId}
```

**Headers:**
```
Authorization: Bearer {{userToken}}
```

**Expected Result:**
- ✅ Status: `200 OK`
- ✅ No "Unknown field 'phone'" error
- ✅ Returns order with business info (owner_email instead of phone)

**Test in Postman:**
1. Get orderId from "Get Business Orders" or "Get User Orders"
2. Run "Get Order Details"
3. Check response has business info without phone field

---

### ✅ 3. Cancel Order (Fixed: Prisma Syntax)

**Endpoint:**
```
DELETE /api/orders/{orderId}
```

**Headers:**
```
Authorization: Bearer {{userToken}}
```

**Expected Result:**
- ✅ Status: `200 OK` (if order can be cancelled)
- ✅ No "Order is not defined" error
- ✅ Returns success message

**Test in Postman:**
1. Get orderId (must be pending or accepted status)
2. Run "Cancel Order"
3. Should work without MongoDB syntax error

---

### ✅ 4. Get Business Products (Fixed: Route Ordering)

**Endpoint:**
```
GET /api/business/products?page=1&limit=20
```

**Headers:**
```
Authorization: Bearer {{businessToken}}
```

**Expected Result:**
- ✅ Status: `200 OK`
- ✅ No "Invalid UUID format" error
- ✅ Returns products array

**Test in Postman:**
1. Run "Business Login" first (saves token automatically)
2. Run "Get Business Products" (if exists in collection)
3. Or create new request:
   - Method: GET
   - URL: `{{base_url}}/api/business/products`
   - Headers: `Authorization: Bearer {{businessToken}}`
4. Should work without UUID error

---

### ✅ 5. Accept Order (Already Fixed)

**Endpoint:**
```
PUT /api/business/orders/{orderId}/accept
```

**Headers:**
```
Authorization: Bearer {{businessToken}}
```

**Expected Result:**
- ✅ Status: `200 OK`
- ✅ Returns "Order accepted successfully"

---

### ✅ 6. Reject Order (Already Fixed)

**Endpoint:**
```
PUT /api/business/orders/{orderId}/reject
```

**Headers:**
```
Authorization: Bearer {{businessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "reason": "Out of stock"
}
```

**Expected Result:**
- ✅ Status: `200 OK`
- ✅ Returns "Order rejected successfully"

---

## 🔧 Manual Testing (Without Postman)

### Using cURL

#### 1. User Login
```bash
curl -X POST https://csy-backend-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

**Save the token from response**

#### 2. Get User Orders
```bash
curl -X GET "https://csy-backend-production.up.railway.app/api/orders/user?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected:** Should return orders without UUID error

#### 3. Business Login
```bash
curl -X POST https://csy-backend-production.up.railway.app/api/business/login \
  -H "Content-Type: application/json" \
  -d '{"email":"business@example.com","password":"password123"}'
```

**Save the business token**

#### 4. Get Business Products
```bash
curl -X GET "https://csy-backend-production.up.railway.app/api/business/products?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_BUSINESS_TOKEN_HERE"
```

**Expected:** Should return products without UUID error

---

## ✅ Test Checklist

### Order Endpoints
- [ ] Get User Orders works (no UUID error)
- [ ] Get Order Details works (no phone field error)
- [ ] Cancel Order works (no MongoDB syntax error)
- [ ] Order details include business info (owner_email, not phone)

### Business Endpoints
- [ ] Get Business Products works (no UUID error)
- [ ] Accept Order works
- [ ] Reject Order works

### General
- [ ] No errors in Railway logs
- [ ] All endpoints return proper status codes
- [ ] All responses have correct structure

---

## 🐛 Troubleshooting

### Issue: Still getting UUID validation error
**Solution:**
- Wait for Railway to redeploy (takes 1-2 minutes)
- Clear browser/Postman cache
- Check that you're using the latest code

### Issue: Token not working
**Solution:**
- Run login endpoint again
- Check token is saved in environment variables
- Verify token is in Authorization header

### Issue: Order not found
**Solution:**
- Create a new order first
- Check orderId is correct
- Verify order belongs to logged-in user/business

### Issue: Products not found
**Solution:**
- Make sure business has products
- Check business is logged in correctly
- Verify businessId is correct

---

## 📊 Expected Response Examples

### Get User Orders (Success)
```json
{
  "success": true,
  "message": "Orders retrieved successfully",
  "data": {
    "orders": [
      {
        "id": "...",
        "order_number": "...",
        "status": "pending",
        "total_amount": 10000,
        ...
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "pages": 1
    }
  }
}
```

### Get Order Details (Success)
```json
{
  "success": true,
  "message": "Order details retrieved successfully",
  "data": {
    "order": {
      "id": "...",
      "order_number": "...",
      "business": {
        "id": "...",
        "business_name": "...",
        "owner_email": "...",
        "address": "...",
        "photos": [...]
      },
      "items": [...]
    }
  }
}
```

### Get Business Products (Success)
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "products": [
      {
        "id": "...",
        "name": "...",
        "price": 75000,
        ...
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10,
      "totalPages": 1
    }
  }
}
```

---

## 🎯 Quick Test Script

Run these in order:

1. ✅ Login as User → Get token
2. ✅ Get User Orders → Should work
3. ✅ Get Order Details → Should work
4. ✅ Cancel Order → Should work
5. ✅ Login as Business → Get token
6. ✅ Get Business Products → Should work
7. ✅ Accept/Reject Order → Should work

**All should work without errors!** 🎉

---

**Last Updated:** After all route ordering and Prisma syntax fixes

