-- CreateEnum
CREATE TYPE "default$default"."BsdasriStatus" AS ENUM ('INITIAL', 'SIGNED_BY_PRODUCER', 'SENT', 'RECEIVED', 'REFUSED_BY_RECIPIENT','PROCESSED', 'REFUSED');

CREATE TYPE "default$default"."BsdasriEmitterType" AS ENUM ('PRODUCER', 'COLLECTOR');


-- CreateTable
CREATE TABLE "default$default"."Bsdasri" (
    "id" TEXT NOT NULL,
    "status" "default$default"."BsdasriStatus" NOT NULL DEFAULT E'INITIAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,
    "isDeleted" BOOLEAN DEFAULT FALSE,
    "isDraft" BOOLEAN DEFAULT FALSE,
    "emitterType" "default$default"."BsdasriEmitterType" NOT NULL DEFAULT E'PRODUCER',
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
    "wasteDetailsCode" TEXT,
    "wasteDetailsOnuCode" TEXT,
    "emitterWasteQuantity" INTEGER,
    "emitterWasteQuantityType" "default$default"."QuantityType",
    "emitterWasteVolume" INTEGER,
    "emitterWastePackagingsInfo" JSONB,
    "emitterCustomInfo" TEXT,
    "emitterOnBehalfOfEcoorganisme" BOOLEAN DEFAULT FALSE,
    "handedOverToTransporterAt" TIMESTAMP(3),
    "emissionSignatureAuthor" TEXT,
    "emissionSignatureDate" TIMESTAMP(3),
    "isEmissionDirectTakenOver" BOOLEAN DEFAULT FALSE,
    "isEmissionTakenOverWithSecretCode" BOOLEAN DEFAULT FALSE,
    "transporterCompanyName" TEXT,
    "transporterCompanySiret" TEXT,
    "transporterCompanyAddress" TEXT,
    "transporterCompanyPhone" TEXT,
    "transporterCompanyContact" TEXT,
    "transporterCompanyMail" TEXT,
    "transporterReceipt" TEXT,
    "transporterReceiptDepartment" TEXT,
    "transporterReceiptValidityLimit" TIMESTAMP(3),
    "transporterWasteAcceptationStatus" "default$default"."WasteAcceptationStatus",
    "transporterWasteRefusalReason" TEXT,
    "transporterWasteRefusedQuantity" INTEGER,
    "transporterTakenOverAt" TIMESTAMP(3),
    "transporterWastePackagingsInfo" JSONB,
    "transporterWasteQuantity" INTEGER,
    "transporterWasteQuantityType" "default$default"."QuantityType",
    "transporterWasteVolume" INTEGER,
    "transporterCustomInfo" TEXT,
    "handedOverToRecipientAt" TIMESTAMP(3),
    "transportSignatureAuthor" TEXT,
    "transportSignatureDate" TIMESTAMP(3),
    "recipientCompanyName" TEXT,
    "recipientCompanySiret" TEXT,
    "recipientCompanyAddress" TEXT,
    "recipientCompanyContact" TEXT,
    "recipientCompanyPhone" TEXT,
    "recipientCompanyMail" TEXT,
    "recipientWastePackagingsInfo" JSONB,
    "recipientWasteAcceptationStatus" "default$default"."WasteAcceptationStatus",
    "recipientWasteRefusalReason" TEXT,
    "recipientWasteRefusedQuantity" INTEGER,
    "recipientWasteQuantity" INTEGER,
    "recipientWasteQuantityType" "default$default"."QuantityType",
    "recipientWasteVolume" INTEGER,
    "recipientCustomInfo" TEXT,
    "receivedAt" TIMESTAMP(3),
    "processingOperation" TEXT,
    "processedAt" TIMESTAMP(3),
    "receptionSignatureAuthor" TEXT,
    "receptionSignatureDate" TIMESTAMP(3),
    "operationSignatureDate" TIMESTAMP(3),
    "operationSignatureAuthor" TEXT,
    "emissionSignatoryId" TEXT,
    "transportSignatoryId" TEXT,
    "receptionSignatoryId" TEXT,
    "operationSignatoryId" TEXT,
    "regroupedOnBsdasriId" TEXT,

    PRIMARY KEY ("id")
);

 
-- Add Foreign Keys
ALTER TABLE "default$default"."Bsdasri" ADD FOREIGN KEY("ownerId")REFERENCES "default$default"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "default$default"."Bsdasri" ADD FOREIGN KEY("emissionSignatoryId")REFERENCES "default$default"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    
ALTER TABLE "default$default"."Bsdasri" ADD FOREIGN KEY("transportSignatoryId")REFERENCES "default$default"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
 
ALTER TABLE "default$default"."Bsdasri" ADD FOREIGN KEY("receptionSignatoryId")REFERENCES "default$default"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "default$default"."Bsdasri" ADD FOREIGN KEY("operationSignatoryId")REFERENCES "default$default"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- grouping
ALTER TABLE "default$default"."Bsdasri" ADD FOREIGN KEY("regroupedOnBsdasriId") REFERENCES "default$default"."Bsdasri"("id") ON DELETE SET NULL ON UPDATE CASCADE;
