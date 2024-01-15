-- AlterTable
ALTER TABLE
  "default$default"."BsffPackaging"
ADD
  COLUMN "acceptationDate" TIMESTAMPTZ(6),
ADD
  COLUMN "acceptationRefusalReason" TEXT,
ADD
  COLUMN "acceptationSignatureAuthor" TEXT,
ADD
  COLUMN "acceptationSignatureDate" TIMESTAMPTZ(6),
ADD
  COLUMN "acceptationStatus" "default$default"."WasteAcceptationStatus",
ADD
  COLUMN "acceptationWeight" DOUBLE PRECISION,
ADD
  COLUMN "acceptationWasteCode" TEXT,
ADD
  COLUMN "acceptationWasteDescription" TEXT,
ADD
  COLUMN "operationDate" TIMESTAMPTZ(6),
ADD
  COLUMN "operationCode" TEXT,
ADD
  COLUMN "operationDescription" TEXT,
ADD
  COLUMN "operationNoTraceability" BOOLEAN NOT NULL DEFAULT false,
ADD
  COLUMN "operationSignatureAuthor" TEXT,
ADD
  COLUMN "operationSignatureDate" TIMESTAMPTZ(6),
ADD
  COLUMN "operationNextDestinationPlannedOperationCode" TEXT,
ADD
  COLUMN "operationNextDestinationCap" TEXT,
ADD
  COLUMN "operationNextDestinationCompanyAddress" TEXT,
ADD
  COLUMN "operationNextDestinationCompanyContact" TEXT,
ADD
  COLUMN "operationNextDestinationCompanyMail" TEXT,
ADD
  COLUMN "operationNextDestinationCompanyName" TEXT,
ADD
  COLUMN "operationNextDestinationCompanyPhone" TEXT,
ADD
  COLUMN "operationNextDestinationCompanySiret" TEXT,
ADD
  COLUMN "operationNextDestinationCompanyVatNumber" TEXT,
ADD
  COLUMN "nextPackagingId" TEXT;


-- CreateIndex
CREATE INDEX "_BsffPackagingNextPackagingIdx" ON "default$default"."BsffPackaging"("nextPackagingId");

-- AddForeignKey
ALTER TABLE
  "default$default"."BsffPackaging"
ADD
  CONSTRAINT "BsffPackaging_nextPackagingId_fkey" FOREIGN KEY ("nextPackagingId") REFERENCES "default$default"."BsffPackaging"("id") ON DELETE
SET
  NULL ON UPDATE CASCADE;

ALTER TYPE "default$default"."BsffStatus"
ADD
  VALUE 'ACCEPTED';

ALTER TYPE "default$default"."BsffStatus"
ADD
  VALUE 'PARTIALLY_REFUSED';

-- AlterTable
ALTER TABLE
  "default$default"."Bsff"
ADD
  COLUMN "destinationCap" TEXT;