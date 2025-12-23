# Payment QR Code Flow

## Complete Payment QR Code Flow

This document explains the complete flow for payment using QR codes in the CSY Backend system.

---

## Flow Overview

```
User App                    Backend API              Business/Cashier App
   |                            |                            |
   |--1. Generate Payment QR-->|                            |
   |<--QR Code Image-----------|                            |
   |                            |                            |
   |  [Display QR Code]         |                            |
   |                            |                            |
   |                            |<--2. Scan QR Code---------|
   |                            |--3. Validate QR---------->|
   |                            |<--4. Process Payment------|
   |                            |--5. Create Transaction-->|
   |                            |--6. Update Order Status-->|
   |                            |--7. Mark QR as Used------>|
   |<--8. Payment Notification--|                            |
```

---

## Step-by-Step Flow

### **Step 1: User Generates Payment QR Code**

**User App Action:** User wants to pay for an order/reservation

**API Call:**
```http
POST /api/qr/generate
Authorization: Bearer <user_jwt_token>
Content-Type: application/json

{
  "type": "payment",
  "reference_id": "order-id-or-reservation-id",
  "additional_data": {
    "business_id": "business-id",
    "amount": 50000  // Amount in piastres (500 EGP)
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "QR code generated successfully",
  "data": {
    "qr_id": "qr-uuid",
    "qr_token": "ABC123DEF456",
    "qr_data_url": "data:image/png;base64,iVBORw0KGgo...",
    "expires_at": "2024-01-15T13:00:00.000Z",
    "qr_type": "payment"
  }
}
```

**What Happens:**
- QR code is generated with unique token
- QR code expires in 1 hour (for payment type)
- QR code is stored in database
- QR code image (data URL) is returned to user

**User App:** Displays the QR code image on screen

---

### **Step 2: Business/Cashier Scans QR Code**

**Business App Action:** Cashier scans the QR code using camera/scanner

**API Call:**
```http
POST /api/qr/scan
Authorization: Bearer <cashier_jwt_token>
Content-Type: application/json

{
  "qr_token": "ABC123DEF456",
  "action": "process",
  "additional_data": {
    "amount": 50000  // Amount to process (optional, can be from QR)
  }
}
```

**What Happens:**
1. Backend validates QR token exists
2. Checks if QR code is expired
3. Checks if QR code is already used
4. Validates QR type is "payment"
5. Processes the payment

---

### **Step 3: Payment Processing**

**Backend Processing:**
```javascript
// In qrService.processPaymentQR()
{
  success: true,
  type: 'payment',
  paymentId: qrCode.reference_id,
  amount: paymentAmount,
  message: `Payment of EGP ${paymentAmount / 100} processed`,
  payment: {
    id: qrCode.reference_id,
    amount: paymentAmount,
    currency: 'EGP',
    status: 'completed'
  }
}
```

**What Happens:**
- Payment amount is extracted from QR code or scanner data
- Payment is processed (could integrate with Stripe/Paymob)
- Transaction record is created
- Order/Reservation payment status is updated

---

### **Step 4: Create Transaction Record**

**Backend Action:**
```javascript
// Create transaction in database
await prisma.transaction.create({
  data: {
    user_id: userId,           // From QR code
    business_id: businessId,   // From QR code
    cashier_id: cashierId,     // From scanner
    transaction_type: 'payment',
    reference_type: 'order',   // or 'reservation'
    reference_id: orderId,      // From QR code
    amount: paymentAmount,
    payment_method: 'qr_code',
    status: 'completed',
    description: 'Payment via QR code'
  }
});
```

---

### **Step 5: Update Order/Reservation Status**

**Backend Action:**
```javascript
// Update order payment status
await prisma.order.update({
  where: { id: orderId },
  data: {
    payment_status: 'paid',
    payment_method: 'qr_code',
    updated_at: new Date()
  }
});
```

---

### **Step 6: Mark QR Code as Used**

**Backend Action:**
```javascript
// Mark QR code as used (one-time use)
await prisma.qRCode.update({
  where: { id: qrCode.id },
  data: {
    is_used: true,
    used_at: new Date(),
    scan_count: qrCode.scan_count + 1,
    last_scanned_at: new Date()
  }
});
```

---

### **Step 7: Send Notifications**

**Backend Action:**
- Send notification to user: "Payment successful"
- Send notification to business: "Payment received"
- Update order status in real-time

---

## API Endpoints Summary

### 1. Generate Payment QR Code
```
POST /api/qr/generate
```
**Required:** User authentication  
**Purpose:** Generate QR code for payment

### 2. Validate QR Code (Optional)
```
POST /api/qr/validate
```
**Required:** Authentication  
**Purpose:** Check if QR code is valid before scanning

### 3. Scan & Process QR Code
```
POST /api/qr/scan
```
**Required:** Cashier/Business authentication  
**Purpose:** Scan QR code and process payment

---

## Request/Response Examples

### Generate Payment QR Code

**Request:**
```json
{
  "type": "payment",
  "reference_id": "order-123-uuid",
  "additional_data": {
    "business_id": "business-456-uuid",
    "amount": 50000
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "QR code generated successfully",
  "data": {
    "qr_id": "qr-789-uuid",
    "qr_token": "ABC123DEF456",
    "qr_data_url": "data:image/png;base64,...",
    "expires_at": "2024-01-15T13:00:00.000Z",
    "qr_type": "payment"
  }
}
```

### Scan Payment QR Code

**Request:**
```json
{
  "qr_token": "ABC123DEF456",
  "action": "process",
  "additional_data": {
    "amount": 50000
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment of EGP 500 processed",
  "data": {
    "type": "payment",
    "paymentId": "order-123-uuid",
    "amount": 50000,
    "payment": {
      "id": "order-123-uuid",
      "amount": 50000,
      "currency": "EGP",
      "status": "completed"
    }
  }
}
```

---

## Security Features

1. **QR Code Expiration:** Payment QR codes expire in 1 hour
2. **One-Time Use:** Payment QR codes can only be used once
3. **Token Validation:** QR tokens are validated before processing
4. **Authentication:** Both user and cashier must be authenticated
5. **Reference Validation:** Order/Reservation must exist and be valid

---

## Error Scenarios

### QR Code Expired
```json
{
  "success": false,
  "message": "QR code has expired",
  "error": "QR_EXPIRED"
}
```

### QR Code Already Used
```json
{
  "success": false,
  "message": "QR code has already been used",
  "error": "QR_ALREADY_USED"
}
```

### Invalid QR Token
```json
{
  "success": false,
  "message": "QR code not found",
  "error": "QR_NOT_FOUND"
}
```

### Order Not Found
```json
{
  "success": false,
  "message": "Order not found",
  "error": "ORDER_NOT_FOUND"
}
```

---

## Integration Points

### With Payment Gateway
- Can integrate with Stripe/Paymob for actual payment processing
- QR code can contain payment gateway reference
- Payment confirmation updates order status

### With Order System
- QR code references order ID
- Payment updates order payment_status
- Order status can trigger notifications

### With Wallet System
- QR code payment can deduct from user wallet
- Transaction records wallet balance changes
- Supports partial wallet + QR payment

---

## Use Cases

1. **Order Payment:** User pays for order using QR code at restaurant
2. **Reservation Payment:** User pays for reservation using QR code
3. **Wallet Top-up:** User generates QR for wallet top-up (future)
4. **Split Payment:** Multiple payment methods including QR code

---

## Testing the Flow

### Test Scenario 1: Complete Payment Flow

1. **User generates QR:**
   ```bash
   curl -X POST http://localhost:3119/api/qr/generate \
     -H "Authorization: Bearer <user_token>" \
     -H "Content-Type: application/json" \
     -d '{
       "type": "payment",
       "reference_id": "order-id-here",
       "additional_data": {"amount": 50000}
     }'
   ```

2. **Cashier scans QR:**
   ```bash
   curl -X POST http://localhost:3119/api/qr/scan \
     -H "Authorization: Bearer <cashier_token>" \
     -H "Content-Type: application/json" \
     -d '{
       "qr_token": "ABC123DEF456",
       "action": "process",
       "additional_data": {"amount": 50000}
     }'
   ```

---

## Notes

- QR codes for payment expire in **1 hour**
- Payment QR codes are **one-time use only**
- QR code contains encrypted token, not sensitive payment data
- Amount can be specified in QR generation or during scan
- Supports multiple payment scenarios (order, reservation, etc.)

