/*
  Warnings:

  - You are about to drop the column `openIdEnabled` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `openIdEnabled` on the `Grant` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Application" DROP COLUMN "openIdEnabled";

-- AlterTable
ALTER TABLE "Grant" DROP COLUMN "openIdEnabled";
