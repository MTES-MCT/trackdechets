ALTER TABLE "default$default"."Bsda" ADD COLUMN IF NOT EXISTS "intermediariesOrgIds" text[] DEFAULT '{}';
-- GIN indexes for arrays
-- > GIN indexes are “inverted indexes” which are appropriate for data values that contain multiple component values, such as arrays.
-- > An inverted index contains a separate entry for each component value, and can efficiently handle queries that test for the presence of specific component values.
CREATE INDEX IF NOT EXISTS "_BsdaIntermediariesOrgIdsIdx" ON "default$default"."Bsda" USING GIN ("intermediariesOrgIds");