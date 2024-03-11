/*
  Warnings:

  - You are about to drop the column `repackagedInId` on the `Bsda` table. All the data in the column will be lost.
  - You are about to drop the column `transporterCompanyPhone` on the `Form` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[vatNumber]` on the table `AnonymousCompany` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[vatNumber]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - Made the column `status` on table `BsdaRevisionRequest` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `BsdaRevisionRequestApproval` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `BsddRevisionRequest` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `BsddRevisionRequestApproval` required. This step will fail if there are existing NULL values in that column.
  - Made the column `allowBsdasriTakeOverWithoutSignature` on table `Company` required. This step will fail if there are existing NULL values in that column.
  - Made the column `contact` on table `IntermediaryBsdaAssociation` required. This step will fail if there are existing NULL values in that column.
  - Made the column `contact` on table `IntermediaryFormAssociation` required. This step will fail if there are existing NULL values in that column.
  - Made the column `token` on table `PdfAccessToken` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bsdType` on table `PdfAccessToken` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bsdId` on table `PdfAccessToken` required. This step will fail if there are existing NULL values in that column.
  - Made the column `orgId` on table `WebhookSetting` required. This step will fail if there are existing NULL values in that column.
  - Made the column `activated` on table `WebhookSetting` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "BsdType" ADD VALUE 'BSPAOH';

-- AlterTable
ALTER TABLE "Bsda" DROP COLUMN "repackagedInId";

-- AlterTable
ALTER TABLE "BsdaRevisionRequest" ALTER COLUMN "status" SET NOT NULL;

-- AlterTable
ALTER TABLE "BsdaRevisionRequestApproval" ALTER COLUMN "status" SET NOT NULL;

-- AlterTable
ALTER TABLE "Bsdasri" ALTER COLUMN "emitterWastePackagings" SET DEFAULT '[]',
ALTER COLUMN "transporterWastePackagings" SET DEFAULT '[]',
ALTER COLUMN "destinationWastePackagings" SET DEFAULT '[]';

-- AlterTable
ALTER TABLE "BsddRevisionRequest" ALTER COLUMN "status" SET NOT NULL;

-- AlterTable
ALTER TABLE "BsddRevisionRequestApproval" ALTER COLUMN "status" SET NOT NULL;

-- AlterTable
ALTER TABLE "Bsff" ALTER COLUMN "transporterRecepisseIsExempted" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Company" ALTER COLUMN "allowBsdasriTakeOverWithoutSignature" SET NOT NULL;

-- AlterTable
ALTER TABLE "Form" DROP COLUMN "transporterCompanyPhone",
ALTER COLUMN "emitterIsPrivateIndividual" DROP NOT NULL,
ALTER COLUMN "emitterIsForeignShip" DROP NOT NULL,
ALTER COLUMN "wasteDetailsPackagingInfos" SET DEFAULT '[]';

-- AlterTable
ALTER TABLE "IntermediaryBsdaAssociation" ALTER COLUMN "contact" SET NOT NULL;

-- AlterTable
ALTER TABLE "IntermediaryFormAssociation" ALTER COLUMN "contact" SET NOT NULL;

-- AlterTable
ALTER TABLE "PdfAccessToken" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "expiresAt" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "token" SET NOT NULL,
ALTER COLUMN "bsdType" SET NOT NULL,
ALTER COLUMN "bsdId" SET NOT NULL,
ALTER COLUMN "lastUsed" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "visitedAt" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "WebhookSetting" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "orgId" SET NOT NULL,
ALTER COLUMN "activated" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AnonymousCompany.vatnumber_unique" ON "AnonymousCompany"("vatNumber");

-- CreateIndex
CREATE UNIQUE INDEX "_Company_vatNumber_unique" ON "Company"("vatNumber");

-- AddForeignKey
ALTER TABLE "Form" ADD CONSTRAINT "Form_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserActivationHash" ADD CONSTRAINT "UserActivationHash_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "default$default.AccessToken.token._UNIQUE" RENAME TO "AccessToken.token._UNIQUE";

-- RenameIndex
ALTER INDEX "AnonymousCompany_orgId_key" RENAME TO "AnonymousCompany.orgId_unique";

-- RenameIndex
ALTER INDEX "default$default.Company.siret._UNIQUE" RENAME TO "_Company_siret_unique";

-- RenameIndex
ALTER INDEX "default$default.EcoOrganisme.siret._UNIQUE" RENAME TO "EcoOrganisme.siret._UNIQUE";

-- RenameIndex
ALTER INDEX "default$default.Form.readableId._UNIQUE" RENAME TO "Form.readableId._UNIQUE";

-- RenameIndex
ALTER INDEX "default$default.Grant.code._UNIQUE" RENAME TO "Grant.code._UNIQUE";

-- RenameIndex
ALTER INDEX "default$default.UserAccountHash.hash._UNIQUE" RENAME TO "UserAccountHash.hash._UNIQUE";

-- RenameIndex
ALTER INDEX "default$default.UserActivationHash.hash._UNIQUE" RENAME TO "UserActivationHash.hash._UNIQUE";
