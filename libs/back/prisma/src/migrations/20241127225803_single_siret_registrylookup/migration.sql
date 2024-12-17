/*
  Warnings:

  - The primary key for the `RegistryLookup` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `sirets` on the `RegistryLookup` table. All the data in the column will be lost.
  - Added the required column `siret` to the `RegistryLookup` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "_RegistryLookupMainIdx";

-- DropIndex
DROP INDEX "_RegistryLookupSiretsIdx";

-- AlterTable
ALTER TABLE "RegistryLookup" DROP CONSTRAINT "RegistryLookup_pkey",
DROP COLUMN "sirets",
ADD COLUMN     "siret" TEXT NOT NULL,
ADD CONSTRAINT "RegistryLookup_pkey" PRIMARY KEY ("id", "exportRegistryType", "siret");

-- CreateIndex
CREATE INDEX "_RegistryLookupMainIdx" ON "RegistryLookup"("date" ASC, "exportRegistryType", "siret");
