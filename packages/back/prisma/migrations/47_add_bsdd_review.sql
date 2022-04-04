-- CreateEnum
CREATE TYPE "default$default"."RevisionRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REFUSED');

-- CreateTable
CREATE TABLE "default$default"."BsddRevisionRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bsddId" TEXT NOT NULL,
    "authoringCompanyId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "status" "default$default"."RevisionRequestStatus" DEFAULT E'PENDING',

    "recipientCap" TEXT,
    "wasteDetailsCode" TEXT,
    "wasteDetailsPop" BOOLEAN,
    "quantityReceived" FLOAT,
    "processingOperationDone" TEXT,
    "brokerCompanyName" TEXT,
    "brokerCompanySiret" TEXT,
    "brokerCompanyAddress" TEXT,
    "brokerCompanyContact" TEXT,
    "brokerCompanyPhone" TEXT,
    "brokerCompanyMail" TEXT,
    "brokerReceipt" TEXT,
    "brokerDepartment" TEXT,
    "brokerValidityLimit" TIMESTAMP(3),
    "traderCompanyAddress" TEXT,
    "traderCompanyContact" TEXT,
    "traderCompanyPhone" TEXT,
    "traderCompanyMail" TEXT,
    "traderReceipt" TEXT,
    "traderDepartment" TEXT,
    "traderValidityLimit" TIMESTAMP(3),
    "temporaryStorageDestinationCap" TEXT,
    "temporaryStorageDestinationProcessingOperation" TEXT,

    PRIMARY KEY ("id")
);

-- CreateEnum
CREATE TYPE "default$default"."RevisionRequestApprovalStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REFUSED', 'CANCELED');

-- CreateTable
CREATE TABLE "default$default"."BsddRevisionRequestApproval" (
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
ALTER TABLE "default$default"."BsddRevisionRequest" ADD FOREIGN KEY ("authoringCompanyId") REFERENCES "default$default"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "default$default"."BsddRevisionRequest" ADD FOREIGN KEY ("bsddId") REFERENCES "default$default"."Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "default$default"."BsddRevisionRequestApproval" ADD FOREIGN KEY ("revisionRequestId") REFERENCES "default$default"."BsddRevisionRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes

CREATE INDEX IF NOT EXISTS "_BsddRevisionRequestAuthoringCompanyIdIdx" ON "default$default"."BsddRevisionRequest"("authoringCompanyId");
CREATE INDEX IF NOT EXISTS "_BsddRevisionRequestBsddIdIdx" ON "default$default"."BsddRevisionRequest"("bsddId");

CREATE INDEX IF NOT EXISTS "_BsddRevisionRequestApprovalRevisionRequestIdIdx" ON "default$default"."BsddRevisionRequestApproval"("revisionRequestId");
CREATE INDEX IF NOT EXISTS "_BsddRevisionRequestApprovalApproverSiretIdx" ON "default$default"."BsddRevisionRequestApproval"("approverSiret");