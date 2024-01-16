
ALTER TABLE "default$default"."Company"
ADD COLUMN IF NOT EXISTS "vatNumber" TEXT;

ALTER TABLE "default$default"."AnonymousCompany"
ADD COLUMN IF NOT EXISTS "vatNumber" TEXT;

-- Index
CREATE INDEX IF NOT EXISTS "_CompanyVatNumberIdx" ON "default$default"."Company"("vatNumber");
CREATE INDEX IF NOT EXISTS "_AnonymousCompanyVatNumberIdx" ON "default$default"."AnonymousCompany"("vatNumber");
