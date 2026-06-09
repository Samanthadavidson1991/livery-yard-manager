-- AlterTable
ALTER TABLE "SharedBillItem" ADD COLUMN "endDate" DATETIME;
ALTER TABLE "SharedBillItem" ADD COLUMN "startDate" DATETIME;

-- AlterTable
ALTER TABLE "SharedBillItemLivery" ADD COLUMN "unitPrice" REAL;
