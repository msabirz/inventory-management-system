# Update Guide: Multi-Product Sales & Inventory Enhancements

This update introduces a new **Multi-Product Sales** system, product **Units** (kg, grams, etc.), and a fixed **Ledger** module. To ensure your local system and data are updated correctly, please follow these steps.

---

## 📋 Pre-Update Checklist
1. **Backup Database**: Copy the file `prisma/dev.db` to your Desktop or a safe folder.
2. **Close Running App**: Stop your terminal (`Ctrl+C`) before starting the update.

---

## 🚀 Update Steps

### 1. Get Latest Code
Pull the latest changes from the repository:
```bash
git pull origin stage
```

### 2. Install New Packages
We have added some UI improvements (like searchable dropdowns) that require new dependencies:
```bash
npm install
```

### 3. Sync Database Schema
Update your database structure to support the new "Units" field and itemized sales:
```bash
npx prisma db push
```

### 4. Run Data Migration
**IMPORTANT:** Your old sales data needs to be moved to the new format. Run this special script to process old orders:
```bash
node scripts/migrate_sales_v2.js
```

### 5. Verify the Update
Start the application:
```bash
npm run dev
```

---

## ✅ What's New?

### 1. Multi-Product Sales
You can now add multiple products to a single sale. In the **Sales** module, use the **"+ Add Another Product"** button to build a list for a single bill.

### 2. Product Units
Every product now has a **Unit** field (e.g., kg, dozen, meters). You can set this when creating a product or editing an existing one.

### 3. Improved Dashboard
The dashboard now shows **Total Sales**, **Total Purchases**, and **Total Pending Credit** amounts with proper comma formatting (e.g., ₹1,23,456).

### 4. Fixed Ledger
The Ledger page now correctly handles multi-item sales and allows you to expand any row to see the full list of products purchased in that bill.

---

*For technical support, please contact your developer.*
