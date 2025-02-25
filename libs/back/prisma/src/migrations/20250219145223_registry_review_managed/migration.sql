-- AlterTable
ALTER TABLE "RegistryManaged" ADD COLUMN     "destinationParcelCoordinates" TEXT[],
ADD COLUMN     "destinationParcelInseeCodes" TEXT[],
ADD COLUMN     "destinationParcelNumbers" TEXT[],
ADD COLUMN     "initialEmitterMunicipalitiesInseeCodes" TEXT[],
ADD COLUMN     "initialEmitterMunicipalitiesNames" TEXT[],
ADD COLUMN     "isUpcycled" BOOLEAN,
ADD COLUMN     "parcelCoordinates" TEXT[],
ADD COLUMN     "parcelInseeCodes" TEXT[],
ADD COLUMN     "parcelNumbers" TEXT[],
ADD COLUMN     "sisIdentifier" TEXT,
ADD COLUMN     "tempStorerCompanyAddress" TEXT,
ADD COLUMN     "tempStorerCompanyCity" TEXT,
ADD COLUMN     "tempStorerCompanyCountryCode" TEXT,
ADD COLUMN     "tempStorerCompanyName" TEXT,
ADD COLUMN     "tempStorerCompanyOrgId" TEXT,
ADD COLUMN     "tempStorerCompanyPostalCode" TEXT,
ADD COLUMN     "tempStorerCompanyType" TEXT,
ADD COLUMN     "wasteDap" TEXT,
ALTER COLUMN "wasteCode" DROP NOT NULL;

-- AlterTable
ALTER TABLE "RegistryOutgoingTexs" ALTER COLUMN "initialEmitterCompanyType" DROP NOT NULL;
