-- AlterTable
ALTER TABLE "RegistryIncomingTexs" ALTER COLUMN "operationMode" DROP NOT NULL,
ALTER COLUMN "transporter1TransportMode" DROP NOT NULL,
ALTER COLUMN "transporter1CompanyType" DROP NOT NULL;

-- AlterTable
ALTER TABLE "RegistryIncomingWaste" ALTER COLUMN "transporter1TransportMode" DROP NOT NULL,
ALTER COLUMN "transporter1CompanyType" DROP NOT NULL;
