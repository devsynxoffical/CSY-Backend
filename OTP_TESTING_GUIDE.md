# OTP API Testing Guide

## Endpoints

### 1. Send OTP
**Endpoint:** `POST /api/auth/send-otp`

### 2. Verify OTP
**Endpoint:** `POST /api/auth/verify-otp`

---

## Testing Methods

### Method 1: Using cURL

#### Send OTP
```bash
curl -X POST http://localhost:3119/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+201012345678"
  }'
```

#### Verify OTP (Using Fixed Code)
```bash
curl -X POST http://localhost:3119/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+201012345678",
    "otp": "123456"
  }'
```

### Method 2: Using Postman

#### Send OTP Request
1. **Method:** POST
2. **URL:** `http://localhost:3119/api/auth/send-otp`
3. **Headers:**
   - `Content-Type: application/json`
4. **Body (raw JSON):**
```json
{
  "phone": "+201012345678"
}
```

#### Verify OTP Request
1. **Method:** POST
2. **URL:** `http://localhost:3119/api/auth/verify-otp`
3. **Headers:**
   - `Content-Type: application/json`
4. **Body (raw JSON):**
```json
{
  "phone": "+201012345678",
  "otp": "123456"
}
```

### Method 3: Using JavaScript (Fetch API)

```javascript
// Send OTP
async function sendOTP(phone) {
  const response = await fetch('http://localhost:3119/api/auth/send-otp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phone })
  });
  
  const data = await response.json();
  console.log('Send OTP Response:', data);
  return data;
}

// Verify OTP
async function verifyOTP(phone, otp) {
  const response = await fetch('http://localhost:3119/api/auth/verify-otp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phone, otp })
  });
  
  const data = await response.json();
  console.log('Verify OTP Response:', data);
  return data;
}

// Usage
sendOTP('+201012345678').then(() => {
  // Wait a moment, then verify with fixed code
  setTimeout(() => {
    verifyOTP('+201012345678', '123456');
  }, 1000);
});
```

---

## Expected Responses

### Send OTP - Success Response (200)
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "phone": "+201012345678",
    "sentAt": "2024-01-15T10:30:00.000Z",
    "expiresIn": 600
  }
}
```

### Send OTP - Error Response (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "phone",
      "message": "Please provide a valid phone number",
      "value": "invalid-phone"
    }
  ]
}
```

### Verify OTP - Success Response (200)
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "userId": "user-id-here",
    "phone": "+201012345678",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "verifiedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Verify OTP - Error Responses

#### Invalid OTP Format (400)
```json
{
  "success": false,
  "message": "Invalid OTP format",
  "error": "OTP must be 6 digits"
}
```

#### User Not Found (404)
```json
{
  "success": false,
  "message": "User not found",
  "error": "User not found"
}
```

#### Invalid OTP Code (400)
```json
{
  "success": false,
  "message": "Invalid OTP",
  "error": "The OTP code you entered is incorrect. Please try again or use the fixed code 123456 for testing."
}
```

---

## Test Scenarios

### Scenario 1: Complete OTP Flow (Using Fixed Code)
1. **Send OTP** to a registered phone number
2. **Verify OTP** using the fixed code `123456`
3. **Expected:** Success response with JWT token

### Scenario 2: Invalid Phone Number
1. **Send OTP** with invalid phone format (e.g., "123")
2. **Expected:** Validation error (400)

### Scenario 3: Verify OTP for Non-existent User
1. **Verify OTP** with phone number that doesn't exist in database
2. **Expected:** User not found error (404)

### Scenario 4: Invalid OTP Format
1. **Verify OTP** with non-6-digit code (e.g., "12345" or "1234567")
2. **Expected:** Invalid OTP format error (400)

### Scenario 5: Wrong OTP Code
1. **Send OTP** to a phone number
2. **Verify OTP** with wrong code (e.g., "000000")
3. **Expected:** Invalid OTP error (400) - Note: Currently accepts any 6-digit OTP in demo mode

---

## Important Notes

1. **Fixed OTP Code:** The code `123456` will always be accepted for testing purposes
2. **Phone Number Format:** Must match pattern `^\+?[0-9]{10,15}$` (e.g., `+201012345678`)
3. **OTP Format:** Must be exactly 6 digits
4. **User Must Exist:** The phone number must belong to a registered user in the database
5. **JWT Token:** Upon successful verification, you'll receive a JWT token that can be used for authenticated requests

---

## Production URL

If testing against production:
- **Base URL:** `https://csy-backend-production.up.railway.app`
- **Send OTP:** `POST https://csy-backend-production.up.railway.app/api/auth/send-otp`
- **Verify OTP:** `POST https://csy-backend-production.up.railway.app/api/auth/verify-otp`

**⚠️ Important:** After pushing code to GitHub, Railway should auto-deploy. If you get 404 errors:
1. Check Railway dashboard → Deployments tab
2. Wait for the latest deployment to complete
3. Or manually trigger a redeploy from Railway dashboard
4. The deployment usually takes 2-5 minutes

---

## Quick Test Commands

### Windows PowerShell
```powershell
# Send OTP
Invoke-RestMethod -Uri "http://localhost:3119/api/auth/send-otp" -Method POST -ContentType "application/json" -Body '{"phone":"+201012345678"}'

# Verify OTP
Invoke-RestMethod -Uri "http://localhost:3119/api/auth/verify-otp" -Method POST -ContentType "application/json" -Body '{"phone":"+201012345678","otp":"123456"}'
```

### Linux/Mac Terminal
```bash
# Send OTP
curl -X POST http://localhost:3119/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+201012345678"}'

# Verify OTP
curl -X POST http://localhost:3119/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+201012345678","otp":"123456"}'
```

