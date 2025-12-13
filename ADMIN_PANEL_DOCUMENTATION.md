# Admin Panel System Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Features & Functionality](#features--functionality)
5. [API Integration](#api-integration)
6. [Deployment & Configuration](#deployment--configuration)

---

## Project Overview

The **Admin Panel** is a centralized dashboard for managing the CSY multi-sided marketplace platform. It allows administrators to oversee users, businesses, drivers, transactions, and system health. The application is built with a modern **React 19** frontend and communicates with the **Node.js/Express** backend via RESTful APIs.

---

## Frontend Architecture

### Technology Stack
- **Framework:** React 19 + TypeScript
- **UI Library:** Material-UI (MUI) v7
- **State Management:** Redux Toolkit
- **Routing:** React Router v7
- **HTTP Client:** Axios
- **Charts:** Recharts
- **Build Tool:** Vite

### Directory Structure
```
src/
├── components/         # Reusable UI components
│   ├── layout/         # Layout components (Header, Sidebar)
│   └── modals/         # Dialogs/Modals (User, Business details)
├── pages/              # Main route pages
│   ├── Dashboard.tsx       # Analytics & Overview
│   ├── UsersPage.tsx       # User management
│   ├── BusinessesPage.tsx  # Business administration
│   └── ...                 # Other feature pages
├── services/           # API integration layer
│   └── api.ts          # Centralized API definitions
├── store/              # Redux state slices
│   ├── index.ts        # Store configuration
│   └── authSlice.ts    # Authentication state
├── routes/             # App routing configuration
└── utils/              # Helper functions
```

### Key Components
- **Layout:** Uses a persistent `MainLayout` with a responsive `Sidebar` and `Header`.
- **StatCard:** Reusable component for displaying metrics on the dashboard.
- **Data Tables:** Material-UI tables used extensively for listing entities with pagination and actions.
- **Protected Routes:** Ensures only authenticated admins access the panel.

---

## Backend Architecture

### Technology Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT (JSON Web Tokens)

### Controllers
- **`admin.auth.controller.js`**: Handles login, password updates, and self-profile retrieval.
- **`admin.controller.js`**:
    - **Dashboard:** Aggregates stats (total users, revenue, active drivers).
    - **Entity Management:** CRUD operations for Users, Businesses, Drivers.
    - **System:** Health checks and logs.

### Middleware
- **`protectAdmin`**: Verifies JWT token and checks if the admin account is active.
- **`restrictTo`**: Implements Role-Based Access Control (RBAC) (e.g., restricted deletion rights).

---

## Features & Functionality

### 1. Dashboard & Analytics
- **Overview Cards:** Real-time counts of Users, Active Businesses, Revenue, and Drivers.
- **Charts:**
    - **Revenue Trend:** Line chart showing income vs. platform fees.
    - **User Growth:** Area chart visualizing new user registrations.
- **Recent Activities:** Log of recent system events (signups, high-value transactions).

### 2. User Management
- **List View:** Paginated table of all users with search and filtering.
- **Actions:**
    - View detailed profile (Wallet, Points, History).
    - Toggle Active/Inactive status.
    - Soft delete users.

### 3. Business Management
- **Verification:** Review new business applications (approve/reject).
- **Oversight:** Monitor reservations, orders, and ratings.
- **Subscription:** Track business plan subscriptions (Pass, Care, Go, etc.).

### 4. Driver Management
- **Tracking:** View real-time location and availability.
- **Performance:** Monitor earnings, delivery counts, and ratings.
- **Payouts:** Process driver earning withdrawals.

### 5. Financial Management
- **Transactions:** comprehensive log of all payments and refunds.
- **Revenue Reports:** Detailed breakdown of platform earnings vs. payouts.

### 6. System Health
- **Monitoring:** Live status of Database, Redis, and API uptime.

---

## API Integration

The frontend uses a centralized `api.ts` service with Axios interceptors.

### Authentication
- **Login:** `POST /api/admin/login`
    - Stores JWT in `localStorage`.
    - Updates Redux auth state.
- **Interceptor:** Automatically attaches `Authorization: Bearer <token>` to all requests.
- **Auto-Logout:** Redirects to login on `401 Unauthorized` responses.

### Endpoints Overview
| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| **Auth** | `/api/admin/me` | GET | Get current admin profile |
| **Stats** | `/api/admin/dashboard/stats` | GET | Dashboard widgets data |
| **Users** | `/api/admin/users` | GET | List users with pagination |
| **Users** | `/api/admin/users/:id/status` | PATCH | Update user status |
| **Business** | `/api/admin/businesses` | GET | List businesses |
| **System** | `/api/admin/system/health` | GET | Check API & DB status |

---

## Deployment & Configuration

### Environment Variables
**Frontend (`.env`):**
```
VITE_API_URL=https://csy-backend-production.up.railway.app
```

**Backend (`.env`):**
```
DATABASE_URL=postgresql://user:pass@host:port/dbname
JWT_SECRET=your_secure_secret
JWT_EXPIRES_IN=24h
```

### Build & Run
**Frontend:**
```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

**Backend:**
```bash
# Install dependencies
npm install

# Run server
npm start
```
