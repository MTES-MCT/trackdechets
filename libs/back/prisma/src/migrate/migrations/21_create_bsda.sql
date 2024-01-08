-- CreateEnum
CREATE TYPE "default$default"."BsdaStatus" AS ENUM ('INITIAL', 'SIGNED_BY_PRODUCER', 'SIGNED_BY_WORKER', 'SENT', 'PROCESSED', 'REFUSED', 'AWAITING_CHILD');

-- CreateEnum
CREATE TYPE "default$default"."BsdaType" AS ENUM ('COLLECTION_2710', 'OTHER_COLLECTIONS', 'GATHERING', 'RESHIPMENT');

-- CreateEnum
CREATE TYPE "default$default"."BsdaConsistence" AS ENUM ('SOLIDE', 'PULVERULENT', 'OTHER');

-- CreateTable
CREATE TABLE "default$default"."Bsda" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "status" "default$default"."BsdaStatus" NOT NULL DEFAULT E'INITIAL',
    "type" "default$default"."BsdaType" NOT NULL DEFAULT E'OTHER_COLLECTIONS',
    "emitterIsPrivateIndividual" BOOLEAN,
    "emitterCompanyName" TEXT,
    "emitterCompanySiret" TEXT,
    "emitterCompanyAddress" TEXT,
    "emitterCompanyContact" TEXT,
    "emitterCompanyPhone" TEXT,
    "emitterCompanyMail" TEXT,
    "emitterWorkSiteName" TEXT,
    "emitterWorkSiteAddress" TEXT,
    "emitterWorkSiteCity" TEXT,
    "emitterWorkSitePostalCode" TEXT,
    "emitterWorkSiteInfos" TEXT,
    "emitterEmissionSignatureAuthor" TEXT,
    "emitterEmissionSignatureDate" TIMESTAMP(3),
    "wasteCode" TEXT,
    "wasteName" TEXT,
    "wasteFamilyCode" TEXT,
    "wasteMaterialName" TEXT,
    "wasteConsistence" "default$default"."BsdaConsistence",
    "wasteSealNumbers" TEXT[],
    "wasteAdr" TEXT,
    "packagings" JSONB,
    "quantityType" "default$default"."QuantityType",
    "quantityValue" DECIMAL(65,30),
    "destinationCompanyName" TEXT,
    "destinationCompanySiret" TEXT,
    "destinationCompanyAddress" TEXT,
    "destinationCompanyContact" TEXT,
    "destinationCompanyPhone" TEXT,
    "destinationCompanyMail" TEXT,
    "destinationCap" TEXT,
    "destinationPlannedOperationCode" TEXT,
    "destinationReceptionDate" TIMESTAMP(3),
    "destinationReceptionQuantityType" "default$default"."QuantityType",
    "destinationReceptionQuantityValue" DECIMAL(65,30),
    "destinationReceptionAcceptationStatus" "default$default"."WasteAcceptationStatus",
    "destinationReceptionRefusalReason" TEXT,
    "destinationOperationCode" TEXT,
    "destinationOperationDate" TIMESTAMP(3),
    "destinationOperationSignatureAuthor" TEXT,
    "destinationOperationSignatureDate" TIMESTAMP(3),
    "transporterCompanyName" TEXT,
    "transporterCompanySiret" TEXT,
    "transporterCompanyAddress" TEXT,
    "transporterCompanyContact" TEXT,
    "transporterCompanyPhone" TEXT,
    "transporterCompanyMail" TEXT,
    "transporterCompanyVatNumber" TEXT,
    "transporterRecepisseNumber" TEXT,
    "transporterRecepisseDepartment" TEXT,
    "transporterRecepisseValidityLimit" TIMESTAMP(3),
    "transporterTransportSignatureAuthor" TEXT,
    "transporterTransportSignatureDate" TIMESTAMP(3),
    "workerCompanyName" TEXT,
    "workerCompanySiret" TEXT,
    "workerCompanyAddress" TEXT,
    "workerCompanyContact" TEXT,
    "workerCompanyPhone" TEXT,
    "workerCompanyMail" TEXT,
    "workerWorkHasEmitterPaperSignature" BOOLEAN,
    "workerWorkSignatureAuthor" TEXT,
    "workerWorkSignatureDate" TIMESTAMP(3),
    "childBsdaId" TEXT,

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "default$default"."Bsda" ADD FOREIGN KEY ("childBsdaId") REFERENCES "default$default"."Bsda"("id") ON DELETE SET NULL ON UPDATE CASCADE;
