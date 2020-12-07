-- Other manual migrations to enhance the schema

-- Form owner: Migrate from N-N to 1-1
ALTER TABLE "default$default"."Form" ADD COLUMN "ownerId" character varying(30);

UPDATE "default$default"."Form"
  SET "ownerId" = t."B"
FROM (
  SELECT *
  FROM "default$default"."_FormToUser"
) t
WHERE t."A" = "default$default"."Form"."id";

DROP TABLE "default$default"."_FormToUser";

-- Form temporaryStorageDetail->temporaryStorageDetailId
ALTER TABLE "default$default"."Form" RENAME COLUMN "temporaryStorageDetail" to "temporaryStorageDetailId";

-- User activation hash: Migrate from N-N to 1-1
ALTER TABLE "default$default"."UserActivationHash" ADD COLUMN "userId" character varying(30);

UPDATE "default$default"."UserActivationHash"
  SET "userId" = t."A"
FROM (
  SELECT *
  FROM "default$default"."_UserToUserActivationHash"
) t
WHERE t."B" = "default$default"."UserActivationHash"."id";

DROP TABLE "default$default"."_UserToUserActivationHash";

-- AccessToken application->applicationId & user->userId
ALTER TABLE "default$default"."AccessToken" RENAME COLUMN "application" to "applicationId";
ALTER TABLE "default$default"."AccessToken" RENAME COLUMN "user" to "userId";

-- Grant application->applicationId & user->userId
ALTER TABLE "default$default"."Grant" RENAME COLUMN "application" to "applicationId";
ALTER TABLE "default$default"."Grant" RENAME COLUMN "user" to "userId";

-- Company transporterReceipt->transporterReceiptId & traderReceipt->traderReceiptId
ALTER TABLE "default$default"."Company" RENAME COLUMN "transporterReceipt" to "transporterReceiptId";
ALTER TABLE "default$default"."Company" RENAME COLUMN "traderReceipt" to "traderReceiptId";

-- CompanyAssociation company->companyId & user->userId
ALTER TABLE "default$default"."CompanyAssociation" RENAME COLUMN "company" to "companyId";
ALTER TABLE "default$default"."CompanyAssociation" RENAME COLUMN "user" to "userId";

-- MembershipRequest company->companyId & user->userId
ALTER TABLE "default$default"."MembershipRequest" RENAME COLUMN "company" to "companyId";
ALTER TABLE "default$default"."MembershipRequest" RENAME COLUMN "user" to "userId";

-- StatusLog form->formId & user->userId
ALTER TABLE "default$default"."StatusLog" RENAME COLUMN "form" to "formId";
ALTER TABLE "default$default"."StatusLog" RENAME COLUMN "user" to "userId";

-- TransportSegment form->formId 
ALTER TABLE "default$default"."TransportSegment" RENAME COLUMN "form" to "formId";

-- Form.isAccepted default to false
ALTER TABLE "default$default"."Form" ALTER COLUMN "isAccepted" SET DEFAULT FALSE;