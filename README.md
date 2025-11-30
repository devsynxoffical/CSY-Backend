# CoreSY Backend API

Professional backend system for the CoreSY Platform built with Node.js, PostgreSQL, and Redis.

## 🚀 Features

- **RESTful API** with comprehensive Swagger documentation
- **PostgreSQL Database** with Prisma ORM for type-safe queries
- **Redis Caching** for optimal performance
- **JWT Authentication** with secure token management
- **File Upload** to AWS S3
- **Payment Processing** via Stripe
- **Email Notifications** with Nodemailer
- **Automated Backups** to AWS S3
- **Rate Limiting** and security best practices

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+
- AWS Account (for S3 and deployment)
- Stripe Account (for payments)

## 🛠️ Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the environment template:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/csy_db

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key

# AWS S3
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=csy-uploads

# Stripe
STRIPE_SECRET_KEY=sk_test_your-key
```

### 3. Initialize Database

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Seed with sample data
npm run db:seed
```

### 4. Start Server

```bash
npm start
```

Server will start on `http://localhost:3119`

## 📚 API Documentation

- **Swagger UI**: http://localhost:3119/api-docs
- **Health Check**: http://localhost:3119/health
- **Postman Collection**: `postman/CoreSY_API.postman_collection.json`

## 🗂️ Project Structure

```
CSY-Backend/
├── config/              # Configuration files
│   ├── database.js      # PostgreSQL/Prisma setup
│   ├── redis.js         # Redis configuration
│   ├── cache-strategies.js  # Caching logic
│   ├── aws.js           # AWS S3 setup
│   └── swagger.js       # API documentation
├── controllers/         # Request handlers
├── middlewares/         # Express middlewares
├── models/              # Prisma client exports
├── routes/              # API routes
├── services/            # Business logic
├── utils/               # Helper functions
├── scripts/             # Utility scripts
│   ├── backup.js        # Database backup
│   ├── restore.js       # Database restore
│   └── seed.js          # Sample data
├── prisma/
│   └── schema.prisma    # Database schema
└── index.js             # Application entry point
```

## 🔧 Available Scripts

```bash
# Development
npm start                # Start server
npm run dev              # Start with auto-reload

# Database
npm run db:generate      # Generate Prisma Client
npm run db:migrate       # Run migrations
npm run db:push          # Push schema changes
npm run db:seed          # Seed database
npm run prisma:studio    # Open database GUI

# Maintenance
npm run db:backup        # Create database backup
npm run db:restore       # Restore from backup
```

## 🗄️ Database Schema

The system uses PostgreSQL with the following main models:

- **Users**: User accounts and authentication
- **Businesses**: Restaurant, clinic, and service providers
- **Drivers**: Delivery personnel
- **Orders**: Delivery orders and items
- **Reservations**: Table and appointment bookings
- **Transactions**: Payment and financial records
- **Ratings**: User reviews and ratings
- **Notifications**: Push and email notifications

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+963999999999",
  "password_hash": "password123",
  "governorate_code": "DM"
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Authenticated Requests

Include the JWT token in the Authorization header:

```http
GET /api/user/profile
Authorization: Bearer your-jwt-token
```

## 📊 Caching Strategy

Redis caching is implemented for:

- User sessions (24h TTL)
- User profiles (30min TTL)
- Business listings (1h TTL)
- QR codes (5min TTL)
- Wallet balances (30min TTL)
- Order status (2min TTL)

## 💾 Backup & Recovery

### Automated Backups

Backups are automatically created daily and stored in AWS S3 with 30-day retention.

### Manual Backup

```bash
npm run db:backup
```

### Restore from Backup

```bash
npm run db:restore <backup-filename>
```

## 🚀 Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed AWS deployment instructions including:

- RDS PostgreSQL setup
- ElastiCache Redis configuration
- EC2/ECS deployment
- Load balancing and auto-scaling
- Monitoring and alerts

## 🧪 Testing

Import the Postman collection from `postman/CoreSY_API.postman_collection.json` to test all endpoints.

### Test Flow

1. Register a new user
2. Login to get JWT token
3. Test authenticated endpoints
4. Create orders and reservations
5. Test payment flows

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/reset-password` - Reset password

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile
- `GET /api/user/wallet` - Get wallet balance
- `GET /api/user/points` - Get points balance
- `POST /api/user/addresses` - Add address

### Business Operations
- `GET /api/business` - List businesses
- `GET /api/business/:id` - Get business details
- `GET /api/business/:id/products` - Get products

### Orders (CoreSY Go)
- `POST /api/orders` - Create order
- `GET /api/orders` - List user orders
- `GET /api/orders/:id` - Get order details
- `GET /api/orders/:id/track` - Track order

### Reservations (CoreSY Pass/Care)
- `POST /api/reservations` - Create reservation
- `GET /api/reservations` - List reservations
- `DELETE /api/reservations/:id` - Cancel reservation

### Payments
- `POST /api/payments/wallet/topup` - Add wallet balance
- `GET /api/payments/transactions` - Transaction history

### QR Operations
- `POST /api/qr/generate` - Generate QR code
- `POST /api/qr/validate` - Validate QR code

### Ratings
- `POST /api/ratings` - Submit rating
- `GET /api/ratings/business/:id` - Get business ratings

## 🔒 Security

- Password hashing with bcrypt (12 rounds)
- JWT token authentication
- Rate limiting on all endpoints
- Input validation and sanitization
- SQL injection protection (Prisma)
- CORS configuration
- Environment variable protection

## 🐛 Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
psql -U postgres -l

# Verify DATABASE_URL in .env
echo $DATABASE_URL
```

### Redis Connection Error

```bash
# Check Redis is running
redis-cli ping

# Should return: PONG
```

### Migration Errors

```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Run migrations again
npm run db:migrate
```

## 📞 Support

For technical support or questions:
- Check [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed setup instructions
- Review [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for deployment help
- Check API documentation at `/api-docs`

## 📄 License

Proprietary - CoreSY Hub © 2025

---

**Built with ❤️ for CoreSY Platform**
