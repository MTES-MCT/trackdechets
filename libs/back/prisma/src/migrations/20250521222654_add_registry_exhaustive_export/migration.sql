/*
  Warnings:

  - Made the column `registryType` on table `RegistryExport` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "RegistryExport" ALTER COLUMN "registryType" SET NOT NULL;

-- CreateTable
CREATE TABLE "RegistryExhaustiveExport" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "createdById" TEXT NOT NULL,
    "status" "RegistryExportStatus" NOT NULL DEFAULT 'PENDING',
    "s3FileKey" TEXT,
    "sirets" TEXT[],
    "isForAllCompanies" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMPTZ(6) NOT NULL,
    "endDate" TIMESTAMPTZ(6),
    "format" "RegistryExportFormat" NOT NULL,

    CONSTRAINT "RegistryExhaustiveExport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "_RegistryExhaustiveExportCreatedByIdIdx" ON "RegistryExhaustiveExport"("createdById");

-- CreateIndex
CREATE INDEX "_RegistryExhaustiveExportSiretsIdx" ON "RegistryExhaustiveExport" USING GIN ("sirets");

-- AddForeignKey
ALTER TABLE "RegistryExhaustiveExport" ADD CONSTRAINT "RegistryExhaustiveExport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
