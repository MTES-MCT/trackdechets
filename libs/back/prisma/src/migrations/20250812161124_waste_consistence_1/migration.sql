-- Step 1: Add a temporary array column
ALTER TABLE "Form" ADD COLUMN     "wasteDetailsConsistence_new" "Consistence"[];

-- Step 2: Migrate existing scalar values to arrays
UPDATE "Form" 
SET "wasteDetailsConsistence_new" = ARRAY["wasteDetailsConsistence"]
WHERE "wasteDetailsConsistence" IS NOT NULL;