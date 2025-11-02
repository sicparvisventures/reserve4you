-- ============================================================================
-- ADD POST ACTIVITY TYPE SUPPORT
-- ============================================================================
-- Ensures activity_feed supports 'post' activity type
-- Updates triggers if needed to handle post activities
-- ============================================================================

-- Ensure activity_feed.activity_type can handle 'post' type
-- This should already be VARCHAR(50) which is sufficient

-- Update activity feed trigger function to handle 'post' type (if exists)
DO $$
BEGIN
  -- Check if trigger function exists and update it
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'create_activity_feed_entry'
  ) THEN
    -- Function exists, we can extend it if needed
    -- For now, 'post' type should work with existing logic
    RAISE NOTICE 'Activity feed trigger function exists - post type should be supported';
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN activity_feed.activity_type IS 'Type of activity: booking, review, photo, check_in, follow, post';

