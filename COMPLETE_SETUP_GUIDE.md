# CoreSY Backend - Complete Setup & Testing Guide

This guide provides everything you need to set up the backend, configure the database, run the server, and test APIs using Postman.

## 1. Prerequisites

-   **Node.js** (v16 or higher)
-   **PostgreSQL** (v13 or higher)
-   **Postman** (for API testing)

## 2. Environment Configuration

1.  Copy the example environment file:
    ```bash
    cp .env.example .env
    ```

2.  Open `.env` and configure your database connection URL:
    ```env
    # Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
    DATABASE_URL="postgresql://postgres:your_password@localhost:5432/csy_db?schema=public"
    ```
    *Replace `postgres`, `your_password`, `localhost`, `5432`, and `csy_db` with your actual PostgreSQL credentials.*

3.  Ensure other essential variables are set (JWT_SECRET, etc.). Defaults in `.env.example` are usually sufficient for development.

## 3. Database Setup

Run the following commands to initialize your database schema:

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Generate Prisma Client:**
    ```bash
    npx prisma generate
    ```

3.  **Run Migrations (Create Tables):**
    This command creates all necessary tables in your PostgreSQL database.
    ```bash
    npx prisma migrate dev --name init
    ```

4.  **Seed Database (Optional but Recommended):**
    Populate the database with initial test data (admin user, categories, etc.).
    ```bash
    npm run seed
    ```

## 4. Running the Server

Start the development server:

```bash
npm run dev
```

-   The server will start on `http://localhost:3000` (or the PORT defined in .env).
-   You should see "Server is running on port 3000" and "Connected to PostgreSQL" in the terminal.

## 5. API Testing with Postman

We have provided a complete Postman collection with automated tests.

### Import Collection & Environment

1.  Open Postman.
2.  Click **Import** (top left).
3.  Drag and drop the following files from the `postman/` directory:
    -   `CoreSY_API_Complete.postman_collection.json`
    -   `CSY_API_Local.postman_environment.json`

### Configure Postman Environment

1.  In Postman, look at the top right dropdown and select **"CSY API Local"**.
2.  Click the **"Eye" icon** (Environment quick look) next to the dropdown.
3.  Click **Edit**.
4.  Ensure `base_url` is set to `http://localhost:3000/api` (or your actual server URL).
5.  **Save** the environment.

### Running Automated Tests

1.  Select the **"CoreSY API Complete"** collection in the left sidebar.
2.  Click the **"Run"** button (or "Run collection" from the three-dot menu).
3.  In the Collection Runner:
    -   Ensure **"CSY API Local"** environment is selected.
    -   Click **"Run CoreSY API Complete"**.
4.  Watch the tests execute! You should see green "Pass" indicators for all requests.

### Troubleshooting Common Issues

-   **500 Internal Server Error:** Check the terminal where `npm run dev` is running for detailed error logs.
-   **401 Unauthorized:** Ensure you have run the "Login" request first to generate a token. The collection automatically handles token management, so running the collection in order is recommended.
-   **Database Connection Error:** Double-check your `DATABASE_URL` in `.env` and ensure your PostgreSQL server is running.

---
**Enjoy building with CoreSY!**
