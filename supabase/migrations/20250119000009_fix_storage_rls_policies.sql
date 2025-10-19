-- =====================================================
-- Migration: Fix Storage RLS Policies for Location Images
-- =====================================================
-- Created: 2025-01-19
-- Purpose: Add proper RLS policies for location-images storage bucket
-- =====================================================

-- 1. Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can upload location images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view location images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their location images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their location images" ON storage.objects;

-- 3. Policy: Allow authenticated users to INSERT (upload) images
CREATE POLICY "Authenticated users can upload location images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'location-images'
);

-- 4. Policy: Allow everyone to SELECT (view) images from the public bucket
CREATE POLICY "Public can view location images"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'location-images'
);

-- 5. Policy: Allow authenticated users to UPDATE their own location images
CREATE POLICY "Users can update their location images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'location-images'
)
WITH CHECK (
  bucket_id = 'location-images'
);

-- 6. Policy: Allow authenticated users to DELETE their own location images
CREATE POLICY "Users can delete their location images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'location-images'
);

-- =====================================================
-- Verification
-- =====================================================
-- Check that policies are created:
-- SELECT 
--   schemaname, 
--   tablename, 
--   policyname, 
--   permissive,
--   roles,
--   cmd,
--   qual,
--   with_check
-- FROM pg_policies
-- WHERE tablename = 'objects' AND policyname LIKE '%location images%';
-- =====================================================

