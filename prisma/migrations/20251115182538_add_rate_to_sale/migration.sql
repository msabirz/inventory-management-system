/*
  Warnings:

  - Added the required column `rate` to the `Sale` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Sale" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "customerId" INTEGER,
    "quantity" INTEGER NOT NULL,
    "pricePerUnit" REAL NOT NULL DEFAULT 0,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "rate" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Sale_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Sale" ("createdAt", "customerId", "date", "id", "pricePerUnit", "productId", "quantity", "remarks", "totalAmount", "updatedAt") SELECT "createdAt", "customerId", "date", "id", "pricePerUnit", "productId", "quantity", "remarks", "totalAmount", "updatedAt" FROM "Sale";
DROP TABLE "Sale";
ALTER TABLE "new_Sale" RENAME TO "Sale";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
