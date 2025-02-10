/*
  Warnings:

  - You are about to drop the column `reportAsSirets` on the `RegistryLookup` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "_RegistryLookupReportAsSiretsIdx";

-- AlterTable
ALTER TABLE "RegistryLookup" DROP COLUMN "reportAsSirets",
ADD COLUMN     "reportAsSiret" TEXT;

-- CreateIndex
CREATE INDEX "_RegistryLookupReportAsSiretIdx" ON "RegistryLookup"("reportAsSiret");
