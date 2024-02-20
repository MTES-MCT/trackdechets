CREATE TABLE "default$default"."AnonymousCompanyRequest" (
    "id" text NOT NULL,
    "siret" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pdf" TEXT NOT NULL,
    "createdAt" timestamptz  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "codeNaf" TEXT NOT NULL,
    "address" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- Indices -------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS "AnonymousCompanyRequest_pkey" ON "default$default"."AnonymousCompanyRequest" ("id");

CREATE UNIQUE INDEX IF NOT EXISTS "AnonymousCompanyRequest_pkey.siret_unique" ON "default$default"."AnonymousCompanyRequest_pkey"("siret");

ALTER TABLE "default$default"."AnonymousCompanyRequest" ADD CONSTRAINT "AnonymousCompanyRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "default$default"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;