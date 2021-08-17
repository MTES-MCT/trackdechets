-- CreateEnum
CREATE TYPE "default$default"."BsffType" AS ENUM ('TRACER_FLUIDE', 'COLLECTE_PETITES_QUANTITES', 'GROUPEMENT', 'RECONDITIONNEMENT', 'REEXPEDITION');

-- AlterEnum
ALTER TABLE "default$default"."Bsff"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE VARCHAR(255);
DROP TYPE IF EXISTS "default$default"."BsffStatus";
CREATE TYPE "default$default"."BsffStatus" AS ENUM ('INITIAL', 'SIGNED_BY_EMITTER', 'SENT', 'RECEIVED', 'INTERMEDIATELY_PROCESSED', 'PROCESSED', 'REFUSED');
ALTER TABLE "default$default"."Bsff"
  ALTER COLUMN "status" SET DATA TYPE "default$default"."BsffStatus" using "status"::"default$default"."BsffStatus",
  ALTER COLUMN "status" SET DEFAULT E'INITIAL';

-- AlterTable
ALTER TABLE "default$default"."Bsff"
  ADD COLUMN "isDraft" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "type" "default$default"."BsffType" NOT NULL DEFAULT E'TRACER_FLUIDE',
  ALTER COLUMN "quantityIsEstimate" DROP NOT NULL,
  ALTER COLUMN "quantityIsEstimate" DROP DEFAULT;
