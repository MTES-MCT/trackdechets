-- CreateTable
CREATE TABLE "RegistryTexsAnalysisFile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "s3FileKey" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "registryIncomingTexsId" TEXT,
    "registryOutgoingTexsId" TEXT,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "RegistryTexsAnalysisFile_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RegistryTexsAnalysisFile" ADD CONSTRAINT "RegistryTexsAnalysisFile_registryIncomingTexsId_fkey" FOREIGN KEY ("registryIncomingTexsId") REFERENCES "RegistryIncomingTexs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistryTexsAnalysisFile" ADD CONSTRAINT "RegistryTexsAnalysisFile_registryOutgoingTexsId_fkey" FOREIGN KEY ("registryOutgoingTexsId") REFERENCES "RegistryOutgoingTexs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistryTexsAnalysisFile" ADD CONSTRAINT "RegistryTexsAnalysisFile_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
