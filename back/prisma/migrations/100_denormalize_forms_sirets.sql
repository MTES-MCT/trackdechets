ALTER TABLE "default$default"."Form" ADD COLUMN "recipientsSirets" text[] DEFAULT '{}';
ALTER TABLE "default$default"."Form" ADD COLUMN "transportersSirets" text[] DEFAULT '{}';
ALTER TABLE "default$default"."Form" ADD COLUMN "intermediariesSirets" text[] DEFAULT '{}';

-- GIN indexes for arrays
-- > GIN indexes are “inverted indexes” which are appropriate for data values that contain multiple component values, such as arrays.
-- > An inverted index contains a separate entry for each component value, and can efficiently handle queries that test for the presence of specific component values.
CREATE INDEX IF NOT EXISTS "_FormRecipientsSiretsIdx" ON "default$default"."Form" USING GIN ("recipientsSirets");
CREATE INDEX IF NOT EXISTS "_FormTransportersSiretsIdx" ON "default$default"."Form" USING GIN ("transportersSirets");
CREATE INDEX IF NOT EXISTS "_FormIntermediariesSiretsIdx" ON "default$default"."Form" USING GIN ("intermediariesSirets");


UPDATE default$default."Form" AS f1
SET "recipientsSirets" =
  array_remove(
        array(SELECT f2."recipientCompanySiret"
            FROM default$default."Form" AS f2
            WHERE f2.id = f1."forwardedInId"
            UNION SELECT f1."recipientCompanySiret"
        ),
        NULL
    );

UPDATE default$default."Form" AS f1
SET "transportersSirets" =
    array_remove(
        array(
            SELECT ts."transporterCompanySiret"
                FROM default$default."TransportSegment" AS ts
                WHERE ts."formId" = f1."id"
            UNION SELECT f2."transporterCompanySiret"
                FROM default$default."Form" AS f2
                WHERE f2.id = f1."forwardedInId"
            UNION SELECT f1."transporterCompanySiret"
        ),
        NULL
   );

UPDATE default$default."Form" AS f1
SET "intermediariesSirets" =
    array_remove(
        array(
            SELECT i."siret"
            FROM default$default."IntermediaryFormAssociation" AS i
            WHERE i."formId" = f1."id"
        ),
        NULL
    );