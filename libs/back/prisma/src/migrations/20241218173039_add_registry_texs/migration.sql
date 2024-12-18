/*
  Warnings:

  - You are about to drop the column `brokerName` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `brokerReceiptNumber` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `brokerSiret` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `municipalitiesInseeCodes` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `municipalitiesNames` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `producerAddress` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `producerCity` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `producerCountryCode` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `producerName` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `producerOrgId` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `producerPostalCode` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `producerType` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `reportAsSiret` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `reportForAddress` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `reportForCity` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `reportForName` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `reportForPostalCode` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `reportForSiret` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `senderAddress` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `senderCity` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `senderCountryCode` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `senderName` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `senderOrgId` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `senderPostalCode` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `senderTakeOverAddress` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `senderTakeOverCity` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `senderTakeOverCountryCode` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `senderTakeOverPostalCode` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `senderType` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `traderName` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `traderReceiptNumber` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `traderSiret` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter1Address` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter1City` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter1CountryCode` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter1Name` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter1OrgId` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter1PostalCode` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter1ReceiptNumber` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter1Type` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter2Address` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter2City` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter2CountryCode` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter2Name` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter2OrgId` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter2PostalCode` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter2ReceiptNumber` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter2Type` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter3Address` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter3City` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter3CountryCode` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter3Name` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter3OrgId` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter3PostalCode` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter3ReceiptNumber` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter3Type` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter4Address` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter4City` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter4CountryCode` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter4Name` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter4OrgId` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter4PostalCode` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter4ReceiptNumber` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter4Type` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter5Address` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter5City` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter5CountryCode` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter5Name` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter5OrgId` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter5PostalCode` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter5ReceiptNumber` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `transporter5Type` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `destinationAddress` on the `RegistrySsd` table. All the data in the column will be lost.
  - You are about to drop the column `destinationCity` on the `RegistrySsd` table. All the data in the column will be lost.
  - You are about to drop the column `destinationCountryCode` on the `RegistrySsd` table. All the data in the column will be lost.
  - You are about to drop the column `destinationName` on the `RegistrySsd` table. All the data in the column will be lost.
  - You are about to drop the column `destinationOrgId` on the `RegistrySsd` table. All the data in the column will be lost.
  - You are about to drop the column `destinationPostalCode` on the `RegistrySsd` table. All the data in the column will be lost.
  - You are about to drop the column `destinationType` on the `RegistrySsd` table. All the data in the column will be lost.
  - You are about to drop the column `reportAsSiret` on the `RegistrySsd` table. All the data in the column will be lost.
  - You are about to drop the column `reportForAddress` on the `RegistrySsd` table. All the data in the column will be lost.
  - You are about to drop the column `reportForCity` on the `RegistrySsd` table. All the data in the column will be lost.
  - You are about to drop the column `reportForName` on the `RegistrySsd` table. All the data in the column will be lost.
  - You are about to drop the column `reportForPostalCode` on the `RegistrySsd` table. All the data in the column will be lost.
  - You are about to drop the column `reportForSiret` on the `RegistrySsd` table. All the data in the column will be lost.
  - Added the required column `emitterCompanyType` to the `RegistryIncomingWaste` table without a default value. This is not possible if the table is not empty.
  - Added the required column `initialEmitterCompanyType` to the `RegistryIncomingWaste` table without a default value. This is not possible if the table is not empty.
  - Added the required column `operationMode` to the `RegistryIncomingWaste` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reportForCompanyAddress` to the `RegistryIncomingWaste` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reportForCompanyCity` to the `RegistryIncomingWaste` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reportForCompanyName` to the `RegistryIncomingWaste` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reportForCompanyPostalCode` to the `RegistryIncomingWaste` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reportForCompanySiret` to the `RegistryIncomingWaste` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transporter1CompanyType` to the `RegistryIncomingWaste` table without a default value. This is not possible if the table is not empty.
  - Added the required column `destinationCompanyType` to the `RegistrySsd` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reportForCompanyAddress` to the `RegistrySsd` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reportForCompanyCity` to the `RegistrySsd` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reportForCompanyName` to the `RegistrySsd` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reportForCompanyPostalCode` to the `RegistrySsd` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reportForCompanySiret` to the `RegistrySsd` table without a default value. This is not possible if the table is not empty.

*/
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
ALTER TABLE "RegistryIncomingWaste"
RENAME COLUMN "brokerName" TO "brokerCompanyName",
RENAME COLUMN "brokerReceiptNumber" TO "brokerRecepisseNumber",
RENAME COLUMN "brokerSiret" TO "brokerCompanySiret",
RENAME COLUMN "municipalitiesInseeCodes" TO "initialEmitterMunicipalitiesInseeCodes",
RENAME COLUMN "municipalitiesNames" TO "initialEmitterMunicipalitiesNames",
RENAME COLUMN "producerAddress" TO "initialEmitterCompanyAddress",
RENAME COLUMN "producerCity" TO "initialEmitterCompanyCity",
RENAME COLUMN "producerCountryCode" TO "initialEmitterCompanyCountryCode",
RENAME COLUMN "producerName" TO "initialEmitterCompanyName",
RENAME COLUMN "producerOrgId" TO "initialEmitterCompanyOrgId",
RENAME COLUMN "producerPostalCode" TO "initialEmitterCompanyPostalCode",
RENAME COLUMN "producerType" TO "initialEmitterCompanyType",
RENAME COLUMN "reportAsSiret" TO "reportAsCompanySiret",
RENAME COLUMN "reportForAddress" TO "reportForCompanyAddress",
RENAME COLUMN "reportForCity" TO "reportForCompanyCity",
RENAME COLUMN "reportForName" TO "reportForCompanyName",
RENAME COLUMN "reportForPostalCode" TO "reportForCompanyPostalCode",
RENAME COLUMN "reportForSiret" TO "reportForCompanySiret",
RENAME COLUMN "senderAddress" TO "emitterCompanyAddress",
RENAME COLUMN "senderCity" TO "emitterCompanyCity",
RENAME COLUMN "senderCountryCode" TO "emitterCompanyCountryCode",
RENAME COLUMN "senderName" TO "emitterCompanyName",
RENAME COLUMN "senderOrgId" TO "emitterCompanyOrgId",
RENAME COLUMN "senderPostalCode" TO "emitterCompanyPostalCode",
RENAME COLUMN "senderTakeOverAddress" TO "emitterPickupSiteAddress",
RENAME COLUMN "senderTakeOverCity" TO "emitterPickupSiteCity",
RENAME COLUMN "senderTakeOverCountryCode" TO "emitterPickupSiteCountryCode",
RENAME COLUMN "senderTakeOverPostalCode" TO "emitterPickupSitePostalCode",
RENAME COLUMN "senderType" TO "emitterCompanyType",
RENAME COLUMN "traderName" TO "traderCompanyName",
RENAME COLUMN "traderReceiptNumber" TO "traderRecepisseNumber",
RENAME COLUMN "traderSiret" TO "traderCompanySiret",
RENAME COLUMN "transporter1Address" TO "transporter1CompanyAddress",
RENAME COLUMN "transporter1City" TO "transporter1CompanyCity",
RENAME COLUMN "transporter1CountryCode" TO "transporter1CompanyCountryCode",
RENAME COLUMN "transporter1Name" TO "transporter1CompanyName",
RENAME COLUMN "transporter1OrgId" TO "transporter1CompanyOrgId",
RENAME COLUMN "transporter1PostalCode" TO "transporter1CompanyPostalCode",
RENAME COLUMN "transporter1ReceiptNumber" TO "transporter1RecepisseNumber",
RENAME COLUMN "transporter1Type" TO "transporter1CompanyType",
RENAME COLUMN "transporter2Address" TO "transporter2CompanyAddress",
RENAME COLUMN "transporter2City" TO "transporter2CompanyCity",
RENAME COLUMN "transporter2CountryCode" TO "transporter2CompanyCountryCode",
RENAME COLUMN "transporter2Name" TO "transporter2CompanyName",
RENAME COLUMN "transporter2OrgId" TO "transporter2CompanyOrgId",
RENAME COLUMN "transporter2PostalCode" TO "transporter2CompanyPostalCode",
RENAME COLUMN "transporter2ReceiptNumber" TO "transporter2RecepisseNumber",
RENAME COLUMN "transporter2Type" TO "transporter2CompanyType",
RENAME COLUMN "transporter3Address" TO "transporter3CompanyAddress",
RENAME COLUMN "transporter3City" TO "transporter3CompanyCity",
RENAME COLUMN "transporter3CountryCode" TO "transporter3CompanyCountryCode",
RENAME COLUMN "transporter3Name" TO "transporter3CompanyName",
RENAME COLUMN "transporter3OrgId" TO "transporter3CompanyOrgId",
RENAME COLUMN "transporter3PostalCode" TO "transporter3CompanyPostalCode",
RENAME COLUMN "transporter3ReceiptNumber" TO "transporter3RecepisseNumber",
RENAME COLUMN "transporter3Type" TO "transporter3CompanyType",
RENAME COLUMN "transporter4Address" TO "transporter4CompanyAddress",
RENAME COLUMN "transporter4City" TO "transporter4CompanyCity",
RENAME COLUMN "transporter4CountryCode" TO "transporter4CompanyCountryCode",
RENAME COLUMN "transporter4Name" TO "transporter4CompanyName",
RENAME COLUMN "transporter4OrgId" TO "transporter4CompanyOrgId",
RENAME COLUMN "transporter4PostalCode" TO "transporter4CompanyPostalCode",
RENAME COLUMN "transporter4ReceiptNumber" TO "transporter4RecepisseNumber",
RENAME COLUMN "transporter4Type" TO "transporter4CompanyType",
RENAME COLUMN "transporter5Address" TO "transporter5CompanyAddress",
RENAME COLUMN "transporter5City" TO "transporter5CompanyCity",
RENAME COLUMN "transporter5CountryCode" TO "transporter5CompanyCountryCode",
RENAME COLUMN "transporter5Name" TO "transporter5CompanyName",
RENAME COLUMN "transporter5OrgId" TO "transporter5CompanyOrgId",
RENAME COLUMN "transporter5PostalCode" TO "transporter5CompanyPostalCode",
RENAME COLUMN "transporter5ReceiptNumber" TO "transporter5RecepisseNumber",
RENAME COLUMN "transporter5Type" TO "transporter5CompanyType",
ADD COLUMN     "transporter1RecepisseIsExempted" BOOLEAN,
ADD COLUMN     "transporter2RecepisseIsExempted" BOOLEAN,
ADD COLUMN     "transporter3RecepisseIsExempted" BOOLEAN,
ADD COLUMN     "transporter4RecepisseIsExempted" BOOLEAN,
ADD COLUMN     "transporter5RecepisseIsExempted" BOOLEAN;

-- AlterTable
ALTER TABLE "RegistrySsd"
RENAME COLUMN "destinationAddress" TO "destinationCompanyAddress",
RENAME COLUMN "destinationCity" TO "destinationCompanyCity",
RENAME COLUMN "destinationCountryCode" TO "destinationCompanyCountryCode",
RENAME COLUMN "destinationName" TO "destinationCompanyName",
RENAME COLUMN "destinationOrgId" TO "destinationCompanyOrgId",
RENAME COLUMN "destinationPostalCode" TO "destinationCompanyPostalCode",
RENAME COLUMN "destinationType" TO "destinationCompanyType",
RENAME COLUMN "reportAsSiret" TO "reportAsCompanySiret",
RENAME COLUMN "reportForAddress" TO "reportForCompanyAddress",
RENAME COLUMN "reportForCity" TO "reportForCompanyCity",
RENAME COLUMN "reportForName" TO "reportForCompanyName",
RENAME COLUMN "reportForPostalCode" TO "reportForCompanyPostalCode",
RENAME COLUMN "reportForSiret" TO "reportForCompanySiret";

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
