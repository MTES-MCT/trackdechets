/*
  Warnings:

  - Added the required column `dateId` to the `RegistryLookup` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RegistryLookup" ADD COLUMN     "dateId" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "_RegistryLookupDateIdIdx" ON "RegistryLookup"("dateId" DESC);
