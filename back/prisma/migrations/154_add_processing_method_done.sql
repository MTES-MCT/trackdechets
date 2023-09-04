-- TODO: do other bsds as well!

CREATE TYPE "default$default"."OperationMode" AS ENUM ('REUTILISATION', 'RECYCLAGE', 'VALORISATION_ENERGETIQUE', 'ELIMINATION');
ALTER TABLE "default$default"."Form" ADD COLUMN IF NOT EXISTS "destinationOperationMode" "default$default"."OperationMode";