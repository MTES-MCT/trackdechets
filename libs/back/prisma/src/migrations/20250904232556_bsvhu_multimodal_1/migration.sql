-- AlterTable
ALTER TABLE "default$default"."Bsvhu" ADD COLUMN     "transportersOrgIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "default$default"."BsvhuTransporter" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "number" INTEGER NOT NULL,
    "bsvhuId" TEXT,
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
    "transporterTransportPlates" TEXT[],
    "transporterTransportTakenOverAt" TIMESTAMPTZ(6),
    "transporterTransportSignatureAuthor" TEXT,
    "transporterTransportSignatureDate" TIMESTAMPTZ(6),

    CONSTRAINT "BsvhuTransporter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "_BsvhuTransporterIdIdx" ON "default$default"."BsvhuTransporter"("bsvhuId");

-- CreateIndex
CREATE INDEX "_BsvhuTransporterSiretIdx" ON "default$default"."BsvhuTransporter"("transporterCompanySiret");

-- CreateIndex
CREATE INDEX "_BsvhuTransporterVatNumberIdx" ON "default$default"."BsvhuTransporter"("transporterCompanyVatNumber");

-- CreateIndex
CREATE INDEX "_BsvhuTransportersOrgIdsIdx" ON "default$default"."Bsvhu" USING GIN ("transportersOrgIds");

-- AddForeignKey
ALTER TABLE "default$default"."BsvhuTransporter" ADD CONSTRAINT "BsvhuTransporter_bsvhuId_fkey" FOREIGN KEY ("bsvhuId") REFERENCES "default$default"."Bsvhu"("id") ON DELETE CASCADE ON UPDATE CASCADE;
