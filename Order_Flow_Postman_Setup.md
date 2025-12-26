# Order Creation & Management Flow - Postman Collection Setup

## 📋 Overview

This Postman collection provides a complete step-by-step flow for:
1. **User Side**: Login → Get Products → Create Order
2. **Business Side**: Login → Get Orders → Reject Order → Accept Order

## 🚀 Quick Start

### Step 1: Import Collection

1. Open Postman
2. Click **Import** button
3. Select `Order_Creation_Flow_Postman_Collection.json`
4. Collection will be imported with all endpoints

### Step 2: Set Environment Variables

The collection uses these environment variables (auto-saved by test scripts):

- `base_url` - Already set to Railway production URL
- `userToken` - Auto-saved from User Login
- `businessToken` - Auto-saved from Business Login
- `productId` - Auto-saved from Get Products
- `orderId` - Auto-saved from Create Order or Get Orders
- `businessId` - Auto-saved from Get Products or Business Login
- `userId` - Auto-saved from User Login
- `orderNumber` - Auto-saved from Create Order

**Note**: You can also create a Postman Environment and set `base_url` manually if needed.

## 📝 Step-by-Step Flow

### Part 1: User Authentication & Order Creation

#### Step 1: User Login
- **Endpoint**: `POST /api/auth/login`
- **Body**: 
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **What it does**: 
  - Authenticates user
  - Auto-saves `userToken` and `userId` to environment
- **Expected Response**: 200 OK with token

#### Step 2: Get Business Products
- **Endpoint**: `GET /api/business/:id/products`
- **What it does**: 
  - Gets all products from a business
  - Auto-saves first `productId` and `businessId` to environment
- **Note**: Replace `{{businessId}}` with actual business ID, or use the one from test accounts
- **Expected Response**: 200 OK with products array

#### Step 3: Create Order
- **Endpoint**: `POST /api/orders`
- **Headers**: `Authorization: Bearer {{userToken}}`
- **Body**: 
  ```json
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
- **What it does**: 
  - Creates a new order with status `pending`
  - Auto-saves `orderId` and `orderNumber` to environment
- **Expected Response**: 201 Created with order details

### Part 2: Business Order Management

#### Step 4: Business Login
- **Endpoint**: `POST /api/business/login`
- **Body**: 
  ```json
  {
    "email": "business@example.com",
    "password": "password123"
  }
  ```
- **What it does**: 
  - Authenticates business owner
  - Auto-saves `businessToken` and `businessId` to environment
- **Expected Response**: 200 OK with token

#### Step 5: Get Business Orders
- **Endpoint**: `GET /api/business/orders`
- **Headers**: `Authorization: Bearer {{businessToken}}`
- **Query Params** (optional):
  - `page`: 1
  - `limit`: 20
  - `status`: "pending" (to filter only pending orders)
- **What it does**: 
  - Gets all orders for the business
  - Auto-saves first pending `orderId` and `orderNumber` to environment
- **Expected Response**: 200 OK with orders array

#### Step 6: Reject Order
- **Endpoint**: `PUT /api/business/orders/:id/reject`
- **Headers**: `Authorization: Bearer {{businessToken}}`
- **Body**: 
  ```json
  {
    "reason": "Out of stock"
  }
  ```
- **What it does**: 
  - Rejects a pending order
  - Changes order status to `cancelled`
  - Sends notification to user
- **Expected Response**: 200 OK with updated order

#### Step 7: Accept Order
- **Endpoint**: `PUT /api/business/orders/:id/accept`
- **Headers**: `Authorization: Bearer {{businessToken}}`
- **What it does**: 
  - Accepts a pending order
  - Changes order status to `accepted`
  - Sends notification to user
- **Expected Response**: 200 OK with updated order
- **Note**: You need a pending order to accept. If you rejected the order in Step 6, create a new order first.

## 🔑 Test Accounts

Use these test accounts (from `TEST_ACCOUNTS_SETUP.md`):

### User Account
```
Email: user@example.com
Password: password123
```

### Business Account
```
Email: business@example.com
Password: password123
```

**Note**: Update the email and password in the request bodies if using different accounts.

## 🧪 Testing Tips

### Testing Reject Flow
1. Run Steps 1-3 to create an order
2. Run Step 4 to login as business
3. Run Step 5 to see the pending order
4. Run Step 6 to reject the order
5. Verify order status is now `cancelled`

### Testing Accept Flow
1. Run Steps 1-3 to create an order
2. Run Step 4 to login as business
3. Run Step 5 to see the pending order
4. Run Step 7 to accept the order
5. Verify order status is now `accepted`

### Testing Both Flows
1. Create two orders (run Steps 1-3 twice with different products)
2. Login as business (Step 4)
3. Get orders (Step 5)
4. Reject one order (Step 6)
5. Accept the other order (Step 7)

## 📊 Response Examples

### Successful Order Creation
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order": {
      "id": "order-uuid",
      "order_number": "ORD-20251226-001",
      "status": "pending",
      "total_amount": "30000",
      "final_amount": "31500"
    }
  }
}
```

### Successful Order Acceptance
```json
{
  "success": true,
  "message": "Order accepted successfully",
  "data": {
    "order_id": "order-uuid",
    "order_number": "ORD-20251226-001",
    "status": "accepted"
  }
}
```

### Successful Order Rejection
```json
{
  "success": true,
  "message": "Order rejected successfully",
  "data": {
    "order_id": "order-uuid",
    "order_number": "ORD-20251226-001",
    "status": "cancelled",
    "reason": "Out of stock"
  }
}
```

## ⚠️ Common Issues

### Issue: "Product not found"
- **Solution**: Make sure you run Step 2 (Get Products) first to get a valid `productId`
- Check that the business has products available

### Issue: "Order not found or cannot be accepted"
- **Solution**: Make sure the order status is `pending`
- Verify the order belongs to the business you logged in with
- Check that you're using the correct `orderId`

### Issue: "Invalid credentials"
- **Solution**: Update email and password in login requests
- Make sure test accounts exist in the database

### Issue: Token expired
- **Solution**: Re-run the login step to get a new token
- Tokens are auto-saved, but may expire after some time

## 🔄 Running the Complete Flow

1. **Create Order Flow**:
   - Step 1: User Login
   - Step 2: Get Business Products
   - Step 3: Create Order

2. **Manage Order Flow**:
   - Step 4: Business Login
   - Step 5: Get Business Orders
   - Step 6: Reject Order (optional)
   - Step 7: Accept Order

## 📱 Live URL

The collection is pre-configured with:
- **Base URL**: `https://csy-backend-production.up.railway.app`

All endpoints use `{{base_url}}` variable which is set to the Railway production URL.

## ✅ Success Checklist

- [ ] Collection imported successfully
- [ ] User login works and token is saved
- [ ] Products are retrieved successfully
- [ ] Order is created successfully
- [ ] Business login works and token is saved
- [ ] Orders are retrieved successfully
- [ ] Order rejection works
- [ ] Order acceptance works

---

**Happy Testing! 🚀**

