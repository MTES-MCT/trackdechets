-- AlterTable
ALTER TABLE "Bsda" ADD COLUMN     "destinationReceptionRefusedWeight" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "BsdaRevisionRequest" ADD COLUMN     "destinationReceptionRefusedWeight" DOUBLE PRECISION,
ADD COLUMN     "initialDestinationReceptionRefusedWeight" DECIMAL(65,30);
