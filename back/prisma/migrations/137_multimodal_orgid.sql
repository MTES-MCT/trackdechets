ALTER TABLE
  "default$default"."Form"
ADD
  COLUMN "currentTransporterOrgId" VARCHAR(30);

ALTER TABLE
  "default$default"."Form"
ADD
  COLUMN "nextTransporterOrgId" VARCHAR(30);

UPDATE
  "default$default"."Form"
SET
  "nextTransporterOrgId" = "nextTransporterSiret";

UPDATE
  "default$default"."Form"
SET
  "currentTransporterOrgId" = "currentTransporterSiret";

ALTER TABLE
  "default$default"."Form" DROP COLUMN "nextTransporterSiret";

ALTER TABLE
  "default$default"."Form" DROP COLUMN "currentTransporterSiret";

-- CREATE INDEX IF NOT EXISTS "_FormCurrentTransporterOrgIdIdx" ON "default$default"."Form"("currentTransporterOrgId");
-- CREATE INDEX IF NOT EXISTS "_FormNextTransporterOrgIdIdx" ON "default$default"."Form"("nextTransporterOrgId");