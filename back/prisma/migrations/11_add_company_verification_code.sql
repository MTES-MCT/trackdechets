-- Creates new column
ALTER TABLE "default$default"."Company"
ADD "verificationCode" VARCHAR(30);

-- Generates codes for existing records
UPDATE "default$default"."Company"
SET "verificationCode" = LPAD(FLOOR(random() * 100000)::CHAR(5), 5, '0');

-- Set verificationCode field as required
ALTER TABLE "default$default"."Company"
ALTER COLUMN "verificationCode" SET NOT NULL;