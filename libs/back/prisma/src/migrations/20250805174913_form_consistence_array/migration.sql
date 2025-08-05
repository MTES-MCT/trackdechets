/*
  Warnings:

  - Changed the column `wasteDetailsConsistence` on the `Form` table from a scalar field to a list field. Existing scalar values will be converted to single-element arrays.

*/

-- Step 1: Add a temporary array column
ALTER TABLE "Form" ADD COLUMN "wasteDetailsConsistence_new" "Consistence"[];

-- Step 2: Migrate existing scalar values to arrays
UPDATE "Form" 
SET "wasteDetailsConsistence_new" = ARRAY["wasteDetailsConsistence"]
WHERE "wasteDetailsConsistence" IS NOT NULL;

-- Step 3: Drop the old column
ALTER TABLE "Form" DROP COLUMN "wasteDetailsConsistence";

-- Step 4: Rename the new column to the original name
ALTER TABLE "Form" RENAME COLUMN "wasteDetailsConsistence_new" TO "wasteDetailsConsistence";
