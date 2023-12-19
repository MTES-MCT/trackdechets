
-- Create enum types
CREATE TYPE "default$default"."CompanyVerificationStatus" AS ENUM ('TO_BE_VERIFIED', 'LETTER_SENT', 'VERIFIED');
CREATE TYPE "default$default"."CompanyVerificationMode" AS ENUM ('MANUAL', 'LETTER');

-- Create new columns
ALTER TABLE "default$default"."Company"
ADD "verificationCode" TEXT,
ADD "verificationStatus" "default$default"."CompanyVerificationStatus" NOT NULL DEFAULT 'TO_BE_VERIFIED'::"default$default"."CompanyVerificationStatus",
ADD "verificationMode" "default$default"."CompanyVerificationMode",
ADD "verificationComment" TEXT,
ADD "verifiedAt" TIMESTAMP;

-- Generates codes for existing records
UPDATE "default$default"."Company"
SET "verificationCode" = LPAD(FLOOR(random() * 100000)::CHAR(5), 5, '0');

-- Set verificationCode field as required
ALTER TABLE "default$default"."Company"
ALTER COLUMN "verificationCode" SET NOT NULL;