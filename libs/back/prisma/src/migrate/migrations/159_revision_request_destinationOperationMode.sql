-- Add column 'destinationOperationMode' to BsddRevisionRequest
ALTER TABLE "default$default"."BsddRevisionRequest" ADD COLUMN IF NOT EXISTS "destinationOperationMode" "default$default"."OperationMode";

-- Add column 'destinationOperationMode' to BsdaRevisionRequest
ALTER TABLE "default$default"."BsdaRevisionRequest" ADD COLUMN IF NOT EXISTS "destinationOperationMode" "default$default"."OperationMode";
