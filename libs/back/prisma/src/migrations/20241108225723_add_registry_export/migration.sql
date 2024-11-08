-- CreateEnum
CREATE TYPE "RegistryExportType" AS ENUM ('SSD', 'INCOMING', 'OUTGOING', 'MANAGED', 'TRANSPORTED');

-- CreateEnum
CREATE TYPE "RegistryExportWasteType" AS ENUM ('DND', 'DD', 'TEXS');

-- CreateEnum
CREATE TYPE "RegistryExportDeclarationType" AS ENUM ('BSD', 'REGISTRY');

-- CreateEnum
CREATE TYPE "RegistryExportStatus" AS ENUM ('PENDING', 'STARTED', 'SUCCESSFUL', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "RegistryExportFormat" AS ENUM ('CSV', 'XLSX');

-- CreateTable
CREATE TABLE "RegistryExport" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "createdById" TEXT NOT NULL,
    "status" "RegistryExportStatus" NOT NULL DEFAULT 'PENDING',
    "s3FileKey" TEXT,
    "delegateSiret" TEXT,
    "sirets" TEXT[],
    "registryType" "RegistryExportType",
    "wasteTypes" "RegistryExportWasteType"[] DEFAULT ARRAY[]::"RegistryExportWasteType"[],
    "wasteCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "declarationType" "RegistryExportDeclarationType",
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "format" "RegistryExportFormat" NOT NULL,

    CONSTRAINT "RegistryExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistryLookup" (
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" TEXT NOT NULL,
    "readableId" TEXT NOT NULL,
    "reportAsSirets" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sirets" TEXT[],
    "exportRegistryType" "RegistryExportType" NOT NULL,
    "declarationType" "RegistryExportDeclarationType" NOT NULL,
    "wasteType" "RegistryExportWasteType" NOT NULL,
    "wasteCode" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "registrySsdId" TEXT,
    "bsddId" TEXT,
    "bsdaId" TEXT,
    "bsdasriId" TEXT,
    "bsffId" TEXT,
    "bspaohId" TEXT,
    "bsvhuId" TEXT,

    CONSTRAINT "RegistryLookup_pkey" PRIMARY KEY ("id","exportRegistryType")
);

-- CreateIndex
CREATE INDEX "_RegistryExportCreatedByIdIdx" ON "RegistryExport"("createdById");

-- CreateIndex
CREATE INDEX "_RegistryExportSiretsIdx" ON "RegistryExport" USING GIN ("sirets");

-- CreateIndex
CREATE INDEX "_RegistryLookupReadableIdIdx" ON "RegistryLookup" USING HASH ("readableId");

-- CreateIndex
CREATE INDEX "_RegistryLookupReportAsSiretsIdx" ON "RegistryLookup" USING GIN ("reportAsSirets");

-- CreateIndex
CREATE INDEX "_RegistryLookupSiretsIdx" ON "RegistryLookup" USING GIN ("sirets");

-- CreateIndex
CREATE INDEX "_RegistryLookupMainIdx" ON "RegistryLookup"("date" DESC, "exportRegistryType");

-- CreateIndex
CREATE INDEX "_RegistryLookupDeclarationTypeIdx" ON "RegistryLookup"("declarationType");

-- CreateIndex
CREATE INDEX "_RegistryLookupWasteTypeIdx" ON "RegistryLookup"("wasteType");

-- CreateIndex
CREATE INDEX "_RegistryLookupWasteCodeIdx" ON "RegistryLookup"("wasteCode");

-- AddForeignKey
ALTER TABLE "RegistryExport" ADD CONSTRAINT "RegistryExport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistryLookup" ADD CONSTRAINT "RegistryLookup_registrySsdId_fkey" FOREIGN KEY ("registrySsdId") REFERENCES "RegistrySsd"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistryLookup" ADD CONSTRAINT "RegistryLookup_bsddId_fkey" FOREIGN KEY ("bsddId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistryLookup" ADD CONSTRAINT "RegistryLookup_bsdaId_fkey" FOREIGN KEY ("bsdaId") REFERENCES "Bsda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistryLookup" ADD CONSTRAINT "RegistryLookup_bsdasriId_fkey" FOREIGN KEY ("bsdasriId") REFERENCES "Bsdasri"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistryLookup" ADD CONSTRAINT "RegistryLookup_bsffId_fkey" FOREIGN KEY ("bsffId") REFERENCES "Bsff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistryLookup" ADD CONSTRAINT "RegistryLookup_bspaohId_fkey" FOREIGN KEY ("bspaohId") REFERENCES "Bspaoh"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistryLookup" ADD CONSTRAINT "RegistryLookup_bsvhuId_fkey" FOREIGN KEY ("bsvhuId") REFERENCES "Bsvhu"("id") ON DELETE CASCADE ON UPDATE CASCADE;
