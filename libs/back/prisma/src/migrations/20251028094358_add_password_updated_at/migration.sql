-- AlterTable
ALTER TABLE "User" ADD COLUMN "passwordUpdatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP;

UPDATE "User" SET "passwordUpdatedAt" = '2025-01-01 12:00:00.000 +0200' WHERE "passwordVersion" = 2;
UPDATE "User" SET "passwordUpdatedAt" = '2022-01-01 12:00:00.000 +0200' WHERE "passwordVersion" = 1 OR "passwordVersion" IS NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "passwordVersion";
