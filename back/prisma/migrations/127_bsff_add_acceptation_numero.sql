ALTER TABLE
  "default$default"."BsffPackaging"
ADD
  COLUMN "emissionNumero" TEXT;

UPDATE
  "default$default"."BsffPackaging"
SET
  "emissionNumero" = "numero";

ALTER TABLE
  "default$default"."BsffPackaging"
ALTER COLUMN
  "emissionNumero"
SET
  NOT NULL;