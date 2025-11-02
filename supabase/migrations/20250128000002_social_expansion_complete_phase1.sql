-- ============================================================================
-- SOCIAL EXPANSION - COMPLETE PHASE 1 MIGRATION (FIXED VERSION)
-- ============================================================================
-- This migration implements ALL Phase 1 database schema from PRD:
-- 1. Social Profile Extensions
-- 2. Social Graph (follows)
-- 3. Activity Feed & Moments
-- 4. Social Interactions (likes, comments)
-- 5. Booking Companions
-- 6. Loyalty & Gamification (FlowCredits, Badges)
-- 7. Chat & Invites (conversations, messages)
-- 8. Discovery & Trends
-- 
-- FIXED: All table creation uses proper error handling
-- ============================================================================

-- ============================================================================
-- 1. EXTEND CONSUMERS TABLE WITH SOCIAL FIELDS
-- ============================================================================

-- Check and add columns one by one to avoid errors
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consumers' AND column_name = 'profile_picture_url') THEN
    ALTER TABLE consumers ADD COLUMN profile_picture_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consumers' AND column_name = 'bio') THEN
    ALTER TABLE consumers ADD COLUMN bio TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consumers' AND column_name = 'favorite_cuisines') THEN
    ALTER TABLE consumers ADD COLUMN favorite_cuisines TEXT[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consumers' AND column_name = 'top_3_restaurants') THEN
    ALTER TABLE consumers ADD COLUMN top_3_restaurants UUID[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consumers' AND column_name = 'is_profile_public') THEN
    ALTER TABLE consumers ADD COLUMN is_profile_public BOOLEAN DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consumers' AND column_name = 'show_in_discover') THEN
    ALTER TABLE consumers ADD COLUMN show_in_discover BOOLEAN DEFAULT true;
  END IF;
END $$;

COMMENT ON COLUMN consumers.profile_picture_url IS 'URL to profile picture stored in Supabase Storage';
COMMENT ON COLUMN consumers.bio IS 'User bio/description';
COMMENT ON COLUMN consumers.favorite_cuisines IS 'Array of favorite cuisine types';
COMMENT ON COLUMN consumers.top_3_restaurants IS 'Array of top 3 favorite restaurant UUIDs';
COMMENT ON COLUMN consumers.is_profile_public IS 'Whether profile is publicly visible';
COMMENT ON COLUMN consumers.show_in_discover IS 'Whether user appears in discover features';

-- ============================================================================
-- 2. SOCIAL PREFERENCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS consumer_social_preferences (
  consumer_id UUID PRIMARY KEY REFERENCES consumers(id) ON DELETE CASCADE,
  auto_share_bookings BOOLEAN DEFAULT false,
  auto_share_reviews BOOLEAN DEFAULT false,
  show_location_to_friends BOOLEAN DEFAULT true,
  allow_friend_requests BOOLEAN DEFAULT true,
  notification_new_follower BOOLEAN DEFAULT true,
  notification_activity_feed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_preferences_consumer ON consumer_social_preferences(consumer_id);

-- ============================================================================
-- 3. SOCIAL GRAPH - FOLLOWS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK(follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at DESC);

-- ============================================================================
-- 4. LOCATION FOLLOWS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS location_follows (
  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (consumer_id, location_id)
);

CREATE INDEX IF NOT EXISTS idx_location_follows_consumer ON location_follows(consumer_id);
CREATE INDEX IF NOT EXISTS idx_location_follows_location ON location_follows(location_id);

-- ============================================================================
-- 5. ACTIVITY FEED TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- 'booking', 'review', 'photo', 'check_in', 'follow'
  target_type VARCHAR(50) NOT NULL, -- 'location', 'booking', 'review', 'consumer'
  target_id UUID NOT NULL,
  metadata JSONB, -- Flexible storage for activity-specific data
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_feed_actor ON activity_feed(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_public ON activity_feed(is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_type ON activity_feed(activity_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_target ON activity_feed(target_type, target_id);

-- ============================================================================
-- 6. MOMENT PHOTOS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS moment_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  tags TEXT[],
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moment_photos_booking ON moment_photos(booking_id);
CREATE INDEX IF NOT EXISTS idx_moment_photos_location ON moment_photos(location_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moment_photos_consumer ON moment_photos(consumer_id, created_at DESC);

-- ============================================================================
-- 7. SOCIAL INTERACTIONS - FEED LIKES
-- ============================================================================

CREATE TABLE IF NOT EXISTS feed_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES activity_feed(id) ON DELETE CASCADE,
  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(activity_id, consumer_id)
);

CREATE INDEX IF NOT EXISTS idx_feed_likes_activity ON feed_likes(activity_id);
CREATE INDEX IF NOT EXISTS idx_feed_likes_consumer ON feed_likes(consumer_id);

-- ============================================================================
-- 8. SOCIAL INTERACTIONS - FEED COMMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS feed_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES activity_feed(id) ON DELETE CASCADE,
  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feed_comments_activity ON feed_comments(activity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_comments_consumer ON feed_comments(consumer_id);

-- ============================================================================
-- 9. BOOKING COMPANIONS (if not exists from previous migration)
-- ============================================================================

CREATE TABLE IF NOT EXISTS booking_companions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES consumers(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'invited', -- 'invited', 'accepted', 'declined'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(booking_id, consumer_id)
);

CREATE INDEX IF NOT EXISTS idx_booking_companions_booking ON booking_companions(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_companions_consumer ON booking_companions(consumer_id);
CREATE INDEX IF NOT EXISTS idx_booking_companions_invited_by ON booking_companions(invited_by);

-- ============================================================================
-- 10. LOYALTY & GAMIFICATION - FLOW CREDITS
-- ============================================================================

CREATE TABLE IF NOT EXISTS flow_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  amount INT NOT NULL DEFAULT 0,
  source VARCHAR(50) NOT NULL, -- 'review', 'invite', 'share', 'photo', 'referral', 'booking'
  source_id UUID, -- Reference to source (review_id, booking_id, etc.)
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flow_credits_consumer ON flow_credits(consumer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_flow_credits_source ON flow_credits(source, source_id);

-- ============================================================================
-- 11. LOYALTY & GAMIFICATION - USER BADGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  badge_type VARCHAR(50) NOT NULL, -- 'food_explorer', 'local_hero', 'top_taster', 'social_butterfly', 'review_master'
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB,
  UNIQUE(consumer_id, badge_type)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_consumer ON user_badges(consumer_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_type ON user_badges(badge_type);

-- ============================================================================
-- 12. CHAT & INVITES - CONVERSATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(20) NOT NULL DEFAULT 'direct', -- 'direct', 'group'
  name TEXT, -- For group conversations
  created_by UUID REFERENCES consumers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);

-- ============================================================================
-- 13. CHAT & INVITES - CONVERSATION PARTICIPANTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  PRIMARY KEY (conversation_id, consumer_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_consumer ON conversation_participants(consumer_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation ON conversation_participants(conversation_id);

-- ============================================================================
-- 14. CHAT & INVITES - MESSAGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'booking_invite', 'location_share'
  metadata JSONB, -- For booking invites, location shares, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id, created_at DESC);

-- ============================================================================
-- 15. CHAT & INVITES - GROUP BOOKING INVITES
-- ============================================================================

CREATE TABLE IF NOT EXISTS group_booking_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  proposed_date TIMESTAMPTZ,
  proposed_time TIME,
  party_size INT,
  created_by UUID NOT NULL REFERENCES consumers(id),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_booking_invites_conversation ON group_booking_invites(conversation_id);
CREATE INDEX IF NOT EXISTS idx_group_booking_invites_location ON group_booking_invites(location_id);
CREATE INDEX IF NOT EXISTS idx_group_booking_invites_created_by ON group_booking_invites(created_by);

-- ============================================================================
-- 16. DISCOVERY & TRENDS - LOCATION TRENDS (CACHE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS location_trends (
  location_id UUID PRIMARY KEY REFERENCES locations(id) ON DELETE CASCADE,
  momentum_score DECIMAL(10,2) DEFAULT 0, -- Calculated from recent activity
  trending_in_city TEXT,
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_location_trends_momentum ON location_trends(momentum_score DESC);
CREATE INDEX IF NOT EXISTS idx_location_trends_city ON location_trends(trending_in_city);

-- ============================================================================
-- 17. UPDATE TRIGGERS
-- ============================================================================

-- Update trigger for consumer_social_preferences
CREATE OR REPLACE FUNCTION update_social_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS social_preferences_updated_at ON consumer_social_preferences;
CREATE TRIGGER social_preferences_updated_at
  BEFORE UPDATE ON consumer_social_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_social_preferences_updated_at();

-- Update trigger for booking_companions
CREATE OR REPLACE FUNCTION update_booking_companions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS booking_companions_updated_at ON booking_companions;
CREATE TRIGGER booking_companions_updated_at
  BEFORE UPDATE ON booking_companions
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_companions_updated_at();

-- Update trigger for conversations
CREATE OR REPLACE FUNCTION update_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS conversations_updated_at ON conversations;
CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversations_updated_at();

-- Update trigger for messages
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS messages_updated_at ON messages;
CREATE TRIGGER messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_messages_updated_at();

-- Update trigger for feed_comments
CREATE OR REPLACE FUNCTION update_feed_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS feed_comments_updated_at ON feed_comments;
CREATE TRIGGER feed_comments_updated_at
  BEFORE UPDATE ON feed_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_feed_comments_updated_at();

-- ============================================================================
-- 18. HELPER FUNCTIONS
-- ============================================================================

-- Get followed consumers for a user
CREATE OR REPLACE FUNCTION get_followed_consumers(p_consumer_id UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  email VARCHAR,
  profile_picture_url TEXT,
  bio TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.email,
    c.profile_picture_url,
    c.bio
  FROM follows f
  JOIN consumers c ON f.following_id = c.id
  WHERE f.follower_id = p_consumer_id
  ORDER BY c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if two consumers follow each other
CREATE OR REPLACE FUNCTION are_following_each_other(p_consumer1_id UUID, p_consumer2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM follows
    WHERE follower_id = p_consumer1_id AND following_id = p_consumer2_id
  ) AND EXISTS (
    SELECT 1 FROM follows
    WHERE follower_id = p_consumer2_id AND following_id = p_consumer1_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- END OF PHASE 1 SCHEMA MIGRATION
-- ============================================================================

