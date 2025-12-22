-- AlterTable
ALTER TABLE "Form" ADD COLUMN     "destinationParcelCoordinates" TEXT[],
ADD COLUMN     "destinationParcelInseeCodes" TEXT[],
ADD COLUMN     "destinationParcelNumbers" TEXT[],
ADD COLUMN     "isUpcycled" BOOLEAN;
