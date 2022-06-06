
-- CreateTable
CREATE TABLE "default$default"."IntermediaryFormAssociation" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "siret" TEXT NOT NULL,
    "vatNumber" TEXT,
    "address" TEXT,
    "contact" TEXT,
    "phone" TEXT,
    "mail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntermediaryFormAssociation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "default$default"."IntermediaryFormAssociation" ADD CONSTRAINT "IntermediaryFormAssociation_formId_fkey" FOREIGN KEY ("formId") REFERENCES "default$default"."Form"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "_IntermediaryFormAssociationFormIdIdx" ON "default$default"."IntermediaryFormAssociation"("formId");

-- CreateIndex
CREATE INDEX "IntermediaryFormAssociationSiretIdx" ON "default$default"."IntermediaryFormAssociation"("siret");
CREATE INDEX "IntermediaryFormAssociationVatNumberIdx" ON "default$default"."IntermediaryFormAssociation"("vatNumber");
