-- Migration: Onze Keuze - Location Metrics Tracking
-- Description: Add tracking for location metrics to determine weekly top 10

-- =====================================================
-- 1. Add metrics columns to locations table
-- =====================================================

-- Add metrics tracking columns if they don't exist
DO $$ 
BEGIN
    -- Total views counter
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'locations' AND column_name = 'total_views') THEN
        ALTER TABLE locations ADD COLUMN total_views INTEGER DEFAULT 0;
    END IF;

    -- Total clicks counter
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'locations' AND column_name = 'total_clicks') THEN
        ALTER TABLE locations ADD COLUMN total_clicks INTEGER DEFAULT 0;
    END IF;

    -- Weekly views counter (resets weekly)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'locations' AND column_name = 'weekly_views') THEN
        ALTER TABLE locations ADD COLUMN weekly_views INTEGER DEFAULT 0;
    END IF;

    -- Weekly clicks counter (resets weekly)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'locations' AND column_name = 'weekly_clicks') THEN
        ALTER TABLE locations ADD COLUMN weekly_clicks INTEGER DEFAULT 0;
    END IF;

    -- Onze Keuze score (calculated weekly)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'locations' AND column_name = 'onze_keuze_score') THEN
        ALTER TABLE locations ADD COLUMN onze_keuze_score DECIMAL(10,2) DEFAULT 0;
    END IF;

    -- Onze Keuze rank (1-10 for top locations)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'locations' AND column_name = 'onze_keuze_rank') THEN
        ALTER TABLE locations ADD COLUMN onze_keuze_rank INTEGER DEFAULT NULL;
    END IF;

    -- Last metrics update timestamp
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'locations' AND column_name = 'metrics_updated_at') THEN
        ALTER TABLE locations ADD COLUMN metrics_updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Last weekly reset timestamp
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'locations' AND column_name = 'weekly_reset_at') THEN
        ALTER TABLE locations ADD COLUMN weekly_reset_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_locations_onze_keuze_rank ON locations(onze_keuze_rank) WHERE onze_keuze_rank IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_locations_onze_keuze_score ON locations(onze_keuze_score DESC);
CREATE INDEX IF NOT EXISTS idx_locations_weekly_metrics ON locations(weekly_views DESC, weekly_clicks DESC);

-- =====================================================
-- 2. Create function to calculate Onze Keuze score
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_onze_keuze_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    location_record RECORD;
    calculated_score DECIMAL(10,2);
    rank_counter INTEGER := 1;
BEGIN
    -- Reset all ranks first
    UPDATE locations SET onze_keuze_rank = NULL;

    -- Calculate scores for all active, public locations
    FOR location_record IN
        SELECT 
            id,
            weekly_views,
            weekly_clicks,
            COALESCE(average_rating, 0) as avg_rating,
            COALESCE(review_count, 0) as reviews,
            created_at
        FROM locations
        WHERE is_active = true 
          AND is_public = true
        ORDER BY id
    LOOP
        -- Scoring algorithm:
        -- - Weekly views: 1 point each
        -- - Weekly clicks: 3 points each
        -- - Average rating: 20 points per star
        -- - Review count: 2 points each
        -- - Recency bonus: up to 10 points for new locations (< 30 days)
        
        calculated_score := 
            (COALESCE(location_record.weekly_views, 0) * 1.0) +
            (COALESCE(location_record.weekly_clicks, 0) * 3.0) +
            (COALESCE(location_record.avg_rating, 0) * 20.0) +
            (COALESCE(location_record.reviews, 0) * 2.0) +
            -- Recency bonus: max 10 points for locations less than 30 days old
            (CASE 
                WHEN location_record.created_at > NOW() - INTERVAL '30 days' 
                THEN 10.0 * (1.0 - EXTRACT(EPOCH FROM (NOW() - location_record.created_at)) / (30.0 * 86400.0))
                ELSE 0.0
            END);

        -- Update the score
        UPDATE locations
        SET 
            onze_keuze_score = calculated_score,
            metrics_updated_at = NOW()
        WHERE id = location_record.id;
    END LOOP;

    -- Assign ranks to top 10
    FOR location_record IN
        SELECT id
        FROM locations
        WHERE is_active = true 
          AND is_public = true
          AND onze_keuze_score > 0
        ORDER BY onze_keuze_score DESC, created_at DESC
        LIMIT 10
    LOOP
        UPDATE locations
        SET onze_keuze_rank = rank_counter
        WHERE id = location_record.id;
        
        rank_counter := rank_counter + 1;
    END LOOP;

    RAISE NOTICE 'Onze Keuze scores calculated and top 10 ranked';
END;
$$;

-- =====================================================
-- 3. Create function to reset weekly metrics
-- =====================================================

CREATE OR REPLACE FUNCTION reset_weekly_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Reset weekly counters
    UPDATE locations
    SET 
        weekly_views = 0,
        weekly_clicks = 0,
        weekly_reset_at = NOW()
    WHERE is_active = true;

    RAISE NOTICE 'Weekly metrics reset completed';
END;
$$;

-- =====================================================
-- 4. Create helper functions to increment metrics
-- =====================================================

-- Increment view count
CREATE OR REPLACE FUNCTION increment_location_views(location_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE locations
    SET 
        total_views = total_views + 1,
        weekly_views = weekly_views + 1,
        metrics_updated_at = NOW()
    WHERE id = location_id_param;
END;
$$;

-- Increment click count
CREATE OR REPLACE FUNCTION increment_location_clicks(location_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE locations
    SET 
        total_clicks = total_clicks + 1,
        weekly_clicks = weekly_clicks + 1,
        metrics_updated_at = NOW()
    WHERE id = location_id_param;
END;
$$;

-- =====================================================
-- 5. Initial calculation
-- =====================================================

-- Calculate initial scores
SELECT calculate_onze_keuze_scores();

-- =====================================================
-- 6. Comments for documentation
-- =====================================================

COMMENT ON COLUMN locations.total_views IS 'Total number of times location page was viewed';
COMMENT ON COLUMN locations.total_clicks IS 'Total number of clicks on location (cards, links, etc)';
COMMENT ON COLUMN locations.weekly_views IS 'Views in current week (resets weekly)';
COMMENT ON COLUMN locations.weekly_clicks IS 'Clicks in current week (resets weekly)';
COMMENT ON COLUMN locations.onze_keuze_score IS 'Calculated score for Onze Keuze ranking';
COMMENT ON COLUMN locations.onze_keuze_rank IS 'Current rank in Onze Keuze top 10 (1-10, NULL if not in top 10)';
COMMENT ON FUNCTION calculate_onze_keuze_scores() IS 'Calculate Onze Keuze scores and assign top 10 ranks';
COMMENT ON FUNCTION reset_weekly_metrics() IS 'Reset weekly view and click counters (run weekly)';
COMMENT ON FUNCTION increment_location_views(UUID) IS 'Increment view counters for a location';
COMMENT ON FUNCTION increment_location_clicks(UUID) IS 'Increment click counters for a location';

