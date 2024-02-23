-- Step 1: Add the new column
ALTER TABLE "default$default"."Form"
ADD COLUMN IF NOT EXISTS "rowNumber" SERIAL;

-- Step 2: Update the new column with auto-incremented values based on the createdAt column
UPDATE "default$default"."Form"
SET "rowNumber" = subquery."row_number"
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt") AS row_number
  FROM "default$default"."Form"
) AS subquery
WHERE "default$default"."Form".id = subquery.id;

-- Step 3: Add a unique constraint on the new column
ALTER TABLE "default$default"."Form"
ADD CONSTRAINT "Form_rowNumber_ukey" UNIQUE ("rowNumber");