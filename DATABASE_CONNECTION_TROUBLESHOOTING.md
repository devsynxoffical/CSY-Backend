# Database Connection Troubleshooting Guide

## Error: Can't reach database server at `metro.proxy.rlwy.net:49988`

This error occurs when the seed script cannot connect to your Railway PostgreSQL database.

## Common Causes & Solutions

### 1. **Railway Database is Paused** (Most Common)

Railway free tier databases automatically pause after 7 days of inactivity.

**Solution:**
- Go to your Railway dashboard: https://railway.app
- Navigate to your PostgreSQL database service
- Click "Wake" or "Start" to activate the database
- Wait 30-60 seconds for the database to fully start
- Try running the seed script again

### 2. **Incorrect DATABASE_URL**

The connection string in your `.env` file might be outdated or incorrect.

**Solution:**
- Check your Railway dashboard
- Go to your PostgreSQL service
- Click on "Variables" tab
- Copy the `DATABASE_URL` or `POSTGRES_URL`
- Update your local `.env` file with the correct connection string
- Format should be: `postgresql://user:password@host:port/database?sslmode=require`

### 3. **Network/Firewall Issues**

Your network or firewall might be blocking the connection.

**Solution:**
- Check if you can access Railway dashboard
- Try from a different network (mobile hotspot)
- Check firewall settings
- Verify VPN is not interfering

### 4. **Database Service is Down**

Railway service might be experiencing issues.

**Solution:**
- Check Railway status: https://status.railway.app
- Check Railway dashboard for any service alerts
- Try restarting the database service in Railway

## Quick Fix Steps

1. **Check Railway Dashboard:**
   ```
   - Login to railway.app
   - Find your PostgreSQL service
   - Check if it's "Active" or "Paused"
   - If paused, click "Wake" or "Start"
   ```

2. **Verify .env File:**
   ```bash
   # Check if DATABASE_URL exists
   cat .env | grep DATABASE_URL
   
   # Should show something like:
   # DATABASE_URL=postgresql://postgres:password@metro.proxy.rlwy.net:49988/railway
   ```

3. **Test Connection:**
   ```bash
   # Try connecting with psql (if installed)
   psql $DATABASE_URL
   
   # Or test with Node.js
   node -e "require('dotenv').config(); const {prisma} = require('./config/database'); prisma.$connect().then(() => console.log('Connected!')).catch(e => console.error(e))"
   ```

4. **Update Connection String:**
   - Go to Railway dashboard
   - PostgreSQL service → Variables
   - Copy the latest `DATABASE_URL`
   - Update your `.env` file
   - Restart your application/script

## Alternative: Use Local Database

If Railway continues to have issues, you can use a local PostgreSQL database:

1. **Install PostgreSQL locally:**
   ```bash
   # Windows (using Chocolatey)
   choco install postgresql
   
   # Or download from: https://www.postgresql.org/download/
   ```

2. **Create local database:**
   ```bash
   createdb csy_backend
   ```

3. **Update .env:**
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/csy_backend
   ```

4. **Run migrations:**
   ```bash
   npx prisma migrate dev
   ```

5. **Run seed script:**
   ```bash
   npm run db:seed:alexandria
   ```

## Verify Connection Works

After fixing the connection, test it:

```bash
# Run the seed script
npm run db:seed:alexandria

# Expected output:
# 🌱 Seeding Alexandria businesses...
# 🔌 Testing database connection...
# ✅ Database connection successful!
# 📝 Creating/updating 13 businesses in Alexandria...
```

## Still Having Issues?

1. Check Railway logs for database errors
2. Verify your Railway account has active credits
3. Check if database service is within usage limits
4. Contact Railway support if service is down

---

**Note:** The seed script now includes better error handling and will provide helpful messages if connection fails.

