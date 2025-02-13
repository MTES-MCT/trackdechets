-- AlterTable
ALTER TABLE
  "Form"
ADD
  COLUMN "isDirectSupply" BOOLEAN NOT NULL DEFAULT false;

UPDATE
  "Form"
SET
  "isDirectSupply" = TRUE,
  "wasteDetailsPackagingInfos" = '[]'
WHERE
  EXISTS (
    SELECT
      1
    FROM
      jsonb_array_elements("wasteDetailsPackagingInfos") AS conditionnement
    WHERE
      jsonb_typeof("wasteDetailsPackagingInfos") = 'array'
      AND conditionnement ->> 'type' = 'PIPELINE'
  );