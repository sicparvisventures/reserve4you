-- ============================================================================
-- FIX FEED AND SOCIAL RLS POLICIES
-- ============================================================================
-- After running previous migrations, some RLS policies may be causing issues
-- This migration ensures all social expansion tables have working RLS policies
-- ============================================================================

-- ============================================================================
-- 1. ACTIVITY_FEED - Ensure RLS is properly configured
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_feed') THEN
    -- Enable RLS
    ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view public activities or from followed users" ON activity_feed;
    DROP POLICY IF EXISTS "Users can create their own activities" ON activity_feed;
    DROP POLICY IF EXISTS "Users can manage their own activities" ON activity_feed;
    
    -- Create simplified policies that avoid recursion
    -- Allow viewing public activities or own activities
    CREATE POLICY "Users can view public or own activities" ON activity_feed
      FOR SELECT
      USING (
        is_public = true OR
        actor_id IN (
          SELECT id FROM consumers WHERE auth_user_id = auth.uid()
        )
      );
    
    -- Allow creating own activities
    CREATE POLICY "Users can create own activities" ON activity_feed
      FOR INSERT
      WITH CHECK (
        actor_id IN (
          SELECT id FROM consumers WHERE auth_user_id = auth.uid()
        )
      );
    
    -- Allow updating/deleting own activities
    CREATE POLICY "Users can update own activities" ON activity_feed
      FOR UPDATE
      USING (
        actor_id IN (
          SELECT id FROM consumers WHERE auth_user_id = auth.uid()
        )
      );
    
    -- Allow deleting own activities
    CREATE POLICY "Users can delete own activities" ON activity_feed
      FOR DELETE
      USING (
        actor_id IN (
          SELECT id FROM consumers WHERE auth_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 2. FEED_LIKES - Ensure RLS is properly configured
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feed_likes') THEN
    ALTER TABLE feed_likes ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view likes" ON feed_likes;
    DROP POLICY IF EXISTS "Users can create likes" ON feed_likes;
    DROP POLICY IF EXISTS "Users can delete own likes" ON feed_likes;
    
    -- Public can view likes (needed for counts)
    CREATE POLICY "Public can view likes" ON feed_likes
      FOR SELECT
      USING (true);
    
    -- Users can create their own likes
    CREATE POLICY "Users can create own likes" ON feed_likes
      FOR INSERT
      WITH CHECK (
        consumer_id IN (
          SELECT id FROM consumers WHERE auth_user_id = auth.uid()
        )
      );
    
    -- Users can delete their own likes
    CREATE POLICY "Users can delete own likes" ON feed_likes
      FOR DELETE
      USING (
        consumer_id IN (
          SELECT id FROM consumers WHERE auth_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 3. FEED_COMMENTS - Ensure RLS is properly configured
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feed_comments') THEN
    ALTER TABLE feed_comments ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view comments" ON feed_comments;
    DROP POLICY IF EXISTS "Users can create comments" ON feed_comments;
    DROP POLICY IF EXISTS "Users can update own comments" ON feed_comments;
    DROP POLICY IF EXISTS "Users can delete own comments" ON feed_comments;
    
    -- Public can view comments
    CREATE POLICY "Public can view comments" ON feed_comments
      FOR SELECT
      USING (true);
    
    -- Users can create comments
    CREATE POLICY "Users can create comments" ON feed_comments
      FOR INSERT
      WITH CHECK (
        consumer_id IN (
          SELECT id FROM consumers WHERE auth_user_id = auth.uid()
        )
      );
    
    -- Users can update own comments
    CREATE POLICY "Users can update own comments" ON feed_comments
      FOR UPDATE
      USING (
        consumer_id IN (
          SELECT id FROM consumers WHERE auth_user_id = auth.uid()
        )
      );
    
    -- Users can delete own comments
    CREATE POLICY "Users can delete own comments" ON feed_comments
      FOR DELETE
      USING (
        consumer_id IN (
          SELECT id FROM consumers WHERE auth_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 4. FOLLOWS - Ensure RLS is properly configured
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'follows') THEN
    ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view follows" ON follows;
    DROP POLICY IF EXISTS "Users can create follows" ON follows;
    DROP POLICY IF EXISTS "Users can delete own follows" ON follows;
    
    -- Public can view follows (needed for social features)
    CREATE POLICY "Public can view follows" ON follows
      FOR SELECT
      USING (true);
    
    -- Users can create their own follows
    CREATE POLICY "Users can create own follows" ON follows
      FOR INSERT
      WITH CHECK (
        follower_id IN (
          SELECT id FROM consumers WHERE auth_user_id = auth.uid()
        )
      );
    
    -- Users can delete their own follows
    CREATE POLICY "Users can delete own follows" ON follows
      FOR DELETE
      USING (
        follower_id IN (
          SELECT id FROM consumers WHERE auth_user_id = auth.uid()
        )
      );
  END IF;
END $$;

COMMENT ON TABLE activity_feed IS 'Activity feed with simplified RLS policies to avoid recursion issues';
COMMENT ON TABLE feed_likes IS 'Likes on activity feed items with public read access';
COMMENT ON TABLE feed_comments IS 'Comments on activity feed items with public read access';
COMMENT ON TABLE follows IS 'User follow relationships with public read access';

