# Driver & Cashier Endpoints - Postman Collection Setup

## 📥 Import Collection

1. Open Postman
2. Click **Import** button
3. Select file: `Driver_Cashier_Endpoints_Postman_Collection.json`
4. Collection will be imported with all endpoints

---

## 🔧 Setup Environment Variables

### Create New Environment

1. Click **Environments** in left sidebar
2. Click **+** to create new environment
3. Name it: `CSY Production - Driver & Cashier`

### Add Variables

Add these variables:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `base_url` | `https://csy-backend-production.up.railway.app` | `https://csy-backend-production.up.railway.app` |
| `driverToken` | (leave empty) | (auto-filled after login) |
| `cashierToken` | (leave empty) | (auto-filled after login) |
| `orderId` | (leave empty) | (auto-filled after operations) |
| `driverId` | (leave empty) | (auto-filled after login) |
| `cashierId` | (leave empty) | (auto-filled after login) |

4. **Save** the environment
5. **Select** this environment from dropdown (top right)

---

## 🚀 Usage Guide

### Step 1: Login First

**For Driver:**
1. Go to **Authentication** → **Driver Login**
2. Update email and password in request body
3. Click **Send**
4. Token will be automatically saved to `driverToken` variable

**For Cashier:**
1. Go to **Authentication** → **Cashier Login**
2. Update email and password in request body
3. Click **Send**
4. Token will be automatically saved to `cashierToken` variable

### Step 2: Use Endpoints

After login, all endpoints will automatically use the saved tokens.

---

## 📋 Endpoints Included

### Authentication
- ✅ **POST** `/api/driver/login` - Driver login
- ✅ **POST** `/api/cashier/login` - Cashier login

### Driver Endpoints
- ✅ **GET** `/api/driver/profile` - Get driver profile
- ✅ **GET** `/api/driver/orders/incoming` - Get incoming orders
- ✅ **GET** `/api/driver/earnings` - Get driver earnings
- ✅ **POST** `/api/driver/orders/:id/deliver` - Deliver order

### Cashier Endpoints
- ✅ **GET** `/api/cashier/orders` - Get cashier orders

---

## 🔍 Endpoint Details

### 1. GET /api/driver/profile
**Description:** Get driver profile with active orders, completed today count, and ratings

**Headers:**
```
Authorization: Bearer {{driverToken}}
```

**Response:**
- Active orders count
- Completed orders today (uses `actual_delivery_time`)
- Ratings summary

---

### 2. GET /api/driver/orders/incoming
**Description:** Get available/incoming orders for driver (orders with status 'waiting_driver' without assigned driver)

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10, max: 50)
- `latitude` (optional) - Driver's current latitude
- `longitude` (optional) - Driver's current longitude

**Headers:**
```
Authorization: Bearer {{driverToken}}
```

---

### 3. GET /api/driver/earnings
**Description:** Get driver earnings and statistics for a date range

**Query Parameters:**
- `startDate` (optional) - Format: YYYY-MM-DD (defaults to start of current month)
- `endDate` (optional) - Format: YYYY-MM-DD (defaults to end of current month)

**Headers:**
```
Authorization: Bearer {{driverToken}}
```

**Note:** Uses `actual_delivery_time` field to filter completed orders

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2025-12-01T00:00:00.000Z",
      "end": "2025-12-31T23:59:59.999Z"
    },
    "summary": {
      "total_orders": 10,
      "total_earnings": 500.00,
      "platform_fees": 150.00,
      "net_earnings": 350.00
    },
    "orders": [...]
  }
}
```

---

### 4. POST /api/driver/orders/:id/deliver
**Description:** Mark order as delivered. Sets `actual_delivery_time` field and updates order status to 'completed'

**Path Parameters:**
- `id` - Order ID (UUID)

**Headers:**
```
Authorization: Bearer {{driverToken}}
Content-Type: application/json
```

**Request Body:**
```json
{
  "delivery_notes": "Delivered successfully to customer"
}
```

**Requirements:**
- Order must be assigned to the driver
- Order status must be `in_delivery`

**Response:**
```json
{
  "success": true,
  "message": "Order marked as delivered successfully",
  "data": {
    "orderId": "order-uuid",
    "status": "completed",
    "delivered_at": "2025-12-26T12:00:00.000Z"
  }
}
```

---

### 5. GET /api/cashier/orders
**Description:** Get all orders for the cashier's business

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `status` (optional) - Filter by status: pending, accepted, preparing, ready, completed, cancelled
- `startDate` (optional) - Format: YYYY-MM-DD
- `endDate` (optional) - Format: YYYY-MM-DD

**Headers:**
```
Authorization: Bearer {{cashierToken}}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

---

## ⚠️ Important Notes

### Migration Required
These endpoints use `actual_delivery_time` field which requires database migration:
- Migration file: `20251226060119_add_actual_delivery_time`
- Should auto-apply on Railway deployment
- If errors persist, check Railway logs for migration status

### Authentication
- All endpoints (except login) require authentication token
- Tokens are automatically saved after login
- Tokens expire after 24 hours (default)

### Error Handling
Common errors:
- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - Order/Driver/Cashier not found
- `400 Bad Request` - Invalid request data or order status
- `500 Internal Server Error` - Database migration not applied

---

## 🧪 Testing Flow

1. **Login as Driver:**
   - Use Driver Login endpoint
   - Token saved automatically

2. **Get Profile:**
   - Test GET /api/driver/profile
   - Should return driver data

3. **Get Incoming Orders:**
   - Test GET /api/driver/orders/incoming
   - Should return available orders

4. **Get Earnings:**
   - Test GET /api/driver/earnings
   - Should return earnings data (if migration applied)

5. **Deliver Order:**
   - First accept an order (if needed)
   - Then use POST /api/driver/orders/:id/deliver
   - Sets actual_delivery_time

6. **Login as Cashier:**
   - Use Cashier Login endpoint
   - Token saved automatically

7. **Get Cashier Orders:**
   - Test GET /api/cashier/orders
   - Should return business orders

---

## 📝 Example Request Bodies

### Driver Login
```json
{
  "email": "driver@example.com",
  "password": "driverpassword123"
}
```

### Cashier Login
```json
{
  "email": "cashier@restaurant.com",
  "password": "cashierpassword123"
}
```

### Deliver Order
```json
{
  "delivery_notes": "Delivered successfully. Customer was satisfied."
}
```

---

## ✅ Collection Features

- ✅ Auto-save tokens after login
- ✅ Pre-configured with live Railway URL
- ✅ All required headers included
- ✅ Query parameters with descriptions
- ✅ Example request bodies
- ✅ Environment variables for easy token management

---

**Ready to use! Import the collection and start testing.** 🚀

