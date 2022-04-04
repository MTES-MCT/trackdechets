-- Add new statuses to FormStatus
ALTER TYPE "default$default"."Status" ADD VALUE 'SIGNED_BY_PRODUCER';
ALTER TYPE "default$default"."Status" ADD VALUE 'SIGNED_BY_TEMP_STORER';

-- Add new fields to Form
ALTER TABLE "default$default"."Form"
ADD COLUMN "emittedAt" TIMESTAMPTZ(6),
ADD COLUMN "emittedBy" TEXT,
ADD COLUMN "emittedByEcoOrganisme" BOOLEAN,
ADD COLUMN "takenOverAt" TIMESTAMPTZ(6),
ADD COLUMN "takenOverBy" TEXT;

-- Fill the new fields with the existing data
UPDATE "default$default"."Form"
SET
  "emittedAt" = "sentAt",
  "takenOverAt" = "sentAt",
  "emittedByEcoOrganisme" = false
WHERE "sentAt" IS NOT NULL;

UPDATE "default$default"."Form"
SET
  "emittedBy" = "sentBy",
  "takenOverBy" = "transporterCompanyName"
WHERE "sentBy" IS NOT NULL;

-- Add new fields to TemporaryStorageDetail
ALTER TABLE "default$default"."TemporaryStorageDetail"
ADD COLUMN "emittedAt" TIMESTAMPTZ(6),
ADD COLUMN "emittedBy" TEXT,
ADD COLUMN "takenOverAt" TIMESTAMPTZ(6),
ADD COLUMN "takenOverBy" TEXT;

-- Fill the new fields with the existing data
UPDATE "default$default"."TemporaryStorageDetail"
SET
  "emittedAt" = "signedAt",
  "takenOverAt" = "signedAt"
WHERE "signedAt" IS NOT NULL;

UPDATE "default$default"."TemporaryStorageDetail"
SET
  "emittedBy" = "signedBy",
  "takenOverBy" = "transporterCompanyName"
WHERE "signedBy" IS NOT NULL;