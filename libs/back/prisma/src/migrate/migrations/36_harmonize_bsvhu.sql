-- AlterTable Bsvhu
ALTER TABLE "default$default"."Bsvhu" RENAME COLUMN "quantityNumber" TO "quantity";
ALTER TABLE "default$default"."Bsvhu" RENAME COLUMN "quantityTons" TO "weightValue";
ALTER TABLE "default$default"."Bsvhu" RENAME COLUMN "destinationReceptionQuantityNumber" TO "destinationReceptionQuantity";
ALTER TABLE "default$default"."Bsvhu" RENAME COLUMN "destinationReceptionQuantityTons" TO "destinationReceptionWeight";
ALTER TABLE "default$default"."Bsvhu" ADD COLUMN    "weightIsEstimate" BOOLEAN;
ALTER TABLE "default$default"."Bsvhu" ADD COLUMN    "destinationOperationNextDestinationCompanyVatNumber" TEXT;
ALTER TABLE "default$default"."Bsvhu" ADD COLUMN    "emitterCustomInfo" TEXT;
ALTER TABLE "default$default"."Bsvhu" ADD COLUMN    "destinationCustomInfo" TEXT;
ALTER TABLE "default$default"."Bsvhu" ADD COLUMN    "transporterCustomInfo" TEXT;
ALTER TABLE "default$default"."Bsvhu" ADD COLUMN    "transporterTransportPlates" TEXT[];