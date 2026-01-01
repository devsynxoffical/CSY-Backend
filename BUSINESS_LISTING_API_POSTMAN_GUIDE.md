# 📋 Business Listing API - Postman Collection Guide

## 🚀 Quick Start

### 1. Import Collection
1. Open Postman
2. Click **Import** button
3. Select `Business_Listing_API_Postman_Collection.json`
4. Collection will be imported with all endpoints

### 2. Set Environment Variable
The collection uses `{{base_url}}` variable. Set it to:
- **Production**: `https://csy-backend-production.up.railway.app`
- **Local**: `http://localhost:3000`

**To set:**
1. Click on collection name
2. Go to **Variables** tab
3. Set `base_url` value
4. Click **Save**

---

## 📁 Collection Structure

### 1. Get All Businesses
Basic business listing endpoints:
- **Get All Businesses (Basic)** - Simple pagination
- **Get Businesses by City** - Filter by city
- **Search Businesses** - Search by name/description

### 2. Category Filtering
Filter by category:
- **Get Restaurants** - `category=restaurants`
- **Get Cafés** - `category=cafes` or `category=cafés`
- **Get Bars** - `category=bars`
- **Get Games/Sports** - `category=games/sports`

### 3. Type Filtering
Filter by business type:
- **Get Restaurant Type** - `type=restaurant`
- **Get Fast Food** - `type=fast_food`
- **Get Cafe Type** - `type=cafe`
- **Get Juice Shops** - `type=juice` or `type=juice_shop`

### 4. Sorting
Sort businesses:
- **Sort by Highest Rated** - `sort=highest_rated`
- **Sort by Nearest** - `sort=nearest` (requires latitude & longitude)
- **Restaurants - Highest Rated in City** - Combined example
- **Cafes - Nearest to Location** - Combined example

### 5. Combined Filters
Advanced filtering examples:
- **Fast Food in City - Highest Rated**
- **Search + Category + Sort**
- **Category + City + Nearest**

### 6. Special Offers
Get public special offers:
- **Get All Active Offers** - All active offers
- **Get Offers by City** - Filter by city
- **Get Restaurant Offers** - Filter by business type
- **Get Cafe Offers** - Cafe offers only
- **Get Offers - City + Type** - Combined filters

---

## 🔧 Query Parameters Reference

### Business Listing (`GET /api/business`)

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `category` | string | Filter by category | `restaurants`, `cafes`, `bars`, `games/sports` |
| `type` | string | Filter by business type | `restaurant`, `fast_food`, `cafe`, `juice` |
| `city` | string | Filter by city | `Alexandria`, `Cairo` |
| `app_type` | string | Filter by app type | `pass`, `care`, `go` |
| `search` | string | Search by name/description | `pizza`, `coffee` |
| `sort` | string | Sort order | `nearest`, `highest_rated`, `rating`, `created_at` |
| `latitude` | number | User latitude (for nearest) | `31.2001` |
| `longitude` | number | User longitude (for nearest) | `29.9187` |
| `page` | number | Page number | `1` |
| `limit` | number | Items per page | `20` |

### Special Offers (`GET /api/business/offers/public`)

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `city` | string | Filter by city | `Alexandria` |
| `business_type` | string | Filter by business type | `restaurant`, `cafe` |
| `limit` | number | Max offers to return | `10` |

---

## 📍 Location Coordinates

### Common Cities (Egypt)

| City | Latitude | Longitude |
|------|----------|-----------|
| **Cairo** | 30.0444 | 31.2357 |
| **Alexandria** | 31.2001 | 29.9187 |
| **Giza** | 30.0131 | 31.2089 |

Use these coordinates for testing "nearest" sorting.

---

## 🧪 Testing Examples

### Example 1: Get Restaurants in Alexandria
```
GET /api/business?category=restaurants&city=Alexandria&page=1&limit=20
```

### Example 2: Get Nearest Cafes to Cairo
```
GET /api/business?category=cafes&sort=nearest&latitude=30.0444&longitude=31.2357&page=1&limit=20
```

### Example 3: Search Pizza Restaurants, Highest Rated
```
GET /api/business?search=pizza&category=restaurants&sort=highest_rated&page=1&limit=20
```

### Example 4: Get Fast Food in Cairo, Nearest
```
GET /api/business?type=fast_food&city=Cairo&sort=nearest&latitude=30.0444&longitude=31.2357&page=1&limit=20
```

### Example 5: Get All Active Offers
```
GET /api/business/offers/public?limit=10
```

### Example 6: Get Restaurant Offers in Alexandria
```
GET /api/business/offers/public?city=Alexandria&business_type=restaurant&limit=10
```

---

## 📊 Response Format

### Business Listing Response
```json
{
  "success": true,
  "message": "Businesses retrieved successfully",
  "data": {
    "businesses": [
      {
        "id": "business-id",
        "business_name": "Business Name",
        "business_type": "restaurant",
        "app_type": "pass",
        "address": "123 Main St",
        "city": "Alexandria",
        "governorate": "Alexandria",
        "latitude": 31.2001,
        "longitude": 29.9187,
        "rating_average": 4.5,
        "rating_count": 120,
        "photos": ["https://..."],
        "has_reservations": true,
        "has_delivery": true,
        "distance": 2.5  // Only when sort=nearest
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

### Special Offers Response
```json
{
  "success": true,
  "message": "Special offers retrieved successfully",
  "data": [
    {
      "id": "offer-id",
      "title": "20% Off All Beverages",
      "description": "Special discount on all beverages",
      "image_url": "https://...",
      "discount_percentage": 20,
      "start_date": "2025-12-01T00:00:00Z",
      "end_date": "2025-12-31T23:59:59Z",
      "business": {
        "id": "business-id",
        "name": "Business Name",
        "type": "restaurant",
        "city": "Alexandria",
        "photo": "https://..."
      }
    }
  ]
}
```

---

## ✅ Testing Checklist

- [ ] Import collection into Postman
- [ ] Set `base_url` variable
- [ ] Test basic business listing
- [ ] Test category filtering (restaurants, cafes, bars)
- [ ] Test type filtering (restaurant, fast_food, cafe, juice)
- [ ] Test sorting by highest rated
- [ ] Test sorting by nearest (with coordinates)
- [ ] Test combined filters
- [ ] Test special offers API
- [ ] Test offers with city filter
- [ ] Test offers with business_type filter

---

## 🐛 Troubleshooting

### Issue: "No businesses found"
**Solution**: Check if businesses are seeded in database. Ensure `is_active: true`.

### Issue: "Distance not showing"
**Solution**: Make sure you're using `sort=nearest` AND providing `latitude` and `longitude` parameters.

### Issue: "Invalid category"
**Solution**: Use valid categories: `restaurants`, `cafes`, `bars`, `games/sports`.

### Issue: "Invalid sort"
**Solution**: Use valid sort options: `nearest`, `highest_rated`, `rating`, `created_at`.

---

## 📝 Notes

1. **Distance Field**: Only appears when `sort=nearest` is used with valid coordinates
2. **Pagination**: Default page=1, limit=20. Adjust as needed
3. **Active Offers**: Only shows offers that are currently valid (between start_date and end_date)
4. **Coordinates**: Use decimal format (e.g., 31.2001, not 31°12'00")
5. **Case Sensitivity**: Category and type filters are case-insensitive

---

**Collection File**: `Business_Listing_API_Postman_Collection.json`  
**Last Updated**: Current  
**Base URL**: Set in collection variables

