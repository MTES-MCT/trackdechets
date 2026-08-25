-- CreateTable
CREATE TABLE "default$default"."BsffPackagingDetenteur" (
  "id" TEXT NOT NULL,
  "bsffPackagingId" TEXT NOT NULL,
  "detenteurCompanySiret" TEXT,
  "detenteurCompanyName" TEXT NOT NULL,
  "detenteurCompanyAddress" TEXT NOT NULL,
  "detenteurCompanyContact" TEXT,
  "detenteurCompanyPhone" TEXT,
  "detenteurCompanyMail" TEXT,
  "detenteurIsPrivateIndividual" BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT "BsffPackagingDetenteur_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "_BsffPackagingDetenteurUnique"
  ON "default$default"."BsffPackagingDetenteur" ("bsffPackagingId", "detenteurCompanySiret");

-- CreateIndex
CREATE INDEX "_BsffPackagingDetenteurCompanySiretIdx"
  ON "default$default"."BsffPackagingDetenteur" ("detenteurCompanySiret");

-- CreateIndex
CREATE INDEX "_BsffPackagingDetenteurPackagingIdIdx"
  ON "default$default"."BsffPackagingDetenteur" ("bsffPackagingId");

-- AddForeignKey
ALTER TABLE "default$default"."BsffPackagingDetenteur"
ADD CONSTRAINT "BsffPackagingDetenteur_bsffPackagingId_fkey"
FOREIGN KEY ("bsffPackagingId") REFERENCES "default$default"."BsffPackaging"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
