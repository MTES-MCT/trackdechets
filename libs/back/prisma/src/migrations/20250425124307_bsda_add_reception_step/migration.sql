-- AlterEnum
ALTER TYPE "BsdaStatus" ADD VALUE 'RECEIVED';

-- AlterTable
ALTER TABLE "Bsda" ADD COLUMN     "destinationReceptionSignatureAuthor" TEXT,
ADD COLUMN     "destinationReceptionSignatureDate" TIMESTAMPTZ(6);
