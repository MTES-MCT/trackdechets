ALTER TABLE "default$default"."Bsff"
  RENAME "destinationReceptionRefusal" TO "destinationReceptionRefusalReason",
  ADD COLUMN "destinationReceptionAcceptationStatus" "default$default"."WasteAcceptationStatus",
  ADD COLUMN "emitterCustomInfo" TEXT,
  ADD COLUMN "transporterCustomInfo" TEXT,
  ADD COLUMN "destinationCustomInfo" TEXT,
  RENAME COLUMN "quantityKilos" TO "weightValue",
  RENAME COLUMN "quantityIsEstimate" TO "weightIsEstimate",
  RENAME COLUMN "destinationReceptionKilos" TO "destinationReceptionWeight";

ALTER TABLE "default$default"."FicheIntervention"
  RENAME COLUMN "kilos" TO "weight";
