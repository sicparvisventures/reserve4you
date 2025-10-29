-- ============================================================================
-- RESERVE4YOU MULTI-SECTOR EXPANSION - STEP 1.2: EXTEND LOCATIONS TABLE
-- ============================================================================
-- This migration adds sector support to the locations table
-- Adds: business_sector (ENUM) and sector_config (JSONB)
-- Backfills existing restaurants with default configuration
-- 100% BACKWARDS COMPATIBLE - no breaking changes
-- ============================================================================

-- Step 1: Add business_sector column (defaults to RESTAURANT for existing rows)
ALTER TABLE locations 
  ADD COLUMN IF NOT EXISTS business_sector business_sector DEFAULT 'RESTAURANT';

-- Step 2: Add sector_config column (JSONB for flexible configuration)
ALTER TABLE locations 
  ADD COLUMN IF NOT EXISTS sector_config JSONB DEFAULT '{}'::jsonb;

-- Step 3: Add index for efficient sector-based queries
CREATE INDEX IF NOT EXISTS idx_locations_business_sector 
  ON locations(business_sector) 
  WHERE is_public = true;

-- Step 4: Add comments for documentation
COMMENT ON COLUMN locations.business_sector IS 'The type of business (restaurant, beauty salon, medical practice, etc.)';
COMMENT ON COLUMN locations.sector_config IS 'Sector-specific configuration: terminology, features, booking rules, display settings';

-- Step 5: Backfill existing locations with RESTAURANT configuration
-- This ensures all current restaurants have proper sector config
UPDATE locations 
SET 
  business_sector = 'RESTAURANT',
  sector_config = jsonb_build_object(
    'terminology', jsonb_build_object(
      'booking', 'Reservering',
      'resource', 'Tafel',
      'customer', 'Gast',
      'staff', 'Personeel',
      'service', 'Gerecht',
      'location', 'Restaurant'
    ),
    'features', jsonb_build_object(
      'requires_staff_assignment', false,
      'has_service_menu', true,
      'allows_recurring_bookings', false,
      'duration_type', 'flexible',
      'requires_intake_form', false,
      'has_class_bookings', false,
      'supports_product_sales', false
    ),
    'booking_rules', jsonb_build_object(
      'min_booking_lead_hours', 0,
      'max_booking_lead_days', 90,
      'cancellation_policy_hours', 24,
      'requires_approval', false,
      'allows_waitlist', true
    ),
    'display', jsonb_build_object(
      'show_price_on_cards', true,
      'show_duration', false,
      'show_staff_photos', false,
      'primary_color', '#FF5A5F',
      'icon', 'restaurant'
    )
  )
WHERE business_sector IS NULL OR business_sector = 'RESTAURANT';

-- Step 6: Verification and reporting
DO $$
DECLARE
  total_locations INT;
  restaurant_locations INT;
  locations_with_config INT;
BEGIN
  -- Count total locations
  SELECT COUNT(*) INTO total_locations FROM locations;
  
  -- Count restaurant locations
  SELECT COUNT(*) INTO restaurant_locations 
  FROM locations 
  WHERE business_sector = 'RESTAURANT';
  
  -- Count locations with sector_config
  SELECT COUNT(*) INTO locations_with_config 
  FROM locations 
  WHERE sector_config IS NOT NULL AND sector_config != '{}'::jsonb;
  
  -- Report results
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ STEP 1.2 COMPLETE: Locations Extended!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Total locations: %', total_locations;
  RAISE NOTICE 'Restaurant locations: %', restaurant_locations;
  RAISE NOTICE 'Locations with sector_config: %', locations_with_config;
  RAISE NOTICE '';
  
  -- Verify columns exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'locations' AND column_name = 'business_sector'
  ) THEN
    RAISE NOTICE '✅ Column "business_sector" added successfully';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'locations' AND column_name = 'sector_config'
  ) THEN
    RAISE NOTICE '✅ Column "sector_config" added successfully';
  END IF;
  
  -- Verify index
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_locations_business_sector'
  ) THEN
    RAISE NOTICE '✅ Index "idx_locations_business_sector" created successfully';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 All existing locations are now configured as RESTAURANT';
  RAISE NOTICE '🎉 Ready for multi-sector expansion!';
  RAISE NOTICE '============================================';
END $$;

-- Optional: View sample configuration for verification
-- Uncomment to see what the sector_config looks like
/*
SELECT 
  id,
  name,
  business_sector,
  sector_config->'terminology' as terminology,
  sector_config->'features' as features
FROM locations
LIMIT 3;
*/

