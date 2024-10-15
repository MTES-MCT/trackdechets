-- CreateEnum
CREATE TYPE "UserNotification" AS ENUM (
  'MEMBERSHIP_REQUEST',
  'SIGNATURE_CODE_RENEWAL',
  'BSD_REFUSAL',
  'BSDA_FINAL_DESTINATION_UPDATE',
  'REVISION_REQUEST'
);

-- AlterTable
ALTER TABLE
  "CompanyAssociation"
ADD
  COLUMN "notifications" "UserNotification" [];

-- Subscribe admins to all notifications
UPDATE
  "CompanyAssociation"
SET
  "notifications" = enum_range(NULL :: "UserNotification")
WHERE
  "role" = 'ADMIN';