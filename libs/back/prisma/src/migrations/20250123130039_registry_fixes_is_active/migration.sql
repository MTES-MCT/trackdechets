/*
  Warnings:

  - Added the required column `emitterNoTraceability` to the `RegistryIncomingTexs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emitterNoTraceability` to the `RegistryIncomingWaste` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RegistryIncomingTexs" RENAME COLUMN "isActive" TO "isLatest";
ALTER TABLE "RegistryIncomingTexs" ADD COLUMN     "emitterNoTraceability" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "initialEmitterCompanyType" DROP NOT NULL;

ALTER TABLE "RegistryIncomingTexs" ALTER COLUMN "emitterNoTraceability" DROP DEFAULT;

-- AlterTable
ALTER TABLE "RegistryIncomingWaste" RENAME COLUMN "isActive" TO "isLatest";
ALTER TABLE "RegistryIncomingWaste" ADD COLUMN     "emitterNoTraceability" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "initialEmitterCompanyType" DROP NOT NULL;

ALTER TABLE "RegistryIncomingWaste" ALTER COLUMN "emitterNoTraceability" DROP DEFAULT;

-- AlterTable
ALTER TABLE "RegistryOutgoingTexs" RENAME COLUMN "isActive" TO "isLatest";

-- AlterTable
ALTER TABLE "RegistrySsd" RENAME COLUMN "isActive" TO "isLatest";
