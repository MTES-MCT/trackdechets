-- AlterTable
ALTER TABLE "RegistryLookup" ADD COLUMN     "registryIncomingTexsId" TEXT,
ADD COLUMN     "registryIncomingWasteId" TEXT;

-- AddForeignKey
ALTER TABLE "RegistryLookup" ADD CONSTRAINT "RegistryLookup_registryIncomingWasteId_fkey" FOREIGN KEY ("registryIncomingWasteId") REFERENCES "RegistryIncomingWaste"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistryLookup" ADD CONSTRAINT "RegistryLookup_registryIncomingTexsId_fkey" FOREIGN KEY ("registryIncomingTexsId") REFERENCES "RegistryIncomingTexs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
