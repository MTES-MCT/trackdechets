ALTER TABLE "default$default"."TransportSegment"
    ADD COLUMN "previousTransporterCompanyOrgId" VARCHAR(30);

UPDATE
  "default$default"."TransportSegment"
SET
  "previousTransporterCompanyOrgId" = "previousTransporterCompanySiret";

ALTER TABLE "default$default"."TransportSegment"
    DROP COLUMN "previousTransporterCompanySiret";
