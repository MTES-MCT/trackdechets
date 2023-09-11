-- Bsda.destinationOperationNextDestinationCompanySiret
CREATE INDEX IF NOT EXISTS "_BsdaDestinationOperationNextDestinationCompanySiretIdx" ON "default$default"."Bsda"("destinationOperationNextDestinationCompanySiret");

-- Bsdd.nextDestinationCompanySiret
CREATE INDEX IF NOT EXISTS "_FormNextDestinationCompanySiretIdx" ON "default$default"."Form"("nextDestinationCompanySiret");
