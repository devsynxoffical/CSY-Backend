# Postman Collection Setup Guide

## Quick Start

1. **Import Collection**
   - Open Postman
   - Click "Import" button
   - Select `Business_Module_Postman_Collection.json`
   - Collection will be imported with all endpoints

2. **Import Environment**
   - Click "Import" button
   - Select `Postman_Environment_Template.json`
   - Or create a new environment manually with the variables below

3. **Set Environment Variables**
   - Click on "Environments" in the left sidebar
   - Select your environment
   - Set the following variables:
     - `base_url`: `http://localhost:3000/api/business` (or your production URL)
     - Other variables will be auto-populated when you use the collection

4. **Select Environment**
   - Click the environment dropdown (top right)
   - Select your imported environment

## Environment Variables

The collection uses these environment variables:

| Variable | Description | Auto-populated |
|----------|-------------|----------------|
| `base_url` | Base URL for API | No - Set manually |
| `business_token` | JWT token from login/register | Yes - Auto-saved |
| `business_id` | Business ID | Yes - Auto-saved |
| `product_id` | Product ID | Yes - Auto-saved |
| `cashier_id` | Cashier ID | Yes - Auto-saved |
| `appointment_id` | Appointment ID | Yes - Auto-saved |
| `order_id` | Order ID | No - Set manually |
| `category_id` | Category ID | No - Set manually |
| `offer_id` | Offer ID | No - Set manually |

## Testing Flow

### Step 1: Authentication
1. Run **"Register Business"** or **"Login Business"**
2. Token will be automatically saved to `business_token`
3. Business ID will be automatically saved to `business_id`

### Step 2: Profile Setup
1. **Get Business Profile** - Verify your business data
2. **Update Business Profile** - Update business information
3. **Update Working Hours** - Set working hours
4. **Upload Photos** - Add business photos

### Step 3: Products
1. **Add Product** - Create a product (ID auto-saved)
2. **Get Products** - View all products
3. **Update Product** - Update using saved product ID
4. **Delete Product** - Delete using saved product ID

### Step 4: Cashiers
1. **Create Cashier** - Add cashier (ID auto-saved)
2. **Get Cashiers** - View all cashiers
3. **Update Cashier** - Update using saved cashier ID
4. **Delete Cashier** - Delete using saved cashier ID

### Step 5: Appointments
1. **Add Appointment** - Create appointment (ID auto-saved)
2. **Get Appointments** - View all appointments
3. **Update Appointment** - Update using saved appointment ID
4. **Delete Appointment** - Delete using saved appointment ID

### Step 6: Orders & Reservations
1. **Get Orders** - View all orders
2. **Accept Order** - Accept an order (set `order_id` manually)
3. **Reject Order** - Reject an order (set `order_id` manually)
4. **Get Reservations** - View all reservations

### Step 7: Analytics
1. **Get Financial Records** - View financial data
2. **Get Offers** - View all offers
3. **Get Analytics** - View analytics reports
4. **Get Dashboard** - View dashboard data
5. **Get Operations Log** - View operations history

## Features

### Auto-Authentication
- The collection automatically adds `Authorization: Bearer <token>` header to authenticated endpoints
- Token is saved automatically after login/register
- No need to manually add headers for most requests

### Auto-Save IDs
- Product ID is saved after creating a product
- Cashier ID is saved after creating a cashier
- Appointment ID is saved after creating an appointment
- Business ID is saved after login/register

### Pre-request Scripts
- Automatically adds Authorization header for authenticated endpoints
- Skips public endpoints (register, login, public business endpoints)

### Test Scripts
- Checks response time (should be < 5000ms)
- Logs error responses for debugging
- Auto-saves tokens and IDs from responses

## Common Issues

### Issue: "Unauthorized" Error
**Solution**: 
- Make sure you've run "Register Business" or "Login Business" first
- Check that `business_token` is set in environment variables
- Verify the token hasn't expired

### Issue: "Not Found" Error
**Solution**:
- Check that the ID variables are set correctly
- Make sure the resource exists (product, cashier, etc.)
- Verify the endpoint URL is correct

### Issue: "Validation Error"
**Solution**:
- Check request body format
- Verify all required fields are included
- Check field types (strings, numbers, etc.)
- Review the testing guide for correct field values

### Issue: Environment Variables Not Saving
**Solution**:
- Make sure you've selected the correct environment
- Check that test scripts are enabled
- Verify the response structure matches expected format

## Production Setup

For production testing:

1. Create a new environment: "CSY Business Module - Production"
2. Set `base_url` to your production URL:
   ```
   https://your-production-url.com/api/business
   ```
3. Use production credentials for login/register

## Tips

1. **Start with Authentication**: Always run Register/Login first
2. **Check Variables**: View environment variables to see auto-saved IDs
3. **Use Folders**: Collection is organized into logical folders
4. **Test Public Endpoints**: Some endpoints don't require authentication
5. **Check Console**: Postman console shows auto-saved values
6. **Use Query Parameters**: Enable/disable query parameters as needed

## Collection Structure

```
Business Module Collection
├── Authentication
│   ├── Register Business
│   └── Login Business
├── Profile Management
│   ├── Get Business Profile
│   ├── Update Business Profile
│   ├── Update Working Hours
│   ├── Upload Photos
│   └── Delete Photo
├── Products Management
│   ├── Add Product
│   ├── Get Products
│   ├── Update Product
│   └── Delete Product
├── Cashier Management
│   ├── Create Cashier
│   ├── Get Cashiers
│   ├── Update Cashier
│   └── Delete Cashier
├── Appointments
│   ├── Add Appointment
│   ├── Get Appointments
│   ├── Update Appointment
│   └── Delete Appointment
├── Orders Management
│   ├── Get Orders
│   ├── Accept Order
│   └── Reject Order
├── Reservations
│   └── Get Reservations
├── Analytics & Reports
│   ├── Get Financial Records
│   ├── Get Offers
│   ├── Get Analytics
│   ├── Get Dashboard
│   └── Get Operations Log
├── Categories
│   ├── Create Category
│   ├── Get Categories
│   ├── Update Category
│   └── Delete Category
├── Offers Management
│   ├── Create Offer
│   ├── Update Offer
│   └── Delete Offer
└── Public Endpoints
    ├── Get All Businesses
    ├── Get Public Business Profile
    └── Get Public Business Products
```

## Support

If you encounter issues:
1. Check the `BUSINESS_MODULE_TESTING_GUIDE.md` for detailed endpoint documentation
2. Verify your server is running
3. Check network connectivity
4. Review Postman console for error messages
5. Verify environment variables are set correctly

