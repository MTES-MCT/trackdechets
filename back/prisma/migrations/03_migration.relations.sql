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

-- Application admins: Migrate from N-N to 1-N
ALTER TABLE "default$default"."User" ADD COLUMN "applicationId" character varying(30);

UPDATE "default$default"."User"
  SET "applicationId" = t."A"
FROM (
  SELECT *
  FROM "default$default"."_ApplicationToUser"
) t
WHERE t."B" = "default$default"."User"."id";

DROP TABLE "default$default"."_ApplicationToUser";

-- Appendix2 forms: Migrate from N-N to 1-N
ALTER TABLE "default$default"."Form" ADD COLUMN "appendix2RootFormId" character varying(30);

UPDATE "default$default"."Form"
  SET "appendix2RootFormId" = t."A"
FROM (
  SELECT *
  FROM "default$default"."_FormToForm"
) t
WHERE t."B" = "default$default"."Form"."id";

DROP TABLE "default$default"."_FormToForm";

-- Some fields were added in the Prisma1 schema while migrating
-- They might be missing in some environments.
ALTER TABLE "default$default"."Form" ADD COLUMN IF NOT EXISTS "signedBy" character varying(30);
ALTER TABLE "default$default"."TemporaryStorageDetail" ADD COLUMN IF NOT EXISTS "tempStorerSignedBy" character varying(30);

ALTER TABLE "default$default"."Form" ADD COLUMN IF NOT EXISTS "wasteDetailsPop" BOOLEAN DEFAULT FALSE;
ALTER TABLE "default$default"."Form" ALTER COLUMN "wasteDetailsPop" SET NOT NULL;

CREATE TABLE IF NOT EXISTS "default$default"."AnonymousCompany" (
    "id" TEXT NOT NULL,
    "siret" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "codeNaf" TEXT NOT NULL,
    "libelleNaf" TEXT NOT NULL,
    "codeCommune" TEXT NOT NULL,

    PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AnonymousCompany.siret_unique" ON "default$default"."AnonymousCompany"("siret");
