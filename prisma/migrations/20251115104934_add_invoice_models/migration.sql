-- CreateTable
CREATE TABLE "Invoice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceNumber" TEXT NOT NULL,
    "customerId" INTEGER,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" REAL NOT NULL DEFAULT 0,
    "discount" REAL NOT NULL DEFAULT 0,
    "cgstPercent" REAL NOT NULL DEFAULT 0,
    "cgstAmount" REAL NOT NULL DEFAULT 0,
    "sgstPercent" REAL NOT NULL DEFAULT 0,
    "sgstAmount" REAL NOT NULL DEFAULT 0,
    "igstPercent" REAL NOT NULL DEFAULT 0,
    "igstAmount" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "pricePerUnit" REAL NOT NULL,
    "total" REAL NOT NULL,
    CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InvoiceItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
