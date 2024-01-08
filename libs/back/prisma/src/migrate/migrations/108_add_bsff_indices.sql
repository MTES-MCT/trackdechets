CREATE INDEX IF NOT EXISTS "_BsffCreatedAtIdx" ON "default$default"."Bsff"("createdAt");

CREATE INDEX IF NOT EXISTS "_BsffEmitterEmissionSignatureDateIdx" ON "default$default"."Bsff"("emitterEmissionSignatureDate");

CREATE INDEX IF NOT EXISTS "_BsffTransporterTransportSignatureDateIdx" ON "default$default"."Bsff"("transporterTransportSignatureDate");

CREATE INDEX IF NOT EXISTS "_BsffPackagingNumeroIdx" ON "default$default"."BsffPackaging"("numero");

CREATE INDEX IF NOT EXISTS "_BsffPackagingAcceptationWasteCodeIdx" ON "default$default"."BsffPackaging"("acceptationWasteCode");

CREATE INDEX IF NOT EXISTS "_BsffPackagingAcceptationSignatureDateIdx" ON "default$default"."BsffPackaging"("acceptationSignatureDate");

CREATE INDEX IF NOT EXISTS "_BsffPackagingOperationNoTraceabilityIdx" ON "default$default"."BsffPackaging"("operationNoTraceability")
WHERE
    ("operationNoTraceability" = true);

CREATE INDEX IF NOT EXISTS "_BsffPackagingOperationCodeIdx" ON "default$default"."BsffPackaging"("operationCode");

CREATE INDEX IF NOT EXISTS "_BsffPackagingOperationSignatureDateIdx" ON "default$default"."BsffPackaging"("operationSignatureDate");