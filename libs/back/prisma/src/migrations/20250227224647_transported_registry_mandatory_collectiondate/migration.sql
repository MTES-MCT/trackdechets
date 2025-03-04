/*
  Warnings:

  - Made the column `collectionDate` on table `RegistryTransported` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "RegistryTransported" ALTER COLUMN "collectionDate" SET NOT NULL;
