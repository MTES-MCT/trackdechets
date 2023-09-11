-- BsdaRevisionRequest
CREATE INDEX IF NOT EXISTS "_BsdaRevisionRequestStatusIdx" ON "default$default"."BsdaRevisionRequest"("status");
-- FormRevisionRequest
CREATE INDEX IF NOT EXISTS "_BsddRevisionRequestStatusIdx" ON "default$default"."BsddRevisionRequest"("status");
