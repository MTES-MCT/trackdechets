ALTER TABLE
    "default$default"."Bsff"
ADD
    COLUMN IF NOT EXISTS "detenteurCompanySirets" text [] DEFAULT '{}';

UPDATE
    "default$default"."Bsff" AS "updated"
SET
    "detenteurCompanySirets" = array(
        SELECT
            "FI"."detenteurCompanySiret"
        FROM
            "default$default"."BsffFicheIntervention" "FI"
            LEFT JOIN "default$default"."_BsffToBsffFicheIntervention" "BSFF_TO_FI" ON "FI"."id" = "BSFF_TO_FI"."B"
            LEFT JOIN "default$default"."Bsff" "BSFF" ON "BSFF_TO_FI"."A" = "BSFF"."id"
        WHERE
            "BSFF"."id" = "updated"."id"
    );

CREATE INDEX IF NOT EXISTS "_BsffDetenteurSiretsIdx" ON "default$default"."Bsff" USING GIN ("detenteurCompanySirets");