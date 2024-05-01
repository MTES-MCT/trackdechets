/*
  Warnings:

  - You are about to drop the column `destinationReceptionWasteWeightIsEstimate` on the `Bspaoh` table. All the data in the column will be lost.
  - You are about to drop the column `destinationReceptionWasteWeightValue` on the `Bspaoh` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Bspaoh" DROP COLUMN "destinationReceptionWasteWeightIsEstimate",
DROP COLUMN "destinationReceptionWasteWeightValue";
