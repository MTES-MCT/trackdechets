-- ========================================
-- WASTE CONSISTENCE MIGRATION SCRIPT
-- ========================================
-- This script migrates scalar wasteDetailsConsistence values to arrays
-- 
-- CONFIGURATION: Update the cutoff date below if needed
-- Format: 'YYYY-MM-DDTHH:mm:ss.sssZ' (ISO 8601 format with timezone)
-- Example: '2025-08-12T16:40:00.000Z' for August 12, 2025 at 16:40 UTC
-- Comment out the date filter lines to process all forms
-- ========================================

-- Set the schema search path to use the default$default schema
SET search_path TO "default$default";

DO $$
DECLARE
    column_exists boolean := false;
    update_count integer;
    -- CONFIGURATION: Set your cutoff date here or leave as NULL
    cutoff_date timestamptz := NULL; -- '2025-08-12T16:40:00.000Z'::timestamptz;
BEGIN
    -- Step 1: Check if the column exists
    RAISE NOTICE 'Checking if wasteDetailsConsistence_new column exists...';
    
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Form' 
        AND column_name = 'wasteDetailsConsistence_new'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE NOTICE 'Column wasteDetailsConsistence_new already exists, skipping creation.';
    ELSE
        RAISE NOTICE 'Column wasteDetailsConsistence_new does not exist, creating it...';
        
        -- Step 2: Create the new column
        ALTER TABLE "Form" ADD COLUMN "wasteDetailsConsistence_new" "Consistence"[];
        
        RAISE NOTICE 'Column wasteDetailsConsistence_new created successfully.';
    END IF;
    
    -- Step 3: Migrate existing scalar values to arrays
    RAISE NOTICE 'Starting migration of scalar values to arrays...';
    
    IF cutoff_date IS NOT NULL THEN
        RAISE NOTICE 'Filtering forms updated after: %', cutoff_date;
        
        UPDATE "Form" 
        SET "wasteDetailsConsistence_new" = ARRAY["wasteDetailsConsistence"]
        WHERE "wasteDetailsConsistence" IS NOT NULL
        AND "updatedAt" >= cutoff_date;
        
    ELSE
        RAISE NOTICE 'No date filter applied - processing all forms with wasteDetailsConsistence';
        
        UPDATE "Form" 
        SET "wasteDetailsConsistence_new" = ARRAY["wasteDetailsConsistence"]
        WHERE "wasteDetailsConsistence" IS NOT NULL;
        
    END IF;
    
    GET DIAGNOSTICS update_count = ROW_COUNT;
    
    RAISE NOTICE 'Successfully updated % forms.', update_count;
    RAISE NOTICE 'Waste consistence migration script completed successfully!';
    
END $$;

-- ========================================
-- VERIFICATION QUERIES (Optional)
-- ========================================
-- Uncomment these to verify the migration results

-- Check total count of forms with the old column populated
-- SELECT COUNT(*) as "Forms with old column" 
-- FROM "Form" 
-- WHERE "wasteDetailsConsistence" IS NOT NULL;

-- Check total count of forms with the new column populated
-- SELECT COUNT(*) as "Forms with new column" 
-- FROM "Form" 
-- WHERE "wasteDetailsConsistence_new" IS NOT NULL;

-- Sample a few records to verify the conversion
-- SELECT 
--     id,
--     "wasteDetailsConsistence" as old_value,
--     "wasteDetailsConsistence_new" as new_value
-- FROM "Form" 
-- WHERE "wasteDetailsConsistence" IS NOT NULL
-- LIMIT 10;