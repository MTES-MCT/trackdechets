-- CreateTable
CREATE TABLE "default$default"."IntermediaryBsdaAssociation" (
    "id" TEXT NOT NULL,
    "bsdaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "siret" TEXT NOT NULL,
    "vatNumber" TEXT,
    "address" TEXT,
    "contact" TEXT,
    "phone" TEXT,
    "mail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntermediaryBsdaAssociation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "default$default"."IntermediaryBsdaAssociation" ADD CONSTRAINT "IntermediaryBsdaAssociation_bsdaId_fkey" FOREIGN KEY ("bsdaId") REFERENCES "default$default"."Bsda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "_IntermediaryBsdaAssociationBsdaIdIdx" ON "default$default"."IntermediaryBsdaAssociation"("bsdaId");

-- CreateIndex
CREATE INDEX "IntermediaryBsdaAssociationSiretIdx" ON "default$default"."IntermediaryBsdaAssociation"("siret");
CREATE INDEX "IntermediaryBsdaAssociationVatNumberIdx" ON "default$default"."IntermediaryBsdaAssociation"("vatNumber");
