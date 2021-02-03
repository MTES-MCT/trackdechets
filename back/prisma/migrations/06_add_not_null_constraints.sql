--- Fix nullable columns required in prisma

-- ACCESS_TOKEN
ALTER TABLE "default$default"."AccessToken" ALTER COLUMN "userId" SET NOT NULL;

-- COMPANY_ASSOCIATION
ALTER TABLE "default$default"."CompanyAssociation"
ALTER COLUMN "userId" SET NOT NULL,
ALTER COLUMN "companyId" SET NOT NULL;

-- FORM
ALTER TABLE "default$default"."Form"
ALTER COLUMN "ownerId" SET NOT NULL;

-- GRANT
ALTER TABLE "default$default"."Grant"
ALTER COLUMN "userId" SET NOT NULL,
ALTER COLUMN "applicationId" SET NOT NULL;

-- INSTALLATION
ALTER TABLE "default$default"."MembershipRequest"
ALTER COLUMN "userId" SET NOT NULL,
ALTER COLUMN "companyId" SET NOT NULL;

-- STATUS_LOG

-- Set default value for records where authType is null
UPDATE "default$default"."StatusLog"
SET "authType" = 'BEARER'
WHERE "authType" IS NULL;

ALTER TABLE "default$default"."StatusLog" ALTER COLUMN "authType" SET NOT NULL;

-- Delete statusLogs where formId is null
DELETE FROM "default$default"."StatusLog"
WHERE "formId" IS NULL;

ALTER TABLE "default$default"."StatusLog"
ALTER COLUMN "formId" SET NOT NULL,
ALTER COLUMN "userId" SET NOT NULL;

-- Set default value for records where updatedFields is null
UPDATE "default$default"."StatusLog"
SET "updatedFields" = '{}'
WHERE "updatedFields" IS NULL;

ALTER TABLE "default$default"."StatusLog" ALTER COLUMN "updatedFields" SET NOT NULL;

-- TRANSPORT_SEGMENT

ALTER TABLE "default$default"."TransportSegment"
ALTER COLUMN "formId" SET NOT NULL;


-- USER_ACTIVATION_HASH

-- Delete records where userId is null
DELETE FROM "default$default"."UserActivationHash"
WHERE "userId" IS NULL;

ALTER TABLE "default$default"."UserActivationHash" ALTER COLUMN "userId" SET NOT NULL;


