-- ============================================================================
-- SOCIAL BOOKING INVITES - Database Schema
-- ============================================================================
-- This migration adds social features for inviting friends to bookings:
-- 1. Follow system (follows table)
-- 2. Booking companions (who was invited to a booking)
-- 3. Consumer social profile extensions
-- ============================================================================

-- ============================================================================
-- 1. EXTEND CONSUMERS TABLE WITH SOCIAL FIELDS
-- ============================================================================

ALTER TABLE consumers 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS favorite_cuisines TEXT[],
ADD COLUMN IF NOT EXISTS top_3_restaurants UUID[],
ADD COLUMN IF NOT EXISTS is_profile_public BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_in_discover BOOLEAN DEFAULT true;

-- ============================================================================
-- 2. SOCIAL GRAPH - FOLLOWS TABLE
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
-- 3. BOOKING COMPANIONS (WHO WAS INVITED TO A BOOKING)
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
-- 4. SOCIAL PREFERENCES TABLE
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

-- ============================================================================
-- 5. UPDATE TRIGGER FOR booking_companions
-- ============================================================================

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

-- ============================================================================
-- 6. RLS POLICIES
-- ============================================================================

-- Follows: Users can see who they follow and who follows them
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "Users can create follows" ON follows;
CREATE POLICY "Users can create follows"
  ON follows FOR INSERT
  WITH CHECK (
    follower_id IN (
      SELECT id FROM consumers WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own follows" ON follows;
CREATE POLICY "Users can delete their own follows"
  ON follows FOR DELETE
  USING (
    follower_id IN (
      SELECT id FROM consumers WHERE auth_user_id = auth.uid()
    )
  );

-- Booking companions: Users can see companions for their bookings
ALTER TABLE booking_companions ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "Users can update their own booking companion status" ON booking_companions;
CREATE POLICY "Users can update their own booking companion status"
  ON booking_companions FOR UPDATE
  USING (
    consumer_id IN (
      SELECT id FROM consumers WHERE auth_user_id = auth.uid()
    )
  );

-- Social preferences: Users can only manage their own preferences
ALTER TABLE consumer_social_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own social preferences" ON consumer_social_preferences;
CREATE POLICY "Users can view their own social preferences"
  ON consumer_social_preferences FOR SELECT
  USING (
    consumer_id IN (
      SELECT id FROM consumers WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage their own social preferences" ON consumer_social_preferences;
CREATE POLICY "Users can manage their own social preferences"
  ON consumer_social_preferences FOR ALL
  USING (
    consumer_id IN (
      SELECT id FROM consumers WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- 7. HELPER FUNCTION: Get followed users for a consumer
-- ============================================================================

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

-- ============================================================================
-- 8. HELPER FUNCTION: Check if two consumers follow each other
-- ============================================================================

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
-- END OF MIGRATION
-- ============================================================================

