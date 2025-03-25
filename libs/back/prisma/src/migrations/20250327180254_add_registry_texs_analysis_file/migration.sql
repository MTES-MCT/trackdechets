-- CreateTable
CREATE TABLE "TexsAnalysisFile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileName" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "registryIncomingTexsId" TEXT,
    "registryOutgoingTexsId" TEXT,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "TexsAnalysisFile_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TexsAnalysisFile" ADD CONSTRAINT "TexsAnalysisFile_registryIncomingTexsId_fkey" FOREIGN KEY ("registryIncomingTexsId") REFERENCES "RegistryIncomingTexs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TexsAnalysisFile" ADD CONSTRAINT "TexsAnalysisFile_registryOutgoingTexsId_fkey" FOREIGN KEY ("registryOutgoingTexsId") REFERENCES "RegistryOutgoingTexs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TexsAnalysisFile" ADD CONSTRAINT "TexsAnalysisFile_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
