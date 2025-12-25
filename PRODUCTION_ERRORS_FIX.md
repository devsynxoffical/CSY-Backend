# Production Errors Fix Guide

## Issues Found and Fixed

### 1. ✅ Postman Error: "Invalid UUID format" for `/reservations`

**Problem:**
- When calling `GET {{base_url}}/reservations`, the route was being matched by `GET /:id` instead of `GET /`
- This caused "reservations" to be treated as an ID and validated as UUID, which failed

**Root Cause:**
- Route ordering issue: Specific routes (like `/availability`) must come BEFORE parameterized routes (like `/:id`)
- The `/availability` route was defined AFTER `/:id`, causing route conflicts

**Fix Applied:**
- Moved `/availability` route BEFORE `/:id` route in `routes/reservation.routes.js`
- Removed duplicate `/availability` route definition
- Added comment explaining route ordering importance

**Solution:**
```javascript
// ✅ CORRECT ORDER:
router.get('/availability', ...);  // Specific route first
router.get('/', ...);               // List route
router.get('/:id', ...);            // Parameterized route last
```

**Postman Fix:**
Make sure your Postman `base_url` includes `/api`:
- ✅ Correct: `https://csy-backend-production.up.railway.app/api`
- ❌ Wrong: `https://csy-backend-production.up.railway.app`

Then use: `GET {{base_url}}/reservations?page=1&limit=20`

---

### 2. ✅ Missing `actual_delivery_time` Field in Order Model

**Problem:**
- Code was trying to query `actual_delivery_time` field which doesn't exist in Order schema
- Error: `Unknown argument 'actual_delivery_time'. Available options are listed in green.`

**Fix Applied:**
- Added `actual_delivery_time DateTime?` field to Order model in `prisma/schema.prisma`

**Next Steps:**
1. Create and run migration:
   ```bash
   npm run db:migrate
   ```
2. Or push schema changes:
   ```bash
   npm run db:push
   ```

---

### 3. ⚠️ Missing `offers` Table in Database

**Problem:**
- Error: `The table 'public.offers' does not exist in the current database`
- Code is trying to use `prisma.offer.findMany()` but table doesn't exist

**Root Cause:**
- Database migrations haven't been run on production
- The `Offer` model exists in schema but table wasn't created

**Fix Required:**
1. **Run migrations on production:**
   ```bash
   npm run db:migrate:deploy
   ```
   Or if using Railway:
   - Go to Railway Dashboard → Your Service → Deploy Logs
   - Check if migrations run automatically (they should via `start` script)
   - If not, manually run: `npx prisma migrate deploy`

2. **Verify migration:**
   - Check if `offers` table exists in database
   - Verify all other tables are created

**Note:** The `start` script in `package.json` should run migrations automatically:
```json
"start": "npx prisma migrate deploy && node index.js"
```

---

### 4. ✅ Fixed `is_active` vs `is_available` Bug

**Problem:**
- `getBusinessProducts` was checking `is_active: true` but Product model uses `is_available`

**Fix Applied:**
- Changed `is_active` to `is_available` in `controllers/business.controller.js`

---

## Deployment Steps

### 1. Commit and Push Changes
```bash
git add .
git commit -m "Fix: Route ordering, add actual_delivery_time field, fix product availability check"
git push
```

### 2. Railway Will Auto-Deploy
- Railway will detect the push and start deployment
- The `start` script will run migrations automatically

### 3. Verify Deployment
- Check Railway Deploy Logs for migration success
- Test the fixed endpoints:
  - `GET /api/reservations` (should work now)
  - `GET /api/business/:id/products` (should filter correctly)
  - Driver earnings endpoint (should work after migration)

### 4. Manual Migration (if needed)
If migrations don't run automatically:
```bash
# SSH into Railway or use Railway CLI
railway run npx prisma migrate deploy
```

---

## Testing Checklist

- [ ] `GET /api/reservations` works without UUID error
- [ ] `GET /api/reservations/availability` works
- [ ] `GET /api/reservations/:id` works with valid UUID
- [ ] Driver earnings endpoint works (after migration)
- [ ] Business products endpoint filters by `is_available`
- [ ] Offers endpoint works (after migration)

---

## Summary

**Fixed:**
1. ✅ Route ordering in reservation routes
2. ✅ Added `actual_delivery_time` field to Order schema
3. ✅ Fixed `is_active` → `is_available` in product query

**Requires Migration:**
1. ⚠️ Run `prisma migrate deploy` to create `offers` table
2. ⚠️ Run migration to add `actual_delivery_time` field

**Postman Configuration:**
- Ensure `base_url` = `https://csy-backend-production.up.railway.app/api`
- Use endpoints like: `{{base_url}}/reservations`

