CREATE TYPE "default$default"."BsdasriType" AS ENUM ('SIMPLE', 'GROUPING', 'SYNTHESIS');

alter TABLE "default$default"."Bsdasri" ADD COLUMN "bsdasriType" "default$default"."BsdasriType" NOT NULL DEFAULT E'SIMPLE';