-- ============================================================================
-- DISCOVER PAGE SEARCH OPTIMIZATION
-- ============================================================================
-- This migration adds indexes and functions to optimize the discover page
-- search functionality for Reserve4You.
--
-- Features:
-- - Fast text search on location names and descriptions
-- - Cuisine type filtering
-- - Price range filtering
-- - Geographic search capability (future enhancement)
-- - Performance indexes for common queries
-- ============================================================================

-- Add indexes for search performance
-- ============================================================================

-- Index for public and active locations (most common filter)
CREATE INDEX IF NOT EXISTS idx_locations_public_active 
ON locations(is_public, is_active) 
WHERE is_public = true AND is_active = true;

-- Index for cuisine type filtering (try both column names for compatibility)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'cuisine_type') THEN
        CREATE INDEX IF NOT EXISTS idx_locations_cuisine_type 
        ON locations(cuisine_type) 
        WHERE is_public = true AND is_active = true;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'cuisine') THEN
        CREATE INDEX IF NOT EXISTS idx_locations_cuisine_type 
        ON locations(cuisine) 
        WHERE is_public = true AND is_active = true;
    END IF;
END $$;

-- Index for price range filtering
CREATE INDEX IF NOT EXISTS idx_locations_price_range 
ON locations(price_range) 
WHERE is_public = true AND is_active = true;

-- Composite index for common filter combinations
-- (Skip cuisine column in composite index as it may not exist yet)
CREATE INDEX IF NOT EXISTS idx_locations_search_composite 
ON locations(is_public, is_active, price_range);

-- Text search indexes using trigram for fuzzy matching
-- Enable pg_trgm extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN index for fast text search on name
CREATE INDEX IF NOT EXISTS idx_locations_name_trgm 
ON locations USING gin(name gin_trgm_ops);

-- GIN index for fast text search on description
CREATE INDEX IF NOT EXISTS idx_locations_description_trgm 
ON locations USING gin(description gin_trgm_ops);

-- Index for ordering by created_at (for "newest first")
CREATE INDEX IF NOT EXISTS idx_locations_created_at 
ON locations(created_at DESC) 
WHERE is_public = true AND is_active = true;

-- Geographic search preparation
-- ============================================================================
-- Enable PostGIS extension for geographic queries (optional, for future use)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- If PostGIS is enabled, add spatial index
-- CREATE INDEX IF NOT EXISTS idx_locations_geography 
-- ON locations USING gist(geography(ST_MakePoint(longitude::float, latitude::float)));


-- Search function for discover page
-- ============================================================================
-- This function provides optimized search with multiple filter options

CREATE OR REPLACE FUNCTION search_public_locations(
  search_query TEXT DEFAULT NULL,
  filter_cuisine TEXT DEFAULT NULL,
  filter_price INT DEFAULT NULL,
  filter_city TEXT DEFAULT NULL,
  result_limit INT DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  cuisine_type TEXT,
  price_range INT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  latitude TEXT,
  longitude TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ,
  relevance_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.name,
    l.slug,
    l.description,
    -- Use cuisine_type if it exists, otherwise use cuisine
    COALESCE(
      (SELECT cuisine_type FROM locations WHERE id = l.id),
      (SELECT cuisine FROM locations WHERE id = l.id)
    ) AS cuisine_type,
    l.price_range,
    COALESCE(
      (SELECT address FROM locations WHERE id = l.id),
      (SELECT address_line1 FROM locations WHERE id = l.id)
    ) AS address,
    l.city,
    l.postal_code,
    l.latitude::TEXT,
    l.longitude::TEXT,
    l.phone,
    l.email,
    l.website,
    COALESCE(
      (SELECT image_url FROM locations WHERE id = l.id),
      (SELECT hero_image_url FROM locations WHERE id = l.id)
    ) AS image_url,
    l.created_at,
    -- Calculate relevance score for ranking
    CASE 
      WHEN search_query IS NOT NULL THEN
        similarity(l.name, search_query) * 2.0 +  -- Name matches are weighted higher
        similarity(COALESCE(l.description, ''), search_query)
      ELSE 0.0
    END AS relevance_score
  FROM locations l
  WHERE 
    l.is_public = true 
    AND l.is_active = true
    -- Text search filter
    AND (
      search_query IS NULL 
      OR l.name ILIKE '%' || search_query || '%'
      OR l.description ILIKE '%' || search_query || '%'
      OR l.city ILIKE '%' || search_query || '%'
    )
    -- Cuisine filter (check both column names for compatibility)
    AND (
      filter_cuisine IS NULL 
      OR (SELECT cuisine_type FROM locations WHERE id = l.id) = filter_cuisine
      OR (SELECT cuisine FROM locations WHERE id = l.id) = filter_cuisine
    )
    -- Price filter
    AND (filter_price IS NULL OR l.price_range = filter_price)
    -- City filter
    AND (filter_city IS NULL OR l.city ILIKE '%' || filter_city || '%')
  ORDER BY 
    -- Order by relevance if searching, otherwise by newest
    CASE WHEN search_query IS NOT NULL THEN relevance_score ELSE 0 END DESC,
    l.created_at DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;


-- Function to get available cuisine types (for filter dropdown)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_available_cuisine_types()
RETURNS TABLE (
  cuisine_type TEXT,
  count BIGINT
) AS $$
DECLARE
  has_cuisine_type BOOLEAN;
BEGIN
  -- Check which column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'locations' AND column_name = 'cuisine_type'
  ) INTO has_cuisine_type;

  IF has_cuisine_type THEN
    RETURN QUERY
    SELECT 
      l.cuisine_type,
      COUNT(*) as count
    FROM locations l
    WHERE 
      l.is_public = true 
      AND l.is_active = true
      AND l.cuisine_type IS NOT NULL
    GROUP BY l.cuisine_type
    ORDER BY count DESC, l.cuisine_type ASC;
  ELSE
    -- Fall back to 'cuisine' column
    RETURN QUERY
    SELECT 
      l.cuisine AS cuisine_type,
      COUNT(*) as count
    FROM locations l
    WHERE 
      l.is_public = true 
      AND l.is_active = true
      AND l.cuisine IS NOT NULL
    GROUP BY l.cuisine
    ORDER BY count DESC, l.cuisine ASC;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;


-- Function to get available cities (for filter dropdown)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_available_cities()
RETURNS TABLE (
  city TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.city,
    COUNT(*) as count
  FROM locations l
  WHERE 
    l.is_public = true 
    AND l.is_active = true
    AND l.city IS NOT NULL
  GROUP BY l.city
  ORDER BY count DESC, l.city ASC;
END;
$$ LANGUAGE plpgsql STABLE;


-- Statistics function for admin/analytics
-- ============================================================================

CREATE OR REPLACE FUNCTION get_search_statistics()
RETURNS TABLE (
  total_public_locations BIGINT,
  locations_by_cuisine JSONB,
  locations_by_price JSONB,
  locations_by_city JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM locations WHERE is_public = true AND is_active = true),
    (SELECT jsonb_object_agg(cuisine_type, count) 
     FROM (
       SELECT cuisine_type, COUNT(*) as count 
       FROM locations 
       WHERE is_public = true AND is_active = true 
       GROUP BY cuisine_type
     ) sub),
    (SELECT jsonb_object_agg(price_range, count) 
     FROM (
       SELECT price_range, COUNT(*) as count 
       FROM locations 
       WHERE is_public = true AND is_active = true 
       GROUP BY price_range
     ) sub),
    (SELECT jsonb_object_agg(city, count) 
     FROM (
       SELECT city, COUNT(*) as count 
       FROM locations 
       WHERE is_public = true AND is_active = true 
       GROUP BY city
     ) sub);
END;
$$ LANGUAGE plpgsql STABLE;


-- Grant permissions
-- ============================================================================

-- Allow authenticated users to call search functions
GRANT EXECUTE ON FUNCTION search_public_locations TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_cuisine_types TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_cities TO authenticated;

-- Allow anonymous users to call search functions (for public discover page)
GRANT EXECUTE ON FUNCTION search_public_locations TO anon;
GRANT EXECUTE ON FUNCTION get_available_cuisine_types TO anon;
GRANT EXECUTE ON FUNCTION get_available_cities TO anon;

-- Admin functions
GRANT EXECUTE ON FUNCTION get_search_statistics TO authenticated;


-- Comments for documentation
-- ============================================================================

COMMENT ON FUNCTION search_public_locations IS 
'Optimized search function for the discover page. Supports text search, cuisine filtering, price filtering, and city filtering.';

COMMENT ON FUNCTION get_available_cuisine_types IS 
'Returns all available cuisine types with their counts for filter dropdowns.';

COMMENT ON FUNCTION get_available_cities IS 
'Returns all available cities with their counts for filter dropdowns.';

COMMENT ON FUNCTION get_search_statistics IS 
'Returns aggregated statistics about public locations for admin/analytics.';

