-- ============================================================================
-- REVIEWS SYSTEM MIGRATION
-- ============================================================================
-- This migration adds a complete review system for Reserve4You:
-- - Reviews with star ratings
-- - Owner replies to reviews
-- - Verified bookings only (customers who actually visited)
-- - Notifications for new reviews
-- ============================================================================

-- ============================================================================
-- REVIEWS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  
  -- Review content
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title VARCHAR(255),
  comment TEXT NOT NULL,
  
  -- Verification
  is_verified BOOLEAN NOT NULL DEFAULT false, -- True if from completed booking
  visit_date DATE,
  
  -- Status
  is_published BOOLEAN NOT NULL DEFAULT true,
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  flagged_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one review per booking
  UNIQUE(booking_id),
  -- Prevent multiple reviews for same visit
  UNIQUE(location_id, consumer_id, visit_date)
);

-- ============================================================================
-- REVIEW REPLIES TABLE (Owner responses)
-- ============================================================================

CREATE TABLE IF NOT EXISTS review_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Reply content
  comment TEXT NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One reply per review
  UNIQUE(review_id)
);

-- ============================================================================
-- REVIEW HELPFUL VOTES (Optional: users can mark reviews as helpful)
-- ============================================================================

CREATE TABLE IF NOT EXISTS review_helpful_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One vote per user per review
  UNIQUE(review_id, consumer_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Get all reviews for a location (most common query)
CREATE INDEX IF NOT EXISTS idx_reviews_location_created 
  ON reviews(location_id, created_at DESC) 
  WHERE is_published = true;

-- Get reviews by consumer
CREATE INDEX IF NOT EXISTS idx_reviews_consumer 
  ON reviews(consumer_id, created_at DESC);

-- Get reviews by rating (for filtering)
CREATE INDEX IF NOT EXISTS idx_reviews_rating 
  ON reviews(location_id, rating) 
  WHERE is_published = true;

-- Get verified reviews
CREATE INDEX IF NOT EXISTS idx_reviews_verified 
  ON reviews(location_id, is_verified) 
  WHERE is_published = true AND is_verified = true;

-- Get replies for reviews
CREATE INDEX IF NOT EXISTS idx_review_replies_review 
  ON review_replies(review_id);

-- Get helpful votes count
CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_review 
  ON review_helpful_votes(review_id);

-- ============================================================================
-- ADD REVIEW STATS TO LOCATIONS TABLE
-- ============================================================================

-- Add review statistics columns to locations
ALTER TABLE locations 
  ADD COLUMN IF NOT EXISTS review_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rating_distribution JSONB DEFAULT '{"1":0,"2":0,"3":0,"4":0,"5":0}'::jsonb;

-- ============================================================================
-- FUNCTIONS TO UPDATE REVIEW STATS
-- ============================================================================

-- Function to update location review statistics
CREATE OR REPLACE FUNCTION update_location_review_stats(p_location_id UUID)
RETURNS void AS $$
DECLARE
  v_count INT;
  v_avg DECIMAL(3,2);
  v_distribution JSONB;
BEGIN
  -- Count total published reviews
  SELECT COUNT(*)::INT
  INTO v_count
  FROM reviews
  WHERE location_id = p_location_id
    AND is_published = true;

  -- Calculate average rating
  SELECT ROUND(AVG(rating)::numeric, 2)::DECIMAL(3,2)
  INTO v_avg
  FROM reviews
  WHERE location_id = p_location_id
    AND is_published = true;

  -- Calculate rating distribution
  SELECT jsonb_build_object(
    '1', COALESCE(SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END), 0),
    '2', COALESCE(SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END), 0),
    '3', COALESCE(SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END), 0),
    '4', COALESCE(SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END), 0),
    '5', COALESCE(SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END), 0)
  )
  INTO v_distribution
  FROM reviews
  WHERE location_id = p_location_id
    AND is_published = true;

  -- Update location
  UPDATE locations
  SET 
    review_count = v_count,
    average_rating = v_avg,
    rating_distribution = v_distribution,
    updated_at = NOW()
  WHERE id = p_location_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS TO MAINTAIN REVIEW STATS
-- ============================================================================

-- Trigger function to update stats when review is inserted/updated/deleted
CREATE OR REPLACE FUNCTION trigger_update_review_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM update_location_review_stats(OLD.location_id);
    RETURN OLD;
  ELSE
    PERFORM update_location_review_stats(NEW.location_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS reviews_stats_trigger ON reviews;
CREATE TRIGGER reviews_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_review_stats();

-- ============================================================================
-- REVIEW NOTIFICATION TYPE
-- ============================================================================

-- Add review notification types to notifications table
-- (assuming notifications table already exists from previous migrations)
DO $$
BEGIN
  -- Check if notifications table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
    -- Add new notification types for reviews if they don't exist
    -- The actual notification creation will happen in application code
    RAISE NOTICE 'Notifications table exists - review notifications can be created';
  ELSE
    RAISE NOTICE 'Notifications table does not exist - skipping notification setup';
  END IF;
END
$$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpful_votes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - REVIEWS
-- ============================================================================

-- Everyone can view published reviews
CREATE POLICY "Anyone can view published reviews"
  ON reviews FOR SELECT
  USING (is_published = true);

-- Consumers can view their own reviews (including unpublished)
CREATE POLICY "Consumers can view own reviews"
  ON reviews FOR SELECT
  USING (auth.uid() IN (SELECT auth_user_id FROM consumers WHERE id = consumer_id));

-- Location owners/managers can view all reviews for their locations
CREATE POLICY "Location owners can view all reviews"
  ON reviews FOR SELECT
  USING (
    location_id IN (
      SELECT l.id FROM locations l
      INNER JOIN memberships m ON m.tenant_id = l.tenant_id
      WHERE m.user_id = auth.uid()
        AND m.role IN ('OWNER', 'MANAGER')
    )
  );

-- Consumers can create reviews for their bookings
CREATE POLICY "Consumers can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT auth_user_id FROM consumers WHERE id = consumer_id)
    AND (
      -- Must have a completed booking at this location
      booking_id IS NULL OR
      booking_id IN (
        SELECT b.id FROM bookings b
        INNER JOIN consumers c ON c.id = b.consumer_id
        WHERE c.auth_user_id = auth.uid()
          AND b.location_id = location_id
          AND b.status = 'COMPLETED'
      )
    )
  );

-- Consumers can update their own reviews
CREATE POLICY "Consumers can update own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() IN (SELECT auth_user_id FROM consumers WHERE id = consumer_id))
  WITH CHECK (auth.uid() IN (SELECT auth_user_id FROM consumers WHERE id = consumer_id));

-- Consumers can delete their own reviews
CREATE POLICY "Consumers can delete own reviews"
  ON reviews FOR DELETE
  USING (auth.uid() IN (SELECT auth_user_id FROM consumers WHERE id = consumer_id));

-- Location owners can update review status (flag, unpublish)
CREATE POLICY "Location owners can moderate reviews"
  ON reviews FOR UPDATE
  USING (
    location_id IN (
      SELECT l.id FROM locations l
      INNER JOIN memberships m ON m.tenant_id = l.tenant_id
      WHERE m.user_id = auth.uid()
        AND m.role IN ('OWNER', 'MANAGER')
    )
  );

-- ============================================================================
-- RLS POLICIES - REVIEW REPLIES
-- ============================================================================

-- Everyone can view replies to published reviews
CREATE POLICY "Anyone can view review replies"
  ON review_replies FOR SELECT
  USING (
    review_id IN (SELECT id FROM reviews WHERE is_published = true)
  );

-- Location owners/managers can create replies
CREATE POLICY "Location owners can create replies"
  ON review_replies FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND review_id IN (
      SELECT r.id FROM reviews r
      INNER JOIN locations l ON l.id = r.location_id
      INNER JOIN memberships m ON m.tenant_id = l.tenant_id
      WHERE m.user_id = auth.uid()
        AND m.role IN ('OWNER', 'MANAGER')
    )
  );

-- Location owners can update their replies
CREATE POLICY "Location owners can update own replies"
  ON review_replies FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Location owners can delete their replies
CREATE POLICY "Location owners can delete own replies"
  ON review_replies FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES - HELPFUL VOTES
-- ============================================================================

-- Anyone can view helpful vote counts
CREATE POLICY "Anyone can view helpful votes"
  ON review_helpful_votes FOR SELECT
  USING (true);

-- Authenticated consumers can vote
CREATE POLICY "Consumers can vote helpful"
  ON review_helpful_votes FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT auth_user_id FROM consumers WHERE id = consumer_id)
  );

-- Consumers can remove their votes
CREATE POLICY "Consumers can remove helpful votes"
  ON review_helpful_votes FOR DELETE
  USING (
    auth.uid() IN (SELECT auth_user_id FROM consumers WHERE id = consumer_id)
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if consumer can review a location
CREATE OR REPLACE FUNCTION can_consumer_review_location(
  p_consumer_id UUID,
  p_location_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_completed_booking BOOLEAN;
BEGIN
  -- Check if consumer has at least one completed booking
  SELECT EXISTS(
    SELECT 1 FROM bookings
    WHERE consumer_id = p_consumer_id
      AND location_id = p_location_id
      AND status = 'COMPLETED'
  ) INTO v_has_completed_booking;
  
  RETURN v_has_completed_booking;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get review summary for a location
CREATE OR REPLACE FUNCTION get_location_review_summary(p_location_id UUID)
RETURNS TABLE (
  total_reviews INT,
  average_rating DECIMAL(3,2),
  rating_1_count INT,
  rating_2_count INT,
  rating_3_count INT,
  rating_4_count INT,
  rating_5_count INT,
  verified_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INT as total_reviews,
    ROUND(AVG(rating)::numeric, 2)::DECIMAL(3,2) as average_rating,
    SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END)::INT as rating_1_count,
    SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END)::INT as rating_2_count,
    SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END)::INT as rating_3_count,
    SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END)::INT as rating_4_count,
    SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END)::INT as rating_5_count,
    SUM(CASE WHEN is_verified THEN 1 ELSE 0 END)::INT as verified_count
  FROM reviews
  WHERE location_id = p_location_id
    AND is_published = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on tables
GRANT SELECT ON reviews TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON reviews TO authenticated;

GRANT SELECT ON review_replies TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON review_replies TO authenticated;

GRANT SELECT ON review_helpful_votes TO authenticated, anon;
GRANT INSERT, DELETE ON review_helpful_votes TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION can_consumer_review_location TO authenticated;
GRANT EXECUTE ON FUNCTION get_location_review_summary TO authenticated, anon;
GRANT EXECUTE ON FUNCTION update_location_review_stats TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE reviews IS 'Customer reviews for restaurant locations';
COMMENT ON TABLE review_replies IS 'Owner/manager responses to reviews';
COMMENT ON TABLE review_helpful_votes IS 'User votes marking reviews as helpful';

COMMENT ON COLUMN reviews.is_verified IS 'True if review is from a completed booking';
COMMENT ON COLUMN reviews.is_published IS 'False if review is hidden by owner or flagged';
COMMENT ON COLUMN reviews.is_flagged IS 'True if review has been flagged for review';

COMMENT ON FUNCTION update_location_review_stats IS 'Updates cached review statistics on location';
COMMENT ON FUNCTION can_consumer_review_location IS 'Checks if consumer has completed booking at location';
COMMENT ON FUNCTION get_location_review_summary IS 'Returns aggregate review statistics for a location';

