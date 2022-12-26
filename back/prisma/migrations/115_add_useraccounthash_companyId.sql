ALTER TABLE "default$default"."UserAccountHash"
    ADD COLUMN "companyId" VARCHAR(30);

UPDATE
  "default$default"."UserAccountHash"
SET
  "companyId" = "companySiret";

ALTER TABLE "default$default"."UserAccountHash"
DROP COLUMN "companySiret";

CREATE INDEX IF NOT EXISTS "_UserAccountHashCompanyIdIdx" ON "default$default"."UserAccountHash"("companyId");
CREATE INDEX IF NOT EXISTS "_UserAccountHashCompanyUserIdx" ON "default$default"."UserAccountHash"("companyId", "email");
