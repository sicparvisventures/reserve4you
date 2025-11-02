-- ============================================================================
-- MOMENT PHOTOS STORAGE SETUP
-- ============================================================================
-- Creates storage bucket and RLS policies for moment photos
-- Allows users to upload photos related to bookings/moments
-- ============================================================================

-- Create storage bucket for moment photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'moment-photos',
  'moment-photos',
  true,
  10485760, -- 10MB (larger than location images for higher quality)
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- Storage RLS Policies for moment-photos bucket
-- Note: These need to be created via Supabase Dashboard under Storage > Policies
-- Or use SECURITY DEFINER functions

-- Policy: Public can view photos
DROP POLICY IF EXISTS "Public can view moment photos" ON storage.objects;
CREATE POLICY "Public can view moment photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'moment-photos');

-- Policy: Authenticated users can upload photos
DROP POLICY IF EXISTS "Authenticated users can upload moment photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload moment photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'moment-photos' AND
    auth.uid() IS NOT NULL
  );

-- Policy: Users can update their own photos
DROP POLICY IF EXISTS "Users can update own moment photos" ON storage.objects;
CREATE POLICY "Users can update own moment photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'moment-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'moment-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can delete their own photos
DROP POLICY IF EXISTS "Users can delete own moment photos" ON storage.objects;
CREATE POLICY "Users can delete own moment photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'moment-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Ensure moment_photos table exists and has all needed columns
DO $$
BEGIN
  -- Add photo_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'moment_photos' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE moment_photos ADD COLUMN photo_url TEXT;
  END IF;

  -- Ensure other columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'moment_photos' AND column_name = 'caption'
  ) THEN
    ALTER TABLE moment_photos ADD COLUMN caption TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'moment_photos' AND column_name = 'tags'
  ) THEN
    ALTER TABLE moment_photos ADD COLUMN tags TEXT[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'moment_photos' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE moment_photos ADD COLUMN is_public BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Add index for activity feed queries
CREATE INDEX IF NOT EXISTS idx_moment_photos_consumer_created ON moment_photos(consumer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moment_photos_location_created ON moment_photos(location_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moment_photos_booking ON moment_photos(booking_id) WHERE booking_id IS NOT NULL;

COMMENT ON TABLE moment_photos IS 'Photos shared by users from their dining experiences';
COMMENT ON COLUMN moment_photos.photo_url IS 'URL to photo stored in Supabase Storage bucket moment-photos';

