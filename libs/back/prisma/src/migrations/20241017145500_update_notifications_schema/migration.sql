-- AlterTable
ALTER TABLE
  "CompanyAssociation"
ADD
  COLUMN "notificationIsActiveBsdRefusal" BOOLEAN NOT NULL DEFAULT false,
ADD
  COLUMN "notificationIsActiveBsdaFinalDestinationUpdate" BOOLEAN NOT NULL DEFAULT false,
ADD
  COLUMN "notificationIsActiveMembershipRequest" BOOLEAN NOT NULL DEFAULT false,
ADD
  COLUMN "notificationIsActiveRevisionRequest" BOOLEAN NOT NULL DEFAULT false,
ADD
  COLUMN "notificationIsActiveSignatureCodeRenewal" BOOLEAN NOT NULL DEFAULT false;

UPDATE
  "CompanyAssociation"
SET
  "notificationIsActiveBsdRefusal" = true
WHERE
  'BSD_REFUSAL' :: "UserNotification" = ANY(notifications);

UPDATE
  "CompanyAssociation"
SET
  "notificationIsActiveBsdaFinalDestinationUpdate" = true
WHERE
  'BSDA_FINAL_DESTINATION_UPDATE' :: "UserNotification" = ANY(notifications);

UPDATE
  "CompanyAssociation"
SET
  "notificationIsActiveMembershipRequest" = true
WHERE
  'MEMBERSHIP_REQUEST' :: "UserNotification" = ANY(notifications);

UPDATE
  "CompanyAssociation"
SET
  "notificationIsActiveRevisionRequest" = true
WHERE
  'REVISION_REQUEST' :: "UserNotification" = ANY(notifications);

UPDATE
  "CompanyAssociation"
SET
  "notificationIsActiveSignatureCodeRenewal" = true
WHERE
  'SIGNATURE_CODE_RENEWAL' :: "UserNotification" = ANY(notifications);

ALTER TABLE
  "CompanyAssociation" DROP COLUMN "notifications";

-- DropEnum
DROP TYPE "UserNotification";