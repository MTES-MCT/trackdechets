-- DropIndex
DROP INDEX "_RegistryLookupDateIdIdx";

-- DropIndex
DROP INDEX "_RegistryLookupReadableIdIdx";

-- RenameIndex
ALTER INDEX "RegistryLookup_dateId_key" RENAME TO "_RegistryLookupDateIdIdx";
