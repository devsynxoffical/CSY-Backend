# Dashboard Test Data Seeding Guide

## Overview
This seed script creates comprehensive test data for testing the user application dashboard, including users, businesses, products, orders, reservations, addresses, transactions, points, and ratings.

## How to Run

### Local Development
```bash
npm run db:seed:dashboard
```

### Production/Staging
```bash
node scripts/seed-dashboard-data.js
```

## What Data is Created

### 1. Users (2 users)
- **Main Test User:**
  - Email: `user@test.com`
  - Password: `password123`
  - Name: Ahmed Ali
  - Wallet Balance: 250 EGP (25000 piastres)
  - Points: 150
  - Pass ID: DM-100001
  - Verified: Yes

- **Additional User:**
  - Email: `sara@test.com`
  - Password: `password123`
  - Wallet Balance: 150 EGP
  - Points: 80

### 2. Businesses (3 businesses)
- **Delicious Restaurant** (restaurant@test.com)
  - Type: Restaurant
  - Has Reservations: Yes
  - Has Delivery: Yes
  - Rating: 4.5/5 (25 reviews)
  
- **Coffee House** (cafe@test.com)
  - Type: Cafe
  - Has Reservations: Yes
  - Rating: 4.2/5 (18 reviews)
  
- **Health Clinic** (clinic@test.com)
  - Type: Clinic
  - Has Reservations: Yes
  - Rating: 4.8/5 (12 reviews)

### 3. Products (4 products)
- Margherita Pizza - 120 EGP
- Chicken Burger - 80 EGP
- Caesar Salad - 60 EGP
- Cappuccino - 50 EGP

### 4. Addresses (2 addresses)
- Default Address: Nasr City, Main Street
- Secondary Address: Mazzeh, Secondary Street

### 5. Orders (10 orders)
Orders with different statuses:
- **Completed** (2 orders) - Paid
- **In Delivery** (2 orders) - Pending payment
- **Preparing** (2 orders) - Pending payment
- **Accepted** (2 orders) - Pending payment
- **Pending** (2 orders) - Pending payment

Each order includes:
- Order items with products
- Delivery addresses
- Payment methods (cash/online)
- Different amounts (140-230 EGP)

### 6. Reservations (8 reservations)
Reservations with different types and statuses:
- **Table Reservations** (2) - Restaurant
- **Activity Reservations** (2) - Recreational
- **Medical Reservations** (2) - Clinic
- **Beauty Reservations** (2) - Beauty center

Statuses include:
- Confirmed (paid)
- Pending
- Completed
- Cancelled

### 7. Transactions (10 transactions)
- **Wallet Top-ups** (5 transactions)
  - Amounts: 100-300 EGP
  - Status: Completed
  - Method: Online
  
- **Order Payments** (5 transactions)
  - Linked to completed orders
  - Status: Completed
  - Methods: Cash/Online

### 8. Points History (10 records)
- **Earned Points** (5 records)
  - From orders
  - Amounts: 10-30 points
  
- **Spent Points** (5 records)
  - Redemptions
  - Amounts: 10-30 points

### 9. Ratings (5 ratings)
- Ratings for completed orders
- Stars: 4-5
- Comments included

## Dashboard Features Tested

### User Profile Dashboard
✅ Wallet balance and history  
✅ Points balance and history  
✅ Recent orders (last 5)  
✅ Recent reservations (last 5)  
✅ Addresses list  
✅ Transaction history  
✅ Visit history  

### Order Management
✅ Orders in different statuses  
✅ Order history  
✅ Order tracking  
✅ Payment status  

### Reservation Management
✅ Upcoming reservations  
✅ Past reservations  
✅ Reservation details  
✅ QR codes  

### Wallet & Points
✅ Balance display  
✅ Transaction history  
✅ Points earned/spent  
✅ Top-up history  

## Test Credentials

### Users
```
Email: user@test.com
Password: password123

Email: sara@test.com
Password: password123
```

### Businesses
```
Email: restaurant@test.com
Password: password123

Email: cafe@test.com
Password: password123

Email: clinic@test.com
Password: password123
```

## Data Distribution

- **Orders:** Spread across last 5 days
- **Reservations:** Spread across next 4 days
- **Transactions:** Spread across last 10 days
- **Points:** Spread across last 10 days

## Notes

- All passwords are: `password123`
- All amounts are in **piastres** (divide by 100 for EGP)
- Dates are distributed to show recent activity
- Orders have realistic status progression
- Reservations include different types for testing

## Running Multiple Times

The script uses `upsert` for users and businesses, so running it multiple times will:
- ✅ Update existing users/businesses
- ✅ Create new orders, reservations, etc. (may create duplicates)
- ⚠️ To reset, clear the database first

## Clearing Data

To start fresh:
```sql
-- Clear all data (be careful!)
TRUNCATE TABLE orders, reservations, transactions, points, ratings, addresses, order_items, products, businesses, users CASCADE;
```

Or use Prisma Studio:
```bash
npm run prisma:studio
```

---

**Ready to test your dashboard! 🚀**

