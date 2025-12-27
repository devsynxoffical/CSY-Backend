# 📦 Order Management Test Collection Guide

This guide explains how to use the Postman collection for testing order management endpoints.

## 🚀 Quick Start

### 1. Import Collection

1. Open Postman
2. Click **Import** button
3. Select `Order_Management_Test_Collection.json`
4. Collection will be imported with all endpoints

### 2. Set Up Environment Variables

Create a new environment or use existing one with these variables:

```
base_url = https://csy-backend-production.up.railway.app
userToken = (will be set automatically after login)
businessToken = (will be set automatically after login)
userId = (will be set automatically after login)
businessId = (will be set automatically after login)
orderId = (will be set automatically when orders are fetched)
productId = (will be set automatically when products are fetched)
```

**Note:** Most variables are set automatically by the collection's test scripts.

---

## 📋 Collection Structure

### 1. Authentication
- **User Login** - Login as user, saves `userToken` and `userId`
- **Business Login** - Login as business, saves `businessToken` and `businessId`

### 2. Get Business Orders (to get orderId)
- **Get Business Orders** - Fetches orders and sets `orderId` for testing

### 3. User Order Endpoints
- **Get User Orders** - `GET /api/orders/user` (Fixed: no UUID validation error)
- **Get Order Details** - `GET /api/orders/{orderId}` (Fixed: no phone field error)
- **Cancel Order** - `DELETE /api/orders/{orderId}` (Fixed: Prisma syntax)

### 4. Business Order Management
- **Accept Order** - `PUT /api/business/orders/{orderId}/accept`
- **Reject Order** - `PUT /api/business/orders/{orderId}/reject`

### 5. Create Order (for testing)
- **Get Business Products** - Get products to create order
- **Create Order** - Create a new order for testing

---

## 🧪 Testing Flow

### Step 1: Authentication

1. Run **User Login**
   - Email: `user@example.com`
   - Password: `password123`
   - ✅ Token saved automatically

2. Run **Business Login**
   - Email: `business@example.com`
   - Password: `password123`
   - ✅ Token saved automatically

### Step 2: Get Order ID

**Option A: Get from Business Orders**
1. Run **Get Business Orders**
   - Uses `businessToken` automatically
   - ✅ Sets `orderId` from first order

**Option B: Create New Order**
1. Run **Get Business Products** (if `businessId` is set)
2. Run **Create Order**
   - ✅ Sets `orderId` from created order

### Step 3: Test User Endpoints

1. **Get User Orders**
   ```
   GET /api/orders/user
   ```
   - ✅ Should work (no UUID validation error)
   - Returns paginated list of user's orders

2. **Get Order Details**
   ```
   GET /api/orders/{orderId}
   ```
   - ✅ Should work (no phone field error)
   - Returns complete order details with business info

3. **Cancel Order**
   ```
   DELETE /api/orders/{orderId}
   ```
   - ✅ Should work (Prisma syntax fixed)
   - Only works for pending/accepted orders

### Step 4: Test Business Endpoints

1. **Accept Order**
   ```
   PUT /api/business/orders/{orderId}/accept
   ```
   - ✅ Should work (already fixed)
   - Changes order status to "accepted"

2. **Reject Order**
   ```
   PUT /api/business/orders/{orderId}/reject
   ```
   - ✅ Should work (already fixed)
   - Requires reason in body
   - Changes order status to "rejected"

---

## ✅ Expected Results

### Get User Orders
```json
{
  "success": true,
  "message": "Orders retrieved successfully",
  "data": {
    "orders": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "pages": 1
    }
  }
}
```

### Get Order Details
```json
{
  "success": true,
  "message": "Order details retrieved successfully",
  "data": {
    "order": {
      "id": "...",
      "order_number": "...",
      "status": "pending",
      "business": {
        "id": "...",
        "business_name": "...",
        "address": "...",
        "owner_email": "...",
        "photos": [...]
      },
      "items": [...]
    }
  }
}
```

### Cancel Order
```json
{
  "success": true,
  "message": "Order cancelled successfully"
}
```

### Accept Order
```json
{
  "success": true,
  "message": "Order accepted successfully"
}
```

### Reject Order
```json
{
  "success": true,
  "message": "Order rejected successfully"
}
```

---

## 🐛 Troubleshooting

### Issue: "Invalid UUID format" for `/api/orders/user`
**Solution:** ✅ Fixed - Route ordering corrected. Should work now.

### Issue: "Unknown field 'phone' for select statement"
**Solution:** ✅ Fixed - Removed phone field from Business select. Should work now.

### Issue: "Failed to cancel order" (500 error)
**Solution:** ✅ Fixed - Replaced MongoDB syntax with Prisma. Should work now.

### Issue: "Order not found"
**Solution:** 
- Make sure `orderId` is set in environment
- Verify order exists by running "Get Business Orders" first
- Check that order belongs to the logged-in user/business

### Issue: "Order cannot be cancelled at this stage"
**Solution:** 
- Only pending or accepted orders can be cancelled
- Check order status first using "Get Order Details"

### Issue: Token not set
**Solution:**
- Run "User Login" or "Business Login" first
- Check that test scripts are enabled in Postman settings

---

## 📝 Test Credentials

**User:**
- Email: `user@example.com`
- Password: `password123`

**Business:**
- Email: `business@example.com`
- Password: `password123`

**Note:** These are test accounts. Run `npm run db:create:test-accounts` if they don't exist.

---

## 🎯 Test Checklist

- [ ] User login successful (token saved)
- [ ] Business login successful (token saved)
- [ ] Get user orders works (no UUID error)
- [ ] Get order details works (no phone field error)
- [ ] Cancel order works (Prisma syntax)
- [ ] Accept order works
- [ ] Reject order works
- [ ] All endpoints return proper responses
- [ ] No errors in Railway logs

---

## 📊 Collection Features

✅ **Automatic Token Management**
- Tokens are saved automatically after login
- Used in subsequent requests automatically

✅ **Automatic Order ID Management**
- Order ID is extracted and saved automatically
- Used in all order-specific endpoints

✅ **Test Scripts**
- Each request has validation tests
- Tests check response structure and status codes

✅ **Environment Variables**
- Base URL configurable
- All tokens and IDs managed automatically

---

**Happy Testing! 🎉**

