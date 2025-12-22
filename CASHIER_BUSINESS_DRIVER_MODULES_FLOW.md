# Cashier, Business & Driver Modules - Complete Flow Documentation

## Table of Contents
1. [Cashier Module Flow](#1-cashier-module-flow)
2. [Business Module Flow](#2-business-module-flow)
3. [Driver Module Flow](#3-driver-module-flow)

---

## 1. Cashier Module Flow

### 1.1 Authentication

**Login:**
- **Endpoint:** `POST /api/cashier/login`
- **Body:** `{ email, password }`
- **Response:** Returns cashier profile + JWT token with `role: 'cashier'`
- **Token Usage:** Required for all subsequent requests (Header: `Authorization: Bearer {token}`)

---

### 1.2 Profile Management

**Get Profile:**
- **Endpoint:** `GET /api/cashier/profile`
- **Returns:** Cashier info, business details, active status

---

### 1.3 Order Management

**Get Orders:**
- **Endpoint:** `GET /api/cashier/orders?page={page}&limit={limit}&status={status}&startDate={date}&endDate={date}`
- **Query Params:**
  - `status`: pending, accepted, preparing, ready, completed, cancelled
  - `startDate`, `endDate`: Filter by date range
- **Returns:** List of orders for cashier's business with customer info

**Update Order Status:**
- **Endpoint:** `PUT /api/cashier/orders/:id/status`
- **Body:** `{ status: "preparing" | "ready" | "completed" | "cancelled", notes?: string }`
- **Flow:**
  1. Cashier views pending orders
  2. Updates status as order progresses:
     - `pending` → `accepted` → `preparing` → `ready` → `completed`
  3. Can add notes for each status change

---

### 1.4 Product Management

**Get Products:**
- **Endpoint:** `GET /api/cashier/products?page={page}&limit={limit}&category={category}&available={true|false}`
- **Returns:** Business menu items/products

**Update Product Availability:**
- **Endpoint:** `PUT /api/cashier/products/:id/availability`
- **Body:** `{ is_available: true | false }`
- **Use Case:** Mark items as out of stock or available

---

### 1.5 Payment Processing

**Process Payment:**
- **Endpoint:** `POST /api/cashier/orders/:id/payment`
- **Body:** `{ payment_method: "cash" | "online" | "wallet", payment_amount?: number }`
- **Flow:**
  1. Order is ready/completed
  2. Cashier processes payment
  3. Updates order `payment_status` to `paid`
  4. Creates transaction record
  5. If online/wallet: Deducts from user wallet

---

### 1.6 QR Code Operations

**Scan QR Code:**
- **Endpoint:** `POST /api/cashier/qr/scan`
- **Body:** `{ qr_token: "abc123..." }`
- **Use Cases:**
  - **Discount QR:** Apply discount to order
  - **Payment QR:** Process payment via QR
  - **Reservation QR:** Check-in reservation
  - **Order QR:** Confirm order pickup
- **Returns:** QR data and processed action result

---

### 1.7 Reports & Statistics

**Daily Report:**
- **Endpoint:** `GET /api/cashier/reports/daily?date={YYYY-MM-DD}`
- **Returns:** 
  - Total orders, completed, cancelled
  - Total revenue
  - Cash vs online payments breakdown
  - Individual order details

**Statistics:**
- **Endpoint:** `GET /api/cashier/statistics?startDate={date}&endDate={date}`
- **Returns:** 
  - Orders processed count
  - Payments processed count
  - Total revenue
  - Performance metrics

**Operations History:**
- **Endpoint:** `GET /api/cashier/operations?page={page}&limit={limit}&startDate={date}&endDate={date}`
- **Returns:** Complete audit log of all cashier operations (orders, payments, QR scans)

---

### 1.8 Complete Cashier Workflow

```
1. Cashier Login
   POST /api/cashier/login
   → Get token

2. View Orders Dashboard
   GET /api/cashier/orders?status=pending
   → See new orders

3. Accept & Prepare Order
   PUT /api/cashier/orders/:id/status
   { status: "accepted" }
   → Order accepted, notify user

4. Update to Preparing
   PUT /api/cashier/orders/:id/status
   { status: "preparing" }
   → Kitchen preparing

5. Mark as Ready
   PUT /api/cashier/orders/:id/status
   { status: "ready" }
   → Order ready for pickup/delivery

6. Process Payment (if cash/wallet)
   POST /api/cashier/orders/:id/payment
   { payment_method: "cash" }
   → Payment recorded

7. Complete Order
   PUT /api/cashier/orders/:id/status
   { status: "completed" }
   → Order finished

8. Scan QR Codes (as needed)
   POST /api/cashier/qr/scan
   { qr_token: "..." }
   → Apply discount/process payment

9. View Daily Report
   GET /api/cashier/reports/daily
   → End of day summary
```

---

## 2. Business Module Flow

### 2.1 Authentication & Registration

**Register Business:**
- **Endpoint:** `POST /api/business/register`
- **Body:** 
  ```json
  {
    "owner_email": "owner@restaurant.com",
    "business_name": "Delicious Restaurant",
    "business_type": "restaurant",
    "app_type": "pass",
    "address": "123 Main St",
    "city": "Damietta",
    "governorate": "Damietta",
    "latitude": 31.4165,
    "longitude": 31.8133,
    "password_hash": "password123"
  }
  ```
- **Returns:** Business profile + JWT token with `role: 'business'`

**Login:**
- **Endpoint:** `POST /api/business/login`
- **Body:** `{ email, password }`
- **Returns:** Business profile + JWT token

---

### 2.2 Profile Management

**Get Profile:**
- **Endpoint:** `GET /api/business/profile`
- **Returns:** Complete business profile + statistics (products count, orders count, ratings)

**Update Profile:**
- **Endpoint:** `PUT /api/business/profile`
- **Body:** Can update business_name, address, city, photos, videos, has_reservations, has_delivery

**Update Working Hours:**
- **Endpoint:** `PUT /api/business/working-hours`
- **Body:** 
  ```json
  {
    "working_hours": {
      "monday": "9:00-22:00",
      "tuesday": "9:00-22:00",
      "sunday": "closed"
    }
  }
  ```

**Upload Photos:**
- **Endpoint:** `POST /api/business/photos`
- **Body:** `{ photos: ["url1", "url2"] }`

**Delete Photo:**
- **Endpoint:** `DELETE /api/business/photos/:id` (id = index)

---

### 2.3 Product/Menu Management

**Add Product:**
- **Endpoint:** `POST /api/business/products`
- **Body:**
  ```json
  {
    "name": "Margherita Pizza",
    "description": "Classic pizza",
    "price": 12000,
    "category": "Pizza",
    "image": "https://...",
    "add_ons": [{"name": "Extra Cheese", "price": 5000}]
  }
  ```

**Get Products:**
- **Endpoint:** `GET /api/business/products?page={page}&limit={limit}&category={category}&available={true|false}`

**Update Product:**
- **Endpoint:** `PUT /api/business/products/:id`
- **Body:** Can update name, description, price, image, is_available, add_ons

**Delete Product:**
- **Endpoint:** `DELETE /api/business/products/:id`

---

### 2.4 Category Management

**Create Category:**
- **Endpoint:** `POST /api/business/categories`
- **Body:** `{ name: "Main Course", description?: string }`

**Get Categories:**
- **Endpoint:** `GET /api/business/categories`

**Update Category:**
- **Endpoint:** `PUT /api/business/categories/:id`

**Delete Category:**
- **Endpoint:** `DELETE /api/business/categories/:id`

---

### 2.5 Offer Management

**Create Offer:**
- **Endpoint:** `POST /api/business/offers`
- **Body:** `{ title, description, discount_percentage, valid_from, valid_to }`

**Get Offers:**
- **Endpoint:** `GET /api/business/offers`

**Update Offer:**
- **Endpoint:** `PUT /api/business/offers/:id`

**Delete Offer:**
- **Endpoint:** `DELETE /api/business/offers/:id`

---

### 2.6 Order Management

**Get Orders:**
- **Endpoint:** `GET /api/business/orders?page={page}&limit={limit}&status={status}&startDate={date}&endDate={date}`
- **Returns:** All orders for business with user info

**Accept Order:**
- **Endpoint:** `PUT /api/business/orders/:id/accept`
- **Flow:** Updates status from `pending` → `accepted`, notifies user

**Reject Order:**
- **Endpoint:** `PUT /api/business/orders/:id/reject`
- **Body:** `{ reason: "Item out of stock" }`
- **Flow:** Updates status to `cancelled`, refunds payment, notifies user

---

### 2.7 Reservation Management

**Get Reservations:**
- **Endpoint:** `GET /api/business/reservations?page={page}&limit={limit}&status={status}&date={date}`
- **Query Params:**
  - `status`: pending, confirmed, cancelled, completed, expired
  - `date`: Filter by specific date
- **Returns:** All reservations for business with user info

**Note:** Business can view and manage reservations, but confirmation/cancellation may be handled through separate endpoints if needed.

---

### 2.8 Appointment Management (Medical/Beauty)

**Get Appointments:**
- **Endpoint:** `GET /api/business/appointments?page={page}&limit={limit}&date={date}&service_name={name}`

**Add Appointment Slot:**
- **Endpoint:** `POST /api/business/appointments`
- **Body:**
  ```json
  {
    "service_name": "Hair Cut",
    "description": "Professional hair cutting",
    "duration": 60,
    "price": 50000,
    "date": "2024-12-25",
    "start_time": "10:00",
    "end_time": "11:00",
    "is_available": true
  }
  ```

**Update Appointment:**
- **Endpoint:** `PUT /api/business/appointments/:id`

**Delete Appointment:**
- **Endpoint:** `DELETE /api/business/appointments/:id`

---

### 2.9 Cashier Management

**Create Cashier:**
- **Endpoint:** `POST /api/business/cashiers`
- **Body:** `{ email, full_name, password_hash }`
- **Flow:** Creates cashier account linked to business

**Get Cashiers:**
- **Endpoint:** `GET /api/business/cashiers?page={page}&limit={limit}`

**Update Cashier:**
- **Endpoint:** `PUT /api/business/cashiers/:id`
- **Body:** `{ full_name?, is_active? }`

**Delete Cashier:**
- **Endpoint:** `DELETE /api/business/cashiers/:id`

---

### 2.10 Analytics & Reports

**Dashboard:**
- **Endpoint:** `GET /api/business/dashboard?startDate={date}&endDate={date}`
- **Returns:**
  - Orders metrics (total, completed, cancelled, revenue)
  - Reservations metrics
  - Ratings summary
  - Revenue breakdown

**Analytics:**
- **Endpoint:** `GET /api/business/analytics?startDate={date}&endDate={date}&reportType={type}`
- **Report Types:** summary, orders, revenue, customers, products

**Financials:**
- **Endpoint:** `GET /api/business/financials?page={page}&limit={limit}&startDate={date}&endDate={date}&type={type}`
- **Returns:** All financial transactions (payments, refunds, platform fees)

**Operations Log:**
- **Endpoint:** `GET /api/business/operations-log?page={page}&limit={limit}&startDate={date}&endDate={date}&operation_type={type}`
- **Returns:** Complete audit log of business operations

---

### 2.11 Complete Business Workflow

```
1. Business Registration/Login
   POST /api/business/register or /api/business/login
   → Get token

2. Setup Business Profile
   PUT /api/business/profile
   PUT /api/business/working-hours
   POST /api/business/photos
   → Complete business setup

3. Add Products/Menu
   POST /api/business/products
   POST /api/business/categories
   → Create menu items

4. Create Cashiers
   POST /api/business/cashiers
   → Add staff accounts

5. Monitor Orders
   GET /api/business/orders?status=pending
   → View incoming orders

6. Accept/Reject Orders
   PUT /api/business/orders/:id/accept
   PUT /api/business/orders/:id/reject
   → Manage order flow

7. Manage Reservations
   GET /api/business/reservations
   → View bookings

8. View Analytics
   GET /api/business/dashboard
   GET /api/business/analytics
   → Track performance

9. Financial Management
   GET /api/business/financials
   → Review transactions
```

---

## 3. Driver Module Flow

### 3.1 Authentication & Registration

**Register Driver:**
- **Endpoint:** `POST /api/driver/register`
- **Body:**
  ```json
  {
    "full_name": "Ahmed Mohamed",
    "email": "ahmed@example.com",
    "phone": "+201234567890",
    "vehicle_type": "car",
    "password_hash": "password123"
  }
  ```
- **Returns:** Driver profile + JWT token with `role: 'driver'`

**Login:**
- **Endpoint:** `POST /api/driver/login`
- **Body:** `{ email, password }`
- **Returns:** Driver profile + JWT token

---

### 3.2 Profile Management

**Get Profile:**
- **Endpoint:** `GET /api/driver/profile`
- **Returns:** 
  - Driver info (name, email, phone, vehicle_type)
  - Current location (latitude, longitude)
  - Availability status
  - Earnings (cash, online, platform_fees_owed)
  - Ratings (average, count)
  - Active orders
  - Statistics

**Update Profile:**
- **Endpoint:** `PUT /api/driver/profile`
- **Body:** Can update full_name, phone, vehicle_type, profile_picture

---

### 3.3 Location & Availability

**Update Location:**
- **Endpoint:** `PUT /api/driver/location`
- **Body:** `{ latitude: 31.4165, longitude: 31.8133 }`
- **Use Case:** Driver app sends location updates periodically
- **Flow:** Updates driver's current GPS coordinates for order matching

**Update Availability:**
- **Endpoint:** `PUT /api/driver/availability`
- **Body:** `{ is_available: true | false }`
- **Flow:**
  - `true`: Driver is online and can receive orders
  - `false`: Driver is offline, won't receive order assignments

---

### 3.4 Order Management

**Get Incoming Orders:**
- **Endpoint:** `GET /api/driver/orders/incoming?page={page}&limit={limit}&latitude={lat}&longitude={lng}`
- **Returns:** Orders with status `waiting_driver` near driver's location
- **Flow:**
  1. System finds orders ready for delivery
  2. Calculates distance from driver to business
  3. Shows orders within radius (e.g., 10km)
  4. Sorted by distance (closest first)

**Get Accepted Orders:**
- **Endpoint:** `GET /api/driver/orders/accepted?page={page}&limit={limit}`
- **Returns:** Orders driver accepted but business is still preparing (status: `preparing`)

**Get Orders In Delivery:**
- **Endpoint:** `GET /api/driver/orders/in-delivery?page={page}&limit={limit}`
- **Returns:** Orders currently being delivered (status: `in_delivery`)

**Get All Orders:**
- **Endpoint:** `GET /api/driver/orders?page={page}&limit={limit}&status={status}`
- **Returns:** Complete order history for driver

---

### 3.5 Order Actions

**Accept Order:**
- **Endpoint:** `POST /api/driver/orders/:id/accept`
- **Flow:**
  1. Driver views incoming orders
  2. Selects an order to accept
  3. System validates:
     - Order status is `waiting_driver`
     - Driver is available
  4. Assigns driver to order
  5. Updates order status to `in_delivery`
  6. Notifies user with driver details
  7. Starts delivery tracking

**Mark Order as Delivered:**
- **Endpoint:** `POST /api/driver/orders/:id/deliver`
- **Flow:**
  1. Driver arrives at delivery location
  2. Confirms delivery
  3. System validates order is `in_delivery`
  4. Updates order status to `completed`
  5. Updates driver earnings:
     - Adds delivery fee to `earnings_cash` or `earnings_online`
     - Calculates platform fee
  6. Notifies user and business
  7. Awards points to user (if applicable)

---

### 3.6 Earnings

**Get Earnings:**
- **Endpoint:** `GET /api/driver/earnings?startDate={date}&endDate={date}`
- **Returns:**
  - Total orders delivered
  - Total earnings (cash + online)
  - Platform fees owed
  - Net earnings
  - Individual order earnings breakdown

---

### 3.7 Complete Driver Workflow

```
1. Driver Registration/Login
   POST /api/driver/register or /api/driver/login
   → Get token

2. Go Online
   PUT /api/driver/availability
   { is_available: true }
   → Driver is now available for orders

3. Update Location (Periodic)
   PUT /api/driver/location
   { latitude: 31.4165, longitude: 31.8133 }
   → System tracks driver location

4. View Available Orders
   GET /api/driver/orders/incoming
   → See orders waiting for driver

5. Accept Order
   POST /api/driver/orders/:id/accept
   → Order assigned, status → in_delivery
   → User notified

6. Navigate to Business
   (Driver app uses maps)
   → Pick up order

7. Navigate to Customer
   PUT /api/driver/location (updates location)
   → Track delivery progress

8. Deliver Order
   POST /api/driver/orders/:id/deliver
   → Order completed
   → Earnings updated
   → User & business notified

9. View Earnings
   GET /api/driver/earnings
   → Check daily/weekly earnings

10. Go Offline (End of Shift)
    PUT /api/driver/availability
    { is_available: false }
    → Driver offline
```

---

## 4. Order Status Flow (Complete System)

### Order Lifecycle:

```
User Creates Order
  ↓
status: "pending"
  ↓
Business Accepts (Business/Cashier)
  PUT /api/business/orders/:id/accept
  ↓
status: "accepted"
  ↓
Business Prepares (Cashier)
  PUT /api/cashier/orders/:id/status { status: "preparing" }
  ↓
status: "preparing"
  ↓
Business Marks Ready (Cashier)
  PUT /api/cashier/orders/:id/status { status: "ready" }
  ↓
status: "ready" (for pickup) OR "waiting_driver" (for delivery)
  ↓
[IF DELIVERY]
  Driver Accepts
  POST /api/driver/orders/:id/accept
  ↓
  status: "in_delivery"
  ↓
  Driver Delivers
  POST /api/driver/orders/:id/deliver
  ↓
status: "completed"
```

---

## 5. Authentication & Authorization

### Token Structure:
All tokens include `role` in JWT payload:
- **Cashier:** `{ role: 'cashier', userId: cashierId }`
- **Business:** `{ role: 'business', userId: businessId }`
- **Driver:** `{ role: 'driver', userId: driverId }`

### Middleware:
- `authenticateCashier` - Validates cashier token
- `authenticateBusiness` - Validates business token
- `authenticateDriver` - Validates driver token

### Access Control:
- **Cashiers** can only access their business's data
- **Business** can access all business data + manage cashiers
- **Drivers** can access their own orders and earnings

---

## 6. Key Integration Points

### Between Modules:

1. **Business ↔ Cashier:**
   - Business creates cashier accounts
   - Cashiers manage business orders
   - Both can update order status

2. **Business ↔ Driver:**
   - Business marks order as ready → Driver sees it in incoming orders
   - Driver accepts → Business notified
   - Driver delivers → Business order completed

3. **Cashier ↔ Driver:**
   - Cashier marks order ready → Order appears for drivers
   - Driver delivers → Cashier can see completed orders

4. **All ↔ User:**
   - User creates order → Business/Cashier receives it
   - Business accepts → User notified
   - Driver assigned → User notified
   - Order delivered → User can rate

---

## 7. Common Query Parameters

### Pagination:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

### Date Filtering:
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)
- `date`: Specific date (YYYY-MM-DD)

### Status Filtering:
- `status`: Filter by status (varies by endpoint)

---

## 8. Error Handling

All endpoints return consistent error format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

Common HTTP Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

---

## 9. Rate Limiting

- **General Limiter:** Applied to most endpoints
- **Strict Limiter:** Applied to sensitive operations (payments, QR generation)
- **Business Registration Limiter:** Applied to business registration

---

## 10. Testing Endpoints

### Cashier Test Flow:
1. Login → Get token
2. Get orders → View pending orders
3. Update order status → Accept order
4. Process payment → Mark as paid
5. View daily report → Check summary

### Business Test Flow:
1. Register/Login → Get token
2. Add products → Create menu
3. Create cashier → Add staff
4. View orders → Monitor incoming orders
5. View dashboard → Check analytics

### Driver Test Flow:
1. Register/Login → Get token
2. Update availability → Go online
3. Update location → Set GPS coordinates
4. Get incoming orders → View available orders
5. Accept order → Assign to driver
6. Deliver order → Complete delivery
7. View earnings → Check income

---

**End of Documentation**

