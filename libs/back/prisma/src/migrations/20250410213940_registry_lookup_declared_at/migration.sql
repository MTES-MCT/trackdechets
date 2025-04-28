-- AlterTable
ALTER TABLE "RegistryLookup" ADD COLUMN     "declaredAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "_RegistryLookupLinesReadIdx" ON "RegistryLookup"("siret", "declaredAt" DESC, "declarationType");
