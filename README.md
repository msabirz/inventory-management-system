# Bhushan Inventory Management System

A professional, full-stack inventory management solution built with modern web technologies. This system provides a robust platform for managing sales, invoices (quotations), customer data, and financial reporting.

## 🚀 Key Features

- **Sales Management**: Track transactions with automatic stock updates and payment status (Cash/UPI/Cheque).
- **Invoices & Quotations**: Generate professional estimates with sequential numbering and GST calculations.
- **Customer Directory**: Centralized customer records with integrated ledger and payment history.
- **Return & Refund Module**: Handle product returns with separate tracking for broken items (excluded from stock).
- **Profit & Loss Dashboard**: Real-time financial insights including revenue, COGS, and net profit.
- **Master Data**: Manage products, categories, suppliers, and low-stock alerts.

## 🛡️ Client Handover & Data Safety

If you are setting this up for a client or migrating to a new machine, follow these rules to ensure no production data is lost:

### 1. The Database File
All application data (Customers, Products, Sales) is stored in a single file: `dev.db`.
- **Location**: `prisma/dev.db`
- **Backup**: Before running any updates or setup commands, always make a copy of `dev.db` and store it in a safe place.

### 2. Safeguard Your Data
**⚠️ CAUTION: NEVER run the following command on a production machine:**
```bash
npx prisma migrate reset
```
This command will **permanently delete** all data in the database.

### 3. Safe Synchronization
When setting up for the first time or after an update, always use:
```bash
npx prisma db push
```
This synchronizes the database schema with the application code **without** deleting your existing records.

---

## 🛠 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (version 18 or higher)
- **npm** (usually comes with Node.js)

## 📦 Local Setup Instructions

Follow these steps to get the project running on your local machine:

### 1. Extract and Install
Extract the project folder and navigate to it in your terminal. Install all required dependencies:
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory and ensure it contains the database connection string:
```env
DATABASE_URL="file:./prisma/dev.db"
```

### 3. Database Sync (Safe)
Synchronize the database schema and generate the Prisma Client without wiping data:
```bash
npx prisma generate
npx prisma db push
```

### 4. Start the Application
Run the development server:
```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

---

## 🔧 Useful Commands

- **Open Database Viewer**: To view or manually edit the database records in a browser.
  ```bash
  npx prisma studio
  ```
- **Build for Production**: Create an optimized production build.
  ```bash
  npm run build
  npm run start
  ```

## 📝 Notes
- The system uses a local SQLite database (`dev.db`) located in the root folder.
- Quotations (Invoices) do not affect stock quantity, while Sales transactions do.
- GST calculations support both Intra-state (CGST+SGST) and Inter-state (IGST) formats.
