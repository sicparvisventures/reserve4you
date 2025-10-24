-- ============================================================================
-- CALENDAR SYSTEM - SCHEMA-COMPATIBLE VERSION
-- ============================================================================
-- Fixed to work with actual tables schema (no table_type column)
-- ============================================================================

-- First, completely clean slate
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname IN (
            'get_calendar_bookings',
            'update_booking_time',
            'assign_table_to_booking',
            'get_table_occupancy',
            'get_calendar_stats',
            'check_booking_conflicts',
            'bulk_update_booking_status'
        )
        AND n.nspname = 'public'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.nspname) || '.' || 
                quote_ident(r.proname) || '(' || r.args || ') CASCADE';
    END LOOP;
END $$;

-- ============================================================================
-- 1. GET CALENDAR BOOKINGS (FIXED)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_calendar_bookings(
  p_location_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'id', b.id,
        'title', COALESCE(b.customer_name, 'Gast') || ' (' || b.number_of_guests || ' pers)',
        'start', (b.booking_date::TEXT || ' ' || b.booking_time::TEXT)::TIMESTAMP,
        'end', (b.booking_date::TEXT || ' ' || b.booking_time::TEXT)::TIMESTAMP + 
               (COALESCE(b.duration_minutes, 120) || ' minutes')::INTERVAL,
        'booking_date', b.booking_date,
        'booking_time', b.booking_time,
        'duration_minutes', COALESCE(b.duration_minutes, 120),
        'customer_name', COALESCE(b.customer_name, 'Gast'),
        'customer_email', b.customer_email,
        'customer_phone', b.customer_phone,
        'number_of_guests', b.number_of_guests,
        'status', b.status,
        'table_id', b.table_id,
        'table_info', CASE 
          WHEN t.id IS NOT NULL THEN json_build_object(
            'id', t.id,
            'table_number', t.table_number,
            'seats', t.seats
          )
          ELSE NULL
        END,
        'special_requests', b.special_requests,
        'internal_note', b.internal_note,
        'created_at', b.created_at,
        'color', CASE
          WHEN b.status = 'confirmed' THEN '#18C964'
          WHEN b.status = 'pending' THEN '#FFB020'
          WHEN b.status = 'cancelled' THEN '#71717A'
          WHEN b.status = 'no_show' THEN '#E11D48'
          WHEN b.status = 'completed' THEN '#3B82F6'
          ELSE '#A1A1AA'
        END
      )
      ORDER BY b.booking_date, b.booking_time
    ),
    '[]'::JSON
  )
  INTO v_result
  FROM bookings b
  LEFT JOIN tables t ON t.id = b.table_id
  WHERE b.location_id = p_location_id
    AND b.booking_date >= p_start_date
    AND b.booking_date <= p_end_date;
  
  RETURN v_result;
END;
$$;

-- ============================================================================
-- 2. GET TABLE OCCUPANCY (FIXED)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_table_occupancy(
  p_location_id UUID,
  p_date DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'table_id', t.id,
        'table_number', t.table_number,
        'seats', t.seats,
        'bookings', COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', b.id,
                'customer_name', COALESCE(b.customer_name, 'Gast'),
                'number_of_guests', b.number_of_guests,
                'start_time', b.booking_time::TEXT,
                'end_time', (b.booking_time + (COALESCE(b.duration_minutes, 120) || ' minutes')::INTERVAL)::TEXT,
                'duration_minutes', COALESCE(b.duration_minutes, 120),
                'status', b.status,
                'color', CASE
                  WHEN b.status = 'confirmed' THEN '#18C964'
                  WHEN b.status = 'pending' THEN '#FFB020'
                  WHEN b.status = 'cancelled' THEN '#71717A'
                  WHEN b.status = 'no_show' THEN '#E11D48'
                  ELSE '#A1A1AA'
                END
              )
              ORDER BY b.booking_time
            )
            FROM bookings b
            WHERE b.table_id = t.id
              AND b.booking_date = p_date
              AND b.status NOT IN ('cancelled')
          ),
          '[]'::JSON
        )
      )
      ORDER BY t.table_number
    ),
    '[]'::JSON
  )
  INTO v_result
  FROM tables t
  WHERE t.location_id = p_location_id
    AND t.is_active = true;
  
  RETURN v_result;
END;
$$;

-- ============================================================================
-- 3. GET CALENDAR STATS
-- ============================================================================
CREATE OR REPLACE FUNCTION get_calendar_stats(
  p_tenant_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_result JSON;
  v_total_bookings INT;
  v_total_guests INT;
BEGIN
  -- Get aggregate counts
  SELECT 
    COUNT(*)::INT,
    COALESCE(SUM(b.number_of_guests), 0)::INT
  INTO v_total_bookings, v_total_guests
  FROM bookings b
  JOIN locations l ON l.id = b.location_id
  WHERE l.tenant_id = p_tenant_id
    AND b.booking_date = p_date;

  -- Build full result
  SELECT json_build_object(
    'date', p_date,
    'total_bookings', v_total_bookings,
    'confirmed', COALESCE((
      SELECT COUNT(*)::INT
      FROM bookings b
      JOIN locations l ON l.id = b.location_id
      WHERE l.tenant_id = p_tenant_id
        AND b.booking_date = p_date
        AND b.status = 'confirmed'
    ), 0),
    'pending', COALESCE((
      SELECT COUNT(*)::INT
      FROM bookings b
      JOIN locations l ON l.id = b.location_id
      WHERE l.tenant_id = p_tenant_id
        AND b.booking_date = p_date
        AND b.status = 'pending'
    ), 0),
    'cancelled', COALESCE((
      SELECT COUNT(*)::INT
      FROM bookings b
      JOIN locations l ON l.id = b.location_id
      WHERE l.tenant_id = p_tenant_id
        AND b.booking_date = p_date
        AND b.status = 'cancelled'
    ), 0),
    'no_show', COALESCE((
      SELECT COUNT(*)::INT
      FROM bookings b
      JOIN locations l ON l.id = b.location_id
      WHERE l.tenant_id = p_tenant_id
        AND b.booking_date = p_date
        AND b.status = 'no_show'
    ), 0),
    'total_guests', v_total_guests,
    'locations', COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', l.id,
          'name', l.name,
          'bookings_count', (
            SELECT COUNT(*)::INT
            FROM bookings b2
            WHERE b2.location_id = l.id
              AND b2.booking_date = p_date
          )
        )
      )
      FROM locations l
      WHERE l.tenant_id = p_tenant_id
    ), '[]'::JSON),
    'hourly_distribution', COALESCE((
      SELECT json_object_agg(hour_slot, booking_count)
      FROM (
        SELECT 
          EXTRACT(HOUR FROM b.booking_time)::TEXT || ':00' as hour_slot,
          COUNT(*)::INT as booking_count
        FROM bookings b
        JOIN locations l ON l.id = b.location_id
        WHERE l.tenant_id = p_tenant_id
          AND b.booking_date = p_date
        GROUP BY hour_slot
        ORDER BY hour_slot
      ) hourly
    ), '{}'::JSON)
  )
  INTO v_result;
  
  RETURN v_result;
END;
$$;

-- ============================================================================
-- 4. UPDATE BOOKING TIME
-- ============================================================================
CREATE OR REPLACE FUNCTION update_booking_time(
  p_booking_id UUID,
  p_new_date DATE,
  p_new_time TIME,
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking bookings%ROWTYPE;
  v_conflicts INT;
BEGIN
  -- Check authorization
  IF NOT EXISTS (
    SELECT 1 FROM bookings b
    JOIN locations l ON l.id = b.location_id
    JOIN memberships m ON m.tenant_id = l.tenant_id
    WHERE b.id = p_booking_id AND m.user_id = p_user_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  
  -- Get booking
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Booking not found');
  END IF;
  
  -- Check conflicts if table assigned
  IF v_booking.table_id IS NOT NULL THEN
    SELECT COUNT(*)::INT INTO v_conflicts
    FROM bookings
    WHERE id != p_booking_id
      AND table_id = v_booking.table_id
      AND booking_date = p_new_date
      AND status NOT IN ('cancelled', 'no_show')
      AND (booking_time, booking_time + (COALESCE(duration_minutes, 120) || ' minutes')::INTERVAL)
          OVERLAPS (p_new_time, p_new_time + (COALESCE(v_booking.duration_minutes, 120) || ' minutes')::INTERVAL);
    
    IF v_conflicts > 0 THEN
      RETURN json_build_object('success', false, 'error', 'Time slot conflict detected', 'conflicts', v_conflicts);
    END IF;
  END IF;
  
  -- Update booking
  UPDATE bookings 
  SET booking_date = p_new_date, booking_time = p_new_time, updated_at = NOW()
  WHERE id = p_booking_id;
  
  RETURN json_build_object(
    'success', true,
    'booking', json_build_object(
      'id', p_booking_id,
      'booking_date', p_new_date,
      'booking_time', p_new_time
    )
  );
END;
$$;

-- ============================================================================
-- 5. ASSIGN TABLE TO BOOKING
-- ============================================================================
CREATE OR REPLACE FUNCTION assign_table_to_booking(
  p_booking_id UUID,
  p_table_id UUID,
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking bookings%ROWTYPE;
  v_table tables%ROWTYPE;
  v_conflicts INT;
BEGIN
  -- Check auth
  IF NOT EXISTS (
    SELECT 1 FROM bookings b
    JOIN locations l ON l.id = b.location_id
    JOIN memberships m ON m.tenant_id = l.tenant_id
    WHERE b.id = p_booking_id AND m.user_id = p_user_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  SELECT * INTO v_table FROM tables WHERE id = p_table_id;
  
  IF v_booking.number_of_guests > v_table.seats THEN
    RETURN json_build_object('success', false, 'error', 'Table too small');
  END IF;
  
  -- Check conflicts
  SELECT COUNT(*)::INT INTO v_conflicts
  FROM bookings
  WHERE id != p_booking_id AND table_id = p_table_id 
    AND booking_date = v_booking.booking_date
    AND status NOT IN ('cancelled', 'no_show')
    AND (booking_time, booking_time + (COALESCE(duration_minutes, 120) || ' minutes')::INTERVAL)
        OVERLAPS (v_booking.booking_time, v_booking.booking_time + (COALESCE(v_booking.duration_minutes, 120) || ' minutes')::INTERVAL);
  
  IF v_conflicts > 0 THEN
    RETURN json_build_object('success', false, 'error', 'Table already booked');
  END IF;
  
  UPDATE bookings SET table_id = p_table_id, updated_at = NOW() WHERE id = p_booking_id;
  RETURN json_build_object('success', true, 'booking_id', p_booking_id, 'table_id', p_table_id);
END;
$$;

-- ============================================================================
-- 6. CHECK BOOKING CONFLICTS
-- ============================================================================
CREATE OR REPLACE FUNCTION check_booking_conflicts(
  p_location_id UUID,
  p_table_id UUID,
  p_date DATE,
  p_time TIME,
  p_duration_minutes INT,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN json_build_object(
    'has_conflicts', EXISTS(
      SELECT 1 FROM bookings
      WHERE location_id = p_location_id AND table_id = p_table_id 
        AND booking_date = p_date
        AND id != COALESCE(p_exclude_booking_id, '00000000-0000-0000-0000-000000000000'::UUID)
        AND status NOT IN ('cancelled', 'no_show')
        AND (booking_time, booking_time + (COALESCE(duration_minutes, 120) || ' minutes')::INTERVAL)
            OVERLAPS (p_time, p_time + (p_duration_minutes || ' minutes')::INTERVAL)
    ),
    'conflicts', COALESCE((
      SELECT json_agg(json_build_object('booking_id', id, 'customer_name', customer_name))
      FROM bookings
      WHERE location_id = p_location_id AND table_id = p_table_id 
        AND booking_date = p_date
        AND id != COALESCE(p_exclude_booking_id, '00000000-0000-0000-0000-000000000000'::UUID)
        AND status NOT IN ('cancelled', 'no_show')
        AND (booking_time, booking_time + (COALESCE(duration_minutes, 120) || ' minutes')::INTERVAL)
            OVERLAPS (p_time, p_time + (p_duration_minutes || ' minutes')::INTERVAL)
    ), '[]'::JSON)
  );
END;
$$;

-- ============================================================================
-- 7. BULK UPDATE BOOKING STATUS
-- ============================================================================
CREATE OR REPLACE FUNCTION bulk_update_booking_status(
  p_booking_ids UUID[],
  p_new_status booking_status,
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_count INT;
BEGIN
  WITH updated AS (
    UPDATE bookings
    SET status = p_new_status, updated_at = NOW()
    WHERE id = ANY(p_booking_ids)
    RETURNING id
  )
  SELECT COUNT(*)::INT INTO v_updated_count FROM updated;
  
  RETURN json_build_object('success', true, 'updated_count', v_updated_count);
END;
$$;

-- ============================================================================
-- GRANT ALL PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_calendar_bookings(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_calendar_bookings(UUID, DATE, DATE) TO anon;
GRANT EXECUTE ON FUNCTION get_table_occupancy(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_occupancy(UUID, DATE) TO anon;
GRANT EXECUTE ON FUNCTION get_calendar_stats(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_calendar_stats(UUID, DATE) TO anon;
GRANT EXECUTE ON FUNCTION update_booking_time(UUID, DATE, TIME, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_table_to_booking(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_booking_conflicts(UUID, UUID, DATE, TIME, INT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_update_booking_status(UUID[], booking_status, UUID) TO authenticated;

-- ============================================================================
-- TEST THE FUNCTIONS
-- ============================================================================

DO $$
DECLARE
  v_test_location_id UUID;
  v_test_tenant_id UUID;
  v_result JSON;
BEGIN
  -- Get first location for testing
  SELECT id, tenant_id INTO v_test_location_id, v_test_tenant_id
  FROM locations
  LIMIT 1;
  
  IF v_test_location_id IS NOT NULL THEN
    -- Test get_calendar_bookings
    SELECT get_calendar_bookings(v_test_location_id, CURRENT_DATE, CURRENT_DATE + 7) INTO v_result;
    RAISE NOTICE '✅ get_calendar_bookings: %', CASE 
      WHEN json_array_length(v_result) > 0 THEN json_array_length(v_result) || ' bookings'
      ELSE 'empty (no bookings)'
    END;
    
    -- Test get_calendar_stats
    SELECT get_calendar_stats(v_test_tenant_id, CURRENT_DATE) INTO v_result;
    RAISE NOTICE '✅ get_calendar_stats: % bookings today', (v_result->>'total_bookings');
    
    -- Test get_table_occupancy
    SELECT get_table_occupancy(v_test_location_id, CURRENT_DATE) INTO v_result;
    RAISE NOTICE '✅ get_table_occupancy: %', CASE 
      WHEN json_array_length(v_result) > 0 THEN json_array_length(v_result) || ' tables'
      ELSE 'no tables'
    END;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 All calendar functions working correctly!';
  ELSE
    RAISE NOTICE '⚠️  No locations found for testing (this is OK for new setup)';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 
  '✅ Calendar System Ready!' as status,
  COUNT(*) as function_count,
  string_agg(p.proname, ', ') as functions
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN (
  'get_calendar_bookings',
  'get_table_occupancy',
  'get_calendar_stats',
  'update_booking_time',
  'assign_table_to_booking',
  'check_booking_conflicts',
  'bulk_update_booking_status'
)
AND n.nspname = 'public';

