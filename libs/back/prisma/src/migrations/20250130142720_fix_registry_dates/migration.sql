-- AlterTable
ALTER TABLE "RegistryExport" ALTER COLUMN "startDate" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "endDate" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "RegistryIncomingTexs" ALTER COLUMN "receptionDate" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "RegistryIncomingWaste" ALTER COLUMN "receptionDate" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "RegistryOutgoingTexs" ALTER COLUMN "dispatchDate" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "RegistryOutgoingWaste" ALTER COLUMN "dispatchDate" SET DATA TYPE TIMESTAMPTZ(6);
