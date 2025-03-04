/*
  Warnings:

  - You are about to drop the column `initialEmitterMunicipalitiesNames` on the `RegistryIncomingTexs` table. All the data in the column will be lost.
  - You are about to drop the column `initialEmitterMunicipalitiesNames` on the `RegistryIncomingWaste` table. All the data in the column will be lost.
  - You are about to drop the column `initialEmitterMunicipalitiesNames` on the `RegistryManaged` table. All the data in the column will be lost.
  - You are about to drop the column `initialEmitterMunicipalitiesNames` on the `RegistryOutgoingTexs` table. All the data in the column will be lost.
  - You are about to drop the column `initialEmitterMunicipalitiesNames` on the `RegistryOutgoingWaste` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RegistryIncomingTexs" DROP COLUMN "initialEmitterMunicipalitiesNames";

-- AlterTable
ALTER TABLE "RegistryIncomingWaste" DROP COLUMN "initialEmitterMunicipalitiesNames";

-- AlterTable
ALTER TABLE "RegistryManaged" DROP COLUMN "initialEmitterMunicipalitiesNames";

-- AlterTable
ALTER TABLE "RegistryOutgoingTexs" DROP COLUMN "initialEmitterMunicipalitiesNames";

-- AlterTable
ALTER TABLE "RegistryOutgoingWaste" DROP COLUMN "initialEmitterMunicipalitiesNames";
