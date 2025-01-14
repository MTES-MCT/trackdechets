/*
  Warnings:

  - Added the required column `operationMode` to the `RegistryIncomingWaste` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RegistryIncomingWaste" ADD COLUMN     "customInfo" TEXT,
ADD COLUMN     "nextDestinationIsAbroad" BOOLEAN,
ADD COLUMN     "nextOperationCode" TEXT,
ADD COLUMN     "noTraceability" BOOLEAN,
ADD COLUMN     "operationMode" "OperationMode" NOT NULL;
