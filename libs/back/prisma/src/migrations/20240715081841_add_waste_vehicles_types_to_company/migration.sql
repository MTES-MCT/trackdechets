-- CreateEnum
CREATE TYPE "WasteVehiclesType" AS ENUM ('BROYEUR', 'DEMOLISSEUR');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "wasteVehiclesTypes" "WasteVehiclesType"[];
