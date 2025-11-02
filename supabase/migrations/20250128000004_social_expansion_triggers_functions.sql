-- ============================================================================
-- SOCIAL EXPANSION - TRIGGERS & FUNCTIONS
-- ============================================================================
-- Database triggers and functions for automatic activity feed generation,
-- credits awarding, and trending calculations
-- Following PRD section 5.2.2 Database Functions & Triggers
-- ============================================================================

-- ============================================================================
-- 1. ACTIVITY FEED AUTO-GENERATION
-- ============================================================================

-- Function: Create activity feed entry on booking completion
CREATE OR REPLACE FUNCTION create_booking_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if activity_feed table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_feed') THEN
    RETURN NEW;
  END IF;

  -- Only create activity if booking status changed to COMPLETED
  IF NEW.status = 'COMPLETED' AND (OLD.status IS NULL OR OLD.status != 'COMPLETED') THEN
    -- Only create if consumer_id exists (not guest booking)
    IF NEW.consumer_id IS NOT NULL THEN
      INSERT INTO activity_feed (actor_id, activity_type, target_type, target_id, metadata)
      VALUES (
        NEW.consumer_id,
        'booking',
        'location',
        NEW.location_id,
        jsonb_build_object(
          'booking_id', NEW.id,
          'location_name', (SELECT name FROM locations WHERE id = NEW.location_id),
          'party_size', NEW.party_size,
          'date', COALESCE(NEW.start_ts::text, ''),
          'guest_name', NEW.guest_name
        )
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS booking_activity_trigger ON bookings;

-- Create trigger only if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_feed') THEN
    CREATE TRIGGER booking_activity_trigger
      AFTER INSERT OR UPDATE ON bookings
      FOR EACH ROW
      EXECUTE FUNCTION create_booking_activity();
  END IF;
END $$;

-- Function: Create activity feed entry on review creation
CREATE OR REPLACE FUNCTION create_review_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if activity_feed table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_feed') THEN
    RETURN NEW;
  END IF;

  -- Create activity feed entry when review is published
  IF NEW.is_published = true THEN
    INSERT INTO activity_feed (actor_id, activity_type, target_type, target_id, metadata)
    VALUES (
      NEW.consumer_id,
      'review',
      'location',
      NEW.location_id,
      jsonb_build_object(
        'review_id', NEW.id,
        'location_name', (SELECT name FROM locations WHERE id = NEW.location_id),
        'rating', NEW.rating,
        'title', NEW.title,
        'comment', LEFT(NEW.comment, 200) -- First 200 chars
      )
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS review_activity_trigger ON reviews;

-- Create trigger only if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_feed') THEN
    CREATE TRIGGER review_activity_trigger
      AFTER INSERT OR UPDATE ON reviews
      FOR EACH ROW
      EXECUTE FUNCTION create_review_activity();
  END IF;
END $$;

-- Function: Create activity feed entry on follow
CREATE OR REPLACE FUNCTION create_follow_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if activity_feed table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_feed') THEN
    RETURN NEW;
  END IF;

  -- Create activity feed entry when user follows another user
  INSERT INTO activity_feed (actor_id, activity_type, target_type, target_id, metadata)
  VALUES (
    NEW.follower_id,
    'follow',
    'consumer',
    NEW.following_id,
    jsonb_build_object(
      'followed_user_name', (SELECT name FROM consumers WHERE id = NEW.following_id)
    )
  )
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS follow_activity_trigger ON follows;

-- Create trigger only if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_feed') THEN
    CREATE TRIGGER follow_activity_trigger
      AFTER INSERT ON follows
      FOR EACH ROW
      EXECUTE FUNCTION create_follow_activity();
  END IF;
END $$;

-- ============================================================================
-- 2. FLOW CREDITS AUTO-AWARD
-- ============================================================================

-- Function: Award credits on review creation
CREATE OR REPLACE FUNCTION award_review_credits()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if flow_credits table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'flow_credits') THEN
    RETURN NEW;
  END IF;

  -- Award 10 credits for creating a review
  IF NEW.is_published = true THEN
    INSERT INTO flow_credits (consumer_id, amount, source, source_id)
    VALUES (NEW.consumer_id, 10, 'review', NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS review_credits_trigger ON reviews;

-- Create trigger only if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'flow_credits') THEN
    CREATE TRIGGER review_credits_trigger
      AFTER INSERT ON reviews
      FOR EACH ROW
      EXECUTE FUNCTION award_review_credits();
  END IF;
END $$;

-- Function: Award credits on booking completion (first booking bonus)
CREATE OR REPLACE FUNCTION award_booking_credits()
RETURNS TRIGGER AS $$
DECLARE
  booking_count INT;
BEGIN
  -- Check if flow_credits table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'flow_credits') THEN
    RETURN NEW;
  END IF;

  -- Only award on booking creation, not updates
  IF OLD IS NULL AND NEW.consumer_id IS NOT NULL THEN
    -- Check if this is user's first booking
    SELECT COUNT(*) INTO booking_count
    FROM bookings
    WHERE consumer_id = NEW.consumer_id
    AND status IN ('PENDING', 'CONFIRMED', 'COMPLETED');
    
    -- Award 20 credits for first booking
    IF booking_count = 1 THEN
      INSERT INTO flow_credits (consumer_id, amount, source, source_id)
      VALUES (NEW.consumer_id, 20, 'booking', NEW.id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS booking_credits_trigger ON bookings;

-- Create trigger only if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'flow_credits') THEN
    CREATE TRIGGER booking_credits_trigger
      AFTER INSERT ON bookings
      FOR EACH ROW
      EXECUTE FUNCTION award_booking_credits();
  END IF;
END $$;

-- Function: Award credits on friend invite (via booking_companions)
CREATE OR REPLACE FUNCTION award_invite_credits()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if flow_credits table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'flow_credits') THEN
    RETURN NEW;
  END IF;

  -- Award 5 credits to inviter for each friend invited
  IF NEW.invited_by IS NOT NULL THEN
    INSERT INTO flow_credits (consumer_id, amount, source, source_id)
    VALUES (NEW.invited_by, 5, 'invite', NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS invite_credits_trigger ON booking_companions;

-- Create trigger only if table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'booking_companions'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'flow_credits'
  ) THEN
    CREATE TRIGGER invite_credits_trigger
      AFTER INSERT ON booking_companions
      FOR EACH ROW
      EXECUTE FUNCTION award_invite_credits();
  END IF;
END $$;

-- Function: Award credits on photo upload
CREATE OR REPLACE FUNCTION award_photo_credits()
RETURNS TRIGGER AS $$
BEGIN
  -- Award 5 credits for uploading a photo
  -- Only if moment_photos table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'flow_credits') THEN
    INSERT INTO flow_credits (consumer_id, amount, source, source_id)
    VALUES (NEW.consumer_id, 5, 'photo', NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS photo_credits_trigger ON moment_photos;

-- Create trigger only if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'moment_photos') THEN
    CREATE TRIGGER photo_credits_trigger
      AFTER INSERT ON moment_photos
      FOR EACH ROW
      EXECUTE FUNCTION award_photo_credits();
  END IF;
END $$;

-- ============================================================================
-- 3. BADGE AWARDING FUNCTIONS
-- ============================================================================

-- Function: Check and award "Food Explorer" badge (10 new places visited)
CREATE OR REPLACE FUNCTION check_food_explorer_badge(p_consumer_id UUID)
RETURNS VOID AS $$
DECLARE
  unique_locations INT;
BEGIN
  -- Count unique locations with completed bookings
  SELECT COUNT(DISTINCT location_id) INTO unique_locations
  FROM bookings
  WHERE consumer_id = p_consumer_id
  AND status = 'COMPLETED';
  
  -- Award badge if threshold reached
  IF unique_locations >= 10 THEN
    INSERT INTO user_badges (consumer_id, badge_type, metadata)
    VALUES (
      p_consumer_id,
      'food_explorer',
      jsonb_build_object('locations_visited', unique_locations)
    )
    ON CONFLICT (consumer_id, badge_type) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check and award "Review Master" badge (25 reviews written)
CREATE OR REPLACE FUNCTION check_review_master_badge(p_consumer_id UUID)
RETURNS VOID AS $$
DECLARE
  review_count INT;
BEGIN
  -- Count reviews
  SELECT COUNT(*) INTO review_count
  FROM reviews
  WHERE consumer_id = p_consumer_id
  AND is_published = true;
  
  -- Award badge if threshold reached
  IF review_count >= 25 THEN
    INSERT INTO user_badges (consumer_id, badge_type, metadata)
    VALUES (
      p_consumer_id,
      'review_master',
      jsonb_build_object('reviews_written', review_count)
    )
    ON CONFLICT (consumer_id, badge_type) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Check badges after review creation
CREATE OR REPLACE FUNCTION check_badges_after_review()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_badges') THEN
    IF NEW.is_published = true THEN
      PERFORM check_review_master_badge(NEW.consumer_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS review_badge_check_trigger ON reviews;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_badges') THEN
    CREATE TRIGGER review_badge_check_trigger
      AFTER INSERT OR UPDATE ON reviews
      FOR EACH ROW
      EXECUTE FUNCTION check_badges_after_review();
  END IF;
END $$;

-- Trigger: Check badges after booking completion
CREATE OR REPLACE FUNCTION check_badges_after_booking()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_badges') THEN
    IF NEW.status = 'COMPLETED' AND NEW.consumer_id IS NOT NULL THEN
      PERFORM check_food_explorer_badge(NEW.consumer_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS booking_badge_check_trigger ON bookings;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_badges') THEN
    CREATE TRIGGER booking_badge_check_trigger
      AFTER INSERT OR UPDATE ON bookings
      FOR EACH ROW
      EXECUTE FUNCTION check_badges_after_booking();
  END IF;
END $$;

-- ============================================================================
-- 4. TRENDING CALCULATION
-- ============================================================================

-- Function: Calculate location momentum score
CREATE OR REPLACE FUNCTION calculate_location_momentum(loc_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  momentum DECIMAL;
BEGIN
  SELECT 
    COALESCE((
      -- Recent reviews (last 7 days) weighted by rating
      SELECT SUM(rating * 2) 
      FROM reviews 
      WHERE location_id = loc_id 
      AND created_at > NOW() - INTERVAL '7 days'
      AND is_published = true
    ), 0) +
    COALESCE((
      -- Recent bookings (last 7 days)
      SELECT COUNT(*) * 1.5 
      FROM bookings 
      WHERE location_id = loc_id 
      AND created_at > NOW() - INTERVAL '7 days'
      AND status IN ('PENDING', 'CONFIRMED', 'COMPLETED')
    ), 0) +
    COALESCE((
      -- Social shares (last 7 days) from activity feed
      SELECT COUNT(*) * 3 
      FROM activity_feed 
      WHERE target_type = 'location' 
      AND target_id = loc_id 
      AND created_at > NOW() - INTERVAL '7 days'
      AND is_public = true
    ), 0) +
    COALESCE((
      -- Photo uploads (last 7 days) - only if table exists
      SELECT CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'moment_photos')
        THEN (
          SELECT COUNT(*) * 2
          FROM moment_photos
          WHERE location_id = loc_id
          AND created_at > NOW() - INTERVAL '7 days'
          AND is_public = true
        )
        ELSE 0
      END
    ), 0)
  INTO momentum;
  
  RETURN momentum;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update trending for a location
CREATE OR REPLACE FUNCTION update_location_trending(loc_id UUID)
RETURNS VOID AS $$
DECLARE
  momentum_score DECIMAL;
  location_city TEXT;
BEGIN
  -- Calculate momentum
  SELECT calculate_location_momentum(loc_id) INTO momentum_score;
  
  -- Get location city
  SELECT (address_json->>'city')::TEXT INTO location_city
  FROM locations
  WHERE id = loc_id;
  
  -- Insert or update trending record
  INSERT INTO location_trends (location_id, momentum_score, trending_in_city, last_calculated_at)
  VALUES (loc_id, momentum_score, location_city, NOW())
  ON CONFLICT (location_id) DO UPDATE
  SET 
    momentum_score = EXCLUDED.momentum_score,
    trending_in_city = EXCLUDED.trending_in_city,
    last_calculated_at = EXCLUDED.last_calculated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update trending for all locations (to be called by cron)
CREATE OR REPLACE FUNCTION update_all_location_trending()
RETURNS VOID AS $$
DECLARE
  loc_record RECORD;
BEGIN
  -- Update trending for all public, active locations
  FOR loc_record IN 
    SELECT id FROM locations 
    WHERE is_public = true 
    AND is_active = true
  LOOP
    PERFORM update_location_trending(loc_record.id);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Update trending when review is created/updated
CREATE OR REPLACE FUNCTION update_trending_on_review()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'location_trends') THEN
    PERFORM update_location_trending(NEW.location_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS review_trending_trigger ON reviews;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'location_trends') THEN
    CREATE TRIGGER review_trending_trigger
      AFTER INSERT OR UPDATE ON reviews
      FOR EACH ROW
      EXECUTE FUNCTION update_trending_on_review();
  END IF;
END $$;

-- Trigger: Update trending when booking is created
CREATE OR REPLACE FUNCTION update_trending_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'location_trends') THEN
    PERFORM update_location_trending(NEW.location_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS booking_trending_trigger ON bookings;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'location_trends') THEN
    CREATE TRIGGER booking_trending_trigger
      AFTER INSERT ON bookings
      FOR EACH ROW
      EXECUTE FUNCTION update_trending_on_booking();
  END IF;
END $$;

-- Trigger: Update trending when activity is created
CREATE OR REPLACE FUNCTION update_trending_on_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'location_trends') THEN
    IF NEW.target_type = 'location' AND NEW.is_public = true THEN
      PERFORM update_location_trending(NEW.target_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS activity_trending_trigger ON activity_feed;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_feed') 
  AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'location_trends') THEN
    CREATE TRIGGER activity_trending_trigger
      AFTER INSERT ON activity_feed
      FOR EACH ROW
      EXECUTE FUNCTION update_trending_on_activity();
  END IF;
END $$;

-- ============================================================================
-- 5. HELPER FUNCTIONS (EXTENDED)
-- ============================================================================

-- Function: Get total credits balance for a consumer
CREATE OR REPLACE FUNCTION get_consumer_credits_balance(p_consumer_id UUID)
RETURNS INT AS $$
DECLARE
  total_credits INT;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total_credits
  FROM flow_credits
  WHERE consumer_id = p_consumer_id
  AND (expires_at IS NULL OR expires_at > NOW());
  
  RETURN total_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get follower count for a consumer
CREATE OR REPLACE FUNCTION get_follower_count(p_consumer_id UUID)
RETURNS INT AS $$
DECLARE
  follower_count INT;
BEGIN
  SELECT COUNT(*) INTO follower_count
  FROM follows
  WHERE following_id = p_consumer_id;
  
  RETURN follower_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get following count for a consumer
CREATE OR REPLACE FUNCTION get_following_count(p_consumer_id UUID)
RETURNS INT AS $$
DECLARE
  following_count INT;
BEGIN
  SELECT COUNT(*) INTO following_count
  FROM follows
  WHERE follower_id = p_consumer_id;
  
  RETURN following_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- END OF TRIGGERS & FUNCTIONS
-- ============================================================================

