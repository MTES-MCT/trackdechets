-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "_RegistryIncomingTexsPublicIdReportForCompanySiretIsLatestUIdx" ON "RegistryIncomingTexs"("publicId", "reportForCompanySiret", "isLatest");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "_RegistryIncomingWastePublicIdReportForCompanySiretIsLatestUIdx" ON "RegistryIncomingWaste"("publicId", "reportForCompanySiret", "isLatest");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "_RegistryManagedPublicIdReportForCompanySiretIsLatestUIdx" ON "RegistryManaged"("publicId", "reportForCompanySiret", "isLatest");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "_RegistryOutgoingTexsPublicIdReportForCompanySiretIsLatestUIdx" ON "RegistryOutgoingTexs"("publicId", "reportForCompanySiret", "isLatest");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "_RegistryOutgoingWastePublicIdReportForCompanySiretIsLatestUIdx" ON "RegistryOutgoingWaste"("publicId", "reportForCompanySiret", "isLatest");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "_RegistrySsdPublicIdReportForSiretIsLatestUIdx" ON "RegistrySsd"("publicId", "reportForCompanySiret", "isLatest");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "_RegistryTransportedPublicIdReportForCompanySiretIsLatestUIdx" ON "RegistryTransported"("publicId", "reportForCompanySiret", "isLatest");
