# Business Reservations Seeding Guide

## Overview
This script creates realistic reservation data for all businesses that have `has_reservations: true` enabled.

## Quick Start

```bash
npm run db:seed:reservations
```

## What It Does

### 1. **Finds Businesses**
- Searches for all active businesses with `has_reservations: true`
- Works with any business type that supports reservations

### 2. **Creates Reservations**
- Creates **3-5 reservations per business** (random)
- Each reservation is linked to a random active user
- Supports **4 reservation types**:

#### **Table Reservations** (Restaurants, Cafes, Fast Food)
- Duration: 60-180 minutes
- People: 1-6 people
- Amount: 5,000 - 15,000 EGP
- Notes: "Window seat preferred", "Birthday celebration", etc.

#### **Medical Reservations** (Clinics)
- Duration: 30-60 minutes
- People: 1 person
- Amount: 20,000 - 35,000 EGP
- Specialty: Cardiology, Dermatology, Orthopedics, etc.
- Notes: "Follow-up appointment", "First time visit", etc.

#### **Beauty Reservations** (Beauty Centers)
- Duration: 60-180 minutes
- People: 1 person
- Amount: 15,000 - 27,500 EGP
- Notes: "Haircut and styling", "Facial treatment", etc.

#### **Activity Reservations** (Recreational)
- Duration: 90-180 minutes
- People: 2-10 people
- Amount: 10,000 - 20,000 EGP
- Notes: "Group booking", "Birthday party", etc.

### 3. **Realistic Data**
- **Dates**: Mix of past (-10 days), today, and future (+19 days)
- **Times**: Random times between 9 AM - 10 PM (30-minute intervals)
- **Statuses**: 
  - `pending` - Waiting for confirmation
  - `confirmed` - Confirmed by business
  - `completed` - Finished
  - `cancelled` - Cancelled
- **Payment Methods**: `cash`, `online`, `wallet`
- **Payment Status**: `pending` or `paid` (based on reservation status)
- **Amounts**: 
  - `total_amount`: Base price
  - `discount_amount`: Random discount (10-15% sometimes)
  - `final_amount`: Total after discount
- **QR Codes**: Unique QR codes for each reservation
- **Notes**: Type-specific notes (optional)

## Output Example

```
📅 Seeding Business Reservations...

🔌 Testing database connection...
✅ Database connection successful!

🏢 Fetching businesses with reservations enabled...
✅ Found 12 businesses with reservations

👤 Fetching active users...
✅ Found 25 active users

📅 Creating reservations...

   Creating 4 reservations for Alexandria Seafood Restaurant (table)...
   Creating 3 reservations for Mediterranean Cafe (table)...
   Creating 5 reservations for Health Care Clinic (medical)...
   ...

✅ Successfully created 45 reservations!

📊 Reservation Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Table Reservations:    18
   Medical Reservations: 12
   Beauty Reservations:   10
   Activity Reservations: 5
   Total:                 45
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 Status Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Pending:   12
   Confirmed: 15
   Completed: 13
   Cancelled: 5
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Business reservations seeded successfully!
```

## Requirements

1. **Database Connection**: Must have access to PostgreSQL database
2. **Businesses**: At least one business with `has_reservations: true`
3. **Users**: At least one active user in the database

## Prerequisites

Before running this script, ensure you have:

1. ✅ **Businesses with reservations enabled**
   ```bash
   # Run business seeding scripts first
   npm run db:seed:alexandria
   # OR
   npm run db:seed:dashboard
   ```

2. ✅ **Active users in database**
   ```bash
   # Create test users
   npm run db:create:test-accounts
   ```

3. ✅ **Database connection**
   - Local: Update `.env` with `DATABASE_URL`
   - Railway: Script will use Railway database automatically

## Reservation Types Mapping

| Business Type | Reservation Type | Example |
|--------------|------------------|---------|
| `restaurant` | `table` | Dinner reservation |
| `cafe` | `table` | Coffee meeting |
| `fast_food` | `table` | Quick meal |
| `clinic` | `medical` | Doctor appointment |
| `beauty_center` | `beauty` | Haircut appointment |
| `recreational` | `activity` | Group activity booking |

## Features

### ✅ Smart Type Detection
Automatically determines reservation type based on business type.

### ✅ Realistic Amounts
- Different price ranges per reservation type
- Random discounts (10-15%)
- Proper calculation of final amount

### ✅ Date Distribution
- Past reservations (completed/cancelled)
- Today's reservations (pending/confirmed)
- Future reservations (pending/confirmed)

### ✅ Payment Integration
- Multiple payment methods
- Payment status linked to reservation status
- Ready for transaction creation

### ✅ QR Code Generation
Unique QR codes for each reservation for scanning/validation.

## Running on Railway

Since Railway databases are not accessible from local machines, you have 3 options:

### Option 1: Railway One-Off Command (Recommended)
```bash
# Install Railway CLI if not installed
npm i -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Run the seeding script
railway run npm run db:seed:reservations
```

### Option 2: Deploy Script as API Endpoint
Create an admin endpoint that triggers seeding (for production use).

### Option 3: Use Railway Dashboard
1. Go to Railway Dashboard → Your Backend Service
2. Open "Deployments" → "Deploy Logs"
3. Use Railway's built-in terminal to run commands

## Troubleshooting

### ❌ "No businesses found with reservations enabled"
**Solution**: Run business seeding scripts first
```bash
npm run db:seed:alexandria
```

### ❌ "No active users found"
**Solution**: Create test users
```bash
npm run db:create:test-accounts
```

### ❌ "Can't reach database server" (Local)
**Solution**: 
- Railway databases are **not accessible from local** (security)
- Use **Railway CLI** to run script: `railway run npm run db:seed:reservations`
- Or deploy script as part of Railway deployment
- Script includes hardcoded DATABASE_URL fallback for testing

### ❌ "Unique constraint failed on qr_code"
**Solution**: Script generates unique QR codes, but if error occurs, re-run script (it will create new unique codes).

## Notes

- Script is **idempotent** - can be run multiple times
- Each run creates **new reservations** (doesn't delete existing)
- Reservations are linked to **random users** from active users
- Dates are **randomly distributed** across past, present, and future

## Next Steps

After seeding reservations:

1. **Test Reservation APIs**
   - `GET /api/reservations` - List reservations
   - `GET /api/reservations/:id` - Get reservation details
   - `PUT /api/reservations/:id/confirm` - Confirm reservation
   - `PUT /api/reservations/:id/cancel` - Cancel reservation

2. **Test in Admin Panel**
   - View reservations in Bookings module
   - Filter by status, type, date
   - Manage reservations

3. **Test in User App**
   - View user's reservations
   - See upcoming/past reservations
   - Cancel reservations

## Support

If you encounter any issues:
1. Check database connection
2. Verify businesses have `has_reservations: true`
3. Ensure active users exist
4. Check Railway logs for errors

---

**Created**: Business Reservations Seeding Script  
**Version**: 1.0.0  
**Last Updated**: 2025-12-27

