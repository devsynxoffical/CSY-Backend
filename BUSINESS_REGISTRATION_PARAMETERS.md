# Business Registration API - Complete Parameters Guide

## Endpoint
```
POST /api/business/register
```

## Authentication
**Not Required** (Public endpoint)

## Request Body

### Required Fields:

```json
{
  "owner_email": "owner@restaurant.com",
  "business_name": "Delicious Restaurant",
  "business_type": "restaurant",
  "app_type": "pass",
  "address": "123 Main Street, Downtown",
  "city": "Damascus",
  "governorate": "Damascus",
  "latitude": 33.5138,
  "longitude": 36.2765,
  "password": "password123"
}
```

### Field Details:

| Field | Type | Required | Validation | Example |
|-------|------|----------|------------|---------|
| `owner_email` | string | ✅ Yes | Valid email format | `"owner@restaurant.com"` |
| `business_name` | string | ✅ Yes | 2-100 characters | `"Delicious Restaurant"` |
| `business_type` | string | ✅ Yes | Must be one of: `restaurant`, `cafe`, `pharmacy`, `clinic`, `beauty_center`, `juice_shop`, `dessert_shop`, `fast_food`, `supermarket`, `recreational`, `other` | `"restaurant"` |
| `app_type` | string | ✅ Yes | Must be one of: `pass`, `care`, `go`, `pass_go`, `care_go` | `"pass"` |
| `address` | string | ✅ Yes | 10-500 characters | `"123 Main Street, Downtown"` |
| `city` | string | ✅ Yes | 2-100 characters | `"Damascus"` |
| `governorate` | string | ✅ Yes | 2-100 characters | `"Damascus"` |
| `latitude` | number | ✅ Yes | -90 to 90 | `33.5138` |
| `longitude` | number | ✅ Yes | -180 to 180 | `36.2765` |
| `password` | string | ✅ Yes | Minimum 8 characters | `"password123"` |

## Valid Business Types

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

## Valid App Types

- `pass` - Pass app only
- `care` - Care app only
- `go` - Go app only
- `pass_go` - Both Pass and Go apps
- `care_go` - Both Care and Go apps

## Response (Success - 201)

```json
{
  "success": true,
  "message": "Profile updated",
  "data": {
    "business": {
      "id": "business-uuid",
      "owner_email": "owner@restaurant.com",
      "business_name": "Delicious Restaurant",
      "business_type": "restaurant",
      "app_type": "pass",
      "address": "123 Main Street, Downtown",
      "city": "Damascus",
      "governorate": "Damascus",
      "latitude": 33.5138,
      "longitude": 36.2765,
      "rating_average": 0,
      "rating_count": 0,
      "is_active": true,
      "created_at": "2024-01-15T10:30:00.000Z"
    },
    "token": "business_jwt_token_here"
  }
}
```

## Response (Error - 400)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Business name must be between 2 and 100 characters",
      "param": "business_name",
      "location": "body"
    }
  ]
}
```

## Response (Error - 409)

```json
{
  "success": false,
  "message": "Business already exists",
  "error": "Email already registered"
}
```

## Postman Example

```
POST {{base_url}}/api/business/register
Content-Type: application/json

{
  "owner_email": "owner@restaurant.com",
  "business_name": "Delicious Restaurant",
  "business_type": "restaurant",
  "app_type": "pass",
  "address": "123 Main Street, Downtown",
  "city": "Damascus",
  "governorate": "Damascus",
  "latitude": 33.5138,
  "longitude": 36.2765,
  "password": "password123"
}
```

## Common Errors

### ❌ Invalid Business Type
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Invalid business type",
      "param": "business_type"
    }
  ]
}
```
**Solution:** Use one of the valid business types listed above.

### ❌ Invalid App Type
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Invalid app type",
      "param": "app_type"
    }
  ]
}
```
**Solution:** Use one of the valid app types: `pass`, `care`, `go`, `pass_go`, `care_go`.

### ❌ Email Already Registered
```json
{
  "success": false,
  "message": "Business already exists",
  "error": "Email already registered"
}
```
**Solution:** Use a different email address or login with existing account.

### ❌ Address Too Short
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Address must be between 10 and 500 characters",
      "param": "address"
    }
  ]
}
```
**Solution:** Provide a complete address with at least 10 characters.

---

**All parameters are now correctly validated! ✅**

