# User Order Creation Flow - How to Get Product IDs

## Question: Where do users get Product IDs from?

**Answer:** Users get Product IDs by browsing businesses and viewing their products/menu. They don't add products - they select from existing products that businesses have added.

---

## Complete Flow for Creating an Order

### Step 1: Get Business ID
**Endpoint:** `GET /api/business`

**Purpose:** User browses available businesses

**Example Request:**
```http
GET /api/business?city=Alexandria&app_type=pass&page=1&limit=20
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "businesses": [
      {
        "id": "business-uuid-123",  // ← This is the BUSINESS_ID
        "business_name": "Alexandria Seafood Restaurant",
        "business_type": "restaurant",
        "address": "Corniche Road, Alexandria",
        "photos": ["https://..."],
        "rating_average": 4.5
      }
    ]
  }
}
```

**Result:** User gets `business_id` from the business they want to order from.

---

### Step 2: Get Product IDs from that Business
**Endpoint:** `GET /api/business/:id/products`

**Purpose:** User views the menu/products of the selected business

**Example Request:**
```http
GET /api/business/business-uuid-123/products?category=Main Course
```

**Example Response:**
```json
{
  "success": true,
  "message": "products retrieved successfully",
  "data": [
    {
      "id": "product-uuid-456",  // ← This is the PRODUCT_ID
      "name": "Grilled Chicken",
      "description": "Tender grilled chicken with herbs",
      "price": 75000,
      "category": "Main Course",
      "image": "https://...",
      "is_available": true,
      "add_ons": [
        {
          "name": "Extra Cheese",
          "price": 5000
        }
      ]
    },
    {
      "id": "product-uuid-789",  // ← Another PRODUCT_ID
      "name": "Beef Burger",
      "price": 60000,
      "is_available": true
    }
  ]
}
```

**Result:** User gets `product_id` values from the products they want to order.

---

### Step 3: Create Order with Product IDs
**Endpoint:** `POST /api/orders`

**Purpose:** User creates an order using the product IDs they selected

**Example Request:**
```http
POST /api/orders
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "items": [
    {
      "product_id": "product-uuid-456",  // ← From Step 2
      "quantity": 2,
      "add_ons": [
        {
          "name": "Extra Cheese",
          "price": 5000
        }
      ]
    },
    {
      "product_id": "product-uuid-789",  // ← From Step 2
      "quantity": 1
    }
  ],
  "order_type": "delivery",
  "payment_method": "cash",
  "delivery_address": {
    "street": "123 Main St",
    "city": "Alexandria",
    "governorate": "Alexandria"
  }
}
```

**What Happens:**
1. Backend receives `product_id` values
2. Backend automatically gets `business_id` from each product (products have `business_id` field)
3. Backend validates products exist and are available
4. Backend calculates prices
5. Order is created

**Note:** You **DON'T need to send `business_id`** in the order request. The backend automatically gets it from the products!

---

## Summary

### For Users (Frontend App):

1. **Browse Businesses** → Get `business_id`
   ```
   GET /api/business
   ```

2. **View Business Menu** → Get `product_id` values
   ```
   GET /api/business/{business_id}/products
   ```

3. **Create Order** → Use `product_id` values
   ```
   POST /api/orders
   {
     "items": [
       { "product_id": "...", "quantity": 2 }
     ]
   }
   ```

### Key Points:

✅ **Users DON'T add products** - Only businesses add products  
✅ **Users DON'T need to send `business_id`** - Backend gets it from products  
✅ **Users only need `product_id`** - Which they get from viewing business menu  
✅ **All endpoints are public** - No authentication needed for browsing businesses/products  

---

## API Endpoints Reference

| Endpoint | Method | Auth Required | Purpose |
|----------|--------|---------------|---------|
| `/api/business` | GET | No | Get list of businesses (get business_id) |
| `/api/business/:id` | GET | No | Get business details |
| `/api/business/:id/products` | GET | No | Get business products/menu (get product_id) |
| `/api/orders` | POST | Yes (User) | Create order with product_ids |

---

## Example Frontend Flow

```javascript
// 1. User searches for businesses
const businesses = await fetch('/api/business?city=Alexandria&app_type=pass');
const businessId = businesses.data.businesses[0].id; // Get business_id

// 2. User views menu of selected business
const products = await fetch(`/api/business/${businessId}/products`);
const productIds = products.data.map(p => p.id); // Get product_ids

// 3. User selects products and creates order
const order = await fetch('/api/orders', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    items: [
      { product_id: productIds[0], quantity: 2 },
      { product_id: productIds[1], quantity: 1 }
    ],
    order_type: 'delivery',
    payment_method: 'cash'
  })
});
```

---

## Database Structure

**Product Model:**
```prisma
model Product {
  id          String   @id @default(uuid())
  business_id String   // ← Product knows which business it belongs to
  name        String
  price       Decimal
  // ...
}
```

**Order Model:**
```prisma
model Order {
  id      String @id @default(uuid())
  user_id String
  // ...
}

model OrderItem {
  id         String @id @default(uuid())
  order_id   String
  business_id String // ← Automatically set from product.business_id
  product_id String  // ← From user's request
  quantity   Int
  // ...
}
```

**Important:** When you send `product_id` in order creation, the backend automatically:
1. Finds the product
2. Gets `business_id` from that product
3. Creates the order with both IDs

---

## Common Questions

**Q: Do I need to send business_id when creating an order?**  
A: **No!** The backend automatically gets `business_id` from the products you send.

**Q: Can I order from multiple businesses in one order?**  
A: **Yes!** You can send multiple `product_id` values from different businesses. The backend handles it.

**Q: How do I know which products belong to which business?**  
A: When you call `GET /api/business/:id/products`, all products returned belong to that business.

**Q: What if a product is not available?**  
A: The backend will return an error: `"Product is not available"` and the order won't be created.

---

**Last Updated:** December 2024

