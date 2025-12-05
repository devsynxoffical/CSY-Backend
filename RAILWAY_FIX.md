# Railway Deployment - Quick Fix Guide

## Current Issue: DATABASE_URL Error During Build

The deployment is failing because Prisma is trying to access `DATABASE_URL` during the build phase, but this variable is only available during the deploy/start phase.

## Solution Steps

### Step 1: Verify DATABASE_URL is Set in Railway

1. Go to your Railway project dashboard
2. Click on **CSY-Backend** service
3. Go to **"Variables"** tab
4. **Verify** that `DATABASE_URL` exists
   - If it exists: ✅ Good
   - If it doesn't exist: You need to link your PostgreSQL database

### Step 2: Link PostgreSQL Database (If DATABASE_URL is Missing)

1. In Railway dashboard, make sure you have a **PostgreSQL** service
2. Click on **CSY-Backend** service
3. Go to **"Settings"** tab
4. Scroll to **"Service Variables"**
5. Click **"New Variable"** → **"Add Reference"**
6. Select **PostgreSQL** service
7. Select **DATABASE_URL** variable
8. Save

### Step 3: Alternative Fix - Use Railway CLI

If the nixpacks.toml isn't working, try this:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Check if DATABASE_URL exists
railway variables

# If DATABASE_URL is missing, add it manually
# (Get the value from your PostgreSQL service)
railway variables set DATABASE_URL="postgresql://..."
```

### Step 4: Manual Redeploy

After verifying DATABASE_URL exists:

1. Go to Railway dashboard
2. Click on **CSY-Backend** service
3. Go to **"Deployments"** tab
4. Click **"Redeploy"** on the latest deployment

### Step 5: Check Build Logs

Watch the build logs. You should see:
```
✅ Installing dependencies
✅ Build complete (no DATABASE_URL errors)
✅ Starting deployment
✅ Generating Prisma Client
✅ Running migrations
✅ Server started
```

## If Still Failing

### Option A: Remove Prisma from package.json postinstall

Check if `package.json` has a `postinstall` script running Prisma:

```json
{
  "scripts": {
    "postinstall": "prisma generate"  // ❌ Remove this if it exists
  }
}
```

### Option B: Use .railwayignore

Create `.railwayignore` file:
```
node_modules/
.git/
```

### Option C: Simplify Start Command

In Railway dashboard:
1. Go to **Settings** → **Deploy**
2. Set **Start Command** to:
   ```
   sh -c "npx prisma generate && npx prisma migrate deploy && node index.js"
   ```

## Verification

Once deployed successfully, test:
```bash
curl https://csy-backend-production.up.railway.app/health
```

Should return:
```json
{"status":"healthy","timestamp":"..."}
```

## Common Causes

1. ❌ PostgreSQL not linked to CSY-Backend service
2. ❌ DATABASE_URL variable not set
3. ❌ Prisma running in postinstall script
4. ❌ Railway using wrong build configuration

## Need Help?

Share:
1. Screenshot of Railway Variables tab
2. Full build logs
3. Your `package.json` scripts section
