# 📱 App Type & Business Type Mapping Guide

This document explains which business types belong to which app types in the CSY platform.

---

## 🎯 App Types Overview

The platform has **5 app types**:

1. **PASS** - Food & Dining App
2. **CARE** - Healthcare & Beauty App
3. **GO** - Delivery Service App
4. **PASS_GO** - Combined Pass + Go (Food with Delivery)
5. **CARE_GO** - Combined Care + Go (Healthcare with Delivery)

---

## 📋 Business Types

Available business types:
- `restaurant`
- `cafe`
- `pharmacy`
- `clinic`
- `beauty_center`
- `juice_shop`
- `dessert_shop`
- `fast_food`
- `supermarket`
- `recreational`
- `other`

---

## 🗺️ Mapping: App Type → Business Types

### 1. **PASS APP** (Food & Dining)

**Business Types:**
- ✅ `restaurant` - Restaurants
- ✅ `cafe` - Cafes
- ✅ `juice_shop` - Juice shops
- ✅ `dessert_shop` - Dessert shops
- ✅ `fast_food` - Fast food restaurants
- ✅ `supermarket` - Supermarkets

**Purpose:** Food ordering, dining reservations, food delivery

**Example Businesses:**
- Italian Restaurant
- Coffee Shop
- Ice Cream Parlor
- Burger Joint
- Grocery Store

---

### 2. **CARE APP** (Healthcare & Beauty)

**Business Types:**
- ✅ `pharmacy` - Pharmacies
- ✅ `clinic` - Medical clinics
- ✅ `beauty_center` - Beauty salons & spas

**Purpose:** Healthcare services, beauty appointments, medical reservations

**Example Businesses:**
- Pharmacy
- Dental Clinic
- Dermatology Clinic
- Hair Salon
- Spa & Wellness Center

---

### 3. **GO APP** (Delivery Service)

**Business Types:**
- ✅ `restaurant` - Restaurant delivery
- ✅ `cafe` - Cafe delivery
- ✅ `pharmacy` - Pharmacy delivery
- ✅ `clinic` - Clinic services (appointments)
- ✅ `beauty_center` - Beauty services (appointments)
- ✅ `juice_shop` - Juice delivery
- ✅ `dessert_shop` - Dessert delivery
- ✅ `fast_food` - Fast food delivery
- ✅ `supermarket` - Supermarket delivery

**Purpose:** Delivery service for both food and healthcare/beauty products

**Note:** GO app includes businesses from both PASS and CARE apps

---

### 4. **PASS_GO APP** (Food + Delivery)

**Business Types:**
- ✅ `restaurant` - Restaurants with delivery
- ✅ `cafe` - Cafes with delivery
- ✅ `juice_shop` - Juice shops with delivery
- ✅ `dessert_shop` - Dessert shops with delivery
- ✅ `fast_food` - Fast food with delivery
- ✅ `supermarket` - Supermarkets with delivery

**Purpose:** Food businesses that offer both dine-in and delivery

**Example:** Restaurant that accepts reservations AND delivers food

---

### 5. **CARE_GO APP** (Healthcare + Delivery)

**Business Types:**
- ✅ `pharmacy` - Pharmacies with delivery
- ✅ `clinic` - Clinics with delivery/telemedicine
- ✅ `beauty_center` - Beauty centers with delivery

**Purpose:** Healthcare/beauty businesses that offer both appointments and delivery

**Example:** Pharmacy that accepts appointments AND delivers medications

---

## 🔄 Reverse Mapping: Business Type → App Types

### Food & Dining Businesses

| Business Type | Available App Types |
|---------------|-------------------|
| `restaurant` | pass, go, pass_go |
| `cafe` | pass, go, pass_go |
| `juice_shop` | pass, go, pass_go |
| `dessert_shop` | pass, go, pass_go |
| `fast_food` | pass, go, pass_go |
| `supermarket` | pass, go, pass_go |

### Healthcare & Beauty Businesses

| Business Type | Available App Types |
|---------------|-------------------|
| `pharmacy` | care, go, care_go |
| `clinic` | care, go, care_go |
| `beauty_center` | care, go, care_go |

### Other Businesses

| Business Type | Available App Types |
|---------------|-------------------|
| `recreational` | pass, go, pass_go |
| `other` | pass, care, go, pass_go, care_go |

---

## 💡 Usage Examples

### Example 1: Restaurant Business

```javascript
{
  business_name: "Pizza Palace",
  business_type: "restaurant",
  app_type: "pass_go",  // Can be: pass, go, or pass_go
  has_reservations: true,
  has_delivery: true
}
```

**Valid app_type values:**
- `pass` - Only reservations/dine-in
- `go` - Only delivery
- `pass_go` - Both reservations and delivery

---

### Example 2: Pharmacy Business

```javascript
{
  business_name: "Health Pharmacy",
  business_type: "pharmacy",
  app_type: "care_go",  // Can be: care, go, or care_go
  has_reservations: true,  // For appointments
  has_delivery: true
}
```

**Valid app_type values:**
- `care` - Only appointments
- `go` - Only delivery
- `care_go` - Both appointments and delivery

---

### Example 3: Fast Food Business

```javascript
{
  business_name: "Burger Express",
  business_type: "fast_food",
  app_type: "go",  // Only delivery, no reservations
  has_reservations: false,
  has_delivery: true
}
```

**Valid app_type values:**
- `pass` - If they have dine-in
- `go` - If they only deliver
- `pass_go` - If they have both

---

## 🎯 Quick Reference

### PASS App Businesses
- Restaurants, Cafes, Juice Shops, Dessert Shops, Fast Food, Supermarkets

### CARE App Businesses
- Pharmacies, Clinics, Beauty Centers

### GO App Businesses
- **All businesses from PASS and CARE** (delivery-focused)

### PASS_GO App Businesses
- **All PASS businesses** that offer both dine-in and delivery

### CARE_GO App Businesses
- **All CARE businesses** that offer both appointments and delivery

---

## 📝 Notes

1. **GO app** is a delivery service that can include businesses from both PASS and CARE apps
2. **PASS_GO** and **CARE_GO** are combined apps for businesses that offer both services
3. **Recreational** businesses typically go in PASS app
4. **Other** type can be assigned to any app type based on business needs
5. A business can only have **one app_type** at a time, but can offer multiple services (reservations + delivery)

---

## 🔍 Validation

When creating/updating a business, validate that:
- `business_type` is compatible with `app_type`
- If `app_type` is `pass`, `business_type` should be from PASS businesses
- If `app_type` is `care`, `business_type` should be from CARE businesses
- If `app_type` is `go`, `business_type` can be from either PASS or CARE
- If `app_type` is `pass_go`, `business_type` should be from PASS businesses
- If `app_type` is `care_go`, `business_type` should be from CARE businesses

---

**Last Updated:** December 2025

