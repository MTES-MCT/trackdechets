ALTER TABLE "default$default"."Bsff"
  RENAME "destinationReceptionRefusal" TO "destinationReceptionRefusalReason",
  ADD COLUMN "destinationReceptionAcceptationStatus" "default$default"."WasteAcceptationStatus",
  ADD COLUMN "emitterCustomInfo" TEXT,
  ADD COLUMN "transporterCustomInfo" TEXT,
  ADD COLUMN "destinationCustomInfo" TEXT