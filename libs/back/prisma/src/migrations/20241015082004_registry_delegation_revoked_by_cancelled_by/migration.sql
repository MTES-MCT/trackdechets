/*
  Warnings:

  - You are about to drop the column `isRevoked` on the `RegistryDelegation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RegistryDelegation" DROP COLUMN "isRevoked",
ADD COLUMN     "cancelledBy" VARCHAR(30),
ADD COLUMN     "revokedBy" VARCHAR(30);
