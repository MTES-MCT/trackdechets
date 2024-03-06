-- Step 1: Add the new column
ALTER TABLE "default$default"."Bsda"
ADD COLUMN IF NOT EXISTS "rowNumber" SERIAL;

-- Step 2: Update the new column with auto-incremented values based on the createdAt column
UPDATE "default$default"."Bsda"
SET "rowNumber" = subquery."row_number"
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt") AS row_number
  FROM "default$default"."Bsda"
) AS subquery
WHERE "default$default"."Bsda".id = subquery.id;

-- Step 3: Add a unique constraint on the new column
ALTER TABLE "default$default"."Bsda"
ADD CONSTRAINT "Bsda_rowNumber_ukey" UNIQUE ("rowNumber");