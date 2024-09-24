-- AlterTable
ALTER TABLE "Bsvhu" ADD COLUMN     "intermediariesOrgIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "IntermediaryBsvhuAssociation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "siret" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "vatNumber" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "mail" TEXT,
    "bsvhuId" TEXT NOT NULL,

    CONSTRAINT "IntermediaryBsvhuAssociation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "_IntermediaryBsvhuAssociationBsvhuIdIdx" ON "IntermediaryBsvhuAssociation"("bsvhuId");

-- CreateIndex
CREATE INDEX "IntermediaryBsvhuAssociationSiretIdx" ON "IntermediaryBsvhuAssociation"("siret");

-- CreateIndex
CREATE INDEX "IntermediaryBsvhuAssociationVatNumberIdx" ON "IntermediaryBsvhuAssociation"("vatNumber");

-- CreateIndex
CREATE INDEX "_BsvhuIntermediariesOrgIdsIdx" ON "Bsvhu" USING GIN ("intermediariesOrgIds");

-- AddForeignKey
ALTER TABLE "IntermediaryBsvhuAssociation" ADD CONSTRAINT "IntermediaryBsvhuAssociation_bsvhuId_fkey" FOREIGN KEY ("bsvhuId") REFERENCES "Bsvhu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
