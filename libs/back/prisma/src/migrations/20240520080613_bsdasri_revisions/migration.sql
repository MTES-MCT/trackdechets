-- CreateTable
CREATE TABLE "BsdasriRevisionRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "RevisionRequestStatus" NOT NULL DEFAULT 'PENDING',
    "comment" TEXT NOT NULL,
    "isCanceled" BOOLEAN NOT NULL DEFAULT false,
    "bsdasriId" TEXT NOT NULL,
    "authoringCompanyId" TEXT NOT NULL,
    "wasteCode" TEXT,
    "destinationWastePackagings" JSONB,
    "destinationReceptionWasteWeightValue" DOUBLE PRECISION,
    "destinationOperationCode" TEXT,
    "destinationOperationMode" "OperationMode",
    "emitterPickupSiteName" TEXT,
    "emitterPickupSiteAddress" TEXT,
    "emitterPickupSiteCity" TEXT,
    "emitterPickupSitePostalCode" TEXT,
    "emitterPickupSiteInfos" TEXT,

    CONSTRAINT "BsdasriRevisionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BsdasriRevisionRequestApproval" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "revisionRequestId" TEXT NOT NULL,
    "approverSiret" TEXT NOT NULL,
    "status" "RevisionRequestApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "comment" TEXT,

    CONSTRAINT "BsdasriRevisionRequestApproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "_BsdasriRevisionRequestAuthoringCompanyIdIdx" ON "BsdasriRevisionRequest"("authoringCompanyId");

-- CreateIndex
CREATE INDEX "_BsdasriRevisionRequestStatusIdx" ON "BsdasriRevisionRequest"("status");

-- CreateIndex
CREATE INDEX "_BsdasriRevisionRequestBsdaIdIdx" ON "BsdasriRevisionRequest"("bsdasriId");

-- CreateIndex
CREATE INDEX "_BsdasriRevisionRequestApprovalRevisionRequestIdIdx" ON "BsdasriRevisionRequestApproval"("revisionRequestId");

-- CreateIndex
CREATE INDEX "_BsdasriRevisionRequestApprovalApproverSiretIdx" ON "BsdasriRevisionRequestApproval"("approverSiret");

-- AddForeignKey
ALTER TABLE "BsdasriRevisionRequest" ADD CONSTRAINT "BsdasriRevisionRequest_bsdasriId_fkey" FOREIGN KEY ("bsdasriId") REFERENCES "Bsdasri"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BsdasriRevisionRequest" ADD CONSTRAINT "BsdasriRevisionRequest_authoringCompanyId_fkey" FOREIGN KEY ("authoringCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BsdasriRevisionRequestApproval" ADD CONSTRAINT "BsdasriRevisionRequestApproval_revisionRequestId_fkey" FOREIGN KEY ("revisionRequestId") REFERENCES "BsdasriRevisionRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
