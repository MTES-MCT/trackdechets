-- CreateEnum
CREATE TYPE "CollectorType" AS ENUM ('NON_DANGEROUS_WASTES', 'DANGEROUS_WASTES', 'DEEE_WASTES', 'OTHER_NON_DANGEROUS_WASTES', 'OTHER_DANGEROUS_WASTES');

-- CreateEnum
CREATE TYPE "WasteProcessorType" AS ENUM ('DANGEROUS_WASTES_INCINERATION', 'NON_DANGEROUS_WASTES_INCINERATION', 'CREMATION', 'DANGEROUS_WASTES_STORAGE', 'NON_DANGEROUS_WASTES_STORAGE', 'INERT_WASTES_STORAGE', 'OTHER_DANGEROUS_WASTES', 'OTHER_NON_DANGEROUS_WASTES');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CompanyType" ADD VALUE 'INTERMEDIARY';
ALTER TYPE "CompanyType" ADD VALUE 'DISPOSAL_FACILITY';
ALTER TYPE "CompanyType" ADD VALUE 'RECOVERY_FACILITY';

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "collectorTypes" "CollectorType"[],
ADD COLUMN     "wasteProcessorTypes" "WasteProcessorType"[];
