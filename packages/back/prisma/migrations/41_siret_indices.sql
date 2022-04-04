-- Bsdasri
CREATE INDEX IF NOT EXISTS "_BsdasriEmitterCompanySiretIdx" ON "default$default"."Bsdasri"("emitterCompanySiret");
CREATE INDEX IF NOT EXISTS "_BsdasriTransporterCompanySiretIdx" ON "default$default"."Bsdasri"("transporterCompanySiret");
CREATE INDEX IF NOT EXISTS "_BsdasriDestinationCompanySiretIdx" ON "default$default"."Bsdasri"("destinationCompanySiret");

-- Bsff

CREATE INDEX IF NOT EXISTS "_BsffEmitterCompanySiretIdx" ON "default$default"."Bsff"("emitterCompanySiret");
CREATE INDEX IF NOT EXISTS "_BsffTransporterCompanySiretIdx" ON "default$default"."Bsff"("transporterCompanySiret");
CREATE INDEX IF NOT EXISTS "_BsffDestinationCompanySiretIdx" ON "default$default"."Bsff"("destinationCompanySiret");

-- BsffFicheIntervention

CREATE INDEX IF NOT EXISTS "_BsffFicheInterventionDetenteurCompanySiretIdx" ON "default$default"."BsffFicheIntervention"("detenteurCompanySiret");
CREATE INDEX IF NOT EXISTS "_BsffFicheInterventionOperateurCompanySiretIdx" ON "default$default"."BsffFicheIntervention"("operateurCompanySiret");

-- Bsda

CREATE INDEX IF NOT EXISTS "_BsdaEmitterCompanySiretIdx" ON "default$default"."Bsda"("emitterCompanySiret");
CREATE INDEX IF NOT EXISTS "_BsdaBrokerCompanySiretIdx" ON "default$default"."Bsda"("brokerCompanySiret");
CREATE INDEX IF NOT EXISTS "_BsdaDestinationCompanySiretIdx" ON "default$default"."Bsda"("destinationCompanySiret");
CREATE INDEX IF NOT EXISTS "_BsdaTransporterCompanySiretIdx" ON "default$default"."Bsda"("transporterCompanySiret");
CREATE INDEX IF NOT EXISTS "_BsdaWorkerCompanySiretIdx" ON "default$default"."Bsda"("workerCompanySiret");

-- Form

CREATE INDEX IF NOT EXISTS "_FormEmitterCompanySiretIdx" ON "default$default"."Form"("emitterCompanySiret");
CREATE INDEX IF NOT EXISTS "_FormRecipientCompanySiretIdx" ON "default$default"."Form"("recipientCompanySiret");
CREATE INDEX IF NOT EXISTS "_FormTransporterCompanySiretIdx" ON "default$default"."Form"("transporterCompanySiret");
CREATE INDEX IF NOT EXISTS "_FormTraderCompanySiretIdx" ON "default$default"."Form"("traderCompanySiret");
CREATE INDEX IF NOT EXISTS "_FormBrokerCompanySiretIdx" ON "default$default"."Form"("brokerCompanySiret");

-- TransportSegment

CREATE INDEX IF NOT EXISTS "_TransportSegmentTransporterCompanySiretIdx" ON "default$default"."TransportSegment"("transporterCompanySiret");


-- TemporaryStorageDetail

CREATE INDEX IF NOT EXISTS "_TemporaryStorageDetailDestinationCompanyIdx" ON "default$default"."TemporaryStorageDetail"("destinationCompanySiret");
CREATE INDEX IF NOT EXISTS "_TemporaryStorageDetailTransporterCompanySiretIdx" ON "default$default"."TemporaryStorageDetail"("transporterCompanySiret");
 

-- Bsvhu

CREATE INDEX IF NOT EXISTS "_BvhuEmitterCompanySirettIdx" ON "default$default"."Bsvhu"("emitterCompanySiret");
CREATE INDEX IF NOT EXISTS "_BsvhuDestinationCompanySiretIdx" ON "default$default"."Bsvhu"("destinationCompanySiret");
CREATE INDEX IF NOT EXISTS "_BsvhuTransporterCompanySiretIdx" ON "default$default"."Bsvhu"("transporterCompanySiret");
 