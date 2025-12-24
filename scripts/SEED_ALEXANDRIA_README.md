# Alexandria Businesses Seed Script

This script seeds the database with businesses located in Alexandria, Egypt. It creates businesses with various `app_type` values, with a focus on `app_type='pass'` businesses.

## Purpose

This script is designed to populate the database with test data so that the endpoint:
```
GET /api/business?city=Alexandria&app_type=pass&page=1&limit=50
```
returns actual business data instead of an empty array.

## What It Creates

The script creates **13 businesses** in Alexandria with the following distribution:

### By App Type:
- **8 businesses** with `app_type='pass'` (restaurants, cafes, fast food, juice shops, dessert shops, recreational)
- **2 businesses** with `app_type='care'` (pharmacy, clinic, beauty center)
- **1 business** with `app_type='go'` (supermarket)
- **1 business** with `app_type='pass_go'` (restaurant)

### By Business Type:
- Restaurants: 3
- Cafes: 2
- Fast Food: 1
- Juice Shop: 1
- Dessert Shop: 1
- Supermarket: 1
- Pharmacy: 1
- Clinic: 1
- Beauty Center: 1
- Recreational: 1

## How to Run

### Option 1: Using npm script
```bash
npm run db:seed:alexandria
```

### Option 2: Direct execution
```bash
node scripts/seed-alexandria-businesses.js
```

## Features

- **Idempotent**: Can be run multiple times safely
  - If a business with the same `owner_email` exists, it will be updated
  - If it doesn't exist, it will be created
- **Comprehensive Data**: Each business includes:
  - Complete profile information
  - Working hours for all days
  - Ratings and review counts
  - Location coordinates (latitude/longitude)
  - Photos array
  - Reservation and delivery settings
- **Error Handling**: Continues processing even if one business fails
- **Statistics**: Shows summary of created/updated businesses

## Default Credentials

All businesses are created with the same password:
- **Password**: `password123`

You can use any of the business owner emails to login:
- `alex_restaurant1@test.com`
- `alex_cafe1@test.com`
- `alex_fastfood1@test.com`
- etc.

## Example Businesses Created

### PASS App Type:
1. **Alexandria Seafood Restaurant** - Restaurant with reservations & delivery
2. **Mediterranean Cafe** - Cafe with reservations
3. **Alexandria Fast Food** - Fast food with delivery
4. **Fresh Juice Bar** - Juice shop with delivery
5. **Sweet Dreams Dessert Shop** - Dessert shop with reservations & delivery
6. **Italian Corner Restaurant** - Restaurant with reservations & delivery
7. **Coastal Coffee House** - Cafe with reservations
8. **Alexandria Fun Zone** - Recreational with reservations

### Other App Types:
- **Alexandria Supermarket** (GO)
- **Alexandria Pharmacy** (CARE)
- **Alexandria Medical Clinic** (CARE)
- **Alexandria Beauty Center** (CARE)
- **Seaside Grill** (PASS_GO)

## Testing the Endpoint

After running the seed script, test the endpoint:

```bash
# Get all PASS businesses in Alexandria
curl "http://localhost:3000/api/business?city=Alexandria&app_type=pass&page=1&limit=50"

# Or in production:
curl "https://csy-backend-production.up.railway.app/api/business?city=Alexandria&app_type=pass&page=1&limit=50"
```

Expected response:
```json
{
  "success": true,
  "message": "Businesses retrieved successfully",
  "data": {
    "businesses": [
      {
        "id": "...",
        "business_name": "Alexandria Seafood Restaurant",
        "business_type": "restaurant",
        "app_type": "pass",
        "city": "Alexandria",
        ...
      },
      ...
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 8,
      "totalPages": 1
    }
  }
}
```

## Notes

- All businesses are set to `is_active: true`
- All businesses have realistic ratings (4.0 - 4.8) and review counts
- Working hours are set for all days of the week
- Coordinates are set to realistic Alexandria locations
- Photos are placeholder URLs (update with actual S3 URLs if needed)

## Troubleshooting

### Error: "Can't reach database server"
- Make sure your `.env` file has the correct `DATABASE_URL`
- Ensure the database is running and accessible

### Error: "Unique constraint failed"
- The script handles this automatically by updating existing businesses
- If you see this error, it means the business already exists and will be updated

### No businesses returned after seeding
- Check that `city` matches exactly: "Alexandria" (case-sensitive)
- Verify `app_type` matches: "pass" (lowercase)
- Check that businesses have `is_active: true`

## Production Usage

To seed production database:

1. Make sure you have production database credentials in `.env`
2. Run the seed script:
   ```bash
   npm run db:seed:alexandria
   ```
3. Verify the endpoint returns data:
   ```bash
   curl "https://csy-backend-production.up.railway.app/api/business?city=Alexandria&app_type=pass&page=1&limit=50"
   ```

## Related Files

- `scripts/seed-dashboard-data.js` - Seeds dashboard test data (Damascus businesses)
- `scripts/seed.js` - Main seed script with comprehensive test data
- `controllers/business.controller.js` - Business controller with GET endpoint logic

