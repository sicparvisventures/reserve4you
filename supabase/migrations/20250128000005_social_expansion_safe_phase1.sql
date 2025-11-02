-- ============================================================================
-- SOCIAL EXPANSION - SAFE PHASE 1 MIGRATION (FIXED)
-- ============================================================================
-- This is a COMPLETE REPLACEMENT that ensures all tables are created correctly
-- Run this INSTEAD of the previous migrations if they failed
-- ============================================================================

-- ============================================================================
-- PART 1: EXTEND CONSUMERS TABLE
-- ============================================================================

DO $$ 
BEGIN
  -- Add profile_picture_url
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consumers' AND column_name = 'profile_picture_url') THEN
    ALTER TABLE consumers ADD COLUMN profile_picture_url TEXT;
  END IF;
  
  -- Add bio
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consumers' AND column_name = 'bio') THEN
    ALTER TABLE consumers ADD COLUMN bio TEXT;
  END IF;
  
  -- Add favorite_cuisines
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consumers' AND column_name = 'favorite_cuisines') THEN
    ALTER TABLE consumers ADD COLUMN favorite_cuisines TEXT[];
  END IF;
  
  -- Add top_3_restaurants
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consumers' AND column_name = 'top_3_restaurants') THEN
    ALTER TABLE consumers ADD COLUMN top_3_restaurants UUID[];
  END IF;
  
  -- Add is_profile_public
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consumers' AND column_name = 'is_profile_public') THEN
    ALTER TABLE consumers ADD COLUMN is_profile_public BOOLEAN DEFAULT true;
  END IF;
  
  -- Add show_in_discover
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consumers' AND column_name = 'show_in_discover') THEN
    ALTER TABLE consumers ADD COLUMN show_in_discover BOOLEAN DEFAULT true;
  END IF;
END $$;

-- ============================================================================
-- PART 2: CREATE ALL TABLES (ONE BY ONE WITH ERROR HANDLING)
-- ============================================================================

-- Consumer Social Preferences
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

-- Follows
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK(follower_id != following_id)
);

-- Location Follows
CREATE TABLE IF NOT EXISTS location_follows (
  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (consumer_id, location_id)
);

-- Activity Feed
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id UUID NOT NULL,
  metadata JSONB,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Moment Photos
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

-- Feed Likes
CREATE TABLE IF NOT EXISTS feed_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES activity_feed(id) ON DELETE CASCADE,
  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(activity_id, consumer_id)
);

-- Feed Comments
CREATE TABLE IF NOT EXISTS feed_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES activity_feed(id) ON DELETE CASCADE,
  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Booking Companions (if not exists from previous migration)
CREATE TABLE IF NOT EXISTS booking_companions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES consumers(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'invited',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(booking_id, consumer_id)
);

-- Flow Credits
CREATE TABLE IF NOT EXISTS flow_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  amount INT NOT NULL DEFAULT 0,
  source VARCHAR(50) NOT NULL,
  source_id UUID,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Badges
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  badge_type VARCHAR(50) NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB,
  UNIQUE(consumer_id, badge_type)
);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(20) NOT NULL DEFAULT 'direct',
  name TEXT,
  created_by UUID REFERENCES consumers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add created_by column if table exists but column doesn't
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'conversations' AND column_name = 'created_by'
    ) THEN
      ALTER TABLE conversations ADD COLUMN created_by UUID REFERENCES consumers(id) ON DELETE SET NULL;
    END IF;
    
    -- Add type column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'conversations' AND column_name = 'type'
    ) THEN
      ALTER TABLE conversations ADD COLUMN type VARCHAR(20) NOT NULL DEFAULT 'direct';
    END IF;
    
    -- Add name column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'conversations' AND column_name = 'name'
    ) THEN
      ALTER TABLE conversations ADD COLUMN name TEXT;
    END IF;
  END IF;
END $$;

-- Conversation Participants
CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  PRIMARY KEY (conversation_id, consumer_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group Booking Invites
CREATE TABLE IF NOT EXISTS group_booking_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  proposed_date TIMESTAMPTZ,
  proposed_time TIME,
  party_size INT,
  created_by UUID NOT NULL REFERENCES consumers(id),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Location Trends
CREATE TABLE IF NOT EXISTS location_trends (
  location_id UUID PRIMARY KEY REFERENCES locations(id) ON DELETE CASCADE,
  momentum_score DECIMAL(10,2) DEFAULT 0,
  trending_in_city TEXT,
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PART 3: CREATE ALL INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_social_preferences_consumer ON consumer_social_preferences(consumer_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_location_follows_consumer ON location_follows(consumer_id);
CREATE INDEX IF NOT EXISTS idx_location_follows_location ON location_follows(location_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_actor ON activity_feed(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_public ON activity_feed(is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_type ON activity_feed(activity_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_target ON activity_feed(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_moment_photos_booking ON moment_photos(booking_id);
CREATE INDEX IF NOT EXISTS idx_moment_photos_location ON moment_photos(location_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moment_photos_consumer ON moment_photos(consumer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_likes_activity ON feed_likes(activity_id);
CREATE INDEX IF NOT EXISTS idx_feed_likes_consumer ON feed_likes(consumer_id);
CREATE INDEX IF NOT EXISTS idx_feed_comments_activity ON feed_comments(activity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_comments_consumer ON feed_comments(consumer_id);
CREATE INDEX IF NOT EXISTS idx_booking_companions_booking ON booking_companions(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_companions_consumer ON booking_companions(consumer_id);
CREATE INDEX IF NOT EXISTS idx_booking_companions_invited_by ON booking_companions(invited_by);
CREATE INDEX IF NOT EXISTS idx_flow_credits_consumer ON flow_credits(consumer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_flow_credits_source ON flow_credits(source, source_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_consumer ON user_badges(consumer_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_type ON user_badges(badge_type);
-- Only create indexes if columns exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' AND column_name = 'created_by'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' AND column_name = 'type'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_conversation_participants_consumer ON conversation_participants(consumer_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_booking_invites_conversation ON group_booking_invites(conversation_id);
CREATE INDEX IF NOT EXISTS idx_group_booking_invites_location ON group_booking_invites(location_id);
CREATE INDEX IF NOT EXISTS idx_group_booking_invites_created_by ON group_booking_invites(created_by);
CREATE INDEX IF NOT EXISTS idx_location_trends_momentum ON location_trends(momentum_score DESC);
CREATE INDEX IF NOT EXISTS idx_location_trends_city ON location_trends(trending_in_city);

-- ============================================================================
-- END OF SAFE MIGRATION
-- ============================================================================

