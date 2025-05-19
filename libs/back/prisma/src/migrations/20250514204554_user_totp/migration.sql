-- AlterTable
ALTER TABLE "User" ADD COLUMN     "totpActive" BOOLEAN DEFAULT false,
ADD COLUMN     "totpSeed" TEXT;
