/*
  Warnings:

  - You are about to drop the column `transporterCompanyAddress` on the `Bsvhu` table. All the data in the column will be lost.
  - You are about to drop the column `transporterCompanyContact` on the `Bsvhu` table. All the data in the column will be lost.
  - You are about to drop the column `transporterCompanyMail` on the `Bsvhu` table. All the data in the column will be lost.
  - You are about to drop the column `transporterCompanyName` on the `Bsvhu` table. All the data in the column will be lost.
  - You are about to drop the column `transporterCompanyPhone` on the `Bsvhu` table. All the data in the column will be lost.
  - You are about to drop the column `transporterCompanySiret` on the `Bsvhu` table. All the data in the column will be lost.
  - You are about to drop the column `transporterCompanyVatNumber` on the `Bsvhu` table. All the data in the column will be lost.
  - You are about to drop the column `transporterCustomInfo` on the `Bsvhu` table. All the data in the column will be lost.
  - You are about to drop the column `transporterRecepisseDepartment` on the `Bsvhu` table. All the data in the column will be lost.
  - You are about to drop the column `transporterRecepisseIsExempted` on the `Bsvhu` table. All the data in the column will be lost.
  - You are about to drop the column `transporterRecepisseNumber` on the `Bsvhu` table. All the data in the column will be lost.
  - You are about to drop the column `transporterRecepisseValidityLimit` on the `Bsvhu` table. All the data in the column will be lost.
  - You are about to drop the column `transporterTransportMode` on the `Bsvhu` table. All the data in the column will be lost.
  - You are about to drop the column `transporterTransportPlates` on the `Bsvhu` table. All the data in the column will be lost.
  - You are about to drop the column `transporterTransportSignatureAuthor` on the `Bsvhu` table. All the data in the column will be lost.
  - You are about to drop the column `transporterTransportTakenOverAt` on the `Bsvhu` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "default$default"."_BsvhuTransporterCompanySiretIdx";

-- DropIndex
DROP INDEX "default$default"."_BsvhuTransporterCompanyVatNumberIdx";

-- AlterTable
ALTER TABLE "Bsvhu" DROP COLUMN "transporterCompanyAddress",
DROP COLUMN "transporterCompanyContact",
DROP COLUMN "transporterCompanyMail",
DROP COLUMN "transporterCompanyName",
DROP COLUMN "transporterCompanyPhone",
DROP COLUMN "transporterCompanySiret",
DROP COLUMN "transporterCompanyVatNumber",
DROP COLUMN "transporterCustomInfo",
DROP COLUMN "transporterRecepisseDepartment",
DROP COLUMN "transporterRecepisseIsExempted",
DROP COLUMN "transporterRecepisseNumber",
DROP COLUMN "transporterRecepisseValidityLimit",
DROP COLUMN "transporterTransportMode",
DROP COLUMN "transporterTransportPlates",
DROP COLUMN "transporterTransportSignatureAuthor",
DROP COLUMN "transporterTransportTakenOverAt";
