ALTER TABLE "default$default"."Form"
    ADD COLUMN "currentTransporterOrgId" VARCHAR(30);

ALTER TABLE "default$default"."Form"
    ADD COLUMN "nextTransporterOrgId" VARCHAR(30);

UPDATE
  "default$default"."Form"
SET
  "nextTransporterOrgId" = "nextTransporterSiret";

UPDATE
  "default$default"."Form"
SET
  "currentTransporterOrgId" = "currentTransporterSiret";

ALTER TABLE "default$default"."Form"
    DROP COLUMN "nextTransporterSiret";

ALTER TABLE "default$default"."Form"
    DROP COLUMN "currentTransporterSiret";
