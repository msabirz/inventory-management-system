-- CreateTable
CREATE TABLE "Purchase" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "supplierId" INTEGER,
    "quantity" INTEGER NOT NULL,
    "pricePerUnit" REAL NOT NULL DEFAULT 0,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Purchase_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Purchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
