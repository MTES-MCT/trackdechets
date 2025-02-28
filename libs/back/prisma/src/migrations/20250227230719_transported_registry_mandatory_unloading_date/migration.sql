/*
  Warnings:

  - Made the column `unloadingDate` on table `RegistryTransported` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "RegistryTransported" ALTER COLUMN "unloadingDate" SET NOT NULL;
