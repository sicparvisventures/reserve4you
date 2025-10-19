-- =====================================================
-- Migration: Add Location Images Support
-- =====================================================
-- Created: 2025-01-19
-- Purpose: Add image storage and URL columns for locations
-- =====================================================

-- 1. Add image columns to locations table
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS image_public_id TEXT,
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- 2. Add index for image queries
CREATE INDEX IF NOT EXISTS idx_locations_image_url ON locations(image_url) WHERE image_url IS NOT NULL;

-- 3. Create storage bucket for location images (done via Supabase Dashboard or SQL)
-- Note: This must be created in Supabase Dashboard under Storage
-- Bucket name: 'location-images'
-- Public: true
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif

-- 4. Add RLS policies for location-images bucket
-- These policies allow authenticated users to upload/manage images for their locations

-- Policy: Allow authenticated users to upload images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'location-images',
  'location-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- 5. Note about RLS Policies
-- Storage policies must be created via Supabase Dashboard
-- See manual steps at the end of this file

-- 10. Add helper function to get location image URL
CREATE OR REPLACE FUNCTION get_location_image_url(location_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_image_url TEXT;
  v_image_public_id TEXT;
  v_supabase_url TEXT;
BEGIN
  -- Get Supabase URL from configuration or environment
  v_supabase_url := current_setting('app.supabase_url', true);
  IF v_supabase_url IS NULL THEN
    v_supabase_url := 'https://your-project.supabase.co'; -- Fallback
  END IF;

  -- Get image info from location
  SELECT image_url, image_public_id INTO v_image_url, v_image_public_id
  FROM locations
  WHERE id = location_id;

  -- If direct URL exists, return it
  IF v_image_url IS NOT NULL AND v_image_url != '' THEN
    RETURN v_image_url;
  END IF;

  -- If public_id exists, construct storage URL
  IF v_image_public_id IS NOT NULL AND v_image_public_id != '' THEN
    RETURN v_supabase_url || '/storage/v1/object/public/location-images/' || v_image_public_id;
  END IF;

  -- Return null if no image
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- 11. Add comment for documentation
COMMENT ON COLUMN locations.image_url IS 'Primary image URL for the location. Can be external URL or Supabase storage URL.';
COMMENT ON COLUMN locations.image_public_id IS 'Public ID/filename in Supabase storage for the primary image.';
COMMENT ON COLUMN locations.images IS 'Array of additional image URLs in JSON format. Example: [{"url": "...", "alt": "..."}, ...]';

-- 12. Update existing locations with placeholder flag
UPDATE locations
SET image_url = NULL
WHERE image_url IS NULL OR image_url = '';

-- =====================================================
-- Verification Query
-- =====================================================
-- Check locations with images:
-- SELECT 
--   name,
--   image_url,
--   image_public_id,
--   CASE 
--     WHEN image_url IS NOT NULL THEN 'Has image'
--     ELSE 'No image'
--   END as status
-- FROM locations
-- ORDER BY name;

-- =====================================================
-- MANUAL STEPS REQUIRED IN SUPABASE DASHBOARD:
-- =====================================================
-- 1. Go to Storage section
-- 2. Create bucket 'location-images' if it doesn't exist
-- 3. Make it public
-- 4. Set file size limit to 5MB
-- 5. Set allowed MIME types: image/jpeg, image/png, image/webp, image/gif
-- =====================================================

