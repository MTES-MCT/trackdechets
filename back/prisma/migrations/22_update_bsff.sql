/*
  Warnings:

  - You are about to alter the column `quantityKilos` on the `Bsff` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `destinationReceptionKilos` on the `Bsff` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `kilos` on the `BsffFicheIntervention` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.

*/
-- AlterTable
ALTER TABLE "default$default"."Bsff" ADD COLUMN     "transporterCompanyVatNumber" TEXT,
ADD COLUMN     "destinationOperationNextDestinationCompanyName" TEXT,
ADD COLUMN     "destinationOperationNextDestinationCompanySiret" TEXT,
ADD COLUMN     "destinationOperationNextDestinationCompanyVatNumber" TEXT,
ADD COLUMN     "destinationOperationNextDestinationCompanyAddress" TEXT,
ADD COLUMN     "destinationOperationNextDestinationCompanyContact" TEXT,
ADD COLUMN     "destinationOperationNextDestinationCompanyPhone" TEXT,
ADD COLUMN     "destinationOperationNextDestinationCompanyMail" TEXT,
ALTER COLUMN "quantityKilos" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "destinationReceptionKilos" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "default$default"."BsffFicheIntervention" ALTER COLUMN "kilos" SET DATA TYPE DECIMAL(65,30);
