-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "businessName" TEXT NOT NULL DEFAULT 'My Business',
    "phone" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "gstin" TEXT,
    "invoiceFooter" TEXT,
    "defaultLowStock" INTEGER NOT NULL DEFAULT 5,
    "updatedAt" DATETIME NOT NULL
);
