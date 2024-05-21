/*
 Warnings:
 
 - You are about to drop the column `transporterCompanyAddress` on the `Bsff` table. All the data in the column will be lost.
 - You are about to drop the column `transporterCompanyContact` on the `Bsff` table. All the data in the column will be lost.
 - You are about to drop the column `transporterCompanyMail` on the `Bsff` table. All the data in the column will be lost.
 - You are about to drop the column `transporterCompanyName` on the `Bsff` table. All the data in the column will be lost.
 - You are about to drop the column `transporterCompanyPhone` on the `Bsff` table. All the data in the column will be lost.
 - You are about to drop the column `transporterCompanySiret` on the `Bsff` table. All the data in the column will be lost.
 - You are about to drop the column `transporterCompanyVatNumber` on the `Bsff` table. All the data in the column will be lost.
 - You are about to drop the column `transporterCustomInfo` on the `Bsff` table. All the data in the column will be lost.
 - You are about to drop the column `transporterRecepisseDepartment` on the `Bsff` table. All the data in the column will be lost.
 - You are about to drop the column `transporterRecepisseIsExempted` on the `Bsff` table. All the data in the column will be lost.
 - You are about to drop the column `transporterRecepisseNumber` on the `Bsff` table. All the data in the column will be lost.
 - You are about to drop the column `transporterRecepisseValidityLimit` on the `Bsff` table. All the data in the column will be lost.
 - You are about to drop the column `transporterTransportMode` on the `Bsff` table. All the data in the column will be lost.
 - You are about to drop the column `transporterTransportPlates` on the `Bsff` table. All the data in the column will be lost.
 - You are about to drop the column `transporterTransportSignatureAuthor` on the `Bsff` table. All the data in the column will be lost.
 - You are about to drop the column `transporterTransportTakenOverAt` on the `Bsff` table. All the data in the column will be lost.
 
 */
ALTER TABLE
  "Bsff"
ADD
  COLUMN "transportersOrgIds" TEXT [] DEFAULT ARRAY [] :: TEXT [];

INSERT INTO
  "Bsff" ("transportersOrgIds")
SELECT
  ARRAY_REMOVE(
    ARRAY_REMOVE (
      ARRAY ["transporterCompanySiret", "transporterCompanyVatNumber"],
      NULL
    ),
    ''
  )
FROM
  "Bsff";

-- DropIndex
DROP INDEX IF EXISTS "_BsffTransporterCompanySiretIdx";

-- DropIndex
DROP INDEX IF EXISTS "_BsffTransporterCompanyVatNumberIdx";

-- CreateTable
CREATE TABLE "BsffTransporter" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  "number" INTEGER NOT NULL,
  "bsffId" TEXT,
  "transporterCompanySiret" TEXT,
  "transporterCompanyName" TEXT,
  "transporterCompanyVatNumber" TEXT,
  "transporterCompanyAddress" TEXT,
  "transporterCompanyContact" TEXT,
  "transporterCompanyPhone" TEXT,
  "transporterCompanyMail" TEXT,
  "transporterCustomInfo" TEXT,
  "transporterRecepisseIsExempted" BOOLEAN,
  "transporterRecepisseNumber" TEXT,
  "transporterRecepisseDepartment" TEXT,
  "transporterRecepisseValidityLimit" TIMESTAMPTZ(6),
  "transporterTransportMode" "TransportMode" DEFAULT 'ROAD',
  "transporterTransportPlates" TEXT [],
  "transporterTransportTakenOverAt" TIMESTAMPTZ(6),
  "transporterTransportSignatureAuthor" TEXT,
  "transporterTransportSignatureDate" TIMESTAMPTZ(6),
  CONSTRAINT "BsffTransporter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "_BsffTransporterBsffIdIdx" ON "BsffTransporter"("bsffId");

-- CreateIndex
CREATE INDEX "_BsffTransporterCompanySiretIdx" ON "BsffTransporter"("transporterCompanySiret");

-- CreateIndex
CREATE INDEX "_BsffTransporterCompanyVatNumberIdx" ON "BsffTransporter"("transporterCompanyVatNumber");

-- AddForeignKey
ALTER TABLE
  "BsffTransporter"
ADD
  CONSTRAINT "BsffTransporter_bsffId_fkey" FOREIGN KEY ("bsffId") REFERENCES "Bsff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate first transporter from Bsff table to BsffTransporter table
INSERT INTO
  "default$default"."BsffTransporter" (
    "id",
    "createdAt",
    "updatedAt",
    "number",
    "bsffId",
    "transporterCompanySiret",
    "transporterCompanyName",
    "transporterCompanyVatNumber",
    "transporterCompanyAddress",
    "transporterCompanyContact",
    "transporterCompanyPhone",
    "transporterCompanyMail",
    "transporterCustomInfo",
    "transporterRecepisseIsExempted",
    "transporterRecepisseNumber",
    "transporterRecepisseDepartment",
    "transporterRecepisseValidityLimit",
    "transporterTransportMode",
    "transporterTransportPlates",
    "transporterTransportTakenOverAt",
    "transporterTransportSignatureAuthor",
    "transporterTransportSignatureDate"
  )
SELECT
  "id",
  "createdAt",
  "updatedAt",
  1,
  "id",
  "transporterCompanySiret",
  "transporterCompanyName",
  "transporterCompanyVatNumber",
  "transporterCompanyAddress",
  "transporterCompanyContact",
  "transporterCompanyPhone",
  "transporterCompanyMail",
  "transporterCustomInfo",
  "transporterRecepisseIsExempted",
  "transporterRecepisseNumber",
  "transporterRecepisseDepartment",
  "transporterRecepisseValidityLimit",
  "transporterTransportMode",
  "transporterTransportPlates",
  "transporterTransportTakenOverAt",
  "transporterTransportSignatureAuthor",
  "transporterTransportSignatureDate"
FROM
  "default$default"."Bsff";

-- AlterTable
ALTER TABLE
  "Bsff" DROP COLUMN "transporterCompanyAddress",
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