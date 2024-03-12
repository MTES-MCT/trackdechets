-- Step 1: Add the new column
ALTER TABLE "default$default"."Bsdasri"
ADD COLUMN IF NOT EXISTS "rowNumber" SERIAL;

-- Step 2: Update the new column with auto-incremented values based on the createdAt column
UPDATE "default$default"."Bsdasri"
SET "rowNumber" = subquery."row_number"
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt") AS row_number
  FROM "default$default"."Bsdasri"
) AS subquery
WHERE "default$default"."Bsdasri".id = subquery.id;

-- Step 3: Add a unique constraint on the new column
ALTER TABLE "default$default"."Bsdasri"
ADD CONSTRAINT "Bsdasri_rowNumber_ukey" UNIQUE ("rowNumber");