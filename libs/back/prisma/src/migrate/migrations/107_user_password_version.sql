ALTER TABLE "default$default"."User"
    ADD COLUMN "passwordVersion" INTEGER;

UPDATE
  "default$default"."User"
SET
  "passwordVersion" = 1;
