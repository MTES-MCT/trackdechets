-- CreateTable
CREATE TABLE "default$default"."Bsff" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "emitterCompanyName" TEXT,
    "emitterCompanySiret" TEXT,
    "emitterCompanyAddress" TEXT,
    "emitterCompanyContact" TEXT,
    "emitterCompanyPhone" TEXT,
    "emitterCompanyMail" TEXT,
    "emitterEmissionSignatureAuthor" TEXT,
    "emitterEmissionSignatureDate" TIMESTAMP(3),
    "packagings" JSONB,
    "wasteCode" TEXT,
    "wasteDescription" TEXT,
    "wasteAdr" TEXT,
    "quantityKilos" INTEGER,
    "quantityIsEstimate" BOOLEAN NOT NULL DEFAULT false,
    "transporterCompanyName" TEXT,
    "transporterCompanySiret" TEXT,
    "transporterCompanyAddress" TEXT,
    "transporterCompanyContact" TEXT,
    "transporterCompanyPhone" TEXT,
    "transporterCompanyMail" TEXT,
    "transporterRecepisseNumber" TEXT,
    "transporterRecepisseDepartment" TEXT,
    "transporterRecepisseValidityLimit" TIMESTAMP(3),
    "transporterTransportMode" "default$default"."TransportMode",
    "transporterTransportSignatureAuthor" TEXT,
    "transporterTransportSignatureDate" TIMESTAMP(3),
    "destinationCompanyName" TEXT,
    "destinationCompanySiret" TEXT,
    "destinationCompanyAddress" TEXT,
    "destinationCompanyContact" TEXT,
    "destinationCompanyPhone" TEXT,
    "destinationCompanyMail" TEXT,
    "destinationReceptionDate" TIMESTAMP(3),
    "destinationReceptionKilos" INTEGER,
    "destinationReceptionRefusal" TEXT,
    "destinationReceptionSignatureAuthor" TEXT,
    "destinationReceptionSignatureDate" TIMESTAMP(3),
    "destinationPlannedOperationCode" TEXT,
    "destinationPlannedOperationQualification" TEXT,
    "destinationOperationCode" TEXT,
    "destinationOperationQualification" TEXT,
    "destinationOperationSignatureAuthor" TEXT,
    "destinationOperationSignatureDate" TIMESTAMP(3),
    "destinationCap" TEXT,
    "bsffId" TEXT,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "default$default"."BsffFicheIntervention" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "numero" TEXT NOT NULL,
    "kilos" INTEGER NOT NULL,
    "postalCode" TEXT NOT NULL,
    "ownerCompanyName" TEXT NOT NULL,
    "ownerCompanySiret" TEXT NOT NULL,
    "ownerCompanyAddress" TEXT NOT NULL,
    "ownerCompanyContact" TEXT NOT NULL,
    "ownerCompanyPhone" TEXT NOT NULL,
    "ownerCompanyMail" TEXT NOT NULL,
    "bsffId" TEXT,

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "default$default"."Bsff" ADD FOREIGN KEY ("bsffId") REFERENCES "default$default"."Bsff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "default$default"."BsffFicheIntervention" ADD FOREIGN KEY ("bsffId") REFERENCES "default$default"."Bsff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
