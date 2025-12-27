# 🐛 Errors List & Fixes

## 📋 Errors Found from Railway Logs & Postman

### 1. ❌ **Business Model 'phone' Field Error**
**Error:** `Unknown field 'phone' for select statement on model 'Business'`

**Location:** `controllers/order.controller.js:846`

**Issue:** Business model doesn't have a `phone` field, but code tries to select it.

**Fix:** Remove `phone` from Business select statement.

---

### 2. ❌ **Cancel Order - MongoDB Syntax Error**
**Error:** `Failed to cancel order` (500 Internal Server Error)

**Location:** `controllers/order.controller.js:473`

**Issue:** Using old MongoDB syntax `Order.findOne()` instead of Prisma.

**Fix:** Replace with Prisma `prisma.order.findUnique()`.

---

### 3. ❌ **Route Ordering - UUID Validation Error**
**Error:** `Invalid UUID format` for `/api/orders/user`

**Location:** `routes/order.routes.js`

**Issue:** Route `/user` comes after `/:id`, so "user" is treated as UUID parameter.

**Fix:** Move `/user` route before `/:id` route.

---

### 4. ❌ **Get Order Details Helper Error**
**Error:** `Get order details helper error` and `Order details helper returned null`

**Location:** `controllers/order.controller.js:_getOrderDetailsHelper`

**Issue:** Business `phone` field error causing helper to fail.

**Fix:** Remove `phone` from Business select.

---

### 5. ❌ **Order Not Found (404)**
**Error:** `Order not found` when fetching order details

**Location:** `controllers/order.controller.js:getOrderDetails`

**Issue:** May be related to helper returning null.

**Fix:** Fix helper method first.

---

### 6. ⚠️ **COUNTRIES Error (May be resolved)**
**Error:** `ReferenceError: COUNTRIES is not defined` at `/app/config/constants.js:243:3`

**Location:** `utils/qrGenerator.js:2:22`

**Issue:** qrGenerator imports constants, but COUNTRIES might not be exported properly.

**Status:** Should be fixed already, but need to verify.

---

### 7. ⚠️ **Product Not Found During Order Creation**
**Error:** `Product not found during order creation`

**Location:** `controllers/order.controller.js:createOrder`

**Issue:** Product validation failing.

**Status:** May be data issue, not code issue.

---

### 8. ⚠️ **Distance Calculation Error**
**Error:** `Distance calculation error`

**Location:** Maps service or order controller

**Issue:** Distance calculation failing.

**Status:** May be related to missing coordinates.

---

## ✅ Fix Priority

1. **HIGH:** Fix Business `phone` field error (affects order details)
2. **HIGH:** Fix cancelOrder MongoDB syntax (affects order cancellation)
3. **HIGH:** Fix route ordering (affects user orders endpoint)
4. **MEDIUM:** Verify COUNTRIES export
5. **LOW:** Product not found (may be data issue)
6. **LOW:** Distance calculation (may be data issue)

---

## 🔧 Fixes Applied

See commits for detailed changes.

