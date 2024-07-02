-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "featureFlags" TEXT[] DEFAULT ARRAY[]::TEXT[];
