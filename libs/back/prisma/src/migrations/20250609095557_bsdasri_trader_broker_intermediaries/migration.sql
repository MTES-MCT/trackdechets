-- AlterTable
ALTER TABLE "Bsdasri" ADD COLUMN     "brokerCompanyAddress" TEXT,
ADD COLUMN     "brokerCompanyContact" TEXT,
ADD COLUMN     "brokerCompanyMail" TEXT,
ADD COLUMN     "brokerCompanyName" TEXT,
ADD COLUMN     "brokerCompanyPhone" TEXT,
ADD COLUMN     "brokerCompanySiret" TEXT,
ADD COLUMN     "brokerRecepisseDepartment" TEXT,
ADD COLUMN     "brokerRecepisseNumber" TEXT,
ADD COLUMN     "brokerRecepisseValidityLimit" TIMESTAMPTZ(6),
ADD COLUMN     "intermediariesOrgIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "traderCompanyAddress" TEXT,
ADD COLUMN     "traderCompanyContact" TEXT,
ADD COLUMN     "traderCompanyMail" TEXT,
ADD COLUMN     "traderCompanyName" TEXT,
ADD COLUMN     "traderCompanyPhone" TEXT,
ADD COLUMN     "traderCompanySiret" TEXT,
ADD COLUMN     "traderRecepisseDepartment" TEXT,
ADD COLUMN     "traderRecepisseNumber" TEXT,
ADD COLUMN     "traderRecepisseValidityLimit" TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE "IntermediaryBsdasriAssociation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "siret" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "vatNumber" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "mail" TEXT,
    "bsdasriId" TEXT NOT NULL,

    CONSTRAINT "IntermediaryBsdasriAssociation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "_IntermediaryBsdasriAssociationBsvhuIdIdx" ON "IntermediaryBsdasriAssociation"("bsdasriId");

-- CreateIndex
CREATE INDEX "IntermediaryBsdasriAssociationSiretIdx" ON "IntermediaryBsdasriAssociation"("siret");

-- CreateIndex
CREATE INDEX "IntermediaryBsdasriAssociationVatNumberIdx" ON "IntermediaryBsdasriAssociation"("vatNumber");

-- AddForeignKey
ALTER TABLE "IntermediaryBsdasriAssociation" ADD CONSTRAINT "IntermediaryBsdasriAssociation_bsdasriId_fkey" FOREIGN KEY ("bsdasriId") REFERENCES "Bsdasri"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
