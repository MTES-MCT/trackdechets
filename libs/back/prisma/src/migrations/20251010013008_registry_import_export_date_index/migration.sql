-- CreateIndex
CREATE INDEX "_RegistryExhaustiveExportCreatedAtIdx" ON "default$default"."RegistryExhaustiveExport"("createdAt");

-- CreateIndex
CREATE INDEX "_RegistryExportCreatedAtIdx" ON "default$default"."RegistryExport"("createdAt");

-- CreateIndex
CREATE INDEX "_RegistryImportCreatedAtIdx" ON "default$default"."RegistryImport"("createdAt");
