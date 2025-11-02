-- ============================================================================
-- SOCIAL EXPANSION - RLS POLICIES
-- ============================================================================
-- Row Level Security policies for all social expansion tables
-- Following PRD section 9.1 Security & Privacy
-- ============================================================================

-- ============================================================================
-- 1. CONSUMERS TABLE - RLS FOR SOCIAL FIELDS
-- ============================================================================

-- Enable RLS on consumers (if not already enabled)
ALTER TABLE consumers ENABLE ROW LEVEL SECURITY;

-- Users can view their own consumer record
DROP POLICY IF EXISTS "Users can view own consumer" ON consumers;
CREATE POLICY "Users can view own consumer"
  ON consumers FOR SELECT
  USING (auth_user_id = auth.uid());

-- Users can view public consumer profiles
DROP POLICY IF EXISTS "Anyone can view public consumer profiles" ON consumers;
CREATE POLICY "Anyone can view public consumer profiles"
  ON consumers FOR SELECT
  USING (is_profile_public = true);

-- Users can update their own consumer record
DROP POLICY IF EXISTS "Users can update own consumer" ON consumers;
CREATE POLICY "Users can update own consumer"
  ON consumers FOR UPDATE
  USING (auth_user_id = auth.uid());

-- ============================================================================
-- 2. CONSUMER SOCIAL PREFERENCES
-- ============================================================================

ALTER TABLE consumer_social_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
DROP POLICY IF EXISTS "Users can view their own social preferences" ON consumer_social_preferences;
CREATE POLICY "Users can view their own social preferences"
  ON consumer_social_preferences FOR SELECT
  USING (
    consumer_id IN (
      SELECT id FROM consumers WHERE auth_user_id = auth.uid()
    )
  );

-- Users can insert/update their own preferences
DROP POLICY IF EXISTS "Users can manage their own social preferences" ON consumer_social_preferences;
CREATE POLICY "Users can manage their own social preferences"
  ON consumer_social_preferences FOR ALL
  USING (
    consumer_id IN (
      SELECT id FROM consumers WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- 3. FOLLOWS TABLE
-- ============================================================================

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Users can view their own follows (who they follow and who follows them)
DROP POLICY IF EXISTS "Users can view their own follows" ON follows;
CREATE POLICY "Users can view their own follows"
  ON follows FOR SELECT
  USING (
    follower_id IN (
      SELECT id FROM consumers WHERE auth_user_id = auth.uid()
    ) OR
    following_id IN (
      SELECT id FROM consumers WHERE auth_user_id = auth.uid()
    )
  );

-- Users can create follows (follow someone)
DROP POLICY IF EXISTS "Users can create follows" ON follows;
CREATE POLICY "Users can create follows"
  ON follows FOR INSERT
  WITH CHECK (
    follower_id IN (
      SELECT id FROM consumers WHERE auth_user_id = auth.uid()
    )
  );

-- Users can delete their own follows (unfollow)
DROP POLICY IF EXISTS "Users can delete their own follows" ON follows;
CREATE POLICY "Users can delete their own follows"
  ON follows FOR DELETE
  USING (
    follower_id IN (
      SELECT id FROM consumers WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. LOCATION FOLLOWS
-- ============================================================================

-- Check if table exists before enabling RLS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'location_follows') THEN
    ALTER TABLE location_follows ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Users can view their own location follows
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'location_follows') THEN
    DROP POLICY IF EXISTS "Users can view their own location follows" ON location_follows;
    CREATE POLICY "Users can view their own location follows"
      ON location_follows FOR SELECT
      USING (
        consumer_id IN (
          SELECT id FROM consumers WHERE auth_user_id = auth.uid()
        )
      );

    -- Public can view location follows (to see who follows a location)
    DROP POLICY IF EXISTS "Public can view location follows" ON location_follows;
    CREATE POLICY "Public can view location follows"
      ON location_follows FOR SELECT
      USING (true);

    -- Users can create/delete their own location follows
    DROP POLICY IF EXISTS "Users can manage their own location follows" ON location_follows;
    CREATE POLICY "Users can manage their own location follows"
      ON location_follows FOR ALL
      USING (
        consumer_id IN (
          SELECT id FROM consumers WHERE auth_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 5. ACTIVITY FEED
-- ============================================================================

ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

-- Users can view public activities or activities from users they follow
DROP POLICY IF EXISTS "Users can view public activities or from followed users" ON activity_feed;
CREATE POLICY "Users can view public activities or from followed users"
  ON activity_feed FOR SELECT
  USING (
    is_public = true OR
    actor_id IN (
      SELECT following_id FROM follows
      WHERE follower_id IN (
        SELECT id FROM consumers WHERE auth_user_id = auth.uid()
      )
    ) OR
    actor_id IN (
      SELECT id FROM consumers WHERE auth_user_id = auth.uid()
    )
  );

-- Users can create their own activities
DROP POLICY IF EXISTS "Users can create their own activities" ON activity_feed;
CREATE POLICY "Users can create their own activities"
  ON activity_feed FOR INSERT
  WITH CHECK (
    actor_id IN (
      SELECT id FROM consumers WHERE auth_user_id = auth.uid()
    )
  );

-- Users can update/delete their own activities
DROP POLICY IF EXISTS "Users can manage their own activities" ON activity_feed;
CREATE POLICY "Users can manage their own activities"
  ON activity_feed FOR ALL
  USING (
    actor_id IN (
      SELECT id FROM consumers WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. MOMENT PHOTOS
-- ============================================================================

-- Check if table exists before enabling RLS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'moment_photos') THEN
    ALTER TABLE moment_photos ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Public can view public moment photos
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'moment_photos') THEN
    DROP POLICY IF EXISTS "Public can view public moment photos" ON moment_photos;
    CREATE POLICY "Public can view public moment photos"
      ON moment_photos FOR SELECT
      USING (is_public = true);

    -- Users can view their own moment photos (even if private)
    DROP POLICY IF EXISTS "Users can view their own moment photos" ON moment_photos;
    CREATE POLICY "Users can view their own moment photos"
      ON moment_photos FOR SELECT
      USING (
        consumer_id IN (
          SELECT id FROM consumers WHERE auth_user_id = auth.uid()
        )
      );

    -- Users can create their own moment photos
    DROP POLICY IF EXISTS "Users can create their own moment photos" ON moment_photos;
    CREATE POLICY "Users can create their own moment photos"
      ON moment_photos FOR INSERT
      WITH CHECK (
        consumer_id IN (
          SELECT id FROM consumers WHERE auth_user_id = auth.uid()
        )
      );

    -- Users can update/delete their own moment photos
    DROP POLICY IF EXISTS "Users can manage their own moment photos" ON moment_photos;
    CREATE POLICY "Users can manage their own moment photos"
      ON moment_photos FOR ALL
      USING (
        consumer_id IN (
          SELECT id FROM consumers WHERE auth_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 7. FEED LIKES
-- ============================================================================

ALTER TABLE feed_likes ENABLE ROW LEVEL SECURITY;

-- Users can view likes on activities they can see
DROP POLICY IF EXISTS "Users can view likes on visible activities" ON feed_likes;
CREATE POLICY "Users can view likes on visible activities"
  ON feed_likes FOR SELECT
  USING (
    activity_id IN (
      SELECT id FROM activity_feed WHERE is_public = true
    )
  );

-- Users can create likes
DROP POLICY IF EXISTS "Users can create likes" ON feed_likes;
CREATE POLICY "Users can create likes"
  ON feed_likes FOR INSERT
  WITH CHECK (
    consumer_id IN (
      SELECT id FROM consumers WHERE auth_user_id = auth.uid()
    )
  );

-- Users can delete their own likes
DROP POLICY IF EXISTS "Users can delete their own likes" ON feed_likes;
CREATE POLICY "Users can delete their own likes"
  ON feed_likes FOR DELETE
  USING (
    consumer_id IN (
      SELECT id FROM consumers WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- 8. FEED COMMENTS
-- ============================================================================

ALTER TABLE feed_comments ENABLE ROW LEVEL SECURITY;

-- Users can view comments on activities they can see
DROP POLICY IF EXISTS "Users can view comments on visible activities" ON feed_comments;
CREATE POLICY "Users can view comments on visible activities"
  ON feed_comments FOR SELECT
  USING (
    activity_id IN (
      SELECT id FROM activity_feed WHERE is_public = true
    )
  );

-- Users can create comments
DROP POLICY IF EXISTS "Users can create comments" ON feed_comments;
CREATE POLICY "Users can create comments"
  ON feed_comments FOR INSERT
  WITH CHECK (
    consumer_id IN (
      SELECT id FROM consumers WHERE auth_user_id = auth.uid()
    )
  );

-- Users can update/delete their own comments
DROP POLICY IF EXISTS "Users can manage their own comments" ON feed_comments;
CREATE POLICY "Users can manage their own comments"
  ON feed_comments FOR ALL
  USING (
    consumer_id IN (
      SELECT id FROM consumers WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- 9. BOOKING COMPANIONS
-- ============================================================================

ALTER TABLE booking_companions ENABLE ROW LEVEL SECURITY;

-- Users can view companions for their bookings or bookings they're invited to
DROP POLICY IF EXISTS "Users can view booking companions for their bookings" ON booking_companions;
CREATE POLICY "Users can view booking companions for their bookings"
  ON booking_companions FOR SELECT
  USING (
    booking_id IN (
      SELECT b.id FROM bookings b
      JOIN consumers c ON b.consumer_id = c.id
      WHERE c.auth_user_id = auth.uid()
    ) OR
    consumer_id IN (
      SELECT id FROM consumers WHERE auth_user_id = auth.uid()
    )
  );

-- Users can create booking companions for their bookings
DROP POLICY IF EXISTS "Users can create booking companions for their bookings" ON booking_companions;
CREATE POLICY "Users can create booking companions for their bookings"
  ON booking_companions FOR INSERT
  WITH CHECK (
    booking_id IN (
      SELECT b.id FROM bookings b
      JOIN consumers c ON b.consumer_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

-- Users can update their own booking companion status
DROP POLICY IF EXISTS "Users can update their own booking companion status" ON booking_companions;
CREATE POLICY "Users can update their own booking companion status"
  ON booking_companions FOR UPDATE
  USING (
    consumer_id IN (
      SELECT id FROM consumers WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- 10. FLOW CREDITS
-- ============================================================================

ALTER TABLE flow_credits ENABLE ROW LEVEL SECURITY;

-- Users can only view their own credits
DROP POLICY IF EXISTS "Users can view their own credits" ON flow_credits;
CREATE POLICY "Users can view their own credits"
  ON flow_credits FOR SELECT
  USING (
    consumer_id IN (
      SELECT id FROM consumers WHERE auth_user_id = auth.uid()
    )
  );

-- System can insert credits (via triggers/functions)
-- Users cannot directly insert credits

-- ============================================================================
-- 11. USER BADGES
-- ============================================================================

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Public can view badges (for display on profiles)
DROP POLICY IF EXISTS "Public can view badges" ON user_badges;
CREATE POLICY "Public can view badges"
  ON user_badges FOR SELECT
  USING (true);

-- System can insert badges (via triggers/functions)
-- Users cannot directly insert badges

-- ============================================================================
-- 12. CONVERSATIONS
-- ============================================================================

-- Check if table exists and has created_by column before enabling RLS
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'conversations'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Users can only view conversations they're part of
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') THEN
    DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
    CREATE POLICY "Users can view their own conversations"
      ON conversations FOR SELECT
      USING (
        id IN (
          SELECT conversation_id FROM conversation_participants
          WHERE consumer_id IN (
            SELECT id FROM consumers WHERE auth_user_id = auth.uid()
          )
        )
      );
  END IF;
END $$;

-- Users can create conversations
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'conversations'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'created_by'
  ) THEN
    DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
    CREATE POLICY "Users can create conversations"
      ON conversations FOR INSERT
      WITH CHECK (
        created_by IN (
          SELECT id FROM consumers WHERE auth_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Users can update conversations they created or are part of
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'conversations'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'created_by'
  ) THEN
    DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;
    CREATE POLICY "Users can update their conversations"
      ON conversations FOR UPDATE
      USING (
        created_by IN (
          SELECT id FROM consumers WHERE auth_user_id = auth.uid()
        ) OR
        id IN (
          SELECT conversation_id FROM conversation_participants
          WHERE consumer_id IN (
            SELECT id FROM consumers WHERE auth_user_id = auth.uid()
          )
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 13. CONVERSATION PARTICIPANTS
-- ============================================================================

ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- Users can view participants of conversations they're part of
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON conversation_participants;
CREATE POLICY "Users can view participants of their conversations"
  ON conversation_participants FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE consumer_id IN (
        SELECT id FROM consumers WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Users can add themselves to conversations
-- Users can add others if they created the conversation or are admin
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversation_participants') THEN
    DROP POLICY IF EXISTS "Users can manage conversation participants" ON conversation_participants;
    CREATE POLICY "Users can manage conversation participants"
      ON conversation_participants FOR ALL
      USING (
        consumer_id IN (
          SELECT id FROM consumers WHERE auth_user_id = auth.uid()
        ) OR
        conversation_id IN (
          SELECT id FROM conversations
          WHERE EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'conversations' 
            AND column_name = 'created_by'
          ) AND created_by IN (
            SELECT id FROM consumers WHERE auth_user_id = auth.uid()
          )
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 14. MESSAGES
-- ============================================================================

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can only view messages in conversations they're part of
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE consumer_id IN (
        SELECT id FROM consumers WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Users can send messages to conversations they're part of
DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id IN (
      SELECT id FROM consumers WHERE auth_user_id = auth.uid()
    ) AND
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE consumer_id IN (
        SELECT id FROM consumers WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Users can update/delete their own messages
DROP POLICY IF EXISTS "Users can manage their own messages" ON messages;
CREATE POLICY "Users can manage their own messages"
  ON messages FOR ALL
  USING (
    sender_id IN (
      SELECT id FROM consumers WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- 15. GROUP BOOKING INVITES
-- ============================================================================

ALTER TABLE group_booking_invites ENABLE ROW LEVEL SECURITY;

-- Users can view invites for conversations they're part of
DROP POLICY IF EXISTS "Users can view group booking invites" ON group_booking_invites;
CREATE POLICY "Users can view group booking invites"
  ON group_booking_invites FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE consumer_id IN (
        SELECT id FROM consumers WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Users can create invites for conversations they're part of
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'group_booking_invites') THEN
    DROP POLICY IF EXISTS "Users can create group booking invites" ON group_booking_invites;
    CREATE POLICY "Users can create group booking invites"
      ON group_booking_invites FOR INSERT
      WITH CHECK (
        created_by IN (
          SELECT id FROM consumers WHERE auth_user_id = auth.uid()
        ) AND
        conversation_id IN (
          SELECT conversation_id FROM conversation_participants
          WHERE consumer_id IN (
            SELECT id FROM consumers WHERE auth_user_id = auth.uid()
          )
        )
      );

    -- Users can update invites they created
    DROP POLICY IF EXISTS "Users can update their own group booking invites" ON group_booking_invites;
    CREATE POLICY "Users can update their own group booking invites"
      ON group_booking_invites FOR UPDATE
      USING (
        created_by IN (
          SELECT id FROM consumers WHERE auth_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 16. LOCATION TRENDS (PUBLIC DATA)
-- ============================================================================

ALTER TABLE location_trends ENABLE ROW LEVEL SECURITY;

-- Public can view trends
DROP POLICY IF EXISTS "Public can view location trends" ON location_trends;
CREATE POLICY "Public can view location trends"
  ON location_trends FOR SELECT
  USING (true);

-- Only service role can update trends (via cron jobs)
-- Users cannot modify trends

-- ============================================================================
-- END OF RLS POLICIES
-- ============================================================================

