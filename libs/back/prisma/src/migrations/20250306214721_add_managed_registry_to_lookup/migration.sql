-- AlterTable
ALTER TABLE "RegistryLookup" ADD COLUMN     "registryManagedId" TEXT;

-- AddForeignKey
ALTER TABLE "RegistryLookup" ADD CONSTRAINT "RegistryLookup_registryManagedId_fkey" FOREIGN KEY ("registryManagedId") REFERENCES "RegistryManaged"("id") ON DELETE CASCADE ON UPDATE CASCADE;
