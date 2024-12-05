-- DropIndex
DROP INDEX "_RegistryLookupDateIdIdx";

-- DropIndex
DROP INDEX "_RegistryLookupMainIdx";

-- CreateIndex
CREATE INDEX "_RegistryLookupMainIdx" ON "RegistryLookup"("date" ASC, "exportRegistryType");

-- CreateIndex
CREATE INDEX "_RegistryLookupDateIdIdx" ON "RegistryLookup"("dateId" ASC);
