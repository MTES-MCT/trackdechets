 
CREATE TYPE "default$default"."BsdType" AS ENUM ('BSDD', 'BSDA', 'BSDASRI', 'BSFF', 'BSVHU' );
 
CREATE TABLE "default$default"."PdfAccessToken" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT,
    "bsdType"  "default$default"."BsdType",
    "bsdId" TEXT ,
    "lastUsed" TIMESTAMP(3) ,
    "userId" TEXT NOT NULL,
    "visitedAt" TIMESTAMP(3),

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "default$default"."Bsda" ADD FOREIGN KEY ("childBsdaId") REFERENCES "default$default"."Bsda"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- CreateIndex
CREATE UNIQUE INDEX "_PdfAccessTokenTokenIdx" ON "default$default"."PdfAccessToken"("token");
