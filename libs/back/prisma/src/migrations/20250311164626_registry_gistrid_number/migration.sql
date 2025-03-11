-- AlterTable
ALTER TABLE "RegistryIncomingTexs" ADD COLUMN "gistridNumber" TEXT;
UPDATE "RegistryIncomingTexs" SET "gistridNumber" = CASE
    WHEN "declarationNumber" IS NOT NULL THEN "declarationNumber"
    WHEN "notificationNumber" IS NOT NULL THEN "notificationNumber"
    ELSE "notificationNumber"
END;

ALTER TABLE "RegistryIncomingTexs"
  DROP COLUMN "declarationNumber",
  DROP COLUMN "notificationNumber";

-- AlterTable
ALTER TABLE "RegistryIncomingWaste" ADD COLUMN "gistridNumber" TEXT;
UPDATE "RegistryIncomingWaste" SET "gistridNumber" = CASE
    WHEN "declarationNumber" IS NOT NULL THEN "declarationNumber"
    WHEN "notificationNumber" IS NOT NULL THEN "notificationNumber"
    ELSE "notificationNumber"
END;

ALTER TABLE "RegistryIncomingWaste"
  DROP COLUMN "declarationNumber",
  DROP COLUMN "notificationNumber";

-- AlterTable
ALTER TABLE "RegistryManaged" ADD COLUMN "gistridNumber" TEXT;
UPDATE "RegistryManaged" SET "gistridNumber" = CASE
    WHEN "declarationNumber" IS NOT NULL THEN "declarationNumber"
    WHEN "notificationNumber" IS NOT NULL THEN "notificationNumber"
    ELSE "notificationNumber"
END;

ALTER TABLE "RegistryManaged"
  DROP COLUMN "declarationNumber",
  DROP COLUMN "notificationNumber";

-- AlterTable
ALTER TABLE "RegistryOutgoingTexs" ADD COLUMN "gistridNumber" TEXT;
UPDATE "RegistryOutgoingTexs" SET "gistridNumber" = CASE
    WHEN "declarationNumber" IS NOT NULL THEN "declarationNumber"
    WHEN "notificationNumber" IS NOT NULL THEN "notificationNumber"
    ELSE "notificationNumber"
END;

ALTER TABLE "RegistryOutgoingTexs"
  DROP COLUMN "declarationNumber",
  DROP COLUMN "notificationNumber";

-- AlterTable
ALTER TABLE "RegistryOutgoingWaste" ADD COLUMN "gistridNumber" TEXT;
UPDATE "RegistryOutgoingWaste" SET "gistridNumber" = CASE
    WHEN "declarationNumber" IS NOT NULL THEN "declarationNumber"
    WHEN "notificationNumber" IS NOT NULL THEN "notificationNumber"
    ELSE "notificationNumber"
END;

ALTER TABLE "RegistryOutgoingWaste"
  DROP COLUMN "declarationNumber",
  DROP COLUMN "notificationNumber";

-- AlterTable
ALTER TABLE "RegistryTransported" ADD COLUMN "gistridNumber" TEXT;
UPDATE "RegistryTransported" SET "gistridNumber" = CASE
    WHEN "declarationNumber" IS NOT NULL THEN "declarationNumber"
    WHEN "notificationNumber" IS NOT NULL THEN "notificationNumber"
    ELSE "notificationNumber"
END;

ALTER TABLE "RegistryTransported"
  DROP COLUMN "declarationNumber",
  DROP COLUMN "notificationNumber";
