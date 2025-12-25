# CSY Backend - API Endpoints Reference

**Quick Reference Guide** - All API endpoints at a glance

---

## Authentication API (`/api/auth`)

1. `POST /api/auth/register` - Register new user
2. `POST /api/auth/login` - User login
3. `POST /api/auth/verify-email` - Verify email address
4. `POST /api/auth/resend-verification` - Resend verification email
5. `POST /api/auth/forgot-password` - Request password reset
6. `POST /api/auth/reset-password` - Reset password with token
7. `POST /api/auth/logout` - Logout user
8. `POST /api/auth/refresh` - Refresh access token
9. `POST /api/auth/send-otp` - Send OTP to phone
10. `POST /api/auth/verify-otp` - Verify OTP code

---

## User Management API (`/api/user`)

1. `GET /api/user/profile` - Get user profile
2. `PUT /api/user/profile` - Update user profile
3. `PUT /api/user/password` - Change password
4. `DELETE /api/user/deactivate` - Deactivate account
5. `GET /api/user/addresses` - Get all addresses
6. `POST /api/user/addresses` - Add new address
7. `PUT /api/user/addresses/:id` - Update address
8. `DELETE /api/user/addresses/:id` - Delete address
9. `GET /api/user/wallet` - Get wallet information
10. `GET /api/user/points` - Get points information
11. `PUT /api/user/assistant-name` - Update AI assistant name
12. `POST /api/user/wallet/add` - Add wallet balance
13. `GET /api/user/wallet/history` - Get wallet transaction history
14. `GET /api/user/points/history` - Get points transaction history
15. `GET /api/user/visit-history` - Get business visit history
16. `GET /api/user/notifications` - Get notifications
17. `PUT /api/user/notifications/:id` - Mark notification as read
18. `DELETE /api/user/account` - Delete account permanently

---

## Business Management API (`/api/business`)

### Public Endpoints
1. `POST /api/business/register` - Register new business
2. `POST /api/business/login` - Business login
3. `GET /api/business` - Get all businesses (public)
4. `GET /api/business/:id` - Get public business profile
5. `GET /api/business/:id/products` - Get public business products

### Authenticated Endpoints
6. `GET /api/business/profile` - Get business profile
7. `PUT /api/business/profile` - Update business profile
8. `PUT /api/business/working-hours` - Update working hours
9. `POST /api/business/photos` - Upload photos
10. `DELETE /api/business/photos/:id` - Delete photo
11. `GET /api/business/cashiers` - Get cashiers
12. `POST /api/business/cashiers` - Create cashier
13. `PUT /api/business/cashiers/:id` - Update cashier
14. `DELETE /api/business/cashiers/:id` - Delete cashier
15. `GET /api/business/financials` - Get financial records
16. `GET /api/business/offers` - Get offers
17. `POST /api/business/offers` - Create offer
18. `PUT /api/business/offers/:id` - Update offer
19. `DELETE /api/business/offers/:id` - Delete offer
20. `PUT /api/business/orders/:id/accept` - Accept order
21. `PUT /api/business/orders/:id/reject` - Reject order
22. `GET /api/business/orders` - Get orders
23. `GET /api/business/appointments` - Get appointments
24. `POST /api/business/appointments` - Add appointment
25. `PUT /api/business/appointments/:id` - Update appointment
26. `DELETE /api/business/appointments/:id` - Delete appointment
27. `POST /api/business/products` - Add product
28. `GET /api/business/products` - Get products
29. `PUT /api/business/products/:id` - Update product
30. `DELETE /api/business/products/:id` - Delete product
31. `GET /api/business/analytics` - Get analytics
32. `GET /api/business/operations-log` - Get operations log
33. `GET /api/business/dashboard` - Get dashboard data
34. `POST /api/business/categories` - Create category
35. `GET /api/business/categories` - Get categories
36. `PUT /api/business/categories/:id` - Update category
37. `DELETE /api/business/categories/:id` - Delete category
38. `GET /api/business/reservations` - Get reservations

---

## Driver Management API (`/api/driver`)

### Public Endpoints
1. `POST /api/driver/register` - Register new driver
2. `POST /api/driver/login` - Driver login

### Authenticated Endpoints
3. `GET /api/driver/profile` - Get driver profile
4. `PUT /api/driver/profile` - Update driver profile
5. `PUT /api/driver/location` - Update location
6. `PUT /api/driver/availability` - Update availability
7. `GET /api/driver/orders/incoming` - Get incoming orders
8. `GET /api/driver/orders/accepted` - Get accepted orders
9. `GET /api/driver/orders/in-delivery` - Get in-delivery orders
10. `GET /api/driver/orders` - Get all orders
11. `POST /api/driver/orders/:id/accept` - Accept order
12. `POST /api/driver/orders/:id/deliver` - Mark order as delivered
13. `GET /api/driver/earnings` - Get earnings

---

## Cashier Management API (`/api/cashier`)

### Public Endpoints
1. `POST /api/cashier/login` - Cashier login

### Authenticated Endpoints
2. `GET /api/cashier/profile` - Get cashier profile
3. `GET /api/cashier/orders` - Get business orders
4. `PUT /api/cashier/orders/:id/status` - Update order status
5. `GET /api/cashier/products` - Get business products
6. `PUT /api/cashier/products/:id/availability` - Update product availability
7. `POST /api/cashier/orders/:id/payment` - Process payment
8. `GET /api/cashier/reports/daily` - Get daily sales report
9. `GET /api/cashier/statistics` - Get cashier statistics
10. `POST /api/cashier/qr/scan` - Scan QR code
11. `GET /api/cashier/operations` - Get operations history

---

## Order Management API (`/api/orders`)

1. `POST /api/orders` - Create new order
2. `GET /api/orders/:id` - Get order details
3. `PUT /api/orders/:id` - Update order
4. `DELETE /api/orders/:id` - Cancel order
5. `GET /api/orders/user` - Get user orders
6. `POST /api/orders/cart` - Calculate cart total
7. `GET /api/orders/track/:id` - Track order location

---

## Reservation Management API (`/api/reservations`)

1. `POST /api/reservations` - Create reservation
2. `GET /api/reservations` - Get user reservations
3. `GET /api/reservations/:id` - Get reservation details
4. `PUT /api/reservations/:id` - Update reservation
5. `DELETE /api/reservations/:id/cancel` - Cancel reservation
6. `GET /api/reservations/availability` - Get available time slots
7. `POST /api/reservations/:id/rate` - Rate reservation

---

## Payment Processing API (`/api/payments`)

1. `POST /api/payments/wallet/topup` - Add balance to wallet
2. `POST /api/payments/process` - Process payment for order
3. `POST /api/payments/verify` - Verify payment status
4. `POST /api/payments/refund` - Process refund
5. `GET /api/payments/wallet/balance` - Get wallet balance
6. `GET /api/payments/wallet/history` - Get wallet transaction history

---

## QR Code Management API (`/api/qr`)

1. `POST /api/qr/generate` - Generate QR code
2. `POST /api/qr/validate` - Validate QR code
3. `POST /api/qr/scan` - Scan and process QR code

---

## Rating & Review API (`/api/ratings`)

1. `POST /api/ratings` - Submit rating
2. `GET /api/ratings/business/:id` - Get business ratings
3. `GET /api/ratings/driver/:id` - Get driver ratings

---

## AI Assistant API (`/api/ai`)

1. `GET /api/ai/recommendations` - Get personalized recommendations
2. `POST /api/ai/chat` - Chat with AI assistant

---

## City & Location API (`/api/cities`)

1. `GET /api/cities` - Get all cities
2. `GET /api/cities/search` - Search cities
3. `GET /api/cities/governorates` - Get all governorates with cities
4. `GET /api/cities/governorate/:governorate_code` - Get cities by governorate
5. `GET /api/cities/:cityName` - Get city details

---

## Admin Dashboard API (`/api/admin`)

### Public Endpoints
1. `POST /api/admin/login` - Admin login
2. `GET /api/admin/system/health` - Get system health

### Authenticated Endpoints
3. `GET /api/admin/me` - Get admin profile
4. `PATCH /api/admin/update-activestatus` - Update active status
5. `PATCH /api/admin/update-password` - Update password
6. `GET /api/admin/dashboard/stats` - Get dashboard statistics
7. `GET /api/admin/dashboard/revenue-chart` - Get revenue chart data
8. `GET /api/admin/dashboard/user-growth` - Get user growth data
9. `GET /api/admin/users` - Get all users
10. `GET /api/admin/users/:id` - Get user by ID
11. `PATCH /api/admin/users/:id/status` - Update user status
12. `DELETE /api/admin/users/:id` - Delete user
13. `GET /api/admin/businesses` - Get all businesses
14. `GET /api/admin/businesses/:id` - Get business by ID
15. `PATCH /api/admin/businesses/:id/status` - Update business status
16. `DELETE /api/admin/businesses/:id` - Delete business
17. `GET /api/admin/drivers` - Get all drivers
18. `GET /api/admin/drivers/:id` - Get driver by ID
19. `PATCH /api/admin/drivers/:id/status` - Update driver status
20. `GET /api/admin/transactions` - Get all transactions
21. `GET /api/admin/transactions/:id` - Get transaction by ID
22. `GET /api/admin/subscriptions` - Get all subscriptions

---

## Summary

**Total Endpoints: 141**

- Authentication API: 10 endpoints
- User Management API: 18 endpoints
- Business Management API: 38 endpoints
- Driver Management API: 12 endpoints
- Cashier Management API: 10 endpoints
- Order Management API: 7 endpoints
- Reservation Management API: 7 endpoints
- Payment Processing API: 6 endpoints
- QR Code Management API: 3 endpoints
- Rating & Review API: 3 endpoints
- AI Assistant API: 2 endpoints
- City & Location API: 5 endpoints
- Admin Dashboard API: 20 endpoints

---

**Note**: Most endpoints require JWT authentication. Include `Authorization: Bearer <token>` header for authenticated requests.

