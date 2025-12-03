# Railway Deployment Guide for CoreSY Backend

## Prerequisites

1. **Railway Account** - Sign up at [railway.app](https://railway.app)
2. **GitHub Repository** - Your code should be pushed to GitHub
3. **PostgreSQL Database** - Railway provides this automatically

---

## Step 1: Push Code to GitHub

### Initialize Git (if not already done)

```bash
cd "d:\DEVSYNX- Projects\CSY-Backend\CSY-main"
git init
git add .
git commit -m "Initial commit - CoreSY Backend with Admin Dashboard"
```

### Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Create a new repository named `CSY-Backend`
3. **Do NOT** initialize with README, .gitignore, or license

### Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/CSY-Backend.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy to Railway

### Option A: Deploy via Railway Dashboard

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `CSY-Backend` repository
5. Railway will automatically detect Node.js and start deployment

### Option B: Deploy via Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Link to your project
railway link

# Deploy
railway up
```

---

## Step 3: Add PostgreSQL Database

1. In your Railway project dashboard, click **"New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway will create a PostgreSQL instance
4. The `DATABASE_URL` will be automatically added to your environment variables

---

## Step 4: Configure Environment Variables

In Railway dashboard, go to **Variables** tab and add:

### Required Variables

```env
# Database (automatically set by Railway PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/database

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Server
PORT=3000
NODE_ENV=production

# CORS
CORS_ORIGIN=https://your-frontend-domain.com

# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Paymob (Egyptian payments)
PAYMOB_API_KEY=your-paymob-api-key
PAYMOB_INTEGRATION_ID=your-integration-id

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=CoreSY <noreply@coresy.com>

# Redis (optional - add Redis service in Railway)
REDIS_URL=redis://default:password@host:port

# Platform Fees
PLATFORM_FEE_PERCENTAGE=10
DRIVER_FEE_PERCENTAGE=15
```

### Optional Variables

```env
# AI Assistant (if using)
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# Google Maps (for location services)
GOOGLE_MAPS_API_KEY=your-google-maps-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Step 5: Add Redis (Optional but Recommended)

1. In Railway project, click **"New"**
2. Select **"Database"** → **"Redis"**
3. Railway will automatically set `REDIS_URL` environment variable

---

## Step 6: Run Database Migrations

Railway will automatically run migrations on deployment via the Procfile:

```
web: npx prisma migrate deploy && node index.js
```

If you need to run migrations manually:

```bash
railway run npx prisma migrate deploy
```

---

## Step 7: Create Admin Account

After deployment, create your first admin account:

```bash
# Connect to Railway shell
railway run bash

# Run the admin creation script
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createAdmin() {
  const password_hash = await bcrypt.hash('Admin@123!ChangeMe', 12);
  const admin = await prisma.admin.create({
    data: {
      email: 'admin@coresy.com',
      password_hash,
      full_name: 'Super Admin',
      role: 'super_admin',
      is_active: true
    }
  });
  console.log('✅ Admin created:', admin.email);
  await prisma.\$disconnect();
}

createAdmin().catch(console.error);
"
```

**⚠️ IMPORTANT:** Change the default password immediately after first login!

---

## Step 8: Verify Deployment

### Check Deployment Status

1. Go to Railway dashboard
2. Check **"Deployments"** tab
3. View logs for any errors

### Test API Endpoints

```bash
# Get your Railway URL (e.g., https://csy-backend-production.up.railway.app)

# Test health endpoint
curl https://your-railway-url.railway.app/health

# Test admin login
curl -X POST https://your-railway-url.railway.app/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@coresy.com","password":"Admin@123!ChangeMe"}'
```

---

## Step 9: Custom Domain (Optional)

1. In Railway project, go to **"Settings"**
2. Click **"Domains"**
3. Add your custom domain (e.g., `api.coresy.com`)
4. Update DNS records as instructed by Railway
5. Update `CORS_ORIGIN` environment variable

---

## Step 10: Enable Automatic Deployments

Railway automatically deploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Update: Added new feature"
git push origin main

# Railway will automatically deploy the changes
```

---

## Monitoring & Logs

### View Logs

```bash
# Via CLI
railway logs

# Or in Railway dashboard → Deployments → View Logs
```

### Monitor Performance

1. Railway dashboard shows:
   - CPU usage
   - Memory usage
   - Network traffic
   - Request metrics

---

## Troubleshooting

### Database Connection Issues

```bash
# Check DATABASE_URL is set
railway variables

# Test database connection
railway run npx prisma db push
```

### Migration Errors

```bash
# Reset database (⚠️ WARNING: Deletes all data)
railway run npx prisma migrate reset

# Or apply migrations manually
railway run npx prisma migrate deploy
```

### Port Issues

Railway automatically sets the `PORT` environment variable. Make sure your `index.js` uses:

```javascript
const PORT = process.env.PORT || 3000;
```

### Memory Issues

If you encounter memory errors:
1. Go to Railway project settings
2. Increase memory limit
3. Redeploy

---

## Scaling

### Horizontal Scaling

Railway supports horizontal scaling:
1. Go to project settings
2. Enable **"Horizontal Scaling"**
3. Set number of instances

### Database Scaling

For production, consider:
- Upgrading PostgreSQL plan
- Enabling connection pooling
- Adding read replicas

---

## Backup Strategy

### Automated Backups

Railway PostgreSQL includes automatic backups. To create manual backup:

```bash
# Export database
railway run npx prisma db pull

# Or use the backup script
railway run node scripts/backup.js
```

### Restore from Backup

```bash
railway run node scripts/restore.js
```

---

## Security Checklist

- [ ] Change default admin password
- [ ] Set strong JWT_SECRET
- [ ] Enable HTTPS (automatic on Railway)
- [ ] Configure CORS_ORIGIN properly
- [ ] Use environment variables for all secrets
- [ ] Enable rate limiting
- [ ] Set up monitoring alerts
- [ ] Regular security updates

---

## Cost Optimization

Railway offers:
- **Free Tier**: $5 credit/month
- **Developer Plan**: $5/month + usage
- **Team Plan**: $20/month + usage

To optimize costs:
1. Use sleep mode for non-production environments
2. Monitor resource usage
3. Optimize database queries
4. Use caching (Redis)

---

## Support

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
- **GitHub Issues**: Create issues in your repository

---

## Quick Reference

```bash
# Deploy
git push origin main

# View logs
railway logs

# Run migrations
railway run npx prisma migrate deploy

# Access database
railway run npx prisma studio

# Shell access
railway run bash

# Environment variables
railway variables
```

---

## Next Steps After Deployment

1. ✅ Test all API endpoints
2. ✅ Create admin account
3. ✅ Update frontend API URL
4. ✅ Configure webhook URLs (Stripe, Paymob)
5. ✅ Set up monitoring
6. ✅ Configure backups
7. ✅ Update documentation
8. ✅ Invite team members to Railway project

---

**Your Railway URL will be:** `https://csy-backend-production.up.railway.app`

**Admin Dashboard:** `https://csy-backend-production.up.railway.app/api/admin/login`

**API Documentation:** `https://csy-backend-production.up.railway.app/api-docs`
