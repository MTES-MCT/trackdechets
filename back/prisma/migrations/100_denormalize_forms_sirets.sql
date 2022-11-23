ALTER TABLE "default$default"."Forms" ADD COLUMN "recipientsSirets" text[] DEFAULT [];
ALTER TABLE "default$default"."Forms" ADD COLUMN "transportersSirets" text[] DEFAULT [];
ALTER TABLE "default$default"."Forms" ADD COLUMN "intermediariesSirets" text[] DEFAULT [];

-- GIN indexes for arrays
-- > GIN indexes are “inverted indexes” which are appropriate for data values that contain multiple component values, such as arrays.
-- > An inverted index contains a separate entry for each component value, and can efficiently handle queries that test for the presence of specific component values.
CREATE INDEX IF NOT EXISTS "_FormRecipientsSiretsIdx" ON "default$default"."Form" USING GIN ("recipientsSirets");
CREATE INDEX IF NOT EXISTS "_FormTransportersSiretsIdx" ON "default$default"."Form" USING GIN ("transportersSirets");
CREATE INDEX IF NOT EXISTS "_FormIntermediariesSiretsIdx" ON "default$default"."Form" USING GIN ("intermediariesSirets");
