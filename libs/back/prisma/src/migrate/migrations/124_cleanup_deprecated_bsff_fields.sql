/*
 Warnings:
 
 - You are about to drop the column `destinationOperationCode` on the `Bsff` table. All the data in the column will be lost.
 - You are about to drop the column `destinationOperationNextDestinationCompanyAddress` on the `Bsff` table. All the data in the column will be lost.
 - You are about to drop the column `destinationOperationNextDestinationCompanyContact` on the `Bsff` table. All the data in the column will be lost.
 - You are about to drop the column `destinationOperationNextDestinationCompanyMail` on the `Bsff` table. All the data in the column will be lost.
 - You are about to drop the column `destinationOperationNextDestinationCompanyName` on the `Bsff` table. All the data in the column will be lost.
 - You are about to drop the column `destinationOperationNextDestinationCompanyPhone` on the `Bsff` table. All the data in the column will be lost.
 - You are about to drop the column `destinationOperationNextDestinationCompanySiret` on the `Bsff` table. All the data in the column will be lost.
 - You are about to drop the column `destinationOperationNextDestinationCompanyVatNumber` on the `Bsff` table. All the data in the column will be lost.
 - You are about to drop the column `destinationOperationSignatureAuthor` on the `Bsff` table. All the data in the column will be lost.
 - You are about to drop the column `destinationOperationSignatureDate` on the `Bsff` table. All the data in the column will be lost.
 - You are about to drop the column `destinationReceptionAcceptationStatus` on the `Bsff` table. All the data in the column will be lost.
 - You are about to drop the column `destinationReceptionRefusalReason` on the `Bsff` table. All the data in the column will be lost.
 - You are about to drop the column `destinationReceptionWeight` on the `Bsff` table. All the data in the column will be lost.
 - You are about to drop the column `forwardingId` on the `Bsff` table. All the data in the column will be lost.
 - You are about to drop the column `groupedInId` on the `Bsff` table. All the data in the column will be lost.
 - You are about to drop the column `repackagedInId` on the `Bsff` table. All the data in the column will be lost.
 
 */
-- DropForeignKey
ALTER TABLE
  "default$default"."Bsff" DROP CONSTRAINT "Bsff_forwardingId_fkey";

-- DropForeignKey
ALTER TABLE
  "default$default"."Bsff" DROP CONSTRAINT "Bsff_groupedInId_fkey";

-- DropForeignKey
ALTER TABLE
  "default$default"."Bsff" DROP CONSTRAINT "Bsff_repackagedInId_fkey";

-- DropIndex
DROP INDEX "default$default"."Bsff_forwardingId_unique";

-- AlterTable
ALTER TABLE
  "default$default"."Bsff" DROP COLUMN "destinationOperationCode",
  DROP COLUMN "destinationOperationNextDestinationCompanyAddress",
  DROP COLUMN "destinationOperationNextDestinationCompanyContact",
  DROP COLUMN "destinationOperationNextDestinationCompanyMail",
  DROP COLUMN "destinationOperationNextDestinationCompanyName",
  DROP COLUMN "destinationOperationNextDestinationCompanyPhone",
  DROP COLUMN "destinationOperationNextDestinationCompanySiret",
  DROP COLUMN "destinationOperationNextDestinationCompanyVatNumber",
  DROP COLUMN "destinationOperationSignatureAuthor",
  DROP COLUMN "destinationOperationSignatureDate",
  DROP COLUMN "destinationReceptionAcceptationStatus",
  DROP COLUMN "destinationReceptionRefusalReason",
  DROP COLUMN "destinationReceptionWeight",
  DROP COLUMN "forwardingId",
  DROP COLUMN "groupedInId",
  DROP COLUMN "repackagedInId";