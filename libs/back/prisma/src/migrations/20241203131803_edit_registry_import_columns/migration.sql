/*
  Warnings:

  - You are about to drop the column `documentNumber` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `notificationDocumentInputNumber` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `senderTakeOverFullAddress` on the `RegistryIncomingWaste` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "_RegistrySsdPublicIdIdx";

-- AlterTable
ALTER TABLE "RegistryIncomingWaste" DROP COLUMN "documentNumber",
DROP COLUMN "notificationDocumentInputNumber",
DROP COLUMN "senderTakeOverFullAddress",
ADD COLUMN     "declarationNumber" TEXT,
ADD COLUMN     "movementNumber" TEXT,
ADD COLUMN     "senderTakeOverAddress" TEXT,
ADD COLUMN     "senderTakeOverCity" TEXT,
ADD COLUMN     "senderTakeOverCountryCode" TEXT,
ADD COLUMN     "senderTakeOverPostalCode" TEXT;

-- CreateIndex
CREATE INDEX "_RegistryIncomingWasteImportIdIdx" ON "RegistryIncomingWaste"("importId");

-- CreateIndex
CREATE INDEX "_RegistryIncomingWastePublicIdReportForSiretIdx" ON "RegistryIncomingWaste"("publicId", "reportForSiret");

-- CreateIndex
CREATE INDEX "_RegistrySsdPublicIdReportForSiretIdx" ON "RegistrySsd"("publicId", "reportForSiret");
