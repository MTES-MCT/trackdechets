-- Create new type OperationMode
CREATE TYPE "default$default"."OperationMode" AS ENUM ('REUTILISATION', 'RECYCLAGE', 'VALORISATION_ENERGETIQUE', 'ELIMINATION');

-- Add column 'destinationOperationMode' to BSDDs
ALTER TABLE "default$default"."Form" ADD COLUMN IF NOT EXISTS "destinationOperationMode" "default$default"."OperationMode";

-- Add column 'destinationOperationMode' to BSDAs
ALTER TABLE "default$default"."Bsda" ADD COLUMN IF NOT EXISTS "destinationOperationMode" "default$default"."OperationMode";

-- Add column 'destinationOperationMode' to BSDASRIs
ALTER TABLE "default$default"."Bsdasri" ADD COLUMN IF NOT EXISTS "destinationOperationMode" "default$default"."OperationMode";

-- Add column 'destinationOperationMode' to BSVHUs
ALTER TABLE "default$default"."Bsvhu" ADD COLUMN IF NOT EXISTS "destinationOperationMode" "default$default"."OperationMode";

-- Add column 'destinationOperationMode' to BSFFPackagings
ALTER TABLE "default$default"."BsffPackaging" ADD COLUMN IF NOT EXISTS "operationMode" "default$default"."OperationMode";
