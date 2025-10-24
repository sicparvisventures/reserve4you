-- ============================================================================
-- FIX AI RECOMMENDATIONS FUNCTION
-- ============================================================================
-- Fix missing v_slow_days variable declaration
-- ============================================================================

DROP FUNCTION IF EXISTS get_ai_recommendations(UUID, UUID);

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
  v_slow_days TEXT;  -- FIX: Added missing variable declaration
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
  
  -- If no recommendations, provide positive feedback
  IF array_length(v_recommendations, 1) IS NULL OR array_length(v_recommendations, 1) = 0 THEN
    v_recommendations := array_append(v_recommendations,
      'Great performance! Your metrics are healthy. Keep maintaining excellent guest communication and service quality.'
    );
  END IF;
  
  v_result := json_build_object(
    'recommendations', v_recommendations,
    'metrics', json_build_object(
      'no_show_rate', COALESCE(v_no_show_rate, 0),
      'cancellation_rate', COALESCE(v_cancellation_rate, 0),
      'avg_lead_time_days', COALESCE(v_avg_lead_time, 0)
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
'Generates actionable recommendations based on performance metrics (FIXED VERSION)';

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_ai_recommendations TO authenticated;

-- ============================================================================
-- ✅ FIX COMPLETE
-- ============================================================================

