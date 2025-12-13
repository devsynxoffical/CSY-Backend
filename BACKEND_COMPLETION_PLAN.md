# Backend Completion Plan

This document outlines the step-by-step plan to bring the CSY-Backend from its current state (approx. 75% complete) to 100% completion, ensuring full alignment with the CoreSY Platform requirements.

## 1. Financial Logic Corrections (Critical)
**Objective:** Align fee structures with business requirements.

- [ ] **Update Platform Fee Logic**
    - Target: `controllers/order.controller.js` and `utils/calculateFees.js`
    - Change: Update platform fee calculation from hardcoded `5%` to **`2%`** per transaction.
    - Scope: Orders (Delivery/Pickup) and Reservations (if paid online).

- [ ] **Implement Partner Discount System**
    - Target: `controllers/order.controller.js`, `controllers/reservation.controller.js`
    - Logic:
        - Apply automatic **10% discount** on all standard orders/bookings.
        - Exception: **CoreSY Go** users get **Free Delivery** instead of 10% discount (if within 3km).
        - Ensure discount is deducted from the *establishment's* share, not the platform fee.

## 2. Dynamic Delivery System
**Objective:** Replace fixed delivery fee with distance-based logic.

- [ ] **Implement Distance Calculation**
    - Target: `services/maps.service.js`
    - Action: Integrate Google Maps Distance Matrix API (or Haversine formula as fallback) to calculate distance between Establishment and User Address.

- [ ] **Update Delivery Fee Logic**
    - Target: `utils/calculateFees.js`
    - Rules:
        - **0 - 3 km:** Free (for CoreSY Go subscribers) or Standard Base Fee.
        - **> 3 km:** Add **1,500 SYP** per extra km.
    - Multi-establishment orders: Add **5,000 SYP** per additional establishment.

## 3. Advanced Order Features
**Objective:** Support multi-establishment orders and smart routing.

- [ ] **Multi-Establishment Cart Support**
    - Target: `models/Order.js` (Prisma schema), `controllers/order.controller.js`
    - Action: Ensure `Order` model supports items from multiple `business_id`s in a single transaction (or split into sub-orders linked by a parent ID).
    - Update `createOrder` to handle "Cart Validation" for products from different partners.

## 4. Smart Assistant (AI) Implementation
**Objective:** Fulfill the "AI-Powered Smart Assistant" requirement.

- [ ] **Create AI Service**
    - Target: `services/ai.service.js`
    - Features:
        - **Recommendations:** Simple rule-based engine suggesting businesses based on User's `governorate` and previous `Order` history.
        - **Health Suggestions:** Tag products/businesses with health keywords and match against user profile notes (if added).
    - Endpoints: `GET /api/user/assistant/recommendations`

## 5. Automatic Payouts & Subscriptions
**Objective:** Automate financial flows and subscription checks.

- [ ] **Subscription Enforcement**
    - Target: `middlewares/subscription.middleware.js`
    - Logic: Verify active subscription (`CoreSY Pass`, `Care`, `Go`) before allowing Booking/Order.
    - Expiry: Automated job (Cron) to expire subscriptions and notify users.

- [ ] **Financial Reports & Payouts**
    - Target: `controllers/admin.controller.js`
    - Action: Implement the "Semi-Automated Payouts" logic to calculate Net Payable to businesses (Revenue - 2% Fee - Discounts).

## 6. Final Verification & Deployment
**Objective:** Prepare for Milestone 4 (Release).

- [ ] **Unit Testing:** Write Jest tests for the new Fee and Discount logic.
- [ ] **Deployment Config:** Verify `Dockerfile` and `render.yaml` / `railway.json` for production.
- [ ] **Documentation:** Update API Swagger/Postman docs with new endpoints.

---

## Execution Phase 1: Logic Fixes (Immediate)
I will begin by correcting the **Platform Fees** and implementing the **Partner Discount** logic, as these change the core financial data structure.
