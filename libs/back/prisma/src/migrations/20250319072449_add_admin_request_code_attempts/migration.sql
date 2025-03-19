-- AlterEnum
ALTER TYPE "AdminRequestStatus" ADD VALUE 'BLOCKED';

-- AlterTable
ALTER TABLE "AdminRequest" ADD COLUMN     "codeAttempts" INTEGER NOT NULL DEFAULT 0;
