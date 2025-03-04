/*
  Warnings:

  - Made the column `dispatchDate` on table `RegistryOutgoingTexs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `dispatchDate` on table `RegistryOutgoingWaste` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "RegistryOutgoingTexs" ALTER COLUMN "dispatchDate" SET NOT NULL;

-- AlterTable
ALTER TABLE "RegistryOutgoingWaste" ALTER COLUMN "dispatchDate" SET NOT NULL;
