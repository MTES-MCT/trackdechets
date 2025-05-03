-- AlterTable
ALTER TABLE "RegistryIncomingTexs" ADD COLUMN "updatedAt" TIMESTAMPTZ(6);
UPDATE "RegistryIncomingTexs" SET "updatedAt" = "createdAt";
ALTER TABLE "RegistryIncomingTexs" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "RegistryIncomingWaste" ADD COLUMN "updatedAt" TIMESTAMPTZ(6);
UPDATE "RegistryIncomingWaste" SET "updatedAt" = "createdAt";
ALTER TABLE "RegistryIncomingWaste" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "RegistryManaged" ADD COLUMN "updatedAt" TIMESTAMPTZ(6);
UPDATE "RegistryManaged" SET "updatedAt" = "createdAt";
ALTER TABLE "RegistryManaged" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "RegistryOutgoingTexs" ADD COLUMN "updatedAt" TIMESTAMPTZ(6);
UPDATE "RegistryOutgoingTexs" SET "updatedAt" = "createdAt";
ALTER TABLE "RegistryOutgoingTexs" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "RegistryOutgoingWaste" ADD COLUMN "updatedAt" TIMESTAMPTZ(6);
UPDATE "RegistryOutgoingWaste" SET "updatedAt" = "createdAt";
ALTER TABLE "RegistryOutgoingWaste" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "RegistrySsd" ADD COLUMN "updatedAt" TIMESTAMPTZ(6);
UPDATE "RegistrySsd" SET "updatedAt" = "createdAt";
ALTER TABLE "RegistrySsd" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "RegistryTransported" ADD COLUMN "updatedAt" TIMESTAMPTZ(6);
UPDATE "RegistryTransported" SET "updatedAt" = "createdAt";
ALTER TABLE "RegistryTransported" ALTER COLUMN "updatedAt" SET NOT NULL;
