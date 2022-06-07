-- CreateTable
CREATE TABLE "default$default"."BsdaRevisionRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bsdaId" TEXT NOT NULL,
    "authoringCompanyId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "status" "default$default"."RevisionRequestStatus" DEFAULT E'PENDING',

    "wasteCode" TEXT,
    "wastePop" BOOLEAN,
    "packagings" JSONB,
    "wasteSealNumbers" TEXT[],
    "wasteMaterialName" TEXT,
    "destinationCap" TEXT,
    "destinationReceptionWeight" FLOAT,
    "destinationOperationCode" TEXT,
    "destinationOperationDescription" TEXT,
    "brokerCompanyName" TEXT,
    "brokerCompanySiret" TEXT,
    "brokerCompanyAddress" TEXT,
    "brokerCompanyContact" TEXT,
    "brokerCompanyPhone" TEXT,
    "brokerCompanyMail" TEXT,
    "brokerRecepisseNumber" TEXT,
    "brokerRecepisseDepartment" TEXT,
    "brokerRecepisseValidityLimit" TIMESTAMPTZ(6),
    "emitterPickupSiteName" TEXT,
    "emitterPickupSiteAddress" TEXT,
    "emitterPickupSiteCity" TEXT,
    "emitterPickupSitePostalCode" TEXT,
    "emitterPickupSiteInfos" TEXT,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "default$default"."BsdaRevisionRequestApproval" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "revisionRequestId" TEXT NOT NULL,
    "approverSiret" TEXT NOT NULL,
    "status" "default$default"."RevisionRequestApprovalStatus" DEFAULT E'PENDING',
    "comment" TEXT,

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "default$default"."BsdaRevisionRequest" ADD FOREIGN KEY ("authoringCompanyId") REFERENCES "default$default"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "default$default"."BsdaRevisionRequest" ADD FOREIGN KEY ("bsdaId") REFERENCES "default$default"."Bsda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "default$default"."BsdaRevisionRequestApproval" ADD FOREIGN KEY ("revisionRequestId") REFERENCES "default$default"."BsdaRevisionRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes

CREATE INDEX IF NOT EXISTS "_BsdaRevisionRequestAuthoringCompanyIdIdx" ON "default$default"."BsdaRevisionRequest"("authoringCompanyId");
CREATE INDEX IF NOT EXISTS "_BsdaRevisionRequestBsdaIdIdx" ON "default$default"."BsdaRevisionRequest"("bsdaId");

CREATE INDEX IF NOT EXISTS "_BsdaRevisionRequestApprovalRevisionRequestIdIdx" ON "default$default"."BsdaRevisionRequestApproval"("revisionRequestId");
CREATE INDEX IF NOT EXISTS "_BsdaRevisionRequestApprovalApproverSiretIdx" ON "default$default"."BsdaRevisionRequestApproval"("approverSiret");