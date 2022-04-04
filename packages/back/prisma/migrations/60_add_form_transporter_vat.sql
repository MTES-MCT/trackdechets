ALTER TABLE "default$default"."Form"
ADD COLUMN IF NOT EXISTS "transporterCompanyVatNumber" TEXT;

ALTER TABLE "default$default"."Bsdasri"
ADD COLUMN IF NOT EXISTS "transporterCompanyVatNumber" TEXT;
