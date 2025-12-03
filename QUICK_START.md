# CoreSY Backend - Quick Start Commands

## Git Push to GitHub

```bash
# Navigate to project directory
cd "d:\DEVSYNX- Projects\CSY-Backend\CSY-main"

# Initialize git (if needed)
git init

# Add all files
git add .

# Commit
git commit -m "feat: Complete CoreSY Backend with Admin Dashboard

- User, Business, Driver APIs at 100%
- Admin Dashboard with 30+ endpoints
- ChamCash/eCash payment integration
- Enhanced QR code system
- AI assistant integration
- Role-based access control
- Comprehensive analytics
"

# Add GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/CSY-Backend.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Deploy to Railway

### Quick Deploy (Recommended)

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `CSY-Backend` repository
4. Add PostgreSQL database (click "New" → "Database" → "PostgreSQL")
5. Add environment variables (see below)
6. Railway deploys automatically!

### Environment Variables (Copy to Railway)

```env
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_EXPIRES_IN=24h
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=coresy-uploads
STRIPE_SECRET_KEY=sk_live_your-key
STRIPE_PUBLISHABLE_KEY=pk_live_your-key
PAYMOB_API_KEY=your-paymob-key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=CoreSY <noreply@coresy.com>
PLATFORM_FEE_PERCENTAGE=10
DRIVER_FEE_PERCENTAGE=15
```

## Create Admin Account (After Deployment)

```bash
# Via Railway CLI
railway run bash

# Then run:
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createAdmin() {
  const password_hash = await bcrypt.hash('Admin@2024!Secure', 12);
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

## Test Deployment

```bash
# Test health
curl https://your-app.up.railway.app/health

# Test admin login
curl -X POST https://your-app.up.railway.app/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@coresy.com","password":"Admin@2024!Secure"}'
```

## Useful Commands

```bash
# View Railway logs
railway logs

# Run migrations
railway run npx prisma migrate deploy

# Access database
railway run npx prisma studio

# Shell access
railway run bash
```

---

**For detailed instructions, see:**
- `RAILWAY_DEPLOYMENT.md` - Complete deployment guide
- `deployment_checklist.md` - Step-by-step checklist
