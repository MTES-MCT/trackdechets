-- CreateEnum
CREATE TYPE "UserNotification" AS ENUM (
  'MEMBERSHIP_REQUEST',
  'SIGNATURE_CODE_RENEWAL',
  'BSD_REFUSAL',
  'BSDA_FINAL_DESTINATION_UPDATE',
  'REVSION_REQUEST'
);

-- AlterTable
ALTER TABLE
  "CompanyAssociation"
ADD
  COLUMN "emailNotifications" "UserNotification" [];

-- Subscribe admins to all notifications
UPDATE
  "CompanyAssociation"
SET
  "emailNotifications" = ARRAY(
    SELECT
      enum_range(NULL :: "UserNotification")
  )
WHERE
  "role" = 'ADMIN';