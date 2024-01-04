/*
  Warnings:

  - You are about to drop the column `bsffId` on the `Bsff` table. All the data in the column will be lost.
  - Made the column `packagings` on table `Bsff` required. The migration will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "default$default"."Bsff" DROP CONSTRAINT "Bsff_bsffId_fkey";

-- AlterTable
ALTER TABLE "default$default"."Bsff" DROP COLUMN "bsffId",
ADD COLUMN     "nextBsffId" TEXT,
ALTER COLUMN "packagings" SET NOT NULL,
ALTER COLUMN "packagings" SET DEFAULT '[]';

-- AddForeignKey
ALTER TABLE "default$default"."Bsff" ADD FOREIGN KEY ("nextBsffId") REFERENCES "default$default"."Bsff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
