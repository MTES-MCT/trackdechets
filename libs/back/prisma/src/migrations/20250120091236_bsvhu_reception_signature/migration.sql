-- AlterEnum
ALTER TYPE "BsvhuStatus" ADD VALUE 'RECEIVED';

-- AlterTable
ALTER TABLE "Bsvhu" ADD COLUMN     "destinationReceptionSignatureAuthor" TEXT,
ADD COLUMN     "destinationReceptionSignatureDate" TIMESTAMPTZ(6);
