-- CreateTable
CREATE TABLE "BsdasriFinalOperation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "operationCode" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "finalBsdasriId" TEXT NOT NULL,
    "initialBsdasriId" TEXT NOT NULL,

    CONSTRAINT "BsdasriFinalOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BsffPackagingFinalOperation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "operationCode" TEXT NOT NULL,
    "noTraceability" BOOLEAN NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "finalBsffPackagingId" TEXT NOT NULL,
    "initialBsffPackagingId" TEXT NOT NULL,

    CONSTRAINT "BsffPackagingFinalOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BsdaFinalOperation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "operationCode" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "finalBsdaId" TEXT NOT NULL,
    "initialBsdaId" TEXT NOT NULL,

    CONSTRAINT "BsdaFinalOperation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "_FinalOperationInitialBsdasriIdIdx" ON "BsdasriFinalOperation"("initialBsdasriId");

-- CreateIndex
CREATE INDEX "_FinalOperationFinalBsdasriIdIdx" ON "BsdasriFinalOperation"("finalBsdasriId");

-- CreateIndex
CREATE UNIQUE INDEX "_FinalOperationBsdasrisUniqueTogether" ON "BsdasriFinalOperation"("initialBsdasriId", "finalBsdasriId");

-- CreateIndex
CREATE INDEX "_FinalOperationInitialBsffPackagingIdIdx" ON "BsffPackagingFinalOperation"("initialBsffPackagingId");

-- CreateIndex
CREATE INDEX "_FinalOperationFinalBsffPackagingIdIdx" ON "BsffPackagingFinalOperation"("finalBsffPackagingId");

-- CreateIndex
CREATE UNIQUE INDEX "_FinalOperationBsffPackagingsUniqueTogether" ON "BsffPackagingFinalOperation"("initialBsffPackagingId", "finalBsffPackagingId");

-- CreateIndex
CREATE INDEX "_FinalOperationInitialBsdaIdIdx" ON "BsdaFinalOperation"("initialBsdaId");

-- CreateIndex
CREATE INDEX "_FinalOperationFinalBsdaIdIdx" ON "BsdaFinalOperation"("finalBsdaId");

-- CreateIndex
CREATE UNIQUE INDEX "_FinalOperationBsdasUniqueTogether" ON "BsdaFinalOperation"("initialBsdaId", "finalBsdaId");

-- AddForeignKey
ALTER TABLE "BsdasriFinalOperation" ADD CONSTRAINT "BsdasriFinalOperation_finalBsdasriId_fkey" FOREIGN KEY ("finalBsdasriId") REFERENCES "Bsdasri"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BsdasriFinalOperation" ADD CONSTRAINT "BsdasriFinalOperation_initialBsdasriId_fkey" FOREIGN KEY ("initialBsdasriId") REFERENCES "Bsdasri"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BsffPackagingFinalOperation" ADD CONSTRAINT "BsffPackagingFinalOperation_finalBsffPackagingId_fkey" FOREIGN KEY ("finalBsffPackagingId") REFERENCES "BsffPackaging"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BsffPackagingFinalOperation" ADD CONSTRAINT "BsffPackagingFinalOperation_initialBsffPackagingId_fkey" FOREIGN KEY ("initialBsffPackagingId") REFERENCES "BsffPackaging"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BsdaFinalOperation" ADD CONSTRAINT "BsdaFinalOperation_finalBsdaId_fkey" FOREIGN KEY ("finalBsdaId") REFERENCES "Bsda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BsdaFinalOperation" ADD CONSTRAINT "BsdaFinalOperation_initialBsdaId_fkey" FOREIGN KEY ("initialBsdaId") REFERENCES "Bsda"("id") ON DELETE CASCADE ON UPDATE CASCADE;
