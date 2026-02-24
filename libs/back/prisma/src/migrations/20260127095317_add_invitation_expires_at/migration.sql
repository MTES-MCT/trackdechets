ALTER TABLE "UserAccountHash" ADD COLUMN "expiresAt" timestamptz;

UPDATE "UserAccountHash"
SET "expiresAt" = "createdAt" + INTERVAL '7 days'
WHERE "expiresAt" IS NULL;

ALTER TABLE "UserAccountHash" ALTER COLUMN "expiresAt" SET NOT NULL;
ALTER TABLE "UserAccountHash" ALTER COLUMN "expiresAt" SET DEFAULT (now() + INTERVAL '7 days');
