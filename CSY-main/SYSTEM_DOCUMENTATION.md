# CoreSY System Documentation

This document provides a comprehensive overview of the CoreSY ecosystem, including the Backend API and the Admin Panel. It outlines the system architecture, core features, and how the different components interact.

## 1. System Architecture

The CoreSY system is built on a modern, scalable technology stack:

### **Backend API**
-   **Runtime:** Node.js with Express.js framework.
-   **Database:** PostgreSQL (relational database) managed via Prisma ORM.
-   **Security:** JWT (JSON Web Tokens) for authentication, bcrypt for password hashing.
-   **Documentation:** Swagger/OpenAPI (accessible via `/api-docs` if enabled).

### **Admin Panel**
-   **Frontend:** React-based web application.
-   **Integration:** Consumes the specific Admin API endpoints (`/api/admin/*`) provided by the backend.

---

## 2. Backend API Features

The backend serves three primary user roles: **Users (Customers)**, **Businesses (Vendors)**, and **Drivers**.

### **A. User (Customer) Features**
-   **Authentication:** Registration, Login, Password Management.
-   **Profile:** Manage personal details, addresses, and AI assistant preferences.
-   **Wallet & Points:**
    -   Digital wallet for payments.
    -   Loyalty points system for rewards.
-   **Ordering:** Browse businesses, view menus, place orders.
-   **Reservations:** Book tables or appointments with businesses.

### **B. Business (Vendor) Features**
-   **Profile Management:** Manage business details, working hours, and gallery photos.
-   **Menu/Services:** Create and update products/services with categories and prices.
-   **Order Management:** Receive, accept, prepare, and complete orders.
-   **Reservation Management:** View and manage booking requests.
-   **Analytics Dashboard:** View sales, orders, and performance metrics.
-   **Staff Management:** Create accounts for cashiers or staff members.

### **C. Driver Features**
-   **Status:** Toggle availability (Online/Offline).
-   **Order Delivery:** Receive delivery requests, update status (Picked Up, Delivered).
-   **Earnings:** Track daily and weekly earnings.

---

## 3. Admin Panel Features

The Admin Panel is a centralized dashboard for platform administrators ("Super Admin" or "Support Admin") to manage the entire ecosystem.

### **1. Dashboard Overview**
-   **Key Metrics:** Real-time counters for Total Users, Total Businesses, and Total Drivers.
-   **System Health:** Monitors database connectivity and server uptime.
-   **Financials:** Revenue charts and growth trends (Visualizations).

### **2. User Management**
-   **List Users:** View all registered customers with pagination.
-   **User Details:** Deep dive into specific user profiles.
-   **Actions:**
    -   Activate/Deactivate accounts (ban users).
    -   Delete users (Safety/Privacy compliance).

### **3. Business Management**
-   **Approval Workflow:** Businesses register but may require admin approval. Admins can `Approve` (activate) or `Reject` (deactivate) businesses.
-   **Monitoring:** View business details and their activity.
-   **Delete:** Remove non-compliant businesses.

### **4. Driver Management**
-   **Onboarding:** Verify driver details.
-   **Status Control:** Approve or suspend drivers from the platform.

### **5. Transaction Monitoring**
-   **Audit Trail:** View a global list of all financial transactions (Orders, Wallet Top-ups, etc.).
-   **Filtering:** Filter by transaction type, status, or payment method.

### **6. Subscription Management**
-   **Plan Tracking:** Monitor which businesses are on which subscription plans (Standard, Pro, etc.).
-   **Status:** specific view for business subscription health and renewal dates.

---

## 4. Workflows

### **How the System Works**

1.  **Registration:**
    -   **Users** sign up via the mobile app/web.
    -   **Businesses** sign up and populate their profile.
    -   **Drivers** sign up and wait for approval.

2.  **Admin Approval (Optional but Recommended):**
    -   Admin logs into the Admin Panel.
    -   Reviews new Businesses and Drivers.
    -   Sets status to `Active`.

3.  **The Order Flow:**
    -   **User** places an order -> Money deducted from Wallet/Card -> **Business** receives notification.
    -   **Business** accepts order -> Prepares item -> Marks as "Ready".
    -   **System** assigns **Driver** (if delivery).
    -   **Driver** picks up -> Delivers -> Order Complete.
    -   **Funds** transferred to Business and Driver wallets (minus platform fees).

4.  **The Reservation Flow:**
    -   **User** selects date/time -> Books slot.
    -   **Business** confirms booking.

---

## 5. Deployment & Configuration

-   The system is configured via `.env` files.
-   **Database:** Requires a running PostgreSQL instance.
-   **Server:** Started via `npm run dev` (Development) or `npm start` (Production).
-   **Tests:** Automated API tests are available via Postman Collection (`postman/CoreSY_API_Complete.postman_collection.json`).
