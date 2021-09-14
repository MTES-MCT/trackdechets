ALTER TABLE "default$default"."Bsff"
  RENAME "destinationReceptionRefusal" TO "destinationReceptionRefusalReason",
  ADD COLUMN "destinationReceptionAcceptationStatus" "default$default"."WasteAcceptationStatus"
