# Reservation API Postman Collection Setup Guide

## Quick Start

1. **Import Collection**
   - Open Postman
   - Click "Import" button
   - Select `Reservation_API_Postman_Collection.json`
   - Collection will be imported with all reservation endpoints

2. **Import Environment**
   - Click "Import" button
   - Select `Reservation_API_Environment_Template.json`
   - Or create a new environment manually with the variables below

3. **Set Environment Variables**
   - Click on "Environments" in the left sidebar
   - Select your environment
   - Set the following variables:
     - `base_url`: `http://localhost:3000/api` (or your production URL)
     - `user_token`: Your JWT token from user login (will be auto-saved)
     - `business_id`: Business ID where you want to make reservations
     - `reservation_id`: Will be auto-saved after creating a reservation

4. **Select Environment**
   - Click the environment dropdown (top right)
   - Select your imported environment

## Environment Variables

| Variable | Description | Auto-populated |
|----------|-------------|----------------|
| `base_url` | Base URL for API | No - Set manually |
| `user_token` | JWT token from user login | No - Set manually (get from auth/login) |
| `business_id` | Business ID for reservations | No - Set manually |
| `reservation_id` | Reservation ID | Yes - Auto-saved after creation |

## Testing Flow

### Step 1: Get User Token
1. Use the Auth API to login as a user:
   ```
   POST /api/auth/login
   {
     "email": "user@test.com",
     "password": "password123"
   }
   ```
2. Copy the token from response and set it as `user_token` in environment

### Step 2: Get Business ID
1. Use Business API to get a business that accepts reservations:
   ```
   GET /api/business?city=Alexandria&app_type=pass
   ```
2. Find a business with `has_reservations: true`
3. Copy the business `id` and set it as `business_id` in environment

### Step 3: Check Availability
1. Run **"Check Availability"** to see available time slots
2. This helps you choose a valid time for your reservation

### Step 4: Create Reservation
1. Run **"Create Reservation"** or one of the specific reservation type endpoints:
   - **Create Table Reservation** - For restaurants/cafes
   - **Create Medical Reservation** - For clinics
   - **Create Beauty Reservation** - For beauty centers
   - **Create Activity Reservation** - For recreational activities
2. Reservation ID will be automatically saved to `reservation_id`

### Step 5: Manage Reservations
1. **Get User Reservations** - View all your reservations
2. **Get Reservation Details** - View specific reservation details
3. **Update Reservation** - Modify reservation details
4. **Cancel Reservation** - Cancel a reservation
5. **Rate Reservation** - Rate a completed reservation

## Reservation Types

### Table Reservation
- **Type**: `table`
- **Use Case**: Restaurants, cafes
- **Required Fields**: business_id, date, time, duration, number_of_people, payment_method
- **Optional**: notes, amount

### Medical Reservation
- **Type**: `medical`
- **Use Case**: Clinics, medical centers
- **Required Fields**: business_id, date, time, duration, number_of_people, payment_method
- **Optional**: specialty, notes, amount

### Beauty Reservation
- **Type**: `beauty`
- **Use Case**: Beauty salons, spas
- **Required Fields**: business_id, date, time, duration, number_of_people, payment_method
- **Optional**: specialty, notes, amount

### Activity Reservation
- **Type**: `activity`
- **Use Case**: Recreational activities, events
- **Required Fields**: business_id, date, time, duration, number_of_people, payment_method
- **Optional**: notes, amount

## Request Body Examples

### Create Table Reservation
```json
{
  "business_id": "uuid-here",
  "reservation_type": "table",
  "date": "2024-12-25",
  "time": "19:30",
  "duration": 120,
  "number_of_people": 4,
  "payment_method": "online",
  "notes": "Window seat preferred",
  "amount": 50000
}
```

### Create Medical Reservation
```json
{
  "business_id": "uuid-here",
  "reservation_type": "medical",
  "date": "2024-12-25",
  "time": "10:00",
  "duration": 60,
  "number_of_people": 1,
  "payment_method": "online",
  "specialty": "Cardiology",
  "notes": "Follow-up appointment"
}
```

## Query Parameters

### Get User Reservations
- `page` (default: 1) - Page number
- `limit` (default: 20) - Items per page
- `status` (optional) - Filter by status: `pending`, `confirmed`, `cancelled`, `completed`, `expired`
- `upcoming` (optional) - Show only upcoming: `true` or `false`

### Check Availability
- `businessId` (required) - Business ID
- `date` (required) - Date in YYYY-MM-DD format
- `duration` (optional, default: 60) - Duration in minutes

## Response Status Codes

- `201` - Reservation created successfully
- `200` - Request successful
- `400` - Bad request (validation error, business doesn't accept reservations)
- `401` - Unauthorized (missing or invalid token)
- `404` - Not found (business or reservation not found)
- `409` - Conflict (time slot not available)
- `500` - Server error

## Features

### Auto-Authentication
- The collection automatically adds `Authorization: Bearer <token>` header
- Token should be set in `user_token` environment variable

### Auto-Save IDs
- Reservation ID is saved after creating a reservation
- Business ID should be set manually

### Pre-request Scripts
- Automatically adds Authorization header for all requests

### Test Scripts
- Checks response time (should be < 5000ms)
- Logs error responses for debugging
- Auto-saves reservation ID from responses

## Common Issues

### Issue: "Unauthorized" Error
**Solution**: 
- Make sure you've logged in and have a valid `user_token`
- Check that the token hasn't expired
- Verify the token is set in environment variables

### Issue: "Business does not accept reservations"
**Solution**:
- Check that the business has `has_reservations: true`
- Use a different business that accepts reservations

### Issue: "Time slot not available"
**Solution**:
- Use "Check Availability" endpoint first
- Choose a time slot from the available slots
- Make sure the time is in the future

### Issue: "Business not found"
**Solution**:
- Verify the `business_id` is correct
- Make sure the business exists in the database
- Check that you're using a valid UUID format

### Issue: "Validation Error"
**Solution**:
- Check request body format
- Verify all required fields are included
- Check field types (strings, numbers, dates)
- Ensure date format is YYYY-MM-DD
- Ensure time format is HH:MM (24-hour format)
- Duration should be between 15-480 minutes
- Number of people should be between 1-50

## Production Setup

For production testing:

1. Create a new environment: "CSY Reservation API - Production"
2. Set `base_url` to your production URL:
   ```
   https://csy-backend-production.up.railway.app/api
   ```
3. Use production credentials for login

## Collection Endpoints

1. **Create Reservation** - General reservation creation
2. **Get User Reservations** - List all user reservations
3. **Get Reservation Details** - Get specific reservation
4. **Update Reservation** - Update reservation details
5. **Cancel Reservation** - Cancel a reservation
6. **Check Availability** - Get available time slots
7. **Rate Reservation** - Rate a completed reservation
8. **Create Table Reservation** - Table-specific example
9. **Create Medical Reservation** - Medical appointment example
10. **Create Beauty Reservation** - Beauty salon example
11. **Create Activity Reservation** - Activity booking example

## Tips

1. **Start with Availability**: Always check availability before creating a reservation
2. **Use Correct Business**: Make sure the business accepts reservations (`has_reservations: true`)
3. **Future Dates**: Reservation dates must be in the future
4. **Time Format**: Use 24-hour format (HH:MM) for times
5. **Duration**: Minimum 15 minutes, maximum 480 minutes (8 hours)
6. **Payment Method**: Use `online` or `cash`
7. **Check Variables**: View environment variables to see auto-saved IDs
8. **Use Console**: Postman console shows auto-saved values and errors

## Support

If you encounter issues:
1. Check the reservation controller code
2. Verify your server is running
3. Check network connectivity
4. Review Postman console for error messages
5. Verify environment variables are set correctly
6. Check that the business accepts reservations

