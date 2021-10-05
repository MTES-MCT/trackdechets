-- AlterTable Bsvhu
ALTER TABLE "Bsvhu"
  RENAME COLUMN "quantityNumber" TO "quantity",
  RENAME COLUMN "quantityTons" TO "weightValue",
  RENAME COLUMN "destinationReceptionQuantityNumber" TO "destinationReceptionQuantity",
  RENAME COLUMN "destinationReceptionQuantityTons" TO "destinationReceptionWeight",
  ADD COLUMN    "destinationOperationNextDestinationCompanyVatNumber" TEXT,
  ADD COLUMN    "weightIsEstimate" BOOLEAN,
  ADD COLUMN    "emitterCustomInfo" TEXT,
  ADD COLUMN    "destinationCustomInfo" TEXT,
  ADD COLUMN    "transporterCustomInfo" TEXT;