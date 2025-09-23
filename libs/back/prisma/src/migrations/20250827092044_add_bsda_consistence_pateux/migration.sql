-- AlterEnum
ALTER TYPE "default$default"."BsdaConsistence" ADD VALUE 'PATEUX';

-- AlterTable
ALTER TABLE "default$default"."Bsda" ADD COLUMN     "wasteConsistenceDescription" TEXT;
