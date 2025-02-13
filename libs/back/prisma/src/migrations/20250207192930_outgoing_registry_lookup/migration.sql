-- AlterTable
ALTER TABLE "RegistryLookup" ADD COLUMN     "registryOutgoingTexsId" TEXT,
ADD COLUMN     "registryOutgoingWasteId" TEXT;

-- AddForeignKey
ALTER TABLE "RegistryLookup" ADD CONSTRAINT "RegistryLookup_registryOutgoingWasteId_fkey" FOREIGN KEY ("registryOutgoingWasteId") REFERENCES "RegistryOutgoingWaste"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistryLookup" ADD CONSTRAINT "RegistryLookup_registryOutgoingTexsId_fkey" FOREIGN KEY ("registryOutgoingTexsId") REFERENCES "RegistryOutgoingTexs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
