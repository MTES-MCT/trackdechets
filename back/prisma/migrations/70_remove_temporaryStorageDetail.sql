/*
  Warnings:

  - You are about to drop the column `temporaryStorageDetailId` on the `Form` table. All the data in the column will be lost.
  - You are about to drop the `TemporaryStorageDetail` table. If the table is not empty, all the data it contains will be lost.

*/

-- AlterTable
ALTER TABLE "Form" ADD COLUMN "forwardedInId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Form_forwardedInId_key" ON "Form"("forwardedInId");


-- AddForeignKey
ALTER TABLE "Form" ADD CONSTRAINT "Form_forwardedInId_fkey" FOREIGN KEY ("forwardedInId") REFERENCES "Form"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- DropForeignKey
ALTER TABLE "Form" DROP CONSTRAINT "Form_temporaryStorageDetailId_fkey";

-- DropIndex
DROP INDEX "Form_temporaryStorageDetailId_key";

-- DropIndex
DROP INDEX "Form_temporaryStorageDetailId_key";

-- AlterTable
ALTER TABLE "Form" DROP COLUMN "temporaryStorageDetailId";

-- DropTable
DROP TABLE "TemporaryStorageDetail";
