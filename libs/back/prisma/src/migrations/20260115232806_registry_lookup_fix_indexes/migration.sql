-- CreateIndex
CREATE INDEX "_RegistryLookupMainSortIdx" ON "RegistryLookup"("siret", "exportRegistryType", "date" ASC, "dateId" ASC);

-- CreateIndex
CREATE INDEX "_RegistryLookupLinesReadSortIdx" ON "RegistryLookup"("siret", "declarationType", "declaredAtId" DESC);

-- DropIndex
DROP INDEX "default$default"."_RegistryLookupLinesReadIdx";

-- DropIndex
DROP INDEX "default$default"."_RegistryLookupMainIdx";