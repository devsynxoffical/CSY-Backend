# 🔧 Database Connection Setup - ACTION REQUIRED

## ❌ Current Issue
The backend is showing database connection timeout errors because `DATABASE_URL` is not set in the `.env` file.

## ✅ Solution

### Step 1: Add DATABASE_URL to .env file

1. **Open `.env` file** in the root directory (`D:\DEVSYNX- Projects\CSY-Backend\.env`)

2. **Add this line** (if it doesn't exist):
   ```env
   DATABASE_URL=postgresql://postgres:rdGEkKzyfuDUqsBdvwhKzaDfHdZVOtwA@metro.proxy.rlwy.net:49988/railway
   ```

3. **Save the file**

### Step 2: Verify Connection

Run this command to test the database connection:
```bash
node check-db-connection.js
```

Expected output:
```
✅ Database connection successful!
📊 PostgreSQL Version: 14.x
👤 Admin users in database: X
```

### Step 3: Create Admin User

After connection is verified, create admin user:
```bash
node scripts/seed-admin.js
```

Expected output:
```
✅ Admin user seeded successfully
```

### Step 4: Start Backend

```bash
npm run dev
```

---

## 📋 Complete .env File Example

Your `.env` file should have at minimum:

```env
# Database Connection
DATABASE_URL=postgresql://postgres:rdGEkKzyfuDUqsBdvwhKzaDfHdZVOtwA@metro.proxy.rlwy.net:49988/railway

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3119
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173
```

---

## 🚨 Troubleshooting

### Error: "Timed out fetching a new connection"
- **Cause:** DATABASE_URL not set or incorrect
- **Fix:** Add DATABASE_URL to .env file (see Step 1)

### Error: "Connection refused"
- **Cause:** Database server not accessible
- **Fix:** Check if database URL is correct and server is running

### Error: "Authentication failed"
- **Cause:** Wrong password in connection string
- **Fix:** Verify the password in DATABASE_URL

---

## ✅ Verification Checklist

- [ ] `.env` file exists in root directory
- [ ] `DATABASE_URL` is set in `.env` file
- [ ] `node check-db-connection.js` runs successfully
- [ ] `node scripts/seed-admin.js` creates admin user
- [ ] Backend starts without connection errors
- [ ] Admin panel can login with `admin@coresy.com` / `admin123`

---

**After completing these steps, your admin panel backend will be fully functional!**

