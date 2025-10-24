-- ============================================================================
-- AI ANALYTICS FUNCTIONS - RESERVE4YOU
-- ============================================================================
-- SQL functions om data te analyseren voor AI chatbot
-- Geeft inzichten in reserveringen, omzet, gasten, trends
-- ============================================================================

-- ============================================================================
-- 1. GET DETAILED BOOKING ANALYTICS
-- ============================================================================
CREATE OR REPLACE FUNCTION get_ai_booking_analytics(
  p_tenant_id UUID,
  p_location_id UUID DEFAULT NULL,
  p_days_back INT DEFAULT 30
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_start_date DATE;
BEGIN
  v_start_date := CURRENT_DATE - (p_days_back || ' days')::INTERVAL;
  
  SELECT json_build_object(
    'total_bookings', COUNT(*),
    'confirmed_bookings', COUNT(*) FILTER (WHERE status = 'confirmed'),
    'pending_bookings', COUNT(*) FILTER (WHERE status = 'pending'),
    'cancelled_bookings', COUNT(*) FILTER (WHERE status = 'cancelled'),
    'no_show_bookings', COUNT(*) FILTER (WHERE status = 'no_show'),
    'completed_bookings', COUNT(*) FILTER (WHERE status = 'completed'),
    
    'total_guests', COALESCE(SUM(number_of_guests), 0),
    'avg_party_size', ROUND(AVG(number_of_guests), 1),
    'max_party_size', MAX(number_of_guests),
    
    'total_revenue_cents', COALESCE(SUM(deposit_amount_cents), 0),
    'avg_revenue_per_booking', ROUND(AVG(deposit_amount_cents), 0),
    
    'no_show_rate', ROUND(
      COUNT(*) FILTER (WHERE status = 'no_show')::DECIMAL / 
      NULLIF(COUNT(*), 0) * 100, 2
    ),
    'cancellation_rate', ROUND(
      COUNT(*) FILTER (WHERE status = 'cancelled')::DECIMAL / 
      NULLIF(COUNT(*), 0) * 100, 2
    ),
    'confirmation_rate', ROUND(
      COUNT(*) FILTER (WHERE status = 'confirmed')::DECIMAL / 
      NULLIF(COUNT(*), 0) * 100, 2
    ),
    
    'busiest_day_of_week', (
      SELECT day_name
      FROM (
        SELECT 
          EXTRACT(DOW FROM booking_date) as dow,
          TO_CHAR(booking_date, 'Day') as day_name,
          COUNT(*) as cnt
        FROM bookings b2
        WHERE b2.location_id = COALESCE(p_location_id, b2.location_id)
          AND EXISTS (
            SELECT 1 FROM locations l 
            WHERE l.id = b2.location_id 
            AND l.tenant_id = p_tenant_id
          )
          AND b2.booking_date >= v_start_date
        GROUP BY dow, day_name
        ORDER BY cnt DESC
        LIMIT 1
      ) sub
    ),
    
    'busiest_hour', (
      SELECT booking_time
      FROM (
        SELECT booking_time, COUNT(*) as cnt
        FROM bookings b2
        WHERE b2.location_id = COALESCE(p_location_id, b2.location_id)
          AND EXISTS (
            SELECT 1 FROM locations l 
            WHERE l.id = b2.location_id 
            AND l.tenant_id = p_tenant_id
          )
          AND b2.booking_date >= v_start_date
        GROUP BY booking_time
        ORDER BY cnt DESC
        LIMIT 1
      ) sub
    ),
    
    'avg_lead_time_days', ROUND(
      AVG(booking_date - created_at::DATE)
    ),
    
    'period_start', v_start_date,
    'period_end', CURRENT_DATE
  )
  INTO v_result
  FROM bookings b
  WHERE b.location_id = COALESCE(p_location_id, b.location_id)
    AND EXISTS (
      SELECT 1 FROM locations l 
      WHERE l.id = b.location_id 
      AND l.tenant_id = p_tenant_id
    )
    AND b.booking_date >= v_start_date;
    
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION get_ai_booking_analytics IS 
'Returns comprehensive booking analytics for AI analysis';

-- ============================================================================
-- 2. GET GUEST INSIGHTS
-- ============================================================================
CREATE OR REPLACE FUNCTION get_ai_guest_insights(
  p_tenant_id UUID,
  p_location_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total_unique_guests', COUNT(DISTINCT c.id),
    'returning_guests', COUNT(DISTINCT c.id) FILTER (WHERE booking_count > 1),
    'new_guests', COUNT(DISTINCT c.id) FILTER (WHERE booking_count = 1),
    'vip_guests', COUNT(DISTINCT c.id) FILTER (WHERE booking_count >= 5),
    
    'returning_rate', ROUND(
      COUNT(DISTINCT c.id) FILTER (WHERE booking_count > 1)::DECIMAL / 
      NULLIF(COUNT(DISTINCT c.id), 0) * 100, 2
    ),
    
    'top_guests', (
      SELECT json_agg(
        json_build_object(
          'name', customer_name,
          'bookings', booking_count,
          'total_guests', total_guests,
          'avg_party_size', avg_party_size
        )
      )
      FROM (
        SELECT 
          customer_name,
          COUNT(*) as booking_count,
          SUM(number_of_guests) as total_guests,
          ROUND(AVG(number_of_guests), 1) as avg_party_size
        FROM bookings b
        WHERE EXISTS (
          SELECT 1 FROM locations l 
          WHERE l.id = b.location_id 
          AND l.tenant_id = p_tenant_id
        )
        AND b.location_id = COALESCE(p_location_id, b.location_id)
        AND b.status != 'cancelled'
        GROUP BY customer_name
        ORDER BY booking_count DESC
        LIMIT 5
      ) top
    ),
    
    'avg_visits_per_guest', ROUND(
      COUNT(*)::DECIMAL / NULLIF(COUNT(DISTINCT c.id), 0), 2
    )
  )
  INTO v_result
  FROM consumers c
  LEFT JOIN LATERAL (
    SELECT COUNT(*) as booking_count
    FROM bookings b
    WHERE (b.consumer_id = c.id OR b.customer_email = c.email)
      AND EXISTS (
        SELECT 1 FROM locations l 
        WHERE l.id = b.location_id 
        AND l.tenant_id = p_tenant_id
      )
      AND b.location_id = COALESCE(p_location_id, b.location_id)
  ) booking_stats ON true
  WHERE c.id IN (
    SELECT DISTINCT consumer_id 
    FROM bookings b
    WHERE EXISTS (
      SELECT 1 FROM locations l 
      WHERE l.id = b.location_id 
      AND l.tenant_id = p_tenant_id
    )
    AND b.consumer_id IS NOT NULL
  );
  
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION get_ai_guest_insights IS 
'Returns guest behavior insights for CRM analysis';

-- ============================================================================
-- 3. GET REVENUE ANALYSIS
-- ============================================================================
CREATE OR REPLACE FUNCTION get_ai_revenue_analysis(
  p_tenant_id UUID,
  p_location_id UUID DEFAULT NULL,
  p_days_back INT DEFAULT 30
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_start_date DATE;
BEGIN
  v_start_date := CURRENT_DATE - (p_days_back || ' days')::INTERVAL;
  
  SELECT json_build_object(
    'total_revenue_cents', COALESCE(SUM(deposit_amount_cents), 0),
    'total_revenue_eur', ROUND(COALESCE(SUM(deposit_amount_cents), 0) / 100.0, 2),
    
    'deposit_revenue', COALESCE(
      SUM(deposit_amount_cents) FILTER (WHERE payment_status = 'paid'), 0
    ) / 100.0,
    
    'no_show_fees', COALESCE(
      SUM(deposit_amount_cents) FILTER (WHERE status = 'no_show'), 0
    ) / 100.0,
    
    'avg_revenue_per_booking', ROUND(
      AVG(deposit_amount_cents) / 100.0, 2
    ),
    
    'avg_revenue_per_guest', ROUND(
      COALESCE(SUM(deposit_amount_cents), 0)::DECIMAL / 
      NULLIF(SUM(number_of_guests), 0) / 100.0, 2
    ),
    
    'revenue_by_day', (
      SELECT json_agg(
        json_build_object(
          'date', booking_date,
          'revenue', revenue_cents / 100.0,
          'bookings', booking_count
        ) ORDER BY booking_date DESC
      )
      FROM (
        SELECT 
          booking_date,
          SUM(deposit_amount_cents) as revenue_cents,
          COUNT(*) as booking_count
        FROM bookings b
        WHERE b.location_id = COALESCE(p_location_id, b.location_id)
          AND EXISTS (
            SELECT 1 FROM locations l 
            WHERE l.id = b.location_id 
            AND l.tenant_id = p_tenant_id
          )
          AND b.booking_date >= v_start_date
        GROUP BY booking_date
        ORDER BY booking_date DESC
        LIMIT 30
      ) daily
    ),
    
    'projected_monthly_revenue', ROUND(
      (COALESCE(SUM(deposit_amount_cents), 0) / p_days_back::DECIMAL * 30) / 100.0, 2
    )
  )
  INTO v_result
  FROM bookings b
  WHERE b.location_id = COALESCE(p_location_id, b.location_id)
    AND EXISTS (
      SELECT 1 FROM locations l 
      WHERE l.id = b.location_id 
      AND l.tenant_id = p_tenant_id
    )
    AND b.booking_date >= v_start_date
    AND b.status != 'cancelled';
    
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION get_ai_revenue_analysis IS 
'Returns revenue analysis and projections for financial insights';

-- ============================================================================
-- 4. GET TREND ANALYSIS
-- ============================================================================
CREATE OR REPLACE FUNCTION get_ai_trend_analysis(
  p_tenant_id UUID,
  p_location_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  WITH this_week AS (
    SELECT COUNT(*) as bookings
    FROM bookings b
    WHERE b.location_id = COALESCE(p_location_id, b.location_id)
      AND EXISTS (
        SELECT 1 FROM locations l 
        WHERE l.id = b.location_id 
        AND l.tenant_id = p_tenant_id
      )
      AND b.booking_date >= CURRENT_DATE - INTERVAL '7 days'
      AND b.booking_date < CURRENT_DATE
  ),
  last_week AS (
    SELECT COUNT(*) as bookings
    FROM bookings b
    WHERE b.location_id = COALESCE(p_location_id, b.location_id)
      AND EXISTS (
        SELECT 1 FROM locations l 
        WHERE l.id = b.location_id 
        AND l.tenant_id = p_tenant_id
      )
      AND b.booking_date >= CURRENT_DATE - INTERVAL '14 days'
      AND b.booking_date < CURRENT_DATE - INTERVAL '7 days'
  ),
  this_month AS (
    SELECT COUNT(*) as bookings
    FROM bookings b
    WHERE b.location_id = COALESCE(p_location_id, b.location_id)
      AND EXISTS (
        SELECT 1 FROM locations l 
        WHERE l.id = b.location_id 
        AND l.tenant_id = p_tenant_id
      )
      AND b.booking_date >= DATE_TRUNC('month', CURRENT_DATE)
  ),
  last_month AS (
    SELECT COUNT(*) as bookings
    FROM bookings b
    WHERE b.location_id = COALESCE(p_location_id, b.location_id)
      AND EXISTS (
        SELECT 1 FROM locations l 
        WHERE l.id = b.location_id 
        AND l.tenant_id = p_tenant_id
      )
      AND b.booking_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
      AND b.booking_date < DATE_TRUNC('month', CURRENT_DATE)
  )
  SELECT json_build_object(
    'week_over_week', json_build_object(
      'this_week', tw.bookings,
      'last_week', lw.bookings,
      'change', tw.bookings - lw.bookings,
      'change_percent', ROUND(
        (tw.bookings - lw.bookings)::DECIMAL / NULLIF(lw.bookings, 0) * 100, 1
      ),
      'trend', CASE 
        WHEN tw.bookings > lw.bookings THEN 'up'
        WHEN tw.bookings < lw.bookings THEN 'down'
        ELSE 'stable'
      END
    ),
    'month_over_month', json_build_object(
      'this_month', tm.bookings,
      'last_month', lm.bookings,
      'change', tm.bookings - lm.bookings,
      'change_percent', ROUND(
        (tm.bookings - lm.bookings)::DECIMAL / NULLIF(lm.bookings, 0) * 100, 1
      ),
      'trend', CASE 
        WHEN tm.bookings > lm.bookings THEN 'up'
        WHEN tm.bookings < lm.bookings THEN 'down'
        ELSE 'stable'
      END
    )
  )
  INTO v_result
  FROM this_week tw, last_week lw, this_month tm, last_month lm;
  
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION get_ai_trend_analysis IS 
'Returns week-over-week and month-over-month trend analysis';

-- ============================================================================
-- 5. GET AI RECOMMENDATIONS
-- ============================================================================
CREATE OR REPLACE FUNCTION get_ai_recommendations(
  p_tenant_id UUID,
  p_location_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_no_show_rate DECIMAL;
  v_cancellation_rate DECIMAL;
  v_avg_lead_time INT;
  v_recommendations TEXT[];
  v_slow_days TEXT;
BEGIN
  -- Calculate key metrics
  SELECT 
    ROUND(
      COUNT(*) FILTER (WHERE status = 'no_show')::DECIMAL / 
      NULLIF(COUNT(*), 0) * 100, 2
    ),
    ROUND(
      COUNT(*) FILTER (WHERE status = 'cancelled')::DECIMAL / 
      NULLIF(COUNT(*), 0) * 100, 2
    ),
    AVG(booking_date - created_at::DATE)::INT
  INTO v_no_show_rate, v_cancellation_rate, v_avg_lead_time
  FROM bookings b
  WHERE EXISTS (
    SELECT 1 FROM locations l 
    WHERE l.id = b.location_id 
    AND l.tenant_id = p_tenant_id
  )
  AND b.location_id = COALESCE(p_location_id, b.location_id)
  AND b.booking_date >= CURRENT_DATE - INTERVAL '30 days';
  
  -- Generate recommendations
  v_recommendations := ARRAY[]::TEXT[];
  
  IF v_no_show_rate > 10 THEN
    v_recommendations := array_append(v_recommendations, 
      'High no-show rate (' || v_no_show_rate || '%). Consider: 1) Sending reminder SMS 24h before, 2) Requiring deposits, 3) Implementing no-show fees'
    );
  END IF;
  
  IF v_cancellation_rate > 20 THEN
    v_recommendations := array_append(v_recommendations,
      'High cancellation rate (' || v_cancellation_rate || '%). Review: 1) Cancellation policy strictness, 2) Booking confirmation process, 3) Guest communication'
    );
  END IF;
  
  IF v_avg_lead_time < 2 THEN
    v_recommendations := array_append(v_recommendations,
      'Most bookings are last-minute (avg ' || v_avg_lead_time || ' days ahead). Encourage advance bookings with: 1) Early bird discounts, 2) Special event promotions, 3) Marketing campaigns'
    );
  END IF;
  
  -- Check for slow days
  WITH day_analysis AS (
    SELECT 
      TO_CHAR(booking_date, 'Day') as day_name,
      COUNT(*) as booking_count
    FROM bookings b
    WHERE EXISTS (
      SELECT 1 FROM locations l 
      WHERE l.id = b.location_id 
      AND l.tenant_id = p_tenant_id
    )
    AND b.location_id = COALESCE(p_location_id, b.location_id)
    AND b.booking_date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY day_name
    HAVING COUNT(*) < (
      SELECT AVG(daily_count) * 0.5
      FROM (
        SELECT COUNT(*) as daily_count
        FROM bookings b2
        WHERE EXISTS (
          SELECT 1 FROM locations l 
          WHERE l.id = b2.location_id 
          AND l.tenant_id = p_tenant_id
        )
        AND b2.location_id = COALESCE(p_location_id, b2.location_id)
        AND b2.booking_date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY booking_date
      ) sub
    )
  )
  SELECT string_agg(day_name, ', ')
  INTO v_slow_days
  FROM day_analysis;
  
  IF v_slow_days IS NOT NULL THEN
    v_recommendations := array_append(v_recommendations,
      'Slow days detected: ' || v_slow_days || '. Consider special promotions or events on these days'
    );
  END IF;
  
  v_result := json_build_object(
    'recommendations', v_recommendations,
    'metrics', json_build_object(
      'no_show_rate', v_no_show_rate,
      'cancellation_rate', v_cancellation_rate,
      'avg_lead_time_days', v_avg_lead_time
    ),
    'priority', CASE
      WHEN v_no_show_rate > 15 OR v_cancellation_rate > 25 THEN 'high'
      WHEN v_no_show_rate > 10 OR v_cancellation_rate > 20 THEN 'medium'
      ELSE 'low'
    END
  );
  
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION get_ai_recommendations IS 
'Generates actionable recommendations based on performance metrics';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_ai_booking_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_ai_guest_insights TO authenticated;
GRANT EXECUTE ON FUNCTION get_ai_revenue_analysis TO authenticated;
GRANT EXECUTE ON FUNCTION get_ai_trend_analysis TO authenticated;
GRANT EXECUTE ON FUNCTION get_ai_recommendations TO authenticated;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- These indexes might already exist, but let's ensure they do
-- Note: Removed CURRENT_DATE from WHERE clause as it's not IMMUTABLE
CREATE INDEX IF NOT EXISTS idx_bookings_tenant_date 
  ON bookings(location_id, booking_date);

CREATE INDEX IF NOT EXISTS idx_bookings_status_date 
  ON bookings(status, booking_date);

CREATE INDEX IF NOT EXISTS idx_bookings_created_at 
  ON bookings(created_at);

-- ============================================================================
-- ✅ MIGRATION COMPLETE
-- ============================================================================

