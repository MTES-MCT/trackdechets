-- AlterTable
ALTER TABLE "RegistryLookup" ADD COLUMN     "registryTransportedId" TEXT;

-- AddForeignKey
ALTER TABLE "RegistryLookup" ADD CONSTRAINT "RegistryLookup_registryTransportedId_fkey" FOREIGN KEY ("registryTransportedId") REFERENCES "RegistryTransported"("id") ON DELETE CASCADE ON UPDATE CASCADE;
