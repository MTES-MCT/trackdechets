ALTER TABLE
    "default$default"."Bsdasri"
ADD
    COLUMN "synthesisEmitterSirets" text[] DEFAULT '{}';

-- GIN index for array
CREATE INDEX IF NOT EXISTS "_BsdasriSynthesisEmitterSiretsIdx" ON "default$default"."Bsdasri" USING GIN ("synthesisEmitterSirets");
