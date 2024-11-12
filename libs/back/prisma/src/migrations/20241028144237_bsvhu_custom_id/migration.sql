-- AlterTable
ALTER TABLE "Bsvhu" ADD COLUMN     "customId" TEXT;

-- CreateIndex
CREATE INDEX "_BsvhuCustomIdIdx" ON "Bsvhu"("customId");
