-- CreateEnum
CREATE TYPE "RegistryExportType" AS ENUM ('SSD', 'INCOMING', 'OUTGOING', 'MANAGED', 'TRANSPORTED');

-- CreateEnum
CREATE TYPE "RegistryExportWasteType" AS ENUM ('DND', 'DD', 'TEXS');

-- CreateEnum
CREATE TYPE "RegistryExportDeclarationType" AS ENUM ('BSD', 'REGISTRY');

-- AlterEnum
ALTER TYPE "RegistryImportType" ADD VALUE 'INCOMING_WASTE';

-- CreateTable
CREATE TABLE "RegistryExport" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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

    CONSTRAINT "RegistryExport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "_RegistryExportReadableIdIdx" ON "RegistryExport" USING HASH ("readableId");

-- CreateIndex
CREATE INDEX "_RegistryExportReportAsSiretsIdx" ON "RegistryExport" USING GIN ("reportAsSirets");

-- CreateIndex
CREATE INDEX "_RegistryExportSiretsIdx" ON "RegistryExport" USING GIN ("sirets");

-- CreateIndex
CREATE INDEX "_RegistryExportMainIdx" ON "RegistryExport"("date" DESC, "exportRegistryType");

-- CreateIndex
CREATE INDEX "_RegistryExportDeclarationTypeIdx" ON "RegistryExport"("declarationType");

-- CreateIndex
CREATE INDEX "_RegistryExportWasteTypeIdx" ON "RegistryExport"("wasteType");

-- CreateIndex
CREATE INDEX "_RegistryExportWasteCodeIdx" ON "RegistryExport"("wasteCode");

-- AddForeignKey
ALTER TABLE "RegistryExport" ADD CONSTRAINT "RegistryExport_registrySsdId_fkey" FOREIGN KEY ("registrySsdId") REFERENCES "RegistrySsd"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistryExport" ADD CONSTRAINT "RegistryExport_bsddId_fkey" FOREIGN KEY ("bsddId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistryExport" ADD CONSTRAINT "RegistryExport_bsdaId_fkey" FOREIGN KEY ("bsdaId") REFERENCES "Bsda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistryExport" ADD CONSTRAINT "RegistryExport_bsdasriId_fkey" FOREIGN KEY ("bsdasriId") REFERENCES "Bsdasri"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistryExport" ADD CONSTRAINT "RegistryExport_bsffId_fkey" FOREIGN KEY ("bsffId") REFERENCES "Bsff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistryExport" ADD CONSTRAINT "RegistryExport_bspaohId_fkey" FOREIGN KEY ("bspaohId") REFERENCES "Bspaoh"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistryExport" ADD CONSTRAINT "RegistryExport_bsvhuId_fkey" FOREIGN KEY ("bsvhuId") REFERENCES "Bsvhu"("id") ON DELETE CASCADE ON UPDATE CASCADE;
