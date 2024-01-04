-- AlterTable Bsff
ALTER TABLE
  "default$default"."Bsff" DROP COLUMN "wasteDescription",
ADD
  COLUMN "destinationCustomInfo" TEXT,
ADD
  COLUMN "destinationReceptionAcceptationStatus" "default$default"."WasteAcceptationStatus",
ADD
  COLUMN "emitterCustomInfo" TEXT,
ADD
  COLUMN "transporterCustomInfo" TEXT,
ADD
  COLUMN "repackagedInId" TEXT,
ADD
  COLUMN "groupedInId" TEXT,
ADD
  COLUMN "forwardingId" TEXT;

ALTER TABLE
  "default$default"."Bsff" RENAME COLUMN "wasteNature" TO "wasteDescription";

ALTER TABLE
  "default$default"."Bsff" RENAME COLUMN "destinationReceptionKilos" TO "destinationReceptionWeight";

ALTER TABLE
  "default$default"."Bsff" RENAME COLUMN "destinationReceptionRefusal" TO "destinationReceptionRefusalReason";

ALTER TABLE
  "default$default"."Bsff" RENAME COLUMN "quantityIsEstimate" TO "weightIsEstimate";

ALTER TABLE
  "default$default"."Bsff" RENAME COLUMN "quantityKilos" TO "weightValue";

-- AlterTable BsffFicheIntervention
ALTER TABLE
  "default$default"."BsffFicheIntervention" RENAME COLUMN "kilos" TO "weight";

-- AddForeignKey
ALTER TABLE
  "default$default"."Bsff"
ADD
  FOREIGN KEY ("repackagedInId") REFERENCES "default$default"."Bsff"("id") ON DELETE
SET
  NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
  "default$default"."Bsff"
ADD
  FOREIGN KEY ("groupedInId") REFERENCES "default$default"."Bsff"("id") ON DELETE
SET
  NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
  "default$default"."Bsff"
ADD
  FOREIGN KEY ("forwardingId") REFERENCES "default$default"."Bsff"("id") ON DELETE
SET
  NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "Bsff_forwardingId_unique" ON "default$default"."Bsff"("forwardingId");