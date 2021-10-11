-- AlterTable Bsda
ALTER TABLE "Bsda"
  RENAME COLUMN "quantityValue" TO "weightValue",
  ADD COLUMN    "weightIsEstimate" BOOLEAN,
  DROP COLUMN "destinationReceptionQuantityType",
  RENAME COLUMN "destinationReceptionQuantityValue" TO "destinationReceptionWeight",
  RENAME COLUMN "emitterWorkSiteName" TO "emitterPickupSiteName",
  RENAME COLUMN "emitterWorkSiteAddress" TO "emitterPickupSiteAddress",
  RENAME COLUMN "emitterWorkSiteCity" TO "emitterPickupSiteCity",
  RENAME COLUMN "emitterWorkSitePostalCode" TO "emitterPickupSitePostalCode",
  RENAME COLUMN "emitterWorkSiteInfos" TO "emitterPickupSiteInfos",
  ADD COLUMN    "emitterCustomInfo" TEXT,
  ADD COLUMN    "destinationCustomInfo" TEXT,
  ADD COLUMN    "transporterCustomInfo" TEXT,
  ADD COLUMN    "forwardingId" TEXT,
  ADD COLUMN    "repackagedInId" TEXT,
  ADD COLUMN    "ecoOrganismeName" TEXT,
  ADD COLUMN    "ecoOrganismeSiret" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Bsda_forwardingId_unique" ON "Bsda"("forwardingId");

-- AddForeignKey
ALTER TABLE "Bsda" ADD FOREIGN KEY ("groupedInId") REFERENCES "Bsda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bsda" ADD FOREIGN KEY ("forwardingId") REFERENCES "Bsda"("id") ON DELETE SET NULL ON UPDATE CASCADE;
