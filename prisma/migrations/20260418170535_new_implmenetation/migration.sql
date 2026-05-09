-- AlterTable
ALTER TABLE "CustomerPayment" ADD COLUMN "paymentMode" TEXT;
ALTER TABLE "CustomerPayment" ADD COLUMN "paymentRef" TEXT;

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN "paymentMode" TEXT;
ALTER TABLE "Sale" ADD COLUMN "paymentRef" TEXT;

-- CreateTable
CREATE TABLE "Return" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceNumber" TEXT,
    "productId" INTEGER NOT NULL,
    "customerId" INTEGER,
    "quantity" INTEGER NOT NULL,
    "amount" REAL NOT NULL DEFAULT 0,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "isBroken" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Return_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Return_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
