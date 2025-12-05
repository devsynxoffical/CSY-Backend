## Railway Database Configuration

**New Database URL:**
```
postgresql://postgres:rdGEkKzyfuDUqsBdvwhKzaDfHdZVOtwA@metro.proxy.rlwy.net:49988/railway
```

## Steps to Configure in Railway Dashboard

### 1. Add DATABASE_URL Variable

1. Go to Railway dashboard
2. Click on **CSY-Backend** service
3. Go to **"Variables"** tab
4. Click **"New Variable"**
5. **Variable Name:** `DATABASE_URL`
6. **Value:** `postgresql://postgres:rdGEkKzyfuDUqsBdvwhKzaDfHdZVOtwA@metro.proxy.rlwy.net:49988/railway`
7. Click **"Add"**

### 2. Set Start Command (if not already set)

1. Go to **"Settings"** tab
2. Scroll to **"Deploy"** section
3. **Custom Start Command:**
   ```
   sh -c "npx prisma generate && npx prisma migrate deploy && node index.js"
   ```
4. Click **"Save"**

### 3. Redeploy

1. Go to **"Deployments"** tab
2. Click **"Redeploy"**

OR wait for automatic deployment after the next Git push.

---

## Database Connection Details

- **Host:** metro.proxy.rlwy.net
- **Port:** 49988
- **Database:** railway
- **User:** postgres
- **Password:** rdGEkKzyfuDUqsBdvwhKzaDfHdZVOtwA

---

## Verification

Once deployed, test the connection:

```bash
curl https://csy-backend-production.up.railway.app/health
```

Expected response:
```json
{"status":"healthy","timestamp":"2025-12-05T18:20:00.000Z"}
```

---

**⚠️ SECURITY NOTE:** 
This database URL contains credentials. Make sure it's only stored in Railway's environment variables and never committed to Git.
