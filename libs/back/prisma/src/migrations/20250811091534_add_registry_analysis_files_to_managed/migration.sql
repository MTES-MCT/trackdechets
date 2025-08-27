-- AlterTable
ALTER TABLE "RegistryTexsAnalysisFile" ADD COLUMN     "registryManagedId" TEXT;

-- AddForeignKey
ALTER TABLE "RegistryTexsAnalysisFile" ADD CONSTRAINT "RegistryTexsAnalysisFile_registryManagedId_fkey" FOREIGN KEY ("registryManagedId") REFERENCES "RegistryManaged"("id") ON DELETE SET NULL ON UPDATE CASCADE;
