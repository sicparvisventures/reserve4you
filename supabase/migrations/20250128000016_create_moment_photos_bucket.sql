-- ============================================================================
-- CREATE MOMENT PHOTOS STORAGE BUCKET - RLS POLICIES ONLY
-- ============================================================================
-- Storage buckets must be created manually via Supabase Dashboard
-- This script only creates the RLS policies for the bucket
--
-- MANUAL SETUP REQUIRED:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "New bucket"
-- 3. Configure:
--    - Name: moment-photos
--    - Public bucket: Yes
--    - File size limit: 10485760 (10MB)
--    - Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp, image/gif
-- 4. Click "Create bucket"
-- 5. Then run this SQL script to add RLS policies
-- ============================================================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public can view moment photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload moment photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own moment photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own moment photos" ON storage.objects;

-- Policy: Public can view photos
CREATE POLICY "Public can view moment photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'moment-photos');

-- Policy: Authenticated users can upload photos
CREATE POLICY "Authenticated users can upload moment photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'moment-photos' AND
    auth.uid() IS NOT NULL
  );

-- Policy: Users can update their own photos
-- Note: Photos are stored in folders like: {consumer_id}/{filename}
-- The folder structure is based on the consumer_id from the upload API
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
CREATE POLICY "Users can delete own moment photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'moment-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Verify bucket exists (this will show a warning if bucket doesn't exist)
DO $$
DECLARE
  bucket_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'moment-photos') INTO bucket_exists;
  
  IF bucket_exists THEN
    RAISE NOTICE '✅ Storage bucket "moment-photos" exists. RLS policies created successfully.';
  ELSE
    RAISE WARNING '⚠️  Storage bucket "moment-photos" does not exist. Please create it manually via Supabase Dashboard:';
    RAISE WARNING '   Storage > New bucket > Name: moment-photos, Public: Yes, Max size: 10MB';
    RAISE WARNING '   Then run this script again to create the RLS policies.';
  END IF;
END $$;
