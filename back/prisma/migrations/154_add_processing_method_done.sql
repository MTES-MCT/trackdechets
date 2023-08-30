-- TODO: do other bsds as well!

CREATE TYPE "default$default"."ProcessingMode" AS ENUM ('REUSE', 'RECYCLING', 'ENERGY_RECOVERY', 'ELIMINATION');
ALTER TABLE "default$default"."Form" ADD COLUMN IF NOT EXISTS "processingModeDone" "default$default"."ProcessingMode";