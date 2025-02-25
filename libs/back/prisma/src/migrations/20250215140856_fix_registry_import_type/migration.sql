/*
  Warnings:

  - The values [TRANSPORTED_WASTE,MANAGED_WASTE] on the enum `RegistryImportType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RegistryImportType_new" AS ENUM ('SSD', 'INCOMING_WASTE', 'INCOMING_TEXS', 'OUTGOING_WASTE', 'OUTGOING_TEXS', 'TRANSPORTED', 'MANAGED');
ALTER TABLE "RegistryImport" ALTER COLUMN "type" TYPE "RegistryImportType_new" USING ("type"::text::"RegistryImportType_new");
ALTER TYPE "RegistryImportType" RENAME TO "RegistryImportType_old";
ALTER TYPE "RegistryImportType_new" RENAME TO "RegistryImportType";
DROP TYPE "RegistryImportType_old";
COMMIT;
