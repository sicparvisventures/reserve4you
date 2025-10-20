-- =====================================================
-- ADD INTERNAL LOCATION NAMES
-- =====================================================
-- This script adds support for internal location names
-- alongside public display names.
--
-- Usage:
-- 1. Run this script in Supabase SQL Editor
-- 2. Restart your Next.js dev server
-- 3. Update location settings in the UI
--
-- Author: Reserve4You
-- Date: 2025-10-20
-- =====================================================

-- Step 1: Add internal_name column to locations table
DO $$ 
BEGIN
  -- Check if internal_name column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'locations' 
    AND column_name = 'internal_name'
  ) THEN
    -- Add internal_name column
    ALTER TABLE locations 
    ADD COLUMN internal_name VARCHAR(255);
    
    RAISE NOTICE '✅ Added internal_name column to locations table';
  ELSE
    RAISE NOTICE '⏭️  internal_name column already exists';
  END IF;
  
  -- Set internal_name to current name for existing locations if not set
  UPDATE locations 
  SET internal_name = name 
  WHERE internal_name IS NULL;
  
  RAISE NOTICE '✅ Set internal_name to current name for existing locations';
END $$;

-- Step 2: Add comment to explain the columns
COMMENT ON COLUMN locations.name IS 'Public display name shown to customers';
COMMENT ON COLUMN locations.internal_name IS 'Internal name for staff/dashboard use (optional)';

-- Step 3: Create or update view for public locations (with public name)
CREATE OR REPLACE VIEW public_locations AS
SELECT 
  id,
  tenant_id,
  name,  -- Public name for customers
  slug,
  description,
  cuisine,
  price_range,
  address_json,
  phone,
  email,
  website,
  image_url,
  banner_image_url,
  hero_image_url,
  opening_hours_json,
  is_public,
  is_active,
  has_deals,
  group_friendly,
  latitude,
  longitude,
  created_at,
  updated_at
FROM locations
WHERE is_public = true 
  AND is_active = true;

COMMENT ON VIEW public_locations IS 'Public locations with public display names';

-- Step 4: Create or update view for internal locations (with internal name)
CREATE OR REPLACE VIEW internal_locations AS
SELECT 
  id,
  tenant_id,
  COALESCE(internal_name, name) as display_name,  -- Use internal name if set, otherwise public name
  name as public_name,
  internal_name,
  slug,
  description,
  cuisine,
  price_range,
  address_json,
  phone,
  email,
  website,
  image_url,
  banner_image_url,
  hero_image_url,
  opening_hours_json,
  slot_minutes,
  buffer_minutes,
  auto_accept_bookings,
  is_public,
  is_active,
  has_deals,
  group_friendly,
  latitude,
  longitude,
  created_at,
  updated_at
FROM locations;

COMMENT ON VIEW internal_locations IS 'Internal locations with internal names for dashboard';

-- Step 5: Create helper function to get location display name based on context
CREATE OR REPLACE FUNCTION get_location_name(
  p_location_id UUID,
  p_use_internal BOOLEAN DEFAULT false
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_name TEXT;
BEGIN
  IF p_use_internal THEN
    -- Get internal name (fallback to public name if not set)
    SELECT COALESCE(internal_name, name)
    INTO v_name
    FROM locations
    WHERE id = p_location_id;
  ELSE
    -- Get public name
    SELECT name
    INTO v_name
    FROM locations
    WHERE id = p_location_id;
  END IF;
  
  RETURN v_name;
END;
$$;

COMMENT ON FUNCTION get_location_name IS 'Get location name based on context (internal vs public)';

-- Step 6: Update RLS policies (if needed)
-- No changes needed - existing policies apply to both columns

-- Step 7: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_locations_internal_name 
ON locations(internal_name) 
WHERE internal_name IS NOT NULL;

-- Step 8: Summary and validation
DO $$
DECLARE
  v_location_count INTEGER;
BEGIN
  -- Count locations
  SELECT COUNT(*) INTO v_location_count FROM locations;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Internal Location Names Setup Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  - Added internal_name column to locations';
  RAISE NOTICE '  - Created views: public_locations, internal_locations';
  RAISE NOTICE '  - Created helper function: get_location_name()';
  RAISE NOTICE '  - Created index on internal_name';
  RAISE NOTICE '  - Total locations: %', v_location_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Go to Manager Dashboard → Location → Settings';
  RAISE NOTICE '  2. Set internal names for your locations';
  RAISE NOTICE '  3. Internal names appear in dashboards';
  RAISE NOTICE '  4. Public names appear on customer-facing pages';
  RAISE NOTICE '';
  RAISE NOTICE 'Example Usage in SQL:';
  RAISE NOTICE '  -- Get public name:';
  RAISE NOTICE '  SELECT get_location_name(location_id, false);';
  RAISE NOTICE '';
  RAISE NOTICE '  -- Get internal name:';
  RAISE NOTICE '  SELECT get_location_name(location_id, true);';
  RAISE NOTICE '';
END $$;

-- Step 9: Query to view current location names
SELECT 
  id,
  name as public_name,
  internal_name,
  CASE 
    WHEN internal_name IS NOT NULL AND internal_name != name 
    THEN '✅ Has different internal name'
    ELSE '⚠️  Using public name only'
  END as status,
  is_public,
  is_active
FROM locations
ORDER BY created_at DESC;

