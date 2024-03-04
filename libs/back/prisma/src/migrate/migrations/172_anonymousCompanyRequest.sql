CREATE TABLE "default$default"."AnonymousCompanyRequest" (
    "id" text NOT NULL,
    "siret" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pdf" TEXT NOT NULL,
    "createdAt" timestamptz  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "codeNaf" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "codeCommune" TEXT,
    PRIMARY KEY ("id")
);

-- Indices -------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS "AnonymousCompanyRequest.siret_unique" ON "default$default"."AnonymousCompanyRequest"("siret");

ALTER TABLE "default$default"."AnonymousCompanyRequest" ADD CONSTRAINT "AnonymousCompanyRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "default$default"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;