ALTER TABLE "default$default"."AnonymousCompany"
    ADD COLUMN "orgId" TEXT UNIQUE;

UPDATE
  "default$default"."AnonymousCompany"
SET
  "orgId" = "siret";

ALTER TABLE "default$default"."AnonymousCompany"
ALTER COLUMN "orgId" SET NOT NULL;

ALTER TABLE "default$default"."AnonymousCompany"
ALTER COLUMN "siret" DROP NOT NULL;
