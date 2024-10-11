-- AlterTable
ALTER TABLE "Bsvhu" ADD COLUMN     "ecoOrganismeName" TEXT,
ADD COLUMN     "ecoOrganismeSiret" TEXT;

-- CreateIndex
CREATE INDEX "_BsdaEcoOrganismeSiretIdx" ON "Bsda"("ecoOrganismeSiret");

-- CreateIndex
CREATE INDEX "_BsvhuEcoOrganismeSiretIdx" ON "Bsvhu"("ecoOrganismeSiret");
