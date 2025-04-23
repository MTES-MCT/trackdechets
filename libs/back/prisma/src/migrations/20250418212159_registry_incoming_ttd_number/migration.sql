/*
  Warnings:

  - You are about to drop the column `nextDestinationIsAbroad` on the `RegistryIncomingTexs` table. All the data in the column will be lost.
  - You are about to drop the column `nextDestinationIsAbroad` on the `RegistryIncomingWaste` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RegistryIncomingTexs" DROP COLUMN "nextDestinationIsAbroad";
ALTER TABLE "RegistryIncomingTexs" RENAME COLUMN "gistridNumber" TO "ttdImportNumber";

-- AlterTable
ALTER TABLE "RegistryIncomingWaste" DROP COLUMN "nextDestinationIsAbroad";
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "gistridNumber" TO "ttdImportNumber";
