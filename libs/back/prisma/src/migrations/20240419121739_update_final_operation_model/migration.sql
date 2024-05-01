/*
  Warnings:

  - You are about to drop the `FinalOperation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "FinalOperation" DROP CONSTRAINT "FinalOperation_formId_fkey";

-- DropTable
DROP TABLE "FinalOperation";

-- CreateTable
CREATE TABLE "BsddFinalOperation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "operationCode" TEXT NOT NULL,
    "noTraceability" BOOLEAN NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "finalFormId" TEXT NOT NULL,
    "initialFormId" TEXT NOT NULL,

    CONSTRAINT "BsddFinalOperation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "_FinalOperationInitialFormIdIdx" ON "BsddFinalOperation"("initialFormId");

-- CreateIndex
CREATE INDEX "_FinalOperationFinalFormIdIdx" ON "BsddFinalOperation"("finalFormId");

-- CreateIndex
CREATE UNIQUE INDEX "_FinalOperationFormsUniqueTogether" ON "BsddFinalOperation"("initialFormId", "finalFormId");

-- AddForeignKey
ALTER TABLE "BsddFinalOperation" ADD CONSTRAINT "BsddFinalOperation_finalFormId_fkey" FOREIGN KEY ("finalFormId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BsddFinalOperation" ADD CONSTRAINT "BsddFinalOperation_initialFormId_fkey" FOREIGN KEY ("initialFormId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;
