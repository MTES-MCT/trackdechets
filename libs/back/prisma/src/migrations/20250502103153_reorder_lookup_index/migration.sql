-- DropIndex
DROP INDEX "_RegistryLookupMainIdx";

-- CreateIndex
CREATE INDEX "_RegistryLookupMainIdx" ON "RegistryLookup"("siret", "exportRegistryType", "date" ASC);
