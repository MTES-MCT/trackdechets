-- DropIndex
DROP INDEX IF EXISTS "default$default"."_BsdaTransporterCompanySiretIdx";

-- DropIndex
DROP INDEX IF EXISTS "default$default"."_BsdaTransporterCompanyVatNumberIdx";

-- CreateTable
CREATE TABLE "default$default"."BsdaTransporter" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "number" INTEGER NOT NULL,
    "bsdaId" TEXT,
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
    "transporterTransportMode" "default$default"."TransportMode" DEFAULT 'ROAD',
    "transporterTransportPlates" TEXT [],
    "transporterTransportTakenOverAt" TIMESTAMPTZ(6),
    "transporterTransportSignatureAuthor" TEXT,
    "transporterTransportSignatureDate" TIMESTAMPTZ(6),
    CONSTRAINT "BsdaTransporter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "_BsdaTransporterFormIdIdx" ON "default$default"."BsdaTransporter"("bsdaId");

-- CreateIndex
CREATE INDEX "_BsdaTransporterCompanySiretIdx" ON "default$default"."BsdaTransporter"("transporterCompanySiret");

-- CreateIndex
CREATE INDEX "_BsdaTransporterCompanyVatNumberIdx" ON "default$default"."BsdaTransporter"("transporterCompanyVatNumber");

-- AddForeignKey
ALTER TABLE
    "default$default"."BsdaTransporter"
ADD
    CONSTRAINT "BsdaTransporter_bsdaId_fkey" FOREIGN KEY ("bsdaId") REFERENCES "default$default"."Bsda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate first transporter from Bsda table to BsdaTransporter table
INSERT INTO
    "default$default"."BsdaTransporter" (
        "id",
        "createdAt",
        "updatedAt",
        "number",
        "bsdaId",
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
    "default$default"."Bsda";

-- AlterTable
ALTER TABLE
    "default$default"."Bsda" DROP COLUMN "transporterCompanyAddress",
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