# 🛵💰 Driver & Cashier Data Guide

This guide explains how to add comprehensive test data for drivers and cashiers in the application.

## 📋 Overview

The seed script creates:
- **8 Drivers** with profile pictures, earnings, ratings, and availability status
- **15 Cashiers** distributed across multiple businesses

## 🚀 Quick Start

### Run the Seed Script

```bash
npm run db:seed:drivers-cashiers
```

This will:
1. ✅ Connect to the database (uses DATABASE_URL from .env or Railway fallback)
2. ✅ Get or create businesses for cashiers
3. ✅ Create/update 8 drivers with comprehensive data
4. ✅ Create/update 15 cashiers across businesses
5. ✅ Display summary and test credentials

### Running on Railway

Since Railway databases are not accessible from local machines, you have 3 options:

**Option 1: Railway CLI (Recommended)**
```bash
# Install Railway CLI if not installed
npm i -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Run the seeding script
railway run npm run db:seed:drivers-cashiers
```

**Option 2: Deploy Script as API Endpoint**
Create an admin endpoint that triggers seeding (for production use).

**Option 3: Use Railway Dashboard**
1. Go to Railway Dashboard → Your Backend Service
2. Open "Deployments" → "Deploy Logs"
3. Use Railway's built-in terminal to run commands

---

## 🛵 Drivers Data

### Created Drivers (8 total)

| Name | Email | Vehicle | Status | Earnings (Cash/Online) | Rating |
|------|-------|---------|--------|------------------------|--------|
| Ahmed Hassan | ahmed.driver@example.com | Motorcycle | Available | 15,000 / 25,000 | 4.8 ⭐ |
| Mohamed Ali | mohamed.driver@example.com | Car | Available | 22,000 / 35,000 | 4.9 ⭐ |
| Omar Ibrahim | omar.driver@example.com | Motorcycle | Offline | 18,000 / 28,000 | 4.7 ⭐ |
| Youssef Mahmoud | youssef.driver@example.com | Car | Available | 30,000 / 45,000 | 4.95 ⭐ |
| Khaled Samir | khaled.driver@example.com | Motorcycle | Available | 12,000 / 20,000 | 4.6 ⭐ |
| Tarek Fawzy | tarek.driver@example.com | Car | Available | 25,000 / 40,000 | 4.85 ⭐ |
| Hassan Mostafa | hassan.driver@example.com | Motorcycle | Offline | 14,000 / 23,000 | 4.75 ⭐ |
| Amr Nabil | amr.driver@example.com | Car | Available | 28,000 / 42,000 | 4.9 ⭐ |

### Driver Data Includes:

✅ **Profile Information:**
- Full name
- Email (unique)
- Phone number (unique)
- Profile picture (Unsplash URLs)
- Vehicle type (motorcycle/car)

✅ **Location:**
- Current latitude/longitude (Cairo coordinates)

✅ **Earnings:**
- Cash earnings (in piastres)
- Online earnings (in piastres)
- Platform fees owed

✅ **Status:**
- Available/Offline status
- Active status
- Rating average (0-5)
- Rating count

✅ **All drivers use password:** `password123`

---

## 💰 Cashiers Data

### Created Cashiers (15 total)

| Name | Email | Business |
|------|-------|----------|
| Sara Ahmed | sara.cashier@example.com | Business 1 |
| Fatima Mohamed | fatima.cashier@example.com | Business 1 |
| Mariam Ali | mariam.cashier@example.com | Business 2 |
| Nour Hassan | nour.cashier@example.com | Business 2 |
| Layla Ibrahim | layla.cashier@example.com | Business 3 |
| Aya Mahmoud | aya.cashier@example.com | Business 3 |
| Yasmin Samir | yasmin.cashier@example.com | Business 4 |
| Dina Fawzy | dina.cashier@example.com | Business 4 |
| Heba Mostafa | heba.cashier@example.com | Business 5 |
| Rania Nabil | rania.cashier@example.com | Business 5 |
| Nada Khaled | nada.cashier@example.com | Business 1 |
| Salma Tarek | salma.cashier@example.com | Business 2 |
| Reem Youssef | reem.cashier@example.com | Business 3 |
| Hanan Amr | hanan.cashier@example.com | Business 4 |
| Mona Waleed | mona.cashier@example.com | Business 5 |

### Cashier Data Includes:

✅ **Profile Information:**
- Full name
- Email (unique)
- Business assignment

✅ **Status:**
- Active status (all active by default)

✅ **All cashiers use password:** `password123`

---

## 🧪 Testing the Data

### Test Driver Login

```bash
POST /api/driver/login
{
  "email": "ahmed.driver@example.com",
  "password": "password123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "driver": {
      "id": "...",
      "full_name": "Ahmed Hassan",
      "email": "ahmed.driver@example.com",
      "vehicle_type": "motorcycle",
      "profile_picture": "https://...",
      "earnings_cash": 15000,
      "earnings_online": 25000,
      "is_available": true,
      "rating_average": 4.8,
      "rating_count": 45
    },
    "token": "..."
  }
}
```

### Test Cashier Login

```bash
POST /api/cashier/login
{
  "email": "sara.cashier@example.com",
  "password": "password123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "cashier": {
      "id": "...",
      "business_id": "...",
      "email": "sara.cashier@example.com",
      "full_name": "Sara Ahmed",
      "is_active": true,
      "business": {
        "id": "...",
        "name": "Business Name",
        "type": "restaurant"
      }
    },
    "token": "..."
  }
}
```

### Get All Drivers

```bash
GET /api/driver
```

**Expected:** Returns 8 drivers with all details

### Get Business Cashiers

```bash
GET /api/business/cashiers
Authorization: Bearer {businessToken}
```

**Expected:** Returns cashiers for the logged-in business

---

## 📊 Data Statistics

After running the seed script:

- **Drivers:**
  - Total: 8
  - Available: 6
  - Offline: 2
  - Motorcycles: 4
  - Cars: 4
  - Average Rating: 4.8+

- **Cashiers:**
  - Total: 15
  - Active: 15
  - Distributed across 5 businesses
  - 2-3 cashiers per business

---

## 🔄 Re-running the Script

The script is **idempotent** - you can run it multiple times safely:

- ✅ Existing drivers/cashiers will be **updated** (not duplicated)
- ✅ New drivers/cashiers will be **created**
- ✅ All data will be refreshed with latest values

### To Reset Data

If you want to start fresh:

```bash
# Option 1: Delete specific drivers/cashiers manually via API or database
# Option 2: The script will update existing records, so just re-run it
npm run db:seed:drivers-cashiers
```

---

## 🎯 Use Cases

### For Testing Driver Features:
- ✅ Driver login/registration
- ✅ Driver profile management
- ✅ Driver earnings tracking
- ✅ Driver availability toggle
- ✅ Driver ratings
- ✅ Driver location tracking
- ✅ Order assignment to drivers

### For Testing Cashier Features:
- ✅ Cashier login
- ✅ Cashier operations (QR scans, payments)
- ✅ Business cashier management
- ✅ Cashier activity tracking
- ✅ Multi-cashier business scenarios

---

## 📝 Notes

1. **Profile Pictures:** All drivers have profile pictures from Unsplash (realistic placeholder images)

2. **Earnings:** All amounts are in **piastres** (divide by 100 for EGP)

3. **Locations:** All drivers are initially located in Cairo, Egypt

4. **Ratings:** Ratings are realistic (4.6 - 4.95) with varying review counts

5. **Business Assignment:** Cashiers are distributed across available businesses. If you have fewer than 5 businesses, cashiers will be assigned to available ones.

---

## ✅ Verification Checklist

After running the script, verify:

- [ ] 8 drivers created/updated
- [ ] 15 cashiers created/updated
- [ ] All drivers have profile pictures
- [ ] All drivers have earnings data
- [ ] All cashiers are assigned to businesses
- [ ] Can login as any driver
- [ ] Can login as any cashier
- [ ] Driver endpoints return data
- [ ] Cashier endpoints return data

---

## 🐛 Troubleshooting

### Issue: "No active businesses found"
**Solution:** The script will create a test business automatically, or run `npm run db:create:test-accounts` first.

### Issue: "Unique constraint failed on phone/email"
**Solution:** The script handles this by updating existing records. If you see this error, the script will continue with other records.

### Issue: "Database connection failed"
**Solution:** 
1. Check your `.env` file has correct database URL
2. Ensure database is running
3. Check network connectivity

---

**Happy Testing! 🎉**

