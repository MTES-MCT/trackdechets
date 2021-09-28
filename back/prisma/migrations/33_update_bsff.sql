
-- AlterTable Bsff
ALTER TABLE "Bsff"
  RENAME COLUMN "destinationReceptionKilos" TO "destinationReceptionWeight",
  RENAME COLUMN "destinationReceptionRefusal" TO "destinationReceptionRefusalReason",
  RENAME COLUMN "quantityIsEstimate" TO "weightIsEstimate",
  RENAME COLUMN "quantityKilos" TO "weightValue",
  ADD COLUMN     "destinationCustomInfo" TEXT,
  ADD COLUMN     "destinationReceptionAcceptationStatus" "WasteAcceptationStatus",
  ADD COLUMN     "emitterCustomInfo" TEXT,
  ADD COLUMN     "forwardingId" TEXT,
  ADD COLUMN     "repackagedInId" TEXT,
  ADD COLUMN     "transporterCustomInfo" TEXT;

-- AlterTable BsffFicheIntervention
ALTER TABLE "default$default"."BsffFicheIntervention"
  RENAME COLUMN "kilos" TO "weight";

-- CreateTable BsffGroupement
CREATE TABLE "BsffGroupement" (
    "id" TEXT NOT NULL,
    "previousId" TEXT NOT NULL,
    "nextId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Bsff_forwardingId_unique" ON "Bsff"("forwardingId");

-- AddForeignKey
ALTER TABLE "Bsff" ADD FOREIGN KEY ("repackagedInId") REFERENCES "Bsff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bsff" ADD FOREIGN KEY ("forwardingId") REFERENCES "Bsff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BsffGroupement" ADD FOREIGN KEY ("previousId") REFERENCES "Bsff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BsffGroupement" ADD FOREIGN KEY ("nextId") REFERENCES "Bsff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

