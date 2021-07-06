/*
  Warnings:

  - You are about to drop the column `destinationPlannedOperationQualification` on the `Bsff` table. All the data in the column will be lost.
  - You are about to drop the column `destinationOperationQualification` on the `Bsff` table. All the data in the column will be lost.
  - You are about to drop the column `ownerCompanyName` on the `BsffFicheIntervention` table. All the data in the column will be lost.
  - You are about to drop the column `ownerCompanySiret` on the `BsffFicheIntervention` table. All the data in the column will be lost.
  - You are about to drop the column `ownerCompanyAddress` on the `BsffFicheIntervention` table. All the data in the column will be lost.
  - You are about to drop the column `ownerCompanyContact` on the `BsffFicheIntervention` table. All the data in the column will be lost.
  - You are about to drop the column `ownerCompanyPhone` on the `BsffFicheIntervention` table. All the data in the column will be lost.
  - You are about to drop the column `ownerCompanyMail` on the `BsffFicheIntervention` table. All the data in the column will be lost.
  - Added the required column `detenteurCompanyName` to the `BsffFicheIntervention` table without a default value. This is not possible if the table is not empty.
  - Added the required column `detenteurCompanySiret` to the `BsffFicheIntervention` table without a default value. This is not possible if the table is not empty.
  - Added the required column `detenteurCompanyAddress` to the `BsffFicheIntervention` table without a default value. This is not possible if the table is not empty.
  - Added the required column `detenteurCompanyContact` to the `BsffFicheIntervention` table without a default value. This is not possible if the table is not empty.
  - Added the required column `detenteurCompanyPhone` to the `BsffFicheIntervention` table without a default value. This is not possible if the table is not empty.
  - Added the required column `detenteurCompanyMail` to the `BsffFicheIntervention` table without a default value. This is not possible if the table is not empty.
  - Added the required column `operateurCompanyName` to the `BsffFicheIntervention` table without a default value. This is not possible if the table is not empty.
  - Added the required column `operateurCompanySiret` to the `BsffFicheIntervention` table without a default value. This is not possible if the table is not empty.
  - Added the required column `operateurCompanyAddress` to the `BsffFicheIntervention` table without a default value. This is not possible if the table is not empty.
  - Added the required column `operateurCompanyContact` to the `BsffFicheIntervention` table without a default value. This is not possible if the table is not empty.
  - Added the required column `operateurCompanyPhone` to the `BsffFicheIntervention` table without a default value. This is not possible if the table is not empty.
  - Added the required column `operateurCompanyMail` to the `BsffFicheIntervention` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "default$default"."BsffStatus" AS ENUM ('INITIAL', 'SIGNED_BY_EMITTER', 'SENT', 'RECEIVED', 'PROCESSED', 'REFUSED');

-- AlterTable
ALTER TABLE "default$default"."Bsff" DROP COLUMN "destinationPlannedOperationQualification",
DROP COLUMN "destinationOperationQualification",
ADD COLUMN     "status" "default$default"."BsffStatus" NOT NULL DEFAULT E'INITIAL',
ADD COLUMN     "wasteNature" TEXT;

-- AlterTable
ALTER TABLE "default$default"."BsffFicheIntervention" DROP COLUMN "ownerCompanyName",
DROP COLUMN "ownerCompanySiret",
DROP COLUMN "ownerCompanyAddress",
DROP COLUMN "ownerCompanyContact",
DROP COLUMN "ownerCompanyPhone",
DROP COLUMN "ownerCompanyMail",
ADD COLUMN     "detenteurCompanyName" TEXT NOT NULL,
ADD COLUMN     "detenteurCompanySiret" TEXT NOT NULL,
ADD COLUMN     "detenteurCompanyAddress" TEXT NOT NULL,
ADD COLUMN     "detenteurCompanyContact" TEXT NOT NULL,
ADD COLUMN     "detenteurCompanyPhone" TEXT NOT NULL,
ADD COLUMN     "detenteurCompanyMail" TEXT NOT NULL,
ADD COLUMN     "operateurCompanyName" TEXT NOT NULL,
ADD COLUMN     "operateurCompanySiret" TEXT NOT NULL,
ADD COLUMN     "operateurCompanyAddress" TEXT NOT NULL,
ADD COLUMN     "operateurCompanyContact" TEXT NOT NULL,
ADD COLUMN     "operateurCompanyPhone" TEXT NOT NULL,
ADD COLUMN     "operateurCompanyMail" TEXT NOT NULL;
