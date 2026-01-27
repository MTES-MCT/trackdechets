-- Add expiresAt column to UserAccountHash and populate with createdAt + 7 days
ALTER TABLE "UserAccountHash" ADD COLUMN "expiresAt" timestamptz;

-- Backfill existing rows: set expiresAt = createdAt + 7 days when null
UPDATE "UserAccountHash"
SET "expiresAt" = "createdAt" + INTERVAL '7 days'
WHERE "expiresAt" IS NULL;

-- Set expiresAt NOT NULL after backfill
ALTER TABLE "UserAccountHash" ALTER COLUMN "expiresAt" DROP NOT NULL;
