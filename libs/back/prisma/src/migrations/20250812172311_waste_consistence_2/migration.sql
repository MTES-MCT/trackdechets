-- Step 3: Drop the old column
ALTER TABLE "Form" DROP COLUMN "wasteDetailsConsistence";

-- Step 4: Rename the new column to the original name
ALTER TABLE "Form" RENAME COLUMN "wasteDetailsConsistence_new" TO "wasteDetailsConsistence";
