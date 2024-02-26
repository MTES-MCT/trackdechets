
-- Table Definition ----------------------------------------------
CREATE TABLE "default$default"."FinalOperation" (
    "id" text NOT NULL,
    "createdAt" timestamptz  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamptz  NOT NULL,
    "finalBsdReadableId" text NOT NULL,
    "operationCode" text NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "destinationCompanySiret" TEXT NOT NULL,
    "destinationCompanyName" TEXT NOT NULL,
    "formId" text REFERENCES "default$default"."Form" (id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY ("id"),

    CONSTRAINT "FinalOperation_pkey_unique_together" UNIQUE ("formId", "finalBsdReadableId")
);

-- Indices -------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS "_FinalOperation_pkey" ON "default$default"."FinalOperation" ("id");
CREATE UNIQUE INDEX IF NOT EXISTS "_FinalOperation_finalBsdReadableId" ON "default$default"."FinalOperation" ("finalBsdReadableId");
CREATE INDEX IF NOT EXISTS "_FinalOperationdestinationCompanySiretIdx" ON "default$default"."FinalOperation" ("destinationCompanySiret");
CREATE INDEX IF NOT EXISTS "_FinalOperationFormIdIdx" ON "default$default"."FinalOperation" ("formId");
