# Complete API Parameters Guide

## 1. Add Product (Business)

**Endpoint:** `POST /api/business/products`

**Authentication:** Required (Business token)

**Request Body:**
```json
{
  "name": "Margherita Pizza",
  "price": 12000,
  "category": "Pizza",
  "description": "Classic pizza with tomato and mozzarella",
  "ingredients": "Tomato sauce, mozzarella cheese, basil",
  "image": "https://example.com/pizza.jpg"
}
```

**Required Fields:**
- `name` (string, 2-100 chars) - Product name
- `price` (number, > 0) - Price in piastres

**Optional Fields:**
- `category` (string) - Product category
- `description` (string, max 500 chars) - Product description
- `ingredients` (string, max 1000 chars) - Ingredients list
- `image` (string, URL) - Product image URL (stored as `image_url` in DB)

**Note:** `add_ons` is NOT stored in Product. It's stored in OrderItem when order is created.

---

## 2. Create Order (User)

**Endpoint:** `POST /api/orders`

**Authentication:** Required (User token)

**Request Body:**
```json
{
  "items": [
    {
      "product_id": "c2177082-0431-41c0-bee2-dfb3e07e065d",
      "quantity": 2,
      "add_ons": [
        {
          "name": "Extra Cheese",
          "price": 5000
        }
      ]
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
  },
  "delivery_notes": "Ring the doorbell",
  "coupon_code": "DISCOUNT10"
}
```

**Required Fields:**
- `items` (array) - Array of order items
  - `items[].product_id` (string, UUID) - Product ID from `/api/business/{id}/products`
  - `items[].quantity` (number, min: 1) - Quantity
- `order_type` (string) - `"delivery"` or `"pickup"`
- `payment_method` (string) - `"cash"` or `"online"`

**Required if order_type is "delivery":**
- `delivery_address` (object)
  - `name` (string, 2-100 chars) - Recipient name
  - `phone` (string) - Phone number
  - `street` (string) - Street address
  - `city` (string) - City name
  - `latitude` (number, -90 to 90) - GPS latitude (for distance calculation)
  - `longitude` (number, -180 to 180) - GPS longitude (for distance calculation)

**Optional Fields:**
- `items[].add_ons` (array) - Add-ons for the product
  - `add_ons[].name` (string) - Add-on name
  - `add_ons[].price` (number) - Add-on price
- `delivery_notes` (string) - Special delivery instructions
- `coupon_code` (string) - Discount coupon code

**Note:** `business_id` is NOT required - it's automatically derived from the products.

---

## 3. Add Address (User)

**Endpoint:** `POST /api/user/addresses`

**Authentication:** Required (User token)

**Request Body:**
```json
{
  "recipient_name": "Ahmed Ali",
  "area": "Nasr City",
  "street": "123 Main Street",
  "city": "Cairo",
  "phone": "03001234567",
  "latitude": 30.0444,
  "longitude": 31.2357,
  "floor": "3rd Floor",
  "is_default": false
}
```

**Required Fields:**
- `recipient_name` (string, 2-100 chars) - Recipient's full name
- `area` (string, 2-100 chars) - Area/district name
- `street` (string, 5-200 chars) - Street address
- `city` (string, 2-100 chars) - City name
- `phone` (string) - Phone number (must match phone regex)
- `latitude` (number, -90 to 90) - GPS latitude
- `longitude` (number, -180 to 180) - GPS longitude

**Optional Fields:**
- `floor` (string) - Floor number/description
- `is_default` (boolean) - Set as default address

**Invalid Fields (DO NOT USE):**
- ❌ `label` - Not in schema
- ❌ `governorate` - Not in schema
- ❌ `name` - Use `recipient_name` instead

---

## 4. Create Reservation (User)

**Endpoint:** `POST /api/reservations`

**Authentication:** Required (User token)

**Request Body:**
```json
{
  "business_id": "3638b657-9d4f-47cf-ac2d-9be6acc3bfc9",
  "reservation_type": "table",
  "date": "2024-12-25",
  "time": "19:30",
  "duration": 120,
  "number_of_people": 4,
  "payment_method": "cash",
  "notes": "Window seat preferred",
  "specialty": "Cardiology",
  "amount": 50000
}
```

**Required Fields:**
- `business_id` (string, UUID) - Business ID
- `reservation_type` (string) - `"table"`, `"activity"`, `"medical"`, or `"beauty"`
- `date` (string, ISO 8601 format: YYYY-MM-DD) - Reservation date
- `time` (string, HH:MM format) - Reservation time (e.g., "19:30")
- `duration` (number, 15-480) - Duration in minutes
- `number_of_people` (number, 1-50) - Number of people
- `payment_method` (string) - `"cash"` or `"online"`

**Optional Fields:**
- `notes` (string) - Special notes/requests
- `specialty` (string) - Required for medical/beauty reservations
- `amount` (number) - Reservation amount in piastres (default: 0)

---

## 5. Add Appointment (Business)

**Endpoint:** `POST /api/business/appointments`

**Authentication:** Required (Business token)

**Request Body:**
```json
{
  "service_name": "Hair Cut",
  "description": "Professional hair cutting service",
  "duration": 60,
  "price": 50000,
  "date": "2024-12-25",
  "start_time": "10:00",
  "end_time": "11:00"
}
```

**Required Fields:**
- `service_name` (string) - Service name
- `duration` (number, 15-480) - Duration in minutes
- `price` (number, >= 0) - Service price in piastres
- `date` (string, YYYY-MM-DD) - Appointment date (must be today or future)
- `start_time` (string, HH:MM) - Start time (e.g., "10:00")
- `end_time` (string, HH:MM) - End time (e.g., "11:00")

**Optional Fields:**
- `description` (string) - Service description

**Note:** The schema stores `time` field (uses `start_time` value), not `start_time` and `end_time` separately.

---

## Summary of Common Mistakes

### ❌ Wrong Parameters:

1. **Product:**
   - ❌ `image_url` → Use `image` (controller converts it)
   - ❌ `add_ons` in Product → Add-ons are stored in OrderItem, not Product

2. **Order:**
   - ❌ `business_id` in order → NOT needed (derived from products)
   - ❌ Missing `latitude`/`longitude` in delivery_address → Required for distance calculation

3. **Address:**
   - ❌ `name` → Use `recipient_name`
   - ❌ `label` → Not in schema
   - ❌ `governorate` → Not in schema, use `area` instead

4. **Appointment:**
   - ❌ `time` → Use `start_time` and `end_time` (controller converts start_time to time)

---

## Quick Reference Table

| API | Endpoint | Auth | Key Required Fields |
|-----|----------|------|---------------------|
| Add Product | `POST /api/business/products` | Business | `name`, `price` |
| Create Order | `POST /api/orders` | User | `items[]`, `order_type`, `payment_method`, `delivery_address` (if delivery) |
| Add Address | `POST /api/user/addresses` | User | `recipient_name`, `area`, `street`, `city`, `phone`, `latitude`, `longitude` |
| Create Reservation | `POST /api/reservations` | User | `business_id`, `reservation_type`, `date`, `time`, `duration`, `number_of_people`, `payment_method` |
| Add Appointment | `POST /api/business/appointments` | Business | `service_name`, `duration`, `price`, `date`, `start_time`, `end_time` |

---

**End of Guide**

