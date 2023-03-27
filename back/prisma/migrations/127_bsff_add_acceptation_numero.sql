ALTER TABLE
  "default$default"."BsffPackaging"
ADD
  COLUMN "emissionNumero" VARCHAR(100);

ALTER TABLE
  "default$default"."BsffPackaging"
ALTER COLUMN
  "numero" TYPE VARCHAR(100);

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