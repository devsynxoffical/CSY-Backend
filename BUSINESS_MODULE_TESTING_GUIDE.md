# Business Module API Testing Guide

This guide provides step-by-step instructions for testing all Business Module endpoints.

## Base URL
- **Local**: `http://localhost:3000/api/business`
- **Production**: `https://your-production-url.com/api/business`

---

## Step 1: Business Registration

### Endpoint: `POST /api/business/register`

**Purpose**: Register a new business account

**Request Body**:
```json
{
  "owner_email": "owner@restaurant.com",
  "business_name": "Delicious Restaurant",
  "business_type": "restaurant",
  "app_type": "pass",
  "address": "123 Main Street",
  "city": "Damietta",
  "governorate": "Damietta",
  "latitude": 31.4165,
  "longitude": 31.8133,
  "password": "securepassword123"
}
```

**Valid Business Types**:
- `restaurant`
- `cafe`
- `pharmacy`
- `clinic`
- `beauty_center`
- `juice_shop`
- `dessert_shop`
- `fast_food`
- `supermarket`
- `recreational`
- `other`

**Valid App Types**:
- `pass`
- `care`
- `go`
- `pass_go`
- `care_go`

**Expected Response** (201):
```json
{
  "success": true,
  "message": "Business registered successfully",
  "data": {
    "business": {
      "id": "uuid-here",
      "owner_email": "owner@restaurant.com",
      "business_name": "Delicious Restaurant",
      "business_type": "restaurant",
      "app_type": "pass",
      "address": "123 Main Street",
      "city": "Damietta",
      "governorate": "Damietta",
      "latitude": 31.4165,
      "longitude": 31.8133,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt-token-here"
  }
}
```

**Save the `token` for subsequent requests!**

---

## Step 2: Business Login

### Endpoint: `POST /api/business/login`

**Purpose**: Authenticate and get access token

**Request Body**:
```json
{
  "email": "owner@restaurant.com",
  "password": "securepassword123"
}
```

**Expected Response** (200):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "business": {
      "id": "uuid-here",
      "owner_email": "owner@restaurant.com",
      "business_name": "Delicious Restaurant",
      "business_type": "restaurant"
    },
    "token": "jwt-token-here"
  }
}
```

---

## Step 3: Get Business Profile

### Endpoint: `GET /api/business/profile`

**Headers**:
```
Authorization: Bearer <your-token>
```

**Expected Response** (200):
```json
{
  "success": true,
  "message": "Business profile retrieved successfully",
  "data": {
    "id": "uuid-here",
    "owner_email": "owner@restaurant.com",
    "business_name": "Delicious Restaurant",
    "business_type": "restaurant",
    "address": "123 Main Street",
    "city": "Damietta",
    "governorate": "Damietta",
    "latitude": 31.4165,
    "longitude": 31.8133,
    "working_hours": {},
    "photos": [],
    "videos": [],
    "rating_average": 0,
    "rating_count": 0,
    "has_reservations": false,
    "has_delivery": false,
    "is_active": true,
    "stats": {
      "products_count": 0,
      "orders_count": 0,
      "reservations_count": 0
    }
  }
}
```

---

## Step 4: Update Business Profile

### Endpoint: `PUT /api/business/profile`

**Headers**:
```
Authorization: Bearer <your-token>
```

**Request Body**:
```json
{
  "business_name": "Updated Restaurant Name",
  "address": "456 New Street",
  "city": "Cairo",
  "governorate": "Cairo",
  "latitude": 30.0444,
  "longitude": 31.2357,
  "working_hours": {
    "monday": "9:00-22:00",
    "tuesday": "9:00-22:00",
    "wednesday": "9:00-22:00",
    "thursday": "9:00-22:00",
    "friday": "9:00-22:00",
    "saturday": "10:00-18:00",
    "sunday": "closed"
  },
  "photos": ["https://example.com/photo1.jpg"],
  "videos": [],
  "has_reservations": true,
  "has_delivery": true
}
```

**Expected Response** (200):
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    // Updated business profile
  }
}
```

---

## Step 5: Update Working Hours

### Endpoint: `PUT /api/business/working-hours`

**Headers**:
```
Authorization: Bearer <your-token>
```

**Request Body**:
```json
{
  "working_hours": {
    "monday": "9:00-18:00",
    "tuesday": "9:00-18:00",
    "wednesday": "9:00-18:00",
    "thursday": "9:00-18:00",
    "friday": "9:00-18:00",
    "saturday": "10:00-16:00",
    "sunday": "closed"
  }
}
```

---

## Step 6: Upload Business Photos

### Endpoint: `POST /api/business/photos`

**Headers**:
```
Authorization: Bearer <your-token>
```

**Request Body**:
```json
{
  "photos": [
    "https://example.com/photo1.jpg",
    "https://example.com/photo2.jpg"
  ]
}
```

---

## Step 7: Add Product

### Endpoint: `POST /api/business/products`

**Headers**:
```
Authorization: Bearer <your-token>
```

**Request Body**:
```json
{
  "category": "Main Course",
  "name": "Grilled Chicken",
  "description": "Tender grilled chicken with herbs",
  "ingredients": "Chicken breast, herbs, olive oil, garlic",
  "image": "https://example.com/chicken.jpg",
  "price": 75000,
  "add_ons": [
    {
      "name": "Extra Cheese",
      "price": 5000
    },
    {
      "name": "Bacon",
      "price": 10000
    }
  ]
}
```

**Expected Response** (201):
```json
{
  "success": true,
  "message": "Product added successfully",
  "data": {
    "id": "product-uuid",
    "name": "Grilled Chicken",
    "price": 75000,
    "category": "Main Course",
    "is_available": true
  }
}
```

---

## Step 8: Get Business Products

### Endpoint: `GET /api/business/products`

**Headers**:
```
Authorization: Bearer <your-token>
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `category` (optional): Filter by category
- `available` (optional): Filter by availability (`true` or `false`)

**Example**: `GET /api/business/products?page=1&limit=20&category=Main Course`

**Expected Response** (200):
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "products": [
      {
        "id": "product-uuid",
        "name": "Grilled Chicken",
        "price": 75000,
        "category": "Main Course",
        "is_available": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

## Step 9: Update Product

### Endpoint: `PUT /api/business/products/:id`

**Headers**:
```
Authorization: Bearer <your-token>
```

**Request Body**:
```json
{
  "name": "Updated Grilled Chicken",
  "price": 80000,
  "is_available": true
}
```

---

## Step 10: Delete Product

### Endpoint: `DELETE /api/business/products/:id`

**Headers**:
```
Authorization: Bearer <your-token>
```

**Expected Response** (200):
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

## Step 11: Create Cashier

### Endpoint: `POST /api/business/cashiers`

**Headers**:
```
Authorization: Bearer <your-token>
```

**Request Body**:
```json
{
  "email": "cashier@restaurant.com",
  "full_name": "John Smith",
  "password_hash": "cashierpassword123"
}
```

**Expected Response** (201):
```json
{
  "success": true,
  "message": "Cashier account created successfully",
  "data": {
    "id": "cashier-uuid",
    "email": "cashier@restaurant.com",
    "full_name": "John Smith",
    "business_id": "business-uuid"
  }
}
```

---

## Step 12: Get Cashiers

### Endpoint: `GET /api/business/cashiers`

**Headers**:
```
Authorization: Bearer <your-token>
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Expected Response** (200):
```json
{
  "success": true,
  "message": "Cashiers retrieved successfully",
  "data": {
    "cashiers": [
      {
        "id": "cashier-uuid",
        "email": "cashier@restaurant.com",
        "full_name": "John Smith",
        "is_active": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

## Step 13: Add Appointment

### Endpoint: `POST /api/business/appointments`

**Headers**:
```
Authorization: Bearer <your-token>
```

**Request Body**:
```json
{
  "service_name": "Hair Cut",
  "description": "Professional hair cutting service",
  "duration": 60,
  "price": 50000,
  "date": "2024-12-25",
  "start_time": "10:00",
  "end_time": "11:00",
  "is_available": true
}
```

**Expected Response** (201):
```json
{
  "success": true,
  "message": "Appointment added successfully",
  "data": {
    "id": "appointment-uuid",
    "service_name": "Hair Cut",
    "date": "2024-12-25",
    "time": "10:00",
    "duration": 60,
    "price": 50000
  }
}
```

---

## Step 14: Get Appointments

### Endpoint: `GET /api/business/appointments`

**Headers**:
```
Authorization: Bearer <your-token>
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `date` (optional): Filter by date (YYYY-MM-DD)
- `service_name` (optional): Filter by service name

**Expected Response** (200):
```json
{
  "success": true,
  "message": "Appointments retrieved successfully",
  "data": {
    "appointments": [
      {
        "id": "appointment-uuid",
        "service_name": "Hair Cut",
        "date": "2024-12-25",
        "time": "10:00",
        "duration": 60,
        "price": 50000,
        "is_available": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

## Step 15: Get Business Orders

### Endpoint: `GET /api/business/orders`

**Headers**:
```
Authorization: Bearer <your-token>
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `status` (optional): Filter by status (`pending`, `accepted`, `preparing`, `waiting_driver`, `in_delivery`, `completed`, `cancelled`)
- `startDate` (optional): Start date filter (YYYY-MM-DD)
- `endDate` (optional): End date filter (YYYY-MM-DD)

**Expected Response** (200):
```json
{
  "success": true,
  "message": "Orders retrieved successfully",
  "data": {
    "orders": [
      {
        "id": "order-uuid",
        "order_number": "ORD-20241201-ABC123",
        "status": "pending",
        "total_amount": 75000,
        "user": {
          "id": "user-uuid",
          "full_name": "Customer Name",
          "phone": "+201234567890"
        },
        "order_items": [
          {
            "product": {
              "name": "Grilled Chicken",
              "price": 75000
            },
            "quantity": 1,
            "total_price": 75000
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

## Step 16: Accept Order

### Endpoint: `PUT /api/business/orders/:id/accept`

**Headers**:
```
Authorization: Bearer <your-token>
```

**Expected Response** (200):
```json
{
  "success": true,
  "message": "Order accepted successfully"
}
```

---

## Step 17: Reject Order

### Endpoint: `PUT /api/business/orders/:id/reject`

**Headers**:
```
Authorization: Bearer <your-token>
```

**Request Body** (optional):
```json
{
  "reason": "Item out of stock"
}
```

**Expected Response** (200):
```json
{
  "success": true,
  "message": "Order rejected successfully"
}
```

---

## Step 18: Get Business Reservations

### Endpoint: `GET /api/business/reservations`

**Headers**:
```
Authorization: Bearer <your-token>
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `status` (optional): Filter by status (`pending`, `confirmed`, `cancelled`, `completed`, `expired`)
- `date` (optional): Filter by date (YYYY-MM-DD)

**Expected Response** (200):
```json
{
  "success": true,
  "message": "Reservations retrieved successfully",
  "data": {
    "reservations": [
      {
        "id": "reservation-uuid",
        "reservation_type": "table",
        "date": "2024-12-25",
        "time": "19:00",
        "number_of_people": 4,
        "status": "confirmed",
        "user": {
          "id": "user-uuid",
          "full_name": "Customer Name"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

## Step 19: Get Financial Records

### Endpoint: `GET /api/business/financials`

**Headers**:
```
Authorization: Bearer <your-token>
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `startDate` (optional): Start date filter (YYYY-MM-DD)
- `endDate` (optional): End date filter (YYYY-MM-DD)
- `type` (optional): Transaction type (`payment`, `discount`, `refund`, `wallet_topup`, `earnings`)

**Expected Response** (200):
```json
{
  "success": true,
  "message": "Financial records retrieved successfully",
  "data": {
    "financials": [
      {
        "id": "transaction-uuid",
        "type": "payment",
        "amount": 75000,
        "description": "Order payment",
        "created_at": "2024-12-01T00:00:00.000Z"
      }
    ],
    "summary": {
      "total_amount": 75000,
      "total_platform_fee": 7500,
      "total_discount": 0
    },
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

## Step 20: Get Offers

### Endpoint: `GET /api/business/offers`

**Headers**:
```
Authorization: Bearer <your-token>
```

**Expected Response** (200):
```json
{
  "success": true,
  "message": "Offers retrieved successfully",
  "data": {
    "offers": []
  }
}
```

---

## Step 21: Get Analytics

### Endpoint: `GET /api/business/analytics`

**Headers**:
```
Authorization: Bearer <your-token>
```

**Query Parameters**:
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)
- `reportType` (optional): Report type (`summary`, `orders`, `revenue`, `customers`, `products`)

**Expected Response** (200):
```json
{
  "success": true,
  "message": "Analytics retrieved successfully",
  "data": {
    "period": {
      "start": "2024-01-01",
      "end": "2024-01-31",
      "report_type": "summary"
    },
    "analytics": {
      "total_orders": 100,
      "total_revenue": 7500000,
      "average_order_value": 75000
    }
  }
}
```

---

## Step 22: Get Dashboard

### Endpoint: `GET /api/business/dashboard`

**Headers**:
```
Authorization: Bearer <your-token>
```

**Query Parameters**:
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)

**Expected Response** (200):
```json
{
  "success": true,
  "message": "Dashboard data retrieved successfully",
  "data": {
    "period": {
      "start": "2024-01-01T00:00:00.000Z",
      "end": "2024-01-31T23:59:59.999Z"
    },
    "metrics": {
      "orders": {
        "total": 100,
        "completed": 95,
        "cancelled": 5,
        "completion_rate": 0.95,
        "total_revenue": 7500000
      },
      "reservations": {
        "total": 50,
        "completed": 48,
        "cancelled": 2,
        "completion_rate": 0.96
      },
      "ratings": {
        "average": 4.5,
        "count": 20
      }
    }
  }
}
```

---

## Step 23: Get Operations Log

### Endpoint: `GET /api/business/operations-log`

**Headers**:
```
Authorization: Bearer <your-token>
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)
- `startDate` (optional): Start date filter (YYYY-MM-DD)
- `endDate` (optional): End date filter (YYYY-MM-DD)
- `operation_type` (optional): Filter by type (`order`, `reservation`, `product`)

**Expected Response** (200):
```json
{
  "success": true,
  "message": "Operations log retrieved successfully",
  "data": {
    "operations": [
      {
        "id": "log-uuid",
        "type": "order",
        "operation": "created",
        "timestamp": "2024-12-01T00:00:00.000Z",
        "reference_id": "order-uuid"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

## Step 24: Public Endpoints (No Authentication Required)

### Get All Businesses
**Endpoint**: `GET /api/business`

**Query Parameters**:
- `city` (optional): Filter by city
- `type` (optional): Filter by business type
- `app_type` (optional): Filter by app type
- `search` (optional): Search by name or description
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

### Get Public Business Profile
**Endpoint**: `GET /api/business/:id`

**Example**: `GET /api/business/123e4567-e89b-12d3-a456-426614174000`

### Get Business Products (Public Menu)
**Endpoint**: `GET /api/business/:id/products`

**Query Parameters**:
- `category` (optional): Filter by category

**Example**: `GET /api/business/123e4567-e89b-12d3-a456-426614174000/products?category=Main Course`

---

## Testing Checklist

### Authentication & Profile
- [ ] Register new business
- [ ] Login with credentials
- [ ] Get business profile
- [ ] Update business profile
- [ ] Update working hours
- [ ] Upload photos
- [ ] Delete photo

### Products Management
- [ ] Add product
- [ ] Get products list
- [ ] Update product
- [ ] Delete product
- [ ] Filter products by category
- [ ] Filter products by availability

### Cashier Management
- [ ] Create cashier account
- [ ] Get cashiers list
- [ ] Update cashier
- [ ] Delete cashier

### Appointments
- [ ] Add appointment slot
- [ ] Get appointments list
- [ ] Update appointment
- [ ] Delete appointment
- [ ] Filter appointments by date
- [ ] Filter appointments by service

### Orders Management
- [ ] Get orders list
- [ ] Accept order
- [ ] Reject order
- [ ] Filter orders by status
- [ ] Filter orders by date range

### Reservations
- [ ] Get reservations list
- [ ] Filter reservations by status
- [ ] Filter reservations by date

### Analytics & Reports
- [ ] Get financial records
- [ ] Get offers
- [ ] Get analytics
- [ ] Get dashboard data
- [ ] Get operations log

### Public Endpoints
- [ ] Get all businesses (public)
- [ ] Get public business profile
- [ ] Get public business products

---

## Common Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized",
  "error": "Invalid or missing token"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found",
  "error": "Business/Product/Order not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "Business already exists",
  "error": "Email already registered"
}
```

### 422 Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "business_type",
      "message": "Invalid business type"
    }
  ]
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error message here"
}
```

---

## Postman Collection Setup

1. **Create Environment Variables**:
   - `base_url`: `http://localhost:3000/api/business`
   - `token`: (will be set after login)

2. **Pre-request Script** (for authenticated endpoints):
   ```javascript
   if (pm.environment.get("token")) {
       pm.request.headers.add({
           key: "Authorization",
           value: "Bearer " + pm.environment.get("token")
       });
   }
   ```

3. **Test Script** (for login endpoint):
   ```javascript
   if (pm.response.code === 200) {
       const jsonData = pm.response.json();
       if (jsonData.data && jsonData.data.token) {
           pm.environment.set("token", jsonData.data.token);
       }
   }
   ```

---

## Tips for Testing

1. **Always start with registration/login** to get a valid token
2. **Save the token** from login response for subsequent requests
3. **Test error cases**: invalid tokens, missing fields, invalid data
4. **Test pagination** with different page and limit values
5. **Test filters** with various query parameters
6. **Verify response structure** matches expected format
7. **Check authentication** by making requests without tokens
8. **Test edge cases**: empty lists, invalid IDs, date ranges

---

## Quick Test Sequence

1. Register business → Save token
2. Login → Verify token
3. Get profile → Verify data
4. Add product → Save product ID
5. Get products → Verify product appears
6. Update product → Verify changes
7. Create cashier → Save cashier ID
8. Get cashiers → Verify cashier appears
9. Add appointment → Save appointment ID
10. Get orders → Verify order list
11. Get analytics → Verify metrics
12. Get dashboard → Verify summary data

---

**Note**: Replace `<your-token>` with the actual JWT token received from login/registration. All authenticated endpoints require the `Authorization: Bearer <token>` header.

