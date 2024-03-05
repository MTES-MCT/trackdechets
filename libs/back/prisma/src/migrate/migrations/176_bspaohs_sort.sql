-- Step 1: Add the new column
ALTER TABLE "default$default"."Bspaoh"
ADD COLUMN IF NOT EXISTS "rowNumber" SERIAL;

-- Step 2: Update the new column with auto-incremented values based on the createdAt column
UPDATE "default$default"."Bspaoh"
SET "rowNumber" = subquery."row_number"
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt") AS row_number
  FROM "default$default"."Bspaoh"
) AS subquery
WHERE "default$default"."Bspaoh".id = subquery.id;

-- Step 3: Add a unique constraint on the new column
ALTER TABLE "default$default"."Bspaoh"
ADD CONSTRAINT "Bspaoh_rowNumber_ukey" UNIQUE ("rowNumber");