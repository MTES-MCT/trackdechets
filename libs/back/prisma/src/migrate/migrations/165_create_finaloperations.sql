
-- Table Definition ----------------------------------------------
CREATE TABLE "default$default"."FinalOperation" (
    "id" text NOT NULL,
    "createdAt" timestamptz  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamptz  NOT NULL,
    "isDeleted" boolean NOT NULL DEFAULT FALSE,
    "finalBsdReadableId" text NOT NULL,
    "operationCode" text NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "destinationCompanySiret" TEXT NOT NULL,
    "destinationCompanyName" TEXT NOT NULL,
    "formId" text REFERENCES "default$default"."Form" (id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
    PRIMARY KEY ("id")
);

-- Indices -------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS "_FinalOperation_pkey" ON "default$default"."FinalOperation" ("id");
CREATE UNIQUE INDEX IF NOT EXISTS "_FinalOperation_unique_finalBsdReadableId" ON "default$default"."FinalOperation" ("finalBsdReadableId");
CREATE INDEX IF NOT EXISTS "_FinalOperationdestinationCompanySiretIdx" ON "default$default"."FinalOperation" ("destinationCompanySiret");
CREATE INDEX IF NOT EXISTS "_FinalOperationFormIdIdx" ON "default$default"."FinalOperation" ("formId");
