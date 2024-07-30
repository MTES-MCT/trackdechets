-- AlterTable
ALTER TABLE "BsddRevisionRequest" ADD COLUMN     "quantityRefused" DOUBLE PRECISION,
ADD COLUMN     "wasteAcceptationStatus" "WasteAcceptationStatus",
ADD COLUMN     "wasteRefusalReason" TEXT;
