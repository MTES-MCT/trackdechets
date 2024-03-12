-- Step 1: Add the new column
ALTER TABLE "default$default"."Bsff"
ADD COLUMN IF NOT EXISTS "rowNumber" SERIAL;

-- Step 2: Update the new column with auto-incremented values based on the createdAt column
UPDATE "default$default"."Bsff"
SET "rowNumber" = subquery."row_number"
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt") AS row_number
  FROM "default$default"."Bsff"
) AS subquery
WHERE "default$default"."Bsff".id = subquery.id;

-- Step 3: Add a unique constraint on the new column
ALTER TABLE "default$default"."Bsff"
ADD CONSTRAINT "Bsff_rowNumber_ukey" UNIQUE ("rowNumber");