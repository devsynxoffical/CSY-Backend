# Reservation & Appointment API Parameters Guide

## 1. Create Reservation (User)

**Endpoint:** `POST /api/reservations`

**Authentication:** Required (User token)

**Headers:**
```
Authorization: Bearer {user_jwt_token}
Content-Type: application/json
```

**Request Body (Required Fields):**
```json
{
  "business_id": "3638b657-9d4f-47cf-ac2d-9be6acc3bfc9",
  "reservation_type": "table",
  "date": "2024-12-25",
  "time": "19:30",
  "duration": 120,
  "number_of_people": 4,
  "payment_method": "cash"
}
```

**Request Body (With Optional Fields):**
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
- `business_id` (string, UUID) - Business ID where reservation is made
- `reservation_type` (string) - Must be one of: `"table"`, `"activity"`, `"medical"`, `"beauty"`
- `date` (string, YYYY-MM-DD format) - Reservation date, e.g., `"2024-12-25"`
- `time` (string, HH:MM format) - Reservation start time, e.g., `"19:30"`
- `duration` (number, 15-480) - Duration in minutes
- `number_of_people` (number, 1-50) - Number of people
- `payment_method` (string) - Must be `"cash"` or `"online"`

**Optional Fields:**
- `notes` (string, max 500 chars) - Additional notes
- `specialty` (string, max 100 chars) - Required for medical/beauty reservations
- `amount` (number, >= 0) - Reservation amount in piastres (default: 0)

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Reservation created successfully",
  "data": {
    "id": "reservation-uuid",
    "user_id": "user-uuid",
    "business_id": "business-uuid",
    "reservation_type": "table",
    "date": "2024-12-25T00:00:00.000Z",
    "time": "19:30",
    "duration": 120,
    "number_of_people": 4,
    "payment_method": "cash",
    "payment_status": "pending",
    "status": "pending",
    "notes": "Window seat preferred",
    "specialty": null,
    "total_amount": 50000,
    "discount_amount": 5000,
    "final_amount": 45000,
    "qr_code": "QR_CODE_STRING",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Common Errors:**
- `400` - Invalid date format (must be YYYY-MM-DD)
- `400` - Invalid time format (must be HH:MM)
- `400` - Invalid reservation_type
- `404` - Business not found
- `400` - Business does not accept reservations
- `409` - Time slot not available

---

## 2. Add Appointment Slot (Business)

**Endpoint:** `POST /api/business/appointments`

**Authentication:** Required (Business token)

**Headers:**
```
Authorization: Bearer {business_jwt_token}
Content-Type: application/json
```

**Request Body (Required Fields):**
```json
{
  "service_name": "Hair Cut",
  "duration": 60,
  "price": 50000,
  "date": "2024-12-25",
  "start_time": "10:00",
  "end_time": "11:00"
}
```

**Request Body (With Optional Fields):**
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
- `service_name` (string, 2-100 chars) - Service name
- `duration` (number, 15-480) - Duration in minutes
- `price` (number, >= 0) - Service price in piastres
- `date` (string, YYYY-MM-DD format) - Appointment date (must be today or future)
- `start_time` (string, HH:MM format) - Start time, e.g., `"10:00"`
- `end_time` (string, HH:MM format) - End time, e.g., `"11:00"`

**Optional Fields:**
- `description` (string, max 500 chars) - Service description

**Note:** 
- `start_time` is stored as `time` in database
- `end_time` is used for validation but not stored (duration is used instead)
- Date must be today or in the future

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Appointment added successfully",
  "data": {
    "id": "appointment-uuid",
    "business_id": "business-uuid",
    "service_name": "Hair Cut",
    "description": "Professional hair cutting service",
    "date": "2024-12-25T00:00:00.000Z",
    "time": "10:00",
    "duration": 60,
    "price": 50000,
    "is_available": true,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Common Errors:**
- `400` - Missing required fields
- `400` - Invalid date format (must be YYYY-MM-DD)
- `400` - Invalid time format (must be HH:MM)
- `400` - Appointment date cannot be in the past
- `401` - Business token required

---

## 3. How Users Book Appointments

**Important:** Appointments are slots created by businesses. Users book them by creating a **Reservation** with `reservation_type: "medical"` or `reservation_type: "beauty"`.

**Example - Booking a Medical Appointment:**
```json
POST /api/reservations
{
  "business_id": "clinic-uuid",
  "reservation_type": "medical",
  "date": "2024-12-25",
  "time": "10:00",
  "duration": 60,
  "number_of_people": 1,
  "payment_method": "online",
  "specialty": "Cardiology",
  "amount": 50000
}
```

**Example - Booking a Beauty Appointment:**
```json
POST /api/reservations
{
  "business_id": "salon-uuid",
  "reservation_type": "beauty",
  "date": "2024-12-25",
  "time": "14:00",
  "duration": 90,
  "number_of_people": 1,
  "payment_method": "cash",
  "specialty": "Hair Cut",
  "amount": 50000
}
```

---

## Quick Reference Table

| API | Endpoint | Auth | Required Fields |
|-----|----------|------|-----------------|
| Create Reservation | `POST /api/reservations` | User | `business_id`, `reservation_type`, `date`, `time`, `duration`, `number_of_people`, `payment_method` |
| Add Appointment | `POST /api/business/appointments` | Business | `service_name`, `duration`, `price`, `date`, `start_time`, `end_time` |

---

## Common Mistakes

### ❌ Wrong Parameters:

1. **Reservation:**
   - ❌ `date: "25-12-2024"` → Use `"2024-12-25"` (YYYY-MM-DD)
   - ❌ `time: "7:30 PM"` → Use `"19:30"` (24-hour format)
   - ❌ `reservation_type: "restaurant"` → Use `"table"` instead
   - ❌ Missing `specialty` for medical/beauty → Add `specialty` field

2. **Appointment:**
   - ❌ `time: "10:00"` → Use `start_time` and `end_time`
   - ❌ `date: "2023-12-25"` → Date must be today or future
   - ❌ Missing `end_time` → Required for validation

---

## Postman Examples

### Create Reservation
```
POST {{base_url}}/api/reservations
Headers:
  Authorization: Bearer {{user_token}}
Body:
{
  "business_id": "{{business_id}}",
  "reservation_type": "table",
  "date": "2024-12-25",
  "time": "19:30",
  "duration": 120,
  "number_of_people": 4,
  "payment_method": "cash",
  "notes": "Window seat preferred"
}
```

### Add Appointment
```
POST {{base_url}}/api/business/appointments
Headers:
  Authorization: Bearer {{business_token}}
Body:
{
  "service_name": "Hair Cut",
  "description": "Professional hair cutting",
  "duration": 60,
  "price": 50000,
  "date": "2024-12-25",
  "start_time": "10:00",
  "end_time": "11:00"
}
```

---

**All parameters are now correctly validated!**

