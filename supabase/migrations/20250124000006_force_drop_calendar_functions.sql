-- ============================================================================
-- FORCE DROP ALL CALENDAR FUNCTIONS
-- ============================================================================
-- This migration forcefully drops ALL versions of calendar functions
-- regardless of their signatures to resolve "function name not unique" errors
-- ============================================================================

-- Drop ALL versions of get_table_occupancy (any signature)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'get_table_occupancy'
        AND n.nspname = 'public'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.nspname) || '.' || quote_ident(r.proname) || '(' || r.args || ') CASCADE';
    END LOOP;
END $$;

-- Drop ALL versions of other calendar functions
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
            'get_calendar_stats',
            'check_booking_conflicts',
            'bulk_update_booking_status'
        )
        AND n.nspname = 'public'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.nspname) || '.' || quote_ident(r.proname) || '(' || r.args || ') CASCADE';
    END LOOP;
END $$;

-- ============================================================================
-- RECREATE ALL CALENDAR FUNCTIONS (CLEAN SLATE)
-- ============================================================================

-- 1. GET CALENDAR BOOKINGS
CREATE FUNCTION get_calendar_bookings(
  p_location_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'id', b.id,
      'title', b.customer_name || ' (' || b.number_of_guests || ' pers)',
      'start', (b.booking_date || ' ' || b.booking_time)::TIMESTAMP,
      'end', (b.booking_date || ' ' || b.booking_time)::TIMESTAMP + (b.duration_minutes || ' minutes')::INTERVAL,
      'booking_date', b.booking_date,
      'booking_time', b.booking_time,
      'duration_minutes', b.duration_minutes,
      'customer_name', b.customer_name,
      'customer_email', b.customer_email,
      'customer_phone', b.customer_phone,
      'number_of_guests', b.number_of_guests,
      'status', b.status,
      'table_id', b.table_id,
      'table_info', CASE 
        WHEN t.id IS NOT NULL THEN json_build_object(
          'id', t.id,
          'table_number', t.table_number,
          'seats', t.seats,
          'table_type', t.table_type
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
  )
  INTO v_result
  FROM bookings b
  LEFT JOIN tables t ON t.id = b.table_id
  WHERE b.location_id = p_location_id
    AND b.booking_date >= p_start_date
    AND b.booking_date <= p_end_date
  ORDER BY b.booking_date, b.booking_time;
  
  RETURN COALESCE(v_result, '[]'::JSON);
END;
$$;

-- 2. UPDATE BOOKING TIME
CREATE FUNCTION update_booking_time(
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
  v_result JSON;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM bookings b
    JOIN locations l ON l.id = b.location_id
    JOIN memberships m ON m.tenant_id = l.tenant_id
    WHERE b.id = p_booking_id AND m.user_id = p_user_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Booking not found');
  END IF;
  
  IF v_booking.table_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_conflicts
    FROM bookings
    WHERE id != p_booking_id
      AND table_id = v_booking.table_id
      AND booking_date = p_new_date
      AND status NOT IN ('cancelled', 'no_show')
      AND (booking_time, booking_time + (duration_minutes || ' minutes')::INTERVAL)
          OVERLAPS (p_new_time, p_new_time + (v_booking.duration_minutes || ' minutes')::INTERVAL);
    
    IF v_conflicts > 0 THEN
      RETURN json_build_object('success', false, 'error', 'Time slot conflict detected', 'conflicts', v_conflicts);
    END IF;
  END IF;
  
  UPDATE bookings SET booking_date = p_new_date, booking_time = p_new_time, updated_at = NOW()
  WHERE id = p_booking_id;
  
  SELECT json_build_object(
    'success', true,
    'booking', json_build_object('id', id, 'booking_date', booking_date, 'booking_time', booking_time,
      'customer_name', customer_name, 'number_of_guests', number_of_guests)
  ) INTO v_result FROM bookings WHERE id = p_booking_id;
  
  RETURN v_result;
END;
$$;

-- 3. ASSIGN TABLE TO BOOKING
CREATE FUNCTION assign_table_to_booking(
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
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Booking or table not found');
  END IF;
  
  IF v_booking.number_of_guests > v_table.seats THEN
    RETURN json_build_object('success', false, 'error', 'Table too small for party size',
      'table_seats', v_table.seats, 'party_size', v_booking.number_of_guests);
  END IF;
  
  SELECT COUNT(*) INTO v_conflicts
  FROM bookings
  WHERE id != p_booking_id AND table_id = p_table_id AND booking_date = v_booking.booking_date
    AND status NOT IN ('cancelled', 'no_show')
    AND (booking_time, booking_time + (duration_minutes || ' minutes')::INTERVAL)
        OVERLAPS (v_booking.booking_time, v_booking.booking_time + (v_booking.duration_minutes || ' minutes')::INTERVAL);
  
  IF v_conflicts > 0 THEN
    RETURN json_build_object('success', false, 'error', 'Table is already booked at this time', 'conflicts', v_conflicts);
  END IF;
  
  UPDATE bookings SET table_id = p_table_id, updated_at = NOW() WHERE id = p_booking_id;
  RETURN json_build_object('success', true, 'booking_id', p_booking_id, 'table_id', p_table_id);
END;
$$;

-- 4. GET TABLE OCCUPANCY (CALENDAR VERSION)
CREATE FUNCTION get_table_occupancy(
  p_location_id UUID,
  p_date DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'table_id', t.id,
      'table_number', t.table_number,
      'seats', t.seats,
      'table_type', t.table_type,
      'bookings', (
        SELECT json_agg(
          json_build_object(
            'id', b.id,
            'customer_name', b.customer_name,
            'number_of_guests', b.number_of_guests,
            'start_time', b.booking_time,
            'end_time', b.booking_time + (b.duration_minutes || ' minutes')::INTERVAL,
            'duration_minutes', b.duration_minutes,
            'status', b.status,
            'color', CASE
              WHEN b.status = 'confirmed' THEN '#18C964'
              WHEN b.status = 'pending' THEN '#FFB020'
              WHEN b.status = 'cancelled' THEN '#71717A'
              WHEN b.status = 'no_show' THEN '#E11D48'
              ELSE '#A1A1AA'
            END
          ) ORDER BY b.booking_time
        )
        FROM bookings b
        WHERE b.table_id = t.id AND b.booking_date = p_date AND b.status NOT IN ('cancelled')
      )
    )
  )
  INTO v_result
  FROM tables t
  WHERE t.location_id = p_location_id AND t.is_active = true
  ORDER BY t.table_number;
  
  RETURN COALESCE(v_result, '[]'::JSON);
END;
$$;

-- 5. GET CALENDAR STATISTICS
CREATE FUNCTION get_calendar_stats(
  p_tenant_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'date', p_date,
    'total_bookings', COUNT(*),
    'confirmed', COUNT(*) FILTER (WHERE b.status = 'confirmed'),
    'pending', COUNT(*) FILTER (WHERE b.status = 'pending'),
    'cancelled', COUNT(*) FILTER (WHERE b.status = 'cancelled'),
    'no_show', COUNT(*) FILTER (WHERE b.status = 'no_show'),
    'total_guests', SUM(b.number_of_guests),
    'locations', json_agg(DISTINCT json_build_object(
      'id', l.id, 'name', l.name,
      'bookings_count', (SELECT COUNT(*) FROM bookings b2 WHERE b2.location_id = l.id AND b2.booking_date = p_date)
    )),
    'hourly_distribution', (
      SELECT json_object_agg(hour_slot, booking_count)
      FROM (
        SELECT EXTRACT(HOUR FROM b.booking_time)::TEXT || ':00' as hour_slot, COUNT(*) as booking_count
        FROM bookings b
        JOIN locations l ON l.id = b.location_id
        WHERE l.tenant_id = p_tenant_id AND b.booking_date = p_date
        GROUP BY hour_slot ORDER BY hour_slot
      ) hourly
    )
  )
  INTO v_result
  FROM bookings b
  JOIN locations l ON l.id = b.location_id
  WHERE l.tenant_id = p_tenant_id AND b.booking_date = p_date;
  
  RETURN v_result;
END;
$$;

-- 6. CHECK BOOKING CONFLICTS
CREATE FUNCTION check_booking_conflicts(
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
AS $$
DECLARE
  v_conflicts JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'booking_id', id, 'customer_name', customer_name,
      'booking_time', booking_time, 'duration_minutes', duration_minutes, 'status', status
    )
  )
  INTO v_conflicts
  FROM bookings
  WHERE location_id = p_location_id AND table_id = p_table_id AND booking_date = p_date
    AND id != COALESCE(p_exclude_booking_id, '00000000-0000-0000-0000-000000000000'::UUID)
    AND status NOT IN ('cancelled', 'no_show')
    AND (booking_time, booking_time + (duration_minutes || ' minutes')::INTERVAL)
        OVERLAPS (p_time, p_time + (p_duration_minutes || ' minutes')::INTERVAL);
  
  RETURN json_build_object('has_conflicts', v_conflicts IS NOT NULL, 'conflicts', COALESCE(v_conflicts, '[]'::JSON));
END;
$$;

-- 7. BULK UPDATE BOOKING STATUS
CREATE FUNCTION bulk_update_booking_status(
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
  IF NOT EXISTS (
    SELECT 1 FROM bookings b
    JOIN locations l ON l.id = b.location_id
    JOIN memberships m ON m.tenant_id = l.tenant_id
    WHERE b.id = ANY(p_booking_ids) AND m.user_id = p_user_id
    HAVING COUNT(*) = array_length(p_booking_ids, 1)
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized for some bookings');
  END IF;
  
  WITH updated AS (
    UPDATE bookings SET status = p_new_status, updated_at = NOW()
    WHERE id = ANY(p_booking_ids)
    RETURNING id
  )
  SELECT COUNT(*) INTO v_updated_count FROM updated;
  
  RETURN json_build_object('success', true, 'updated_count', v_updated_count);
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_calendar_bookings(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION update_booking_time(UUID, DATE, TIME, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_table_to_booking(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_occupancy(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_calendar_stats(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION check_booking_conflicts(UUID, UUID, DATE, TIME, INT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_update_booking_status(UUID[], booking_status, UUID) TO authenticated;

-- ============================================================================
-- ✅ CALENDAR FUNCTIONS FORCE RECREATED
-- ============================================================================

