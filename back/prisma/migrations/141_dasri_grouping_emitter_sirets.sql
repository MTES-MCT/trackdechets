ALTER TABLE
    "default$default"."Bsdasri"
ADD
    COLUMN "groupingEmitterSirets" text[] DEFAULT '{}';

-- GIN index for array
CREATE INDEX IF NOT EXISTS "_BsdasriGroupingEmitterSiretIdx" ON "default$default"."Bsdasri" USING GIN ("groupingEmitterSirets");
