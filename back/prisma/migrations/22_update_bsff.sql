-- AlterTable
ALTER TABLE "default$default"."Bsff" ADD COLUMN     "transporterCompanyVatNumber" TEXT,
ADD COLUMN     "destinationOperationNextDestinationCompanyName" TEXT,
ADD COLUMN     "destinationOperationNextDestinationCompanySiret" TEXT,
ADD COLUMN     "destinationOperationNextDestinationCompanyVatNumber" TEXT,
ADD COLUMN     "destinationOperationNextDestinationCompanyAddress" TEXT,
ADD COLUMN     "destinationOperationNextDestinationCompanyContact" TEXT,
ADD COLUMN     "destinationOperationNextDestinationCompanyPhone" TEXT,
ADD COLUMN     "destinationOperationNextDestinationCompanyMail" TEXT;
