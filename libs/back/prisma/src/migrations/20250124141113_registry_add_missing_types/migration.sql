-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RegistryImportType" ADD VALUE 'OUTGOING_WASTE';
ALTER TYPE "RegistryImportType" ADD VALUE 'OUTGOING_TEXS';
ALTER TYPE "RegistryImportType" ADD VALUE 'TRANSPORTED_WASTE';
ALTER TYPE "RegistryImportType" ADD VALUE 'MANAGED_WASTE';
