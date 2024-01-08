/*
 Warnings:

 - You are about to drop the column `childBsdaId` on the `Bsda` table. All the data in the column will be lost.
 - You are about to drop the column `quantityType` on the `Bsda` table. All the data in the column will be lost.
 - You are about to drop the column `nextBsffId` on the `Bsff` table. All the data in the column will be lost.
 - You are about to drop the column `packagingsJson` on the `Bsff` table. All the data in the column will be lost.
 - You are about to drop the column `temporaryStorageDetailId` on the `Form` table. All the data in the column will be lost.
 - You are about to drop the `TemporaryStorageDetail` table. If the table is not empty, all the data it contains will be lost.

 */
-- DropForeignKey
ALTER TABLE
  "default$default"."Bsda" DROP CONSTRAINT "Bsda_childBsdaId_fkey";

-- DropForeignKey
ALTER TABLE
  "default$default"."Bsff" DROP CONSTRAINT "Bsff_nextBsffId_fkey";

-- DropForeignKey
ALTER TABLE
  "default$default"."Form" DROP CONSTRAINT "Form_temporaryStorageDetail_fkey";

-- AlterTable
ALTER TABLE
  "default$default"."Bsda" DROP COLUMN "childBsdaId",
  DROP COLUMN "quantityType";

-- AlterTable
ALTER TABLE
  "default$default"."Bsff" DROP COLUMN "nextBsffId",
  DROP COLUMN "packagingsJson";

-- AlterTable
ALTER TABLE
  "default$default"."Form" DROP COLUMN "temporaryStorageDetailId";

-- DropTable
DROP TABLE "default$default"."TemporaryStorageDetail";