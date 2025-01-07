-- AlterEnum
ALTER TYPE "OperationMode" ADD VALUE 'UNKNOWN';

-- AlterEnum
ALTER TYPE "RegistryImportType" ADD VALUE 'INCOMING_TEXS';

-- AlterEnum
ALTER TYPE "TransportMode" ADD VALUE 'UNKNOWN';

-- DropIndex
DROP INDEX "_RegistryIncomingWastePublicIdReportForSiretIdx";

-- DropIndex
DROP INDEX "_RegistrySsdPublicIdReportForSiretIdx";

-- AlterTable
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "brokerName" TO "brokerCompanyName";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "brokerReceiptNumber" TO "brokerRecepisseNumber";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "brokerSiret" TO "brokerCompanySiret";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "municipalitiesInseeCodes" TO "initialEmitterMunicipalitiesInseeCodes";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "municipalitiesNames" TO "initialEmitterMunicipalitiesNames";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "producerAddress" TO "initialEmitterCompanyAddress";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "producerCity" TO "initialEmitterCompanyCity";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "producerCountryCode" TO "initialEmitterCompanyCountryCode";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "producerName" TO "initialEmitterCompanyName";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "producerOrgId" TO "initialEmitterCompanyOrgId";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "producerPostalCode" TO "initialEmitterCompanyPostalCode";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "producerType" TO "initialEmitterCompanyType";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "reportAsSiret" TO "reportAsCompanySiret";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "reportForAddress" TO "reportForCompanyAddress";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "reportForCity" TO "reportForCompanyCity";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "reportForName" TO "reportForCompanyName";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "reportForPostalCode" TO "reportForCompanyPostalCode";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "reportForSiret" TO "reportForCompanySiret";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "senderAddress" TO "emitterCompanyAddress";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "senderCity" TO "emitterCompanyCity";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "senderCountryCode" TO "emitterCompanyCountryCode";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "senderName" TO "emitterCompanyName";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "senderOrgId" TO "emitterCompanyOrgId";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "senderPostalCode" TO "emitterCompanyPostalCode";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "senderTakeOverAddress" TO "emitterPickupSiteAddress";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "senderTakeOverCity" TO "emitterPickupSiteCity";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "senderTakeOverCountryCode" TO "emitterPickupSiteCountryCode";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "senderTakeOverPostalCode" TO "emitterPickupSitePostalCode";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "senderType" TO "emitterCompanyType";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "traderName" TO "traderCompanyName";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "traderReceiptNumber" TO "traderRecepisseNumber";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "traderSiret" TO "traderCompanySiret";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter1Address" TO "transporter1CompanyAddress";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter1City" TO "transporter1CompanyCity";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter1CountryCode" TO "transporter1CompanyCountryCode";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter1Name" TO "transporter1CompanyName";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter1OrgId" TO "transporter1CompanyOrgId";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter1PostalCode" TO "transporter1CompanyPostalCode";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter1ReceiptNumber" TO "transporter1RecepisseNumber";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter1Type" TO "transporter1CompanyType";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter2Address" TO "transporter2CompanyAddress";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter2City" TO "transporter2CompanyCity";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter2CountryCode" TO "transporter2CompanyCountryCode";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter2Name" TO "transporter2CompanyName";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter2OrgId" TO "transporter2CompanyOrgId";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter2PostalCode" TO "transporter2CompanyPostalCode";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter2ReceiptNumber" TO "transporter2RecepisseNumber";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter2Type" TO "transporter2CompanyType";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter3Address" TO "transporter3CompanyAddress";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter3City" TO "transporter3CompanyCity";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter3CountryCode" TO "transporter3CompanyCountryCode";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter3Name" TO "transporter3CompanyName";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter3OrgId" TO "transporter3CompanyOrgId";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter3PostalCode" TO "transporter3CompanyPostalCode";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter3ReceiptNumber" TO "transporter3RecepisseNumber";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter3Type" TO "transporter3CompanyType";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter4Address" TO "transporter4CompanyAddress";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter4City" TO "transporter4CompanyCity";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter4CountryCode" TO "transporter4CompanyCountryCode";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter4Name" TO "transporter4CompanyName";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter4OrgId" TO "transporter4CompanyOrgId";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter4PostalCode" TO "transporter4CompanyPostalCode";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter4ReceiptNumber" TO "transporter4RecepisseNumber";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter4Type" TO "transporter4CompanyType";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter5Address" TO "transporter5CompanyAddress";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter5City" TO "transporter5CompanyCity";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter5CountryCode" TO "transporter5CompanyCountryCode";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter5Name" TO "transporter5CompanyName";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter5OrgId" TO "transporter5CompanyOrgId";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter5PostalCode" TO "transporter5CompanyPostalCode";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter5ReceiptNumber" TO "transporter5RecepisseNumber";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "transporter5Type" TO "transporter5CompanyType";

ALTER TABLE "RegistryIncomingWaste"
ADD COLUMN     "transporter1RecepisseIsExempted" BOOLEAN,
ADD COLUMN     "transporter2RecepisseIsExempted" BOOLEAN,
ADD COLUMN     "transporter3RecepisseIsExempted" BOOLEAN,
ADD COLUMN     "transporter4RecepisseIsExempted" BOOLEAN,
ADD COLUMN     "transporter5RecepisseIsExempted" BOOLEAN;

-- AlterTable
ALTER TABLE "RegistrySsd" RENAME COLUMN "destinationAddress" TO "destinationCompanyAddress";
ALTER TABLE "RegistrySsd" RENAME COLUMN "destinationCity" TO "destinationCompanyCity";
ALTER TABLE "RegistrySsd" RENAME COLUMN "destinationCountryCode" TO "destinationCompanyCountryCode";
ALTER TABLE "RegistrySsd" RENAME COLUMN "destinationName" TO "destinationCompanyName";
ALTER TABLE "RegistrySsd" RENAME COLUMN "destinationOrgId" TO "destinationCompanyOrgId";
ALTER TABLE "RegistrySsd" RENAME COLUMN "destinationPostalCode" TO "destinationCompanyPostalCode";
ALTER TABLE "RegistrySsd" RENAME COLUMN "destinationType" TO "destinationCompanyType";
ALTER TABLE "RegistrySsd" RENAME COLUMN "reportAsSiret" TO "reportAsCompanySiret";
ALTER TABLE "RegistrySsd" RENAME COLUMN "reportForAddress" TO "reportForCompanyAddress";
ALTER TABLE "RegistrySsd" RENAME COLUMN "reportForCity" TO "reportForCompanyCity";
ALTER TABLE "RegistrySsd" RENAME COLUMN "reportForName" TO "reportForCompanyName";
ALTER TABLE "RegistrySsd" RENAME COLUMN "reportForPostalCode" TO "reportForCompanyPostalCode";
ALTER TABLE "RegistrySsd" RENAME COLUMN "reportForSiret" TO "reportForCompanySiret";

-- CreateTable
CREATE TABLE "RegistryIncomingTexs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "importId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "reportForCompanySiret" TEXT NOT NULL,
    "reportForCompanyName" TEXT NOT NULL,
    "reportForCompanyAddress" TEXT NOT NULL,
    "reportForCompanyCity" TEXT NOT NULL,
    "reportForCompanyPostalCode" TEXT NOT NULL,
    "reportAsCompanySiret" TEXT,
    "customInfo" TEXT,
    "wasteCode" TEXT NOT NULL,
    "wastePop" BOOLEAN NOT NULL,
    "wasteIsDangerous" BOOLEAN,
    "receptionDate" TIMESTAMP(3) NOT NULL,
    "wasteDescription" TEXT NOT NULL,
    "wasteCodeBale" TEXT,
    "wasteDap" TEXT,
    "weightValue" DOUBLE PRECISION NOT NULL,
    "weightIsEstimate" BOOLEAN NOT NULL,
    "volume" DOUBLE PRECISION,
    "parcelInseeCodes" TEXT[],
    "parcelNumbers" TEXT[],
    "parcelCoordinates" TEXT[],
    "sisIdentifiers" TEXT[],
    "initialEmitterCompanyType" TEXT NOT NULL,
    "initialEmitterCompanyOrgId" TEXT,
    "initialEmitterCompanyName" TEXT,
    "initialEmitterCompanyAddress" TEXT,
    "initialEmitterCompanyPostalCode" TEXT,
    "initialEmitterCompanyCity" TEXT,
    "initialEmitterCompanyCountryCode" TEXT,
    "initialEmitterMunicipalitiesInseeCodes" TEXT[],
    "initialEmitterMunicipalitiesNames" TEXT[],
    "emitterCompanyType" TEXT NOT NULL,
    "emitterCompanyOrgId" TEXT,
    "emitterCompanyName" TEXT,
    "emitterPickupSiteAddress" TEXT,
    "emitterPickupSitePostalCode" TEXT,
    "emitterPickupSiteCity" TEXT,
    "emitterPickupSiteCountryCode" TEXT,
    "emitterCompanyAddress" TEXT,
    "emitterCompanyPostalCode" TEXT,
    "emitterCompanyCity" TEXT,
    "emitterCompanyCountryCode" TEXT,
    "brokerCompanySiret" TEXT,
    "brokerCompanyName" TEXT,
    "brokerRecepisseNumber" TEXT,
    "traderCompanySiret" TEXT,
    "traderCompanyName" TEXT,
    "traderRecepisseNumber" TEXT,
    "operationCode" TEXT NOT NULL,
    "operationMode" "OperationMode" NOT NULL,
    "noTraceability" BOOLEAN,
    "nextDestinationIsAbroad" BOOLEAN,
    "declarationNumber" TEXT,
    "notificationNumber" TEXT,
    "movementNumber" TEXT,
    "nextOperationCode" TEXT,
    "isUpcycled" BOOLEAN,
    "destinationParcelInseeCodes" TEXT[],
    "destinationParcelNumbers" TEXT[],
    "destinationParcelCoordinates" TEXT[],
    "transporter1TransportMode" "TransportMode" NOT NULL,
    "transporter1CompanyType" TEXT NOT NULL,
    "transporter1CompanyOrgId" TEXT,
    "transporter1RecepisseIsExempted" BOOLEAN,
    "transporter1RecepisseNumber" TEXT,
    "transporter1CompanyName" TEXT,
    "transporter1CompanyAddress" TEXT,
    "transporter1CompanyPostalCode" TEXT,
    "transporter1CompanyCity" TEXT,
    "transporter1CompanyCountryCode" TEXT,
    "transporter2TransportMode" "TransportMode",
    "transporter2CompanyType" TEXT,
    "transporter2CompanyOrgId" TEXT,
    "transporter2RecepisseIsExempted" BOOLEAN,
    "transporter2RecepisseNumber" TEXT,
    "transporter2CompanyName" TEXT,
    "transporter2CompanyAddress" TEXT,
    "transporter2CompanyPostalCode" TEXT,
    "transporter2CompanyCity" TEXT,
    "transporter2CompanyCountryCode" TEXT,
    "transporter3TransportMode" "TransportMode",
    "transporter3CompanyType" TEXT,
    "transporter3CompanyOrgId" TEXT,
    "transporter3RecepisseIsExempted" BOOLEAN,
    "transporter3RecepisseNumber" TEXT,
    "transporter3CompanyName" TEXT,
    "transporter3CompanyAddress" TEXT,
    "transporter3CompanyPostalCode" TEXT,
    "transporter3CompanyCity" TEXT,
    "transporter3CompanyCountryCode" TEXT,
    "transporter4TransportMode" "TransportMode",
    "transporter4CompanyType" TEXT,
    "transporter4CompanyOrgId" TEXT,
    "transporter4RecepisseIsExempted" BOOLEAN,
    "transporter4RecepisseNumber" TEXT,
    "transporter4CompanyName" TEXT,
    "transporter4CompanyAddress" TEXT,
    "transporter4CompanyPostalCode" TEXT,
    "transporter4CompanyCity" TEXT,
    "transporter4CompanyCountryCode" TEXT,
    "transporter5TransportMode" "TransportMode",
    "transporter5CompanyType" TEXT,
    "transporter5CompanyOrgId" TEXT,
    "transporter5RecepisseIsExempted" BOOLEAN,
    "transporter5RecepisseNumber" TEXT,
    "transporter5CompanyName" TEXT,
    "transporter5CompanyAddress" TEXT,
    "transporter5CompanyPostalCode" TEXT,
    "transporter5CompanyCity" TEXT,
    "transporter5CompanyCountryCode" TEXT,

    CONSTRAINT "RegistryIncomingTexs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "_RegistryIncomingTexsImportIdIdx" ON "RegistryIncomingTexs"("importId");

-- CreateIndex
CREATE INDEX "_RegistryIncomingTexsPublicIdReportForCompanySiretIdx" ON "RegistryIncomingTexs"("publicId", "reportForCompanySiret");

-- CreateIndex
CREATE INDEX "_RegistryIncomingWastePublicIdReportForCompanySiretIdx" ON "RegistryIncomingWaste"("publicId", "reportForCompanySiret");

-- CreateIndex
CREATE INDEX "_RegistrySsdPublicIdReportForSiretIdx" ON "RegistrySsd"("publicId", "reportForCompanySiret");

-- AddForeignKey
ALTER TABLE "RegistryIncomingTexs" ADD CONSTRAINT "RegistryIncomingTexs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
