/*
  Warnings:

  - The primary key for the `RegistryExport` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `RegistryExport` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RegistryExport" DROP CONSTRAINT "RegistryExport_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "RegistryExport_pkey" PRIMARY KEY ("readableId", "exportRegistryType");
