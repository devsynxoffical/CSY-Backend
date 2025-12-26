# Test Accounts Setup Guide

## 🔐 Invalid Credentials Error Fix

If you're getting "Invalid credentials" error, you need to create test accounts first.

---

## 🚀 Quick Setup

### Option 1: Create Test Accounts (Recommended)

Run this command to create test accounts:

```bash
npm run db:create:test-accounts
```

This will create:
- **Driver:** `driver@example.com` / `password123`
- **Cashier:** `cashier@example.com` / `password123`

---

### Option 2: Use Existing Seed Data

If you've run the main seed script, you can use these accounts:

**Drivers:**
- `driver_bike@example.com` / `password123`
- `driver_car@example.com` / `password123`
- `driver_van@example.com` / `password123`

**Cashiers:**
- Check seed script output for cashier emails (format: `cashier1@businessname.com`)
- Password: `password123`

---

## 📝 Test Account Credentials

After running `npm run db:create:test-accounts`:

### Driver Account
```
Email: driver@example.com
Password: password123
```

### Cashier Account
```
Email: cashier@example.com
Password: password123
```

---

## 🧪 Testing in Postman

1. **Import Collection:**
   - Import `Driver_Cashier_Endpoints_Postman_Collection.json`

2. **Create Test Accounts:**
   ```bash
   npm run db:create:test-accounts
   ```

3. **Login:**
   - Use "Driver Login" with: `driver@example.com` / `password123`
   - Use "Cashier Login" with: `cashier@example.com` / `password123`

4. **Test Endpoints:**
   - Tokens are auto-saved after login
   - All endpoints will work automatically

---

## ⚠️ Troubleshooting

### Still Getting "Invalid credentials"?

1. **Check if accounts exist:**
   ```bash
   npm run db:create:test-accounts
   ```

2. **Verify email format:**
   - Email is case-insensitive (automatically lowercased)
   - Make sure no extra spaces

3. **Check password:**
   - Must be exactly: `password123`
   - No extra spaces or characters

4. **Verify account is active:**
   - Script sets `is_active: true` automatically
   - If manually created, ensure `is_active` is `true`

5. **Check database connection:**
   - Ensure Railway database is active
   - Check DATABASE_URL in .env

---

## 🔍 Verify Accounts Exist

You can check if accounts exist by querying the database:

**Check Driver:**
```sql
SELECT email, is_active FROM drivers WHERE email = 'driver@example.com';
```

**Check Cashier:**
```sql
SELECT email, is_active FROM cashiers WHERE email = 'cashier@example.com';
```

---

## 📋 Alternative: Create Account via API

### Register New Driver
```http
POST /api/driver/register
Content-Type: application/json

{
  "full_name": "Test Driver",
  "email": "testdriver@example.com",
  "phone": "+201234567890",
  "vehicle_type": "motorcycle",
  "password_hash": "password123"
}
```

### Create Cashier (Business must create)
```http
POST /api/business/cashiers
Authorization: Bearer {businessToken}
Content-Type: application/json

{
  "full_name": "Test Cashier",
  "email": "testcashier@example.com",
  "phone": "+201234567891",
  "password": "password123"
}
```

---

**Run `npm run db:create:test-accounts` to create test accounts and fix the login error!** ✅

