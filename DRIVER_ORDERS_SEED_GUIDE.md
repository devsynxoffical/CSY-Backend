# 🛵 Driver Orders Seed Guide

## Overview
This guide explains how to seed orders for the driver app, so drivers can see **incoming orders** and **active orders** when they log in.

---

## 📋 What This Script Creates

### 1. **Incoming Orders** (5 orders)
- **Status**: `waiting_driver`
- **Driver**: Not assigned (null)
- **Purpose**: Orders available for drivers to accept
- **Shows in**: Driver app "Incoming Orders" section

### 2. **Active Orders** (3 orders)
- **Status**: `in_delivery` or `accepted`
- **Driver**: Assigned to **Ahmed Hassan**
- **Purpose**: Orders currently assigned to the driver
- **Shows in**: Driver app "Active Orders" section

---

## 🚀 How to Run

### On Railway (Recommended)
```bash
railway run npm run db:seed:driver-orders
```

### Locally (if database is accessible)
```bash
npm run db:seed:driver-orders
```

---

## ⚙️ Prerequisites

Before running this script, make sure you have:

1. ✅ **Drivers seeded**
   ```bash
   npm run db:seed:drivers-cashiers
   ```
   - Ensures Ahmed Hassan driver exists

2. ✅ **Businesses seeded**
   - At least 1-3 active businesses
   - Can use: `npm run db:seed:alexandria` or other business seed scripts

3. ✅ **Products seeded**
   - At least 5-10 products from active businesses
   - Products should be available (`is_available: true`)

4. ✅ **Users exist** (optional)
   - Script will create a test user if none exists

---

## 📊 Order Details

### Incoming Orders Structure
```javascript
{
  status: 'waiting_driver',
  driver_id: null,  // No driver assigned
  order_type: 'delivery',
  payment_method: 'cash' | 'online',
  // Includes: order_items, delivery_address, etc.
}
```

### Active Orders Structure
```javascript
{
  status: 'in_delivery' | 'accepted',
  driver_id: 'ahmed-hassan-driver-id',  // Assigned to Ahmed Hassan
  order_type: 'delivery',
  payment_method: 'cash' | 'online',
  // Includes: order_items, delivery_address, etc.
}
```

---

## 🔍 What Driver Sees in App

### When Ahmed Hassan Logs In:

#### 1. **Incoming Orders** (`GET /api/driver/orders/incoming`)
- Shows 5 orders with `waiting_driver` status
- No driver assigned yet
- Driver can accept these orders
- Includes:
  - Order number
  - Business name and location
  - Delivery address
  - Total amount
  - Payment method
  - Order items

#### 2. **Active Orders** (`GET /api/driver/orders/accepted` or `/in-delivery`)
- Shows 3 orders assigned to Ahmed Hassan
- Status: `in_delivery` or `accepted`
- Driver can:
  - Track delivery progress
  - Update order status
  - Complete delivery

---

## 📝 Order Data Created

### Incoming Orders (5 orders)
1. Fast food order - Cash payment - 25 EGP delivery fee
2. Restaurant order - Online payment - 30 EGP delivery fee
3. Cafe order (multiple items) - Cash payment - 20 EGP delivery fee
4. Dessert shop order - Online payment - 35 EGP delivery fee
5. Quick delivery - Cash payment - 25 EGP delivery fee

### Active Orders (3 orders)
1. Fast food order - `in_delivery` - Cash payment
2. Restaurant order - `in_delivery` - Online payment
3. Cafe order - `accepted` - Cash payment

---

## 🧪 Testing Driver App

### Step 1: Login as Ahmed Hassan
```bash
POST /api/driver/login
{
  "email": "ahmed.hassan.driver@example.com",
  "password": "password123"
}
```

### Step 2: Get Incoming Orders
```bash
GET /api/driver/orders/incoming
Authorization: Bearer <token>
```

**Expected Response:**
- 5 orders with `waiting_driver` status
- No `driver_id` assigned
- Ready to accept

### Step 3: Get Active Orders
```bash
GET /api/driver/orders/accepted
# or
GET /api/driver/orders/in-delivery
Authorization: Bearer <token>
```

**Expected Response:**
- 3 orders assigned to Ahmed Hassan
- Status: `in_delivery` or `accepted`
- Can track and complete

### Step 4: Accept an Incoming Order
```bash
POST /api/driver/orders/:orderId/accept
Authorization: Bearer <token>
```

**Result:**
- Order status changes to `in_delivery`
- `driver_id` set to Ahmed Hassan
- Order moves from "incoming" to "active"

---

## 🔄 Re-running the Script

The script is **idempotent** - you can run it multiple times:
- Creates new orders each time
- Doesn't delete existing orders
- Adds to existing data

**To start fresh:**
1. Delete existing orders (if needed)
2. Run the seed script again

---

## 📍 Order Locations

All orders use:
- **User Address**: Downtown Cairo, Tahrir Square area
- **Coordinates**: 30.0444, 31.2357
- **Delivery Type**: All are delivery orders (not pickup)

---

## 💰 Order Pricing

Each order includes:
- **Total Amount**: Sum of all order items
- **Platform Fee**: 2% of total amount
- **Delivery Fee**: 20-35 EGP (varies)
- **Final Amount**: Total + Platform Fee + Delivery Fee

---

## 🐛 Troubleshooting

### Error: "Driver not found"
**Solution**: Run driver seed script first
```bash
npm run db:seed:drivers-cashiers
```

### Error: "No businesses found"
**Solution**: Seed businesses first
```bash
npm run db:seed:alexandria
# or your business seed script
```

### Error: "No products found"
**Solution**: Ensure businesses have products
- Check products exist in database
- Products must be `is_available: true`

### Error: "Database connection failed"
**Solution**: 
- For Railway: Use `railway run` command
- For local: Check DATABASE_URL in .env file

---

## 📊 Summary

| Item | Count | Status |
|------|-------|--------|
| Incoming Orders | 5 | `waiting_driver` |
| Active Orders | 3 | `in_delivery` / `accepted` |
| Total Orders | 8 | Mixed payment methods |
| Assigned Driver | Ahmed Hassan | For active orders |

---

## ✅ Verification

After running the script, verify:

1. ✅ Check database:
   ```sql
   SELECT COUNT(*) FROM orders WHERE status = 'waiting_driver';
   -- Should return 5
   
   SELECT COUNT(*) FROM orders WHERE driver_id = '<ahmed-hassan-id>';
   -- Should return 3
   ```

2. ✅ Test API endpoints:
   - Incoming orders endpoint returns 5 orders
   - Active orders endpoint returns 3 orders

3. ✅ Check order items:
   - Each order has 1-3 order items
   - Order items linked to businesses and products

---

## 🎯 Next Steps

1. Run the seed script
2. Login as Ahmed Hassan in driver app
3. Verify incoming orders appear
4. Verify active orders appear
5. Test accepting an incoming order
6. Test completing an active order

---

**Script Location**: `scripts/seed-driver-orders.js`  
**NPM Command**: `npm run db:seed:driver-orders`  
**Last Updated**: Current

