-- Fix missing default

ALTER TABLE "default$default"."Form"
ALTER COLUMN "wasteDetailsPop" SET DEFAULT FALSE;