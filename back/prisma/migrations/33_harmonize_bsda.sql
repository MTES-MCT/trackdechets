-- AlterTable Bsda
ALTER TABLE "default$default"."Bsda" DROP COLUMN   "destinationReceptionQuantityType";
ALTER TABLE "default$default"."Bsda" RENAME COLUMN "quantityValue" TO "weightValue";
ALTER TABLE "default$default"."Bsda" RENAME COLUMN "destinationReceptionQuantityValue" TO "destinationReceptionWeight";
ALTER TABLE "default$default"."Bsda" RENAME COLUMN "emitterWorkSiteName" TO "emitterPickupSiteName";
ALTER TABLE "default$default"."Bsda" RENAME COLUMN "emitterWorkSiteAddress" TO "emitterPickupSiteAddress";
ALTER TABLE "default$default"."Bsda" RENAME COLUMN "emitterWorkSiteCity" TO "emitterPickupSiteCity";
ALTER TABLE "default$default"."Bsda" RENAME COLUMN "emitterWorkSitePostalCode" TO "emitterPickupSitePostalCode";
ALTER TABLE "default$default"."Bsda" RENAME COLUMN "emitterWorkSiteInfos" TO "emitterPickupSiteInfos";
ALTER TABLE "default$default"."Bsda" ADD COLUMN    "weightIsEstimate" BOOLEAN;
ALTER TABLE "default$default"."Bsda" ADD COLUMN    "emitterCustomInfo" TEXT;
ALTER TABLE "default$default"."Bsda" ADD COLUMN    "destinationCustomInfo" TEXT;
ALTER TABLE "default$default"."Bsda" ADD COLUMN    "transporterCustomInfo" TEXT;
ALTER TABLE "default$default"."Bsda" ADD COLUMN    "repackagedInId" TEXT;
ALTER TABLE "default$default"."Bsda" ADD COLUMN    "ecoOrganismeName" TEXT;
ALTER TABLE "default$default"."Bsda" ADD COLUMN    "ecoOrganismeSiret" TEXT;
ALTER TABLE "default$default"."Bsda" ADD COLUMN    "forwardingId" TEXT;
ALTER TABLE "default$default"."Bsda" ADD COLUMN    "groupedInId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Bsda_forwardingId_unique" ON "default$default"."Bsda"("forwardingId");

-- AddForeignKey
ALTER TABLE "default$default"."Bsda" ADD FOREIGN KEY ("groupedInId") REFERENCES "default$default"."Bsda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "default$default"."Bsda" ADD FOREIGN KEY ("forwardingId") REFERENCES "default$default"."Bsda"("id") ON DELETE SET NULL ON UPDATE CASCADE;
