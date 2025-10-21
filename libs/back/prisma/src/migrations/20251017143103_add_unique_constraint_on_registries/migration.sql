-- Partial indexes to enforce unique constraints on registries tables
-- This is not supported by Prisma, so this doesnt appear in the registry.prisma file
-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS
"_RegistryIncomingTexsPublicIdReportForCompanySiretIsLatestUIdx" ON
"RegistryIncomingTexs"("publicId", "reportForCompanySiret")
WHERE "isLatest"=TRUE;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS
"_RegistryIncomingWastePublicIdReportForCompanySiretIsLatestUIdx" ON
"RegistryIncomingWaste"("publicId", "reportForCompanySiret")
WHERE "isLatest"=TRUE;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS
"_RegistryManagedPublicIdReportForCompanySiretIsLatestUIdx" ON "RegistryManaged"
("publicId", "reportForCompanySiret")
WHERE "isLatest"=TRUE;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS
"_RegistryOutgoingTexsPublicIdReportForCompanySiretIsLatestUIdx" ON
"RegistryOutgoingTexs"("publicId", "reportForCompanySiret")
WHERE "isLatest"=TRUE;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS
"_RegistryOutgoingWastePublicIdReportForCompanySiretIsLatestUIdx" ON
"RegistryOutgoingWaste"("publicId", "reportForCompanySiret")
WHERE "isLatest"=TRUE;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS
"_RegistrySsdPublicIdReportForSiretIsLatestUIdx" ON "RegistrySsd"("publicId",
"reportForCompanySiret")
WHERE "isLatest"=TRUE;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS
"_RegistryTransportedPublicIdReportForCompanySiretIsLatestUIdx" ON
"RegistryTransported"("publicId", "reportForCompanySiret")
WHERE "isLatest"=TRUE; 
