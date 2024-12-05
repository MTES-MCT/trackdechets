/*
  Warnings:

  - A unique constraint covering the columns `[dateId]` on the table `RegistryLookup` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "RegistryLookup_dateId_key" ON "RegistryLookup"("dateId");
