# CSY-Backend Master Documentation

## 1. Executive Summary
This document provides a comprehensive technical overview of the CSY-Backend system, reflecting the latest architectural updates, financial logic corrections, and feature additions as of **December 2025**.

The system facilitates a multi-sided marketplace connecting **Users** (Customers), **Businesses** (Vendors), and **Drivers** (Logistics), managed via an **Admin Panel**.

---

## 2. Core Architecture

### Tech Stack
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Database:** PostgreSQL (Relation Management via Prisma ORM)
- **Caching:** Redis (Session & Data Caching)
- **Storage:** AWS S3 (Media Assets)
- **External APIs:** Google Maps (Geocoding/Distance), OpenAI/Anthropic (AI Assistant)

### Directory Structure
- `controllers/`: Request handlers (Order, User, Business, etc.)
- `services/`: Encapsulated business logic (Maps, AI, Payment)
- `routes/`: API endpoint definitions
- `prisma/`: Database schema and migration history
- `utils/`: Shared helper functions (Fee calculations, formatting)
- `config/`: System constants and environment variables

---

## 3. Financial System Logic (New)

The financial model has been updated to reflect the new business requirements. Use this section as the definitive reference for how money flows.

### 3.1 Platform Fees
**Rule:** The platform charges a fixed percentage on the *subtotal* of orders.
- **Rate:** **2%** (Fixed constant `PLATFORM_FEE_PERCENTAGE = 0.02`)
- **Calculation:** `Subtotal * 0.02`
- **Source:** `utils/calculateFees.js`

### 3.2 Partner Discounts
**Rule:** Orders automatically apply a partner discount to incentivize usage.
- **Rate:** **10%** (Fixed constant `PARTNER_DISCOUNT_PERCENTAGE = 0.10`)
- **Calculation:** `Subtotal * 0.10`
- **Application:** Deducted from the User's payable amount.

### 3.3 Dynamic Delivery Pricing
**Rule:** Delivery fees are calculated based on the distance between the Business and the Customer.
- **Base Fee:** **15 EGP** (Covers first 3km)
- **Distance Surcharge:** **+15 EGP** per each additional km beyond 3km.
- **CoreSY Go Exception:**
    - If User has active subscription (`go`, `pass_go`, `care_go`) AND Distance ≤ 3km:
    - **Delivery Fee = 0 EGP** (Free Delivery)

### 3.4 Multi-Establishment Orders
**Rule:** Orders containing items from multiple businesses incur a surcharge.
- **Surcharge:** **+50 EGP** per additional business.
- **Example:** Order from 2 businesses => Base Delivery + 50 EGP.

---

## 4. Feature Implementation Details

### 4.1 Order Processing (`order.controller.js`)
- **Flow:**
    1.  Validate Items & Stock.
    2.  Calculate Distance via `MapsService` (Google Maps API).
    3.  Calculate Fees (Delivery, Platform, Discount).
    4.  Check Subscription status for `CoreSY Go` benefits.
    5.  Handle Multi-establishment logic (Fee + Multiple Business Notifications).
    6.  Create Order & Transaction records in PostgreSQL.

### 4.2 Reservation System (`reservation.controller.js`)
- **Flow:**
    1.  Check availability.
    2.  Calculate Total Amount (if applicable).
    3.  **New:** Apply **10% Partner Discount** logic to reservation cost.
    4.  Generate QR Code for check-in.

### 4.3 AI Smart Assistant (`ai.controller.js`)
- **Purpose:** Personalized recommendations and chat assistance.
- **Endpoints:**
    - `GET /api/ai/recommendations`: Fetch user-tailored suggestions.
    - `POST /api/ai/chat`: Natural language interface for queries (e.g., "Find me spicy food").
- **Integration:** Powered by `services/ai-assistant.service.js`.

---

## 5. Database & Schema

### Critical Models (Prisma)
- **User:** Stores profile, wallet, and `subscription` status.
- **Business:** Stores location (`latitude`, `longitude`) for distance checks.
- **Order:** Tracks `platform_fee`, `delivery_fee`, and `discount_amount`.
- **Reservation:** Tracks booking details and newly added financial fields (`total_amount`, `discount_amount`).

### Migration Note
> **Important:** The `Reservation` model was recently updated to include `amount` fields. You must run `npx prisma db push` to sync these changes before deploying.

---

## 6. Setup & Deployment

### Environment Variables (.env)
Ensure the following are configured:
```env
DATABASE_URL="postgresql://user:pass@host:5432/db"
PLATFORM_FEE_PERCENTAGE=2
DISCOUNT_PERCENTAGE=10
GOOGLE_MAPS_API_KEY="your_key"
OPENAI_API_KEY="your_key"
```

### Quick Commands
- **Install:** `npm install`
- **Database Push:** `npx prisma db push` (Sync Schema)
- **Seed Data:** `npx prisma db seed` (Populate Dummy Data)
- **Start Dev:** `npm run dev`

---

## 7. Version History
- **v1.0**: Initial Release
- **v1.1 (Current)**:
    - Updated Platform Fee to 2%.
    - Added Dynamic Delivery (Maps integration).
    - Added AI Assistant backbone.
    - Added Multi-Establishment support.
