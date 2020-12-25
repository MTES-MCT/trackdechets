-- Most of the code has been generated with Prisma
-- Through a dry run: npx prisma migrate dev --create-only --preview-feature
-- A few edits have benn done: added schema, some TEXT to VARCHAR(X)

-- CreateEnum
CREATE TYPE "default$default"."VhuStatus" AS ENUM ('IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "default$default"."PackagingType" AS ENUM ('UNIT', 'BUNDLE');

-- CreateEnum
CREATE TYPE "default$default"."IdentificationType" AS ENUM ('VHU_NUMBER', 'BUNDLE_NUMBER');

-- CreateEnum
CREATE TYPE "default$default"."VhuQuantityUnit" AS ENUM ('TON', 'NUMBER');

-- CreateTable
CREATE TABLE "default$default"."Signature" (
    "id" SERIAL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signatoryId" VARCHAR(40) NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signedBy" VARCHAR(100) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "default$default"."VhuForm" (
    "id" VARCHAR(40) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" VARCHAR(40) NOT NULL,
    "status" "default$default"."VhuStatus" NOT NULL DEFAULT E'IN_PROGRESS',
    "emitterAgreement" VARCHAR(100),
    "emitterValidityLimit" TIMESTAMP(3),
    "emitterCompanyName" VARCHAR(100),
    "emitterCompanySiret" VARCHAR(17),
    "emitterCompanyAddress" TEXT,
    "emitterCompanyContact" VARCHAR(50),
    "emitterCompanyPhone" VARCHAR(15),
    "emitterCompanyMail" VARCHAR(50),
    "recipientOperationPlanned" VARCHAR(50),
    "recipientAgreement" VARCHAR(100),
    "recipientValidityLimit" TIMESTAMP(3),
    "recipientCompanyName" VARCHAR(100),
    "recipientCompanySiret" VARCHAR(17),
    "recipientCompanyAddress" TEXT,
    "recipientCompanyContact" VARCHAR(50),
    "recipientCompanyPhone" VARCHAR(15),
    "recipientCompanyMail" VARCHAR(50),
    "wasteDetailsPackagingType" "default$default"."PackagingType",
    "wasteDetailsIdentificationNumbers" TEXT[],
    "wasteDetailsIdentificationType" "default$default"."IdentificationType",
    "wasteDetailsQuantity" INTEGER,
    "wasteDetailsQuantityUnit" "default$default"."VhuQuantityUnit",
    "emitterSignatureId" INTEGER,
    "transporterAgreement" VARCHAR(100),
    "transporterCompanyName" VARCHAR(100),
    "transporterCompanySiret" VARCHAR(17),
    "transporterCompanyAddress" TEXT,
    "transporterCompanyContact" VARCHAR(50),
    "transporterCompanyPhone" VARCHAR(15),
    "transporterCompanyMail" VARCHAR(50),
    "transporterReceipt" VARCHAR(50),
    "transporterDepartment" VARCHAR(30),
    "transporterValidityLimit" TIMESTAMP(3),
    "transporterTransportType" TEXT,
    "transporterSignatureId" INTEGER,
    "recipientAcceptanceQuantity" DECIMAL(65,30),
    "recipientAcceptanceStatus" "default$default"."WasteAcceptationStatus",
    "recipientAcceptanceRefusalReason" TEXT,
    "recipientAcceptanceSignatureId" INTEGER,
    "recipientOperationDone" VARCHAR(50),
    "recipientOperationSignatureId" INTEGER,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VhuForm_emitterSignatureId_unique" ON "default$default"."VhuForm"("emitterSignatureId");

-- CreateIndex
CREATE UNIQUE INDEX "VhuForm_transporterSignatureId_unique" ON "default$default"."VhuForm"("transporterSignatureId");

-- CreateIndex
CREATE UNIQUE INDEX "VhuForm_recipientAcceptanceSignatureId_unique" ON "default$default"."VhuForm"("recipientAcceptanceSignatureId");

-- CreateIndex
CREATE UNIQUE INDEX "VhuForm_recipientOperationSignatureId_unique" ON "default$default"."VhuForm"("recipientOperationSignatureId");

-- AddForeignKey
ALTER TABLE "default$default"."Signature" ADD FOREIGN KEY("signatoryId")REFERENCES "default$default"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "default$default"."VhuForm" ADD FOREIGN KEY("ownerId")REFERENCES "default$default"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "default$default"."VhuForm" ADD FOREIGN KEY("emitterSignatureId")REFERENCES "default$default"."Signature"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "default$default"."VhuForm" ADD FOREIGN KEY("transporterSignatureId")REFERENCES "default$default"."Signature"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "default$default"."VhuForm" ADD FOREIGN KEY("recipientAcceptanceSignatureId")REFERENCES "default$default"."Signature"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "default$default"."VhuForm" ADD FOREIGN KEY("recipientOperationSignatureId")REFERENCES "default$default"."Signature"("id") ON DELETE SET NULL ON UPDATE CASCADE;