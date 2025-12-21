# City API Documentation

## Overview

The City API provides endpoints to retrieve city information, search cities, and get cities by governorate. These endpoints help users discover available cities for services and businesses.

---

## Base URL

- **Local:** `http://localhost:3119/api/cities`
- **Production:** `https://csy-backend-production.up.railway.app/api/cities`

---

## Endpoints

### 1. **Get All Cities**

Retrieve a list of all available cities from businesses and predefined major cities.

**Endpoint:** `GET /api/cities`

**Authentication:** Not required (Public endpoint)

**Query Parameters:**
- `governorate` (optional) - Filter by governorate name
- `search` (optional) - Search cities by name

**Example Request:**
```bash
GET /api/cities?governorate=Damietta&search=dam
```

**Response:**
```json
{
  "success": true,
  "message": "Cities retrieved successfully",
  "data": {
    "cities": [
      {
        "name": "Damietta",
        "key": "damietta",
        "governorate": "Damietta",
        "latitude": 31.4165,
        "longitude": 31.8133,
        "source": "predefined"
      },
      {
        "name": "Cairo",
        "key": "cairo",
        "governorate": null,
        "latitude": 30.0444,
        "longitude": 31.2357,
        "source": "predefined"
      }
    ],
    "total": 20
  }
}
```

---

### 2. **Search Cities**

Search for cities by name with fuzzy matching.

**Endpoint:** `GET /api/cities/search`

**Authentication:** Not required (Public endpoint)

**Query Parameters:**
- `q` (required) - Search query (minimum 2 characters)
- `governorate` (optional) - Filter by governorate
- `limit` (optional) - Maximum number of results (default: 20)

**Example Request:**
```bash
GET /api/cities/search?q=dam&limit=10
```

**Response:**
```json
{
  "success": true,
  "message": "Cities found successfully",
  "data": {
    "query": "dam",
    "cities": [
      {
        "name": "Damietta",
        "governorate": "Damietta",
        "latitude": 31.4165,
        "longitude": 31.8133,
        "match_score": 1
      },
      {
        "name": "Damascus",
        "governorate": "Damascus",
        "latitude": null,
        "longitude": null,
        "match_score": 0.5
      }
    ],
    "total": 2
  }
}
```

---

### 3. **Get Cities by Governorate**

Retrieve all cities in a specific governorate.

**Endpoint:** `GET /api/cities/governorate/:governorate_code`

**Authentication:** Not required (Public endpoint)

**Path Parameters:**
- `governorate_code` (required) - Governorate code (e.g., DM, HS, HM, etc.)

**Available Governorate Codes:**
- `DM` - Damietta
- `HS` - Al-Hasakah
- `HM` - Homs
- `HI` - Hama
- `LA` - Latakia
- `QA` - Qamishli
- `RA` - Raqqa
- `SU` - Suwayda
- `TA` - Tartus
- `AL` - Aleppo
- `DA` - Damascus
- `DR` - Daraa
- `DE` - Deir ez-Zor
- `ID` - Idlib
- `RI` - Rif Dimashq

**Example Request:**
```bash
GET /api/cities/governorate/DM
```

**Response:**
```json
{
  "success": true,
  "message": "Cities in Damietta retrieved successfully",
  "data": {
    "governorate": "Damietta",
    "governorate_code": "DM",
    "cities": [
      {
        "name": "Damietta",
        "governorate": "Damietta",
        "governorate_code": "DM",
        "latitude": 31.4165,
        "longitude": 31.8133
      },
      {
        "name": "Ras El Bar",
        "governorate": "Damietta",
        "governorate_code": "DM",
        "latitude": null,
        "longitude": null
      }
    ],
    "total": 2
  }
}
```

---

### 4. **Get City Details**

Get detailed information about a specific city including businesses.

**Endpoint:** `GET /api/cities/:cityName`

**Authentication:** Not required (Public endpoint)

**Path Parameters:**
- `cityName` (required) - City name

**Example Request:**
```bash
GET /api/cities/Damietta
```

**Response:**
```json
{
  "success": true,
  "message": "City details retrieved successfully",
  "data": {
    "name": "Damietta",
    "coordinates": {
      "latitude": 31.4165,
      "longitude": 31.8133
    },
    "governorates": ["Damietta"],
    "businesses_count": 15,
    "businesses": [
      {
        "id": "business-id",
        "business_name": "Restaurant Name",
        "business_type": "restaurant",
        "city": "Damietta",
        "governorate": "Damietta",
        "latitude": 31.4165,
        "longitude": 31.8133,
        "rating_average": 4.5,
        "rating_count": 120
      }
    ]
  }
}
```

---

### 5. **Get All Governorates with Cities**

Retrieve all governorates with their associated cities.

**Endpoint:** `GET /api/cities/governorates`

**Authentication:** Not required (Public endpoint)

**Example Request:**
```bash
GET /api/cities/governorates
```

**Response:**
```json
{
  "success": true,
  "message": "Governorates with cities retrieved successfully",
  "data": {
    "governorates": [
      {
        "name": "Damietta",
        "code": "DM",
        "cities": ["Damietta", "Ras El Bar"],
        "cities_count": 2
      },
      {
        "name": "Damascus",
        "code": "DA",
        "cities": ["Damascus", "Mezzeh"],
        "cities_count": 2
      }
    ],
    "total": 14
  }
}
```

---

## Usage Examples

### Get All Cities
```javascript
const response = await fetch('https://csy-backend-production.up.railway.app/api/cities');
const data = await response.json();
console.log(data.data.cities);
```

### Search Cities
```javascript
const response = await fetch('https://csy-backend-production.up.railway.app/api/cities/search?q=dam');
const data = await response.json();
console.log(data.data.cities);
```

### Get Cities by Governorate
```javascript
const response = await fetch('https://csy-backend-production.up.railway.app/api/cities/governorate/DM');
const data = await response.json();
console.log(data.data.cities);
```

### Get City Details
```javascript
const response = await fetch('https://csy-backend-production.up.railway.app/api/cities/Damietta');
const data = await response.json();
console.log(data.data);
```

---

## Error Responses

### Invalid Governorate Code (400)
```json
{
  "success": false,
  "message": "Invalid governorate code",
  "error": "Governorate code must be one of: DM, HS, HM, ..."
}
```

### City Not Found (200 with empty data)
```json
{
  "success": true,
  "message": "City details retrieved successfully",
  "data": {
    "name": "UnknownCity",
    "coordinates": null,
    "governorates": [],
    "businesses_count": 0,
    "businesses": []
  }
}
```

### Invalid Search Query (400)
```json
{
  "success": false,
  "message": "Search query must be at least 2 characters",
  "error": "INVALID_SEARCH_QUERY"
}
```

---

## Data Sources

Cities are retrieved from two sources:

1. **Predefined Major Cities** - From maps service (includes coordinates)
2. **Business Cities** - Extracted from active businesses in database

Cities are automatically deduplicated and merged.

---

## Notes

- All endpoints are **public** (no authentication required)
- Cities are sorted alphabetically
- Coordinates are available for major cities from maps service
- Business cities may not have coordinates if not in predefined list
- Search is case-insensitive
- Results are limited to active businesses only

