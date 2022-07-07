ALTER TABLE "default$default"."Bsff" RENAME COLUMN "packagings" TO "packagingsJson";

-- CreateTable
CREATE TABLE "default$default"."BsffPackaging" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "volume" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION NOT NULL,
    "numero" TEXT NOT NULL,
    "bsffId" TEXT NOT NULL,

    CONSTRAINT "BsffPackaging_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "default$default"."BsffPackaging" ADD CONSTRAINT "BsffPackaging_bsffId_fkey" FOREIGN KEY ("bsffId") REFERENCES "default$default"."Bsff"("id") ON DELETE CASCADE ON UPDATE CASCADE;