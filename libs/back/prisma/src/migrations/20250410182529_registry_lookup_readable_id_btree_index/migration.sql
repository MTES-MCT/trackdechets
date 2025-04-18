-- DropIndex
DROP INDEX "_RegistryLookupReadableIdIdx";

-- CreateIndex
CREATE INDEX "_RegistryLookupReadableIdIdx" ON "RegistryLookup"("readableId");
