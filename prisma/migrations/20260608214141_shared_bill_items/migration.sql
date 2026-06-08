-- CreateTable
CREATE TABLE "SharedBillItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 1,
    "unitPrice" REAL NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SharedBillItemLivery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sharedBillItemId" TEXT NOT NULL,
    "liveryId" TEXT NOT NULL,
    CONSTRAINT "SharedBillItemLivery_sharedBillItemId_fkey" FOREIGN KEY ("sharedBillItemId") REFERENCES "SharedBillItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SharedBillItemLivery_liveryId_fkey" FOREIGN KEY ("liveryId") REFERENCES "Livery" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SharedBillItemLivery_sharedBillItemId_liveryId_key" ON "SharedBillItemLivery"("sharedBillItemId", "liveryId");
