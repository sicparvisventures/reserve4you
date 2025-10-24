-- =====================================================
-- CRM SYSTEM - Reserve4You
-- Enhanced Consumer Profiles & Guest Management
-- =====================================================

-- 1. ENHANCE CONSUMERS TABLE
-- =====================================================

-- Add CRM fields to consumers table
ALTER TABLE consumers ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE consumers ADD COLUMN IF NOT EXISTS anniversary DATE;
ALTER TABLE consumers ADD COLUMN IF NOT EXISTS dietary_preferences TEXT[];
ALTER TABLE consumers ADD COLUMN IF NOT EXISTS allergies TEXT[];
ALTER TABLE consumers ADD COLUMN IF NOT EXISTS preferred_table_type VARCHAR(50);
ALTER TABLE consumers ADD COLUMN IF NOT EXISTS vip_status BOOLEAN DEFAULT FALSE;
ALTER TABLE consumers ADD COLUMN IF NOT EXISTS lifetime_visits INT DEFAULT 0;
ALTER TABLE consumers ADD COLUMN IF NOT EXISTS lifetime_spend_cents INT DEFAULT 0;
ALTER TABLE consumers ADD COLUMN IF NOT EXISTS average_party_size INT DEFAULT 0;
ALTER TABLE consumers ADD COLUMN IF NOT EXISTS favorite_location_id UUID;
ALTER TABLE consumers ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE consumers ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE consumers ADD COLUMN IF NOT EXISTS last_visit_date DATE;
ALTER TABLE consumers ADD COLUMN IF NOT EXISTS preferred_booking_time TIME;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_consumers_birthday ON consumers(birthday) WHERE birthday IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consumers_anniversary ON consumers(anniversary) WHERE anniversary IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consumers_vip ON consumers(vip_status) WHERE vip_status = TRUE;
CREATE INDEX IF NOT EXISTS idx_consumers_tags ON consumers USING GIN(tags) WHERE tags IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consumers_favorite_location ON consumers(favorite_location_id) WHERE favorite_location_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consumers_last_visit ON consumers(last_visit_date) WHERE last_visit_date IS NOT NULL;

-- 2. CREATE CRM TRACKING FUNCTIONS
-- =====================================================

-- Function: Update consumer stats after booking completion
CREATE OR REPLACE FUNCTION update_consumer_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update on booking completion
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE consumers
    SET 
      lifetime_visits = COALESCE(lifetime_visits, 0) + 1,
      last_visit_date = NEW.booking_date,
      average_party_size = (
        SELECT ROUND(AVG(b.number_of_guests))::INT
        FROM bookings b
        WHERE b.consumer_id = NEW.consumer_id
          AND b.status = 'completed'
      )
    WHERE id = NEW.consumer_id;
    
    -- Update favorite location (most visited)
    UPDATE consumers c
    SET favorite_location_id = (
      SELECT b.location_id
      FROM bookings b
      WHERE b.consumer_id = NEW.consumer_id
        AND b.status = 'completed'
      GROUP BY b.location_id
      ORDER BY COUNT(*) DESC
      LIMIT 1
    )
    WHERE c.id = NEW.consumer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-tracking
DROP TRIGGER IF EXISTS trg_update_consumer_stats ON bookings;
CREATE TRIGGER trg_update_consumer_stats
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_consumer_stats();

-- 3. CRM ANALYTICS FUNCTIONS
-- =====================================================

-- Function: Get CRM stats for a location
CREATE OR REPLACE FUNCTION get_location_crm_stats(
  p_location_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE
  v_total_guests INT;
  v_vip_guests INT;
  v_new_guests INT;
  v_returning_guests INT;
  v_upcoming_birthdays INT;
  v_upcoming_anniversaries INT;
BEGIN
  -- Total unique guests
  SELECT COUNT(DISTINCT c.id)::INT INTO v_total_guests
  FROM consumers c
  JOIN bookings b ON b.consumer_id = c.id
  WHERE b.location_id = p_location_id;

  -- VIP guests
  SELECT COUNT(DISTINCT c.id)::INT INTO v_vip_guests
  FROM consumers c
  JOIN bookings b ON b.consumer_id = c.id
  WHERE b.location_id = p_location_id
    AND c.vip_status = TRUE;

  -- New guests (first visit this month)
  SELECT COUNT(DISTINCT c.id)::INT INTO v_new_guests
  FROM consumers c
  JOIN bookings b ON b.consumer_id = c.id
  WHERE b.location_id = p_location_id
    AND c.lifetime_visits = 1
    AND b.booking_date >= DATE_TRUNC('month', p_date)
    AND b.booking_date < DATE_TRUNC('month', p_date) + INTERVAL '1 month';

  -- Returning guests (visited before this month)
  SELECT COUNT(DISTINCT c.id)::INT INTO v_returning_guests
  FROM consumers c
  JOIN bookings b ON b.consumer_id = c.id
  WHERE b.location_id = p_location_id
    AND c.lifetime_visits > 1
    AND b.booking_date >= DATE_TRUNC('month', p_date)
    AND b.booking_date < DATE_TRUNC('month', p_date) + INTERVAL '1 month';

  -- Upcoming birthdays (next 30 days)
  SELECT COUNT(*)::INT INTO v_upcoming_birthdays
  FROM consumers c
  JOIN bookings b ON b.consumer_id = c.id
  WHERE b.location_id = p_location_id
    AND c.birthday IS NOT NULL
    AND (
      -- Birthday this year
      DATE_TRUNC('year', p_date) + (c.birthday - DATE_TRUNC('year', c.birthday))
      BETWEEN p_date AND p_date + INTERVAL '30 days'
      OR
      -- Birthday next year
      DATE_TRUNC('year', p_date) + INTERVAL '1 year' + (c.birthday - DATE_TRUNC('year', c.birthday))
      BETWEEN p_date AND p_date + INTERVAL '30 days'
    );

  -- Upcoming anniversaries (next 30 days)
  SELECT COUNT(*)::INT INTO v_upcoming_anniversaries
  FROM consumers c
  JOIN bookings b ON b.consumer_id = c.id
  WHERE b.location_id = p_location_id
    AND c.anniversary IS NOT NULL
    AND (
      DATE_TRUNC('year', p_date) + (c.anniversary - DATE_TRUNC('year', c.anniversary))
      BETWEEN p_date AND p_date + INTERVAL '30 days'
      OR
      DATE_TRUNC('year', p_date) + INTERVAL '1 year' + (c.anniversary - DATE_TRUNC('year', c.anniversary))
      BETWEEN p_date AND p_date + INTERVAL '30 days'
    );

  RETURN json_build_object(
    'total_guests', COALESCE(v_total_guests, 0),
    'vip_guests', COALESCE(v_vip_guests, 0),
    'new_guests', COALESCE(v_new_guests, 0),
    'returning_guests', COALESCE(v_returning_guests, 0),
    'upcoming_birthdays', COALESCE(v_upcoming_birthdays, 0),
    'upcoming_anniversaries', COALESCE(v_upcoming_anniversaries, 0)
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Get CRM stats for all locations (tenant-wide)
CREATE OR REPLACE FUNCTION get_tenant_crm_stats(
  p_tenant_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE
  v_total_guests INT;
  v_vip_guests INT;
  v_new_guests INT;
  v_returning_guests INT;
  v_upcoming_birthdays INT;
  v_upcoming_anniversaries INT;
BEGIN
  -- Total unique guests across all locations
  SELECT COUNT(DISTINCT c.id)::INT INTO v_total_guests
  FROM consumers c
  JOIN bookings b ON b.consumer_id = c.id
  JOIN locations l ON l.id = b.location_id
  WHERE l.tenant_id = p_tenant_id;

  -- VIP guests
  SELECT COUNT(DISTINCT c.id)::INT INTO v_vip_guests
  FROM consumers c
  JOIN bookings b ON b.consumer_id = c.id
  JOIN locations l ON l.id = b.location_id
  WHERE l.tenant_id = p_tenant_id
    AND c.vip_status = TRUE;

  -- New guests (first visit this month)
  SELECT COUNT(DISTINCT c.id)::INT INTO v_new_guests
  FROM consumers c
  JOIN bookings b ON b.consumer_id = c.id
  JOIN locations l ON l.id = b.location_id
  WHERE l.tenant_id = p_tenant_id
    AND c.lifetime_visits = 1
    AND b.booking_date >= DATE_TRUNC('month', p_date)
    AND b.booking_date < DATE_TRUNC('month', p_date) + INTERVAL '1 month';

  -- Returning guests
  SELECT COUNT(DISTINCT c.id)::INT INTO v_returning_guests
  FROM consumers c
  JOIN bookings b ON b.consumer_id = c.id
  JOIN locations l ON l.id = b.location_id
  WHERE l.tenant_id = p_tenant_id
    AND c.lifetime_visits > 1
    AND b.booking_date >= DATE_TRUNC('month', p_date)
    AND b.booking_date < DATE_TRUNC('month', p_date) + INTERVAL '1 month';

  -- Upcoming birthdays (next 30 days)
  SELECT COUNT(DISTINCT c.id)::INT INTO v_upcoming_birthdays
  FROM consumers c
  JOIN bookings b ON b.consumer_id = c.id
  JOIN locations l ON l.id = b.location_id
  WHERE l.tenant_id = p_tenant_id
    AND c.birthday IS NOT NULL
    AND (
      DATE_TRUNC('year', p_date) + (c.birthday - DATE_TRUNC('year', c.birthday))
      BETWEEN p_date AND p_date + INTERVAL '30 days'
      OR
      DATE_TRUNC('year', p_date) + INTERVAL '1 year' + (c.birthday - DATE_TRUNC('year', c.birthday))
      BETWEEN p_date AND p_date + INTERVAL '30 days'
    );

  -- Upcoming anniversaries
  SELECT COUNT(DISTINCT c.id)::INT INTO v_upcoming_anniversaries
  FROM consumers c
  JOIN bookings b ON b.consumer_id = c.id
  JOIN locations l ON l.id = b.location_id
  WHERE l.tenant_id = p_tenant_id
    AND c.anniversary IS NOT NULL
    AND (
      DATE_TRUNC('year', p_date) + (c.anniversary - DATE_TRUNC('year', c.anniversary))
      BETWEEN p_date AND p_date + INTERVAL '30 days'
      OR
      DATE_TRUNC('year', p_date) + INTERVAL '1 year' + (c.anniversary - DATE_TRUNC('year', c.anniversary))
      BETWEEN p_date AND p_date + INTERVAL '30 days'
    );

  RETURN json_build_object(
    'date', p_date,
    'total_guests', COALESCE(v_total_guests, 0),
    'vip_guests', COALESCE(v_vip_guests, 0),
    'new_guests', COALESCE(v_new_guests, 0),
    'returning_guests', COALESCE(v_returning_guests, 0),
    'upcoming_birthdays', COALESCE(v_upcoming_birthdays, 0),
    'upcoming_anniversaries', COALESCE(v_upcoming_anniversaries, 0),
    'locations', COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', l.id,
          'name', l.name,
          'total_guests', (
            SELECT COUNT(DISTINCT c.id)::INT
            FROM consumers c
            JOIN bookings b ON b.consumer_id = c.id
            WHERE b.location_id = l.id
          ),
          'vip_guests', (
            SELECT COUNT(DISTINCT c.id)::INT
            FROM consumers c
            JOIN bookings b ON b.consumer_id = c.id
            WHERE b.location_id = l.id AND c.vip_status = TRUE
          )
        )
      )
      FROM locations l
      WHERE l.tenant_id = p_tenant_id
    ), '[]'::JSON)
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Get guest list for a location with filters
CREATE OR REPLACE FUNCTION get_location_guests(
  p_location_id UUID,
  p_search TEXT DEFAULT NULL,
  p_vip_only BOOLEAN DEFAULT FALSE,
  p_tag_filter TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS JSON AS $$
BEGIN
  RETURN COALESCE((
    SELECT json_agg(guest_data)
    FROM (
      SELECT json_build_object(
        'id', c.id,
        'name', c.name,
        'email', c.email,
        'phone', c.phone,
        'birthday', c.birthday,
        'anniversary', c.anniversary,
        'dietary_preferences', COALESCE(c.dietary_preferences, ARRAY[]::TEXT[]),
        'allergies', COALESCE(c.allergies, ARRAY[]::TEXT[]),
        'preferred_table_type', c.preferred_table_type,
        'vip_status', COALESCE(c.vip_status, FALSE),
        'lifetime_visits', COALESCE(c.lifetime_visits, 0),
        'lifetime_spend_cents', COALESCE(c.lifetime_spend_cents, 0),
        'average_party_size', COALESCE(c.average_party_size, 0),
        'favorite_location_id', c.favorite_location_id,
        'notes', c.notes,
        'tags', COALESCE(c.tags, ARRAY[]::TEXT[]),
        'last_visit_date', c.last_visit_date,
        'preferred_booking_time', c.preferred_booking_time,
        'total_bookings', (
          SELECT COUNT(*)::INT
          FROM bookings b
          WHERE b.consumer_id = c.id AND b.location_id = p_location_id
        ),
        'upcoming_birthday', CASE
          WHEN c.birthday IS NOT NULL THEN
            (DATE_TRUNC('year', CURRENT_DATE) + (c.birthday - DATE_TRUNC('year', c.birthday))) < CURRENT_DATE + INTERVAL '30 days'
          ELSE FALSE
        END,
        'upcoming_anniversary', CASE
          WHEN c.anniversary IS NOT NULL THEN
            (DATE_TRUNC('year', CURRENT_DATE) + (c.anniversary - DATE_TRUNC('year', c.anniversary))) < CURRENT_DATE + INTERVAL '30 days'
          ELSE FALSE
        END
      ) as guest_data
      FROM consumers c
      WHERE EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.consumer_id = c.id AND b.location_id = p_location_id
      )
      AND (p_search IS NULL OR 
           c.name ILIKE '%' || p_search || '%' OR
           c.email ILIKE '%' || p_search || '%' OR
           c.phone ILIKE '%' || p_search || '%')
      AND (NOT p_vip_only OR c.vip_status = TRUE)
      AND (p_tag_filter IS NULL OR p_tag_filter = ANY(c.tags))
      ORDER BY c.last_visit_date DESC NULLS LAST, c.lifetime_visits DESC
      LIMIT p_limit
      OFFSET p_offset
    ) subquery
  ), '[]'::JSON);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Update consumer profile
CREATE OR REPLACE FUNCTION update_consumer_profile(
  p_consumer_id UUID,
  p_birthday DATE DEFAULT NULL,
  p_anniversary DATE DEFAULT NULL,
  p_dietary_preferences TEXT[] DEFAULT NULL,
  p_allergies TEXT[] DEFAULT NULL,
  p_preferred_table_type VARCHAR(50) DEFAULT NULL,
  p_vip_status BOOLEAN DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_updated_consumer consumers%ROWTYPE;
BEGIN
  UPDATE consumers
  SET
    birthday = COALESCE(p_birthday, birthday),
    anniversary = COALESCE(p_anniversary, anniversary),
    dietary_preferences = COALESCE(p_dietary_preferences, dietary_preferences),
    allergies = COALESCE(p_allergies, allergies),
    preferred_table_type = COALESCE(p_preferred_table_type, preferred_table_type),
    vip_status = COALESCE(p_vip_status, vip_status),
    notes = COALESCE(p_notes, notes),
    tags = COALESCE(p_tags, tags),
    updated_at = NOW()
  WHERE id = p_consumer_id
  RETURNING * INTO v_updated_consumer;

  RETURN json_build_object(
    'success', TRUE,
    'consumer', row_to_json(v_updated_consumer)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get upcoming special occasions (birthdays/anniversaries)
CREATE OR REPLACE FUNCTION get_upcoming_occasions(
  p_tenant_id UUID,
  p_days_ahead INT DEFAULT 30
)
RETURNS JSON AS $$
BEGIN
  RETURN COALESCE((
    SELECT json_agg(
      json_build_object(
        'consumer_id', c.id,
        'consumer_name', c.name,
        'consumer_email', c.email,
        'consumer_phone', c.phone,
        'occasion_type', CASE 
          WHEN c.birthday IS NOT NULL AND (
            DATE_TRUNC('year', CURRENT_DATE) + (c.birthday - DATE_TRUNC('year', c.birthday))
            BETWEEN CURRENT_DATE AND CURRENT_DATE + (p_days_ahead || ' days')::INTERVAL
          ) THEN 'birthday'
          WHEN c.anniversary IS NOT NULL AND (
            DATE_TRUNC('year', CURRENT_DATE) + (c.anniversary - DATE_TRUNC('year', c.anniversary))
            BETWEEN CURRENT_DATE AND CURRENT_DATE + (p_days_ahead || ' days')::INTERVAL
          ) THEN 'anniversary'
          ELSE NULL
        END,
        'occasion_date', CASE
          WHEN c.birthday IS NOT NULL THEN 
            DATE_TRUNC('year', CURRENT_DATE) + (c.birthday - DATE_TRUNC('year', c.birthday))
          WHEN c.anniversary IS NOT NULL THEN
            DATE_TRUNC('year', CURRENT_DATE) + (c.anniversary - DATE_TRUNC('year', c.anniversary))
          ELSE NULL
        END,
        'favorite_location_id', c.favorite_location_id,
        'vip_status', c.vip_status,
        'lifetime_visits', c.lifetime_visits
      )
    )
    FROM consumers c
    JOIN bookings b ON b.consumer_id = c.id
    JOIN locations l ON l.id = b.location_id
    WHERE l.tenant_id = p_tenant_id
      AND (
        (c.birthday IS NOT NULL AND (
          DATE_TRUNC('year', CURRENT_DATE) + (c.birthday - DATE_TRUNC('year', c.birthday))
          BETWEEN CURRENT_DATE AND CURRENT_DATE + (p_days_ahead || ' days')::INTERVAL
        ))
        OR
        (c.anniversary IS NOT NULL AND (
          DATE_TRUNC('year', CURRENT_DATE) + (c.anniversary - DATE_TRUNC('year', c.anniversary))
          BETWEEN CURRENT_DATE AND CURRENT_DATE + (p_days_ahead || ' days')::INTERVAL
        ))
      )
    GROUP BY c.id
  ), '[]'::JSON);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 4. RLS POLICIES FOR CRM
-- =====================================================

-- Grant permissions to authenticated and anon users
GRANT EXECUTE ON FUNCTION get_location_crm_stats(UUID, DATE) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_tenant_crm_stats(UUID, DATE) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_location_guests(UUID, TEXT, BOOLEAN, TEXT, INT, INT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION update_consumer_profile(UUID, DATE, DATE, TEXT[], TEXT[], VARCHAR, BOOLEAN, TEXT, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_upcoming_occasions(UUID, INT) TO authenticated, anon;

-- 5. TEST DATA & VALIDATION
-- =====================================================

DO $$
DECLARE
  v_test_tenant_id UUID;
  v_test_location_id UUID;
  v_test_consumer_id UUID;
  v_crm_stats JSON;
BEGIN
  -- Get test tenant and location
  SELECT id INTO v_test_tenant_id FROM tenants LIMIT 1;
  SELECT id INTO v_test_location_id FROM locations WHERE tenant_id = v_test_tenant_id LIMIT 1;
  SELECT id INTO v_test_consumer_id FROM consumers LIMIT 1;

  IF v_test_tenant_id IS NOT NULL AND v_test_location_id IS NOT NULL THEN
    -- Test location CRM stats
    SELECT get_location_crm_stats(v_test_location_id, CURRENT_DATE) INTO v_crm_stats;
    RAISE NOTICE 'Location CRM Stats: %', v_crm_stats;

    -- Test tenant CRM stats
    SELECT get_tenant_crm_stats(v_test_tenant_id, CURRENT_DATE) INTO v_crm_stats;
    RAISE NOTICE 'Tenant CRM Stats: %', v_crm_stats;

    -- Test get guests
    SELECT get_location_guests(v_test_location_id) INTO v_crm_stats;
    RAISE NOTICE 'Location Guests: %', v_crm_stats;

    -- Test upcoming occasions
    SELECT get_upcoming_occasions(v_test_tenant_id, 30) INTO v_crm_stats;
    RAISE NOTICE 'Upcoming Occasions: %', v_crm_stats;

    RAISE NOTICE '✅ CRM System migration completed successfully!';
  ELSE
    RAISE NOTICE '⚠️  No test data available';
  END IF;
END $$;

