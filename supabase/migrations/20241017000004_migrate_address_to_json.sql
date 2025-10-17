-- ============================================================================
-- MIGRATE ADDRESS COLUMNS TO address_json
-- ============================================================================
-- This migration converts the old address structure (separate columns)
-- to the new address_json JSONB structure
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '🔄 Starting address migration...';
  
  -- Check if we have old address columns
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'locations' 
    AND column_name IN ('address_line1', 'address_line2', 'city', 'postal_code')
  ) THEN
    RAISE NOTICE '   Found old address columns, migrating...';
    
    -- Add address_json column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'locations' 
      AND column_name = 'address_json'
    ) THEN
      ALTER TABLE locations ADD COLUMN address_json JSONB;
      RAISE NOTICE '   ✅ Added address_json column';
    END IF;
    
    -- Migrate existing data to address_json
    UPDATE locations
    SET address_json = jsonb_build_object(
      'street', COALESCE(address_line1, ''),
      'number', '',
      'city', COALESCE(city, ''),
      'postalCode', COALESCE(postal_code, ''),
      'country', 'NL'
    )
    WHERE address_json IS NULL;
    
    RAISE NOTICE '   ✅ Migrated existing address data';
    
    -- Make address_json NOT NULL
    ALTER TABLE locations ALTER COLUMN address_json SET NOT NULL;
    RAISE NOTICE '   ✅ Set address_json as NOT NULL';
    
    -- Drop old columns
    ALTER TABLE locations DROP COLUMN IF EXISTS address_line1;
    ALTER TABLE locations DROP COLUMN IF EXISTS address_line2;
    ALTER TABLE locations DROP COLUMN IF EXISTS city;
    ALTER TABLE locations DROP COLUMN IF EXISTS state;
    ALTER TABLE locations DROP COLUMN IF EXISTS postal_code;
    ALTER TABLE locations DROP COLUMN IF EXISTS country;
    
    RAISE NOTICE '   ✅ Dropped old address columns';
  ELSE
    -- Check if address_json exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'locations' 
      AND column_name = 'address_json'
    ) THEN
      -- Add it if it doesn't exist
      ALTER TABLE locations ADD COLUMN address_json JSONB NOT NULL DEFAULT '{}'::jsonb;
      RAISE NOTICE '   ✅ Added address_json column (no old data to migrate)';
    ELSE
      RAISE NOTICE '   ℹ️  address_json already exists, skipping migration';
    END IF;
  END IF;
  
  -- Ensure other expected columns exist with correct names
  
  -- Add opening_hours_json if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'locations' 
    AND column_name = 'opening_hours_json'
  ) THEN
    ALTER TABLE locations ADD COLUMN opening_hours_json JSONB;
    RAISE NOTICE '   ✅ Added opening_hours_json column';
  END IF;
  
  -- Add slot_minutes if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'locations' 
    AND column_name = 'slot_minutes'
  ) THEN
    ALTER TABLE locations ADD COLUMN slot_minutes INTEGER DEFAULT 90;
    RAISE NOTICE '   ✅ Added slot_minutes column';
  END IF;
  
  -- Add buffer_minutes if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'locations' 
    AND column_name = 'buffer_minutes'
  ) THEN
    ALTER TABLE locations ADD COLUMN buffer_minutes INTEGER DEFAULT 15;
    RAISE NOTICE '   ✅ Added buffer_minutes column';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Address migration complete!';
  
END $$;

-- Verify the migration
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'locations' 
    AND column_name = 'address_json'
  ) THEN
    RAISE NOTICE '✅ VERIFIED: locations.address_json exists';
  ELSE
    RAISE EXCEPTION '❌ FAILED: locations.address_json still missing!';
  END IF;
END $$;

