-- CreateEnum
CREATE TYPE "BsffPackagingType" AS ENUM ('BOUTEILLE', 'CONTENEUR', 'CITERNE', 'OTHER');

-- AlterTable
ALTER TABLE
    "default$default"."BsffPackaging"
ADD
    COLUMN "other" TEXT,
ADD
    COLUMN "type" "default$default"."BsffPackagingType";

UPDATE
    "default$default"."BsffPackaging"
SET
    "type" = 'BOUTEILLE' :: "default$default"."BsffPackagingType"
WHERE
    LOWER("name") = 'bouteille';

UPDATE
    "default$default"."BsffPackaging"
SET
    "type" = 'OTHER' :: "default$default"."BsffPackagingType",
    "other" = "name"
WHERE
    LOWER("name") != 'bouteille';

ALTER TABLE
    "default$default"."BsffPackaging"
ALTER COLUMN
    "type"
SET
    NOT NULL,
    DROP COLUMN "name";