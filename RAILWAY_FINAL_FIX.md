# Railway Deployment - FINAL FIX

## The Problem

Railway's Nixpacks is auto-detecting Prisma and running migrations during the BUILD phase where `DATABASE_URL` is not available.

## The ONLY Solution That Works

Configure everything directly in Railway's dashboard. **DO NOT use nixpacks.toml or railway.json files.**

---

## Step-by-Step Fix (Do This in Railway Dashboard)

### 1. Add DATABASE_URL Variable

1. Go to Railway dashboard: https://railway.app
2. Click on **CSY-Backend** service
3. Go to **"Variables"** tab
4. Click **"New Variable"**
5. **Variable name:** `DATABASE_URL`
6. **Value:** 
   ```
   postgresql://postgres:rdGEkKzyfuDUqsBdvwhKzaDfHdZVOtwA@metro.proxy.rlwy.net:49988/railway
   ```
7. Click **"Add"**

### 2. Disable Build Command

1. Go to **"Settings"** tab
2. Scroll down to **"Build"** section
3. Click **"Build Command"** field
4. Enter: `npm install`
5. Click outside to save

### 3. Set Custom Start Command

1. Still in **"Settings"** tab
2. Scroll to **"Deploy"** section  
3. Click **"Start Command"** field
4. Enter:
   ```
   sh -c "npx prisma generate && npx prisma migrate deploy && node index.js"
   ```
5. Click outside to save

### 4. Set Node Version (Optional but Recommended)

1. Still in **"Settings"** tab
2. Scroll to **"Environment"** section
3. Add this variable in the **Variables** tab:
   - **Name:** `NODE_VERSION`
   - **Value:** `20`

### 5. Redeploy

1. Go to **"Deployments"** tab
2. Find the latest deployment
3. Click the **"..."** menu
4. Click **"Redeploy"**

---

## What Should Happen

**Build Phase:**
```
✅ Installing dependencies with npm install
✅ Build complete (no Prisma, no DATABASE_URL needed)
```

**Deploy Phase:**
```
✅ Starting deployment...
✅ Generating Prisma Client...
✅ Running database migrations...
✅ Server starting on port 3000...
✅ Deployment successful!
```

---

## Verification

Once deployed successfully, test:

```bash
curl https://csy-backend-production.up.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-06T15:33:00.000Z"
}
```

---

## If Still Failing

### Check These:

1. ✅ DATABASE_URL is added in Variables tab
2. ✅ Build Command is set to `npm install`
3. ✅ Start Command is set to the full command with Prisma
4. ✅ No nixpacks.toml or railway.json files in the repo

### Alternative: Use Dockerfile

If Railway settings don't work, we can create a custom Dockerfile that Railway will use instead of Nixpacks.

---

## Important Notes

- **DO NOT** use `nixpacks.toml` - Railway ignores it
- **DO NOT** use `railway.json` build commands - they run during build phase
- **ONLY** configure via Railway dashboard Settings
- The Start Command runs AFTER build, where DATABASE_URL is available

---

**Once you've configured these settings in Railway dashboard, let me know and I'll help verify the deployment!**
