-- AlterTable
ALTER TABLE "User" ADD COLUMN     "totpActivatedAt" TIMESTAMPTZ(6),
ADD COLUMN     "totpSeed" TEXT;
