# 🚀 Drivers & Cashiers Seed Data Guide

This guide explains how to seed your database with comprehensive test data for **Drivers** and **Cashiers** modules.

## 📋 Overview

The seed script creates:
- **8 Drivers** with realistic profiles, locations, earnings, and ratings
- **10 Cashiers** distributed across available businesses
- All accounts use password: `password123`

## 🛵 Drivers Data

### Driver Features:
- ✅ Profile pictures (Unsplash images)
- ✅ Different vehicle types (motorcycle, car)
- ✅ Realistic locations in Cairo
- ✅ Earnings (cash & online)
- ✅ Platform fees
- ✅ Ratings and review counts
- ✅ Availability status

### Driver List:
1. **Ahmed Hassan** - Motorcycle, Available, 4.8★ (45 reviews)
2. **Mohamed Ali** - Car, Available, 4.9★ (78 reviews)
3. **Omar Ibrahim** - Motorcycle, Unavailable, 4.7★ (32 reviews)
4. **Youssef Mahmoud** - Car, Available, 4.95★ (120 reviews)
5. **Khaled Samir** - Motorcycle, Available, 4.6★ (28 reviews)
6. **Tarek Fawzy** - Car, Available, 4.85★ (95 reviews)
7. **Hassan Mostafa** - Motorcycle, Unavailable, 4.75★ (40 reviews)
8. **Amr Nabil** - Car, Available, 4.9★ (110 reviews)

## 💰 Cashiers Data

### Cashier Features:
- ✅ Assigned to different businesses
- ✅ Realistic names
- ✅ Active status
- ✅ Distributed across multiple businesses

### Cashier List:
1. **Sara Ahmed** - Assigned to first business
2. **Fatima Mohamed** - Assigned to first business
3. **Mariam Ali** - Assigned to second business
4. **Nour Hassan** - Assigned to second business
5. **Layla Ibrahim** - Assigned to third business
6. **Aya Mahmoud** - Assigned to third business
7. **Yasmin Samir** - Assigned to fourth business
8. **Dina Fawzy** - Assigned to fourth business
9. **Heba Mostafa** - Assigned to fifth business
10. **Rania Nabil** - Assigned to fifth business

## 🚀 How to Run

### Option 1: Using npm script (Recommended)
```bash
npm run db:seed:drivers-cashiers
```

### Option 2: Direct execution
```bash
node scripts/seed-drivers-cashiers.js
```

## 📝 Prerequisites

1. **Database Connection**: Make sure your `.env` file has the correct `DATABASE_URL`
2. **Active Businesses**: The script needs at least one active business to assign cashiers
   - If no businesses exist, the script will create a test business automatically
3. **Dependencies**: Ensure all npm packages are installed
   ```bash
   npm install
   ```

## 🔄 How It Works

1. **Connects to Database**: Tests connection first
2. **Finds Businesses**: Gets all active businesses (or creates one if none exist)
3. **Creates/Updates Drivers**: 
   - Checks if driver exists (by email or phone)
   - Updates if exists, creates if new
   - Includes profile pictures, locations, earnings, ratings
4. **Creates/Updates Cashiers**:
   - Assigns cashiers to different businesses
   - Distributes evenly across available businesses
   - Updates if exists, creates if new

## 📊 Output Example

```
🚀 Seeding Drivers and Cashiers with comprehensive data...

🔌 Testing database connection...
✅ Database connection successful!

🏢 Getting businesses for cashiers...
✅ Found 5 businesses

🛵 Creating drivers...

  ✅ Created driver: Ahmed Hassan
  ✅ Created driver: Mohamed Ali
  ✅ Updated driver: Omar Ibrahim
  ...

✅ Created/Updated 8 drivers

💰 Creating cashiers...

  ✅ Created cashier: Sara Ahmed (Test Restaurant)
  ✅ Created cashier: Fatima Mohamed (Test Restaurant)
  ...

✅ Created/Updated 10 cashiers

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SEEDING SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Drivers: 8
   - Available: 6
   - Motorcycles: 4
   - Cars: 4

✅ Cashiers: 10
   - Active: 10

📝 Test Credentials:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🛵 Drivers (Password: password123):
   Ahmed Hassan: ahmed.driver@example.com
   Mohamed Ali: mohamed.driver@example.com
   Omar Ibrahim: omar.driver@example.com

💰 Cashiers (Password: password123):
   Sara Ahmed: sara.cashier@example.com
   Fatima Mohamed: fatima.cashier@example.com
   Mariam Ali: mariam.cashier@example.com
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎉 Drivers and Cashiers seeded successfully!
```

## 🔑 Test Credentials

### Drivers
All drivers use password: `password123`

| Name | Email | Phone | Vehicle | Status |
|------|-------|-------|---------|--------|
| Ahmed Hassan | ahmed.driver@example.com | +201012345678 | Motorcycle | Available |
| Mohamed Ali | mohamed.driver@example.com | +201012345679 | Car | Available |
| Omar Ibrahim | omar.driver@example.com | +201012345680 | Motorcycle | Unavailable |
| Youssef Mahmoud | youssef.driver@example.com | +201012345681 | Car | Available |
| Khaled Samir | khaled.driver@example.com | +201012345682 | Motorcycle | Available |
| Tarek Fawzy | tarek.driver@example.com | +201012345683 | Car | Available |
| Hassan Mostafa | hassan.driver@example.com | +201012345684 | Motorcycle | Unavailable |
| Amr Nabil | amr.driver@example.com | +201012345685 | Car | Available |

### Cashiers
All cashiers use password: `password123`

| Name | Email | Business |
|------|-------|----------|
| Sara Ahmed | sara.cashier@example.com | First Business |
| Fatima Mohamed | fatima.cashier@example.com | First Business |
| Mariam Ali | mariam.cashier@example.com | Second Business |
| Nour Hassan | nour.cashier@example.com | Second Business |
| Layla Ibrahim | layla.cashier@example.com | Third Business |
| Aya Mahmoud | aya.cashier@example.com | Third Business |
| Yasmin Samir | yasmin.cashier@example.com | Fourth Business |
| Dina Fawzy | dina.cashier@example.com | Fourth Business |
| Heba Mostafa | heba.cashier@example.com | Fifth Business |
| Rania Nabil | rania.cashier@example.com | Fifth Business |

## 🖼️ Profile Pictures

All drivers have profile pictures from **Unsplash**:
- High-quality professional photos
- 400x400px optimized images
- Different people for variety
- URLs are directly accessible

## ⚠️ Important Notes

1. **Idempotent**: The script is safe to run multiple times
   - Updates existing records if found
   - Creates new ones if not found

2. **Business Requirement**: 
   - Cashiers need businesses to be assigned
   - Script creates a test business if none exist

3. **Unique Constraints**:
   - Driver emails and phones must be unique
   - Cashier emails must be unique
   - Script handles conflicts gracefully

4. **Password**: All accounts use `password123` for easy testing

## 🔧 Troubleshooting

### Error: "No active businesses found"
**Solution**: The script will automatically create a test business. Or run `npm run db:seed` first to create businesses.

### Error: "Unique constraint failed"
**Solution**: The script handles this automatically by updating existing records. If you want fresh data, delete existing drivers/cashiers first.

### Error: "Database connection failed"
**Solution**: 
1. Check your `.env` file has correct `DATABASE_URL`
2. Ensure database server is running
3. Verify network connectivity

## 📚 Related Scripts

- `npm run db:seed` - Full database seed (includes basic drivers/cashiers)
- `npm run db:create:test-accounts` - Create minimal test accounts
- `npm run db:seed:dashboard` - Seed dashboard test data

## ✅ Verification

After running the script, verify the data:

```bash
# Check drivers
# Use Prisma Studio or query directly

# Check cashiers
# Use Prisma Studio or query directly
```

Or use Prisma Studio:
```bash
npm run prisma:studio
```

Then navigate to:
- **Drivers** table to see all 8 drivers
- **Cashiers** table to see all 10 cashiers

---

**Happy Testing! 🎉**

