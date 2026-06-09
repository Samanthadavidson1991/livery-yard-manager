-- CreateTable
CREATE TABLE "SharedBillItemApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sharedBillItemId" TEXT NOT NULL,
    "liveryId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SharedBillItemApplication_sharedBillItemId_fkey" FOREIGN KEY ("sharedBillItemId") REFERENCES "SharedBillItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SharedBillItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 1,
    "unitPrice" REAL NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "autoAdd" BOOLEAN NOT NULL DEFAULT false,
    "frequency" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_SharedBillItem" ("active", "createdAt", "description", "id", "quantity", "unitPrice") SELECT "active", "createdAt", "description", "id", "quantity", "unitPrice" FROM "SharedBillItem";
DROP TABLE "SharedBillItem";
ALTER TABLE "new_SharedBillItem" RENAME TO "SharedBillItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SharedBillItemApplication_sharedBillItemId_liveryId_period_key" ON "SharedBillItemApplication"("sharedBillItemId", "liveryId", "period");
