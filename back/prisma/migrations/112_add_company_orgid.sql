ALTER TABLE "default$default"."Company"
    ADD COLUMN "orgId" TEXT UNIQUE;

UPDATE
  "default$default"."Company"
SET
  "orgId" = "siret";

ALTER TABLE "default$default"."Company"
ALTER COLUMN "orgId" SET NOT NULL;

ALTER TABLE "default$default"."Company"
ALTER COLUMN "siret" DROP NOT NULL;
