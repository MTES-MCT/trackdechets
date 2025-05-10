/*
  Warnings:

  - A unique constraint covering the columns `[declaredAtId]` on the table `RegistryLookup` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "RegistryLookup" ADD COLUMN     "declaredAtId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "_RegistryLookupDeclaredAtIdIdx" ON "RegistryLookup"("declaredAtId" DESC);
