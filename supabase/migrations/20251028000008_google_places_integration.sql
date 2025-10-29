-- ========================================
-- GOOGLE PLACES INTEGRATION
-- ========================================
-- Adds Google Business Profile integration to locations
-- Allows automatic import of business data from Google

-- STEP 1: Add Google Places columns to locations table
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS google_place_id VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS google_data JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_google_sync TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS website VARCHAR(500);

-- STEP 2: Create index for Google Place ID lookups
CREATE INDEX IF NOT EXISTS idx_locations_google_place_id 
  ON locations(google_place_id) 
  WHERE google_place_id IS NOT NULL;

-- STEP 3: Create index for last sync (for background sync jobs)
CREATE INDEX IF NOT EXISTS idx_locations_last_google_sync 
  ON locations(last_google_sync) 
  WHERE google_place_id IS NOT NULL;

-- STEP 4: Add comment for documentation
COMMENT ON COLUMN locations.google_place_id IS 'Google Place ID from Google Business Profile - unique identifier for syncing';
COMMENT ON COLUMN locations.google_data IS 'Raw JSON data from Google Places API - stored for reference and future sync';
COMMENT ON COLUMN locations.last_google_sync IS 'Timestamp of last successful sync with Google Places API';
COMMENT ON COLUMN locations.website IS 'Business website URL';

-- ========================================
-- VERIFICATION
-- ========================================

-- Check if columns exist
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'locations'
  AND column_name IN ('google_place_id', 'google_data', 'last_google_sync', 'website')
ORDER BY column_name;

-- Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'locations'
  AND indexname LIKE '%google%'
ORDER BY indexname;

