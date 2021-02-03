--- Fix nullable columns required in prisma

-- STATUS LOGS

-- Set default value for records where authType is null
UPDATE "default$default"."StatusLog"
SET "authType" = 'BEARER'
WHERE "authType" IS NULL;

ALTER TABLE "default$default"."StatusLog" ALTER COLUMN "authType" SET NOT NULL;

-- Set default value for records where updatedFields is null
UPDATE "default$default"."StatusLog"
SET "updatedFields" = '{}'
WHERE "updatedFields" IS NULL;


ALTER TABLE "default$default"."StatusLog" ALTER COLUMN "updatedFields" SET NOT NULL;

-- Delete statusLogs where formId is null
DELETE FROM "default$default"."StatusLog"
WHERE "formId" IS NULL;

ALTER TABLE "default$default"."StatusLog" ALTER COLUMN "formId" SET NOT NULL;

-- USER ACTIVATION HASH

-- Delete records where userId is null
DELETE FROM "default$default"."UserActivationHash"
WHERE "userId" IS NULL;

ALTER TABLE "default$default"."UserActivationHash" ALTER COLUMN "userId" SET NOT NULL;


