-- ============================================================================
-- ADVANCED CALENDAR SYSTEM - RESERVE4YOU
-- ============================================================================
-- SQL functions voor geavanceerd calendar management
-- Drag & drop, conflict detection, real-time updates
-- ============================================================================

-- ============================================================================
-- 1. GET CALENDAR BOOKINGS (for specific date range and location)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_calendar_bookings(
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

COMMENT ON FUNCTION get_calendar_bookings IS 
'Returns all bookings for a location within date range, formatted for calendar display';

-- ============================================================================
-- 2. UPDATE BOOKING TIME (for drag & drop)
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
  v_result JSON;
BEGIN
  -- Check authorization (user must be member of tenant)
  IF NOT EXISTS (
    SELECT 1 FROM bookings b
    JOIN locations l ON l.id = b.location_id
    JOIN memberships m ON m.tenant_id = l.tenant_id
    WHERE b.id = p_booking_id
      AND m.user_id = p_user_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Unauthorized'
    );
  END IF;
  
  -- Get booking details
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Booking not found'
    );
  END IF;
  
  -- Check for conflicts (if table is assigned)
  IF v_booking.table_id IS NOT NULL THEN
    SELECT COUNT(*)
    INTO v_conflicts
    FROM bookings
    WHERE id != p_booking_id
      AND table_id = v_booking.table_id
      AND booking_date = p_new_date
      AND status NOT IN ('cancelled', 'no_show')
      AND (
        -- Check if time slots overlap
        (booking_time, booking_time + (duration_minutes || ' minutes')::INTERVAL)
        OVERLAPS
        (p_new_time, p_new_time + (v_booking.duration_minutes || ' minutes')::INTERVAL)
      );
    
    IF v_conflicts > 0 THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Time slot conflict detected',
        'conflicts', v_conflicts
      );
    END IF;
  END IF;
  
  -- Update booking
  UPDATE bookings
  SET 
    booking_date = p_new_date,
    booking_time = p_new_time,
    updated_at = NOW()
  WHERE id = p_booking_id;
  
  -- Return updated booking
  SELECT json_build_object(
    'success', true,
    'booking', json_build_object(
      'id', id,
      'booking_date', booking_date,
      'booking_time', booking_time,
      'customer_name', customer_name,
      'number_of_guests', number_of_guests
    )
  )
  INTO v_result
  FROM bookings
  WHERE id = p_booking_id;
  
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION update_booking_time IS 
'Updates booking time with conflict detection for drag & drop calendar';

-- ============================================================================
-- 3. ASSIGN TABLE TO BOOKING (for drag & drop to tables)
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
  v_result JSON;
BEGIN
  -- Check authorization
  IF NOT EXISTS (
    SELECT 1 FROM bookings b
    JOIN locations l ON l.id = b.location_id
    JOIN memberships m ON m.tenant_id = l.tenant_id
    WHERE b.id = p_booking_id
      AND m.user_id = p_user_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Unauthorized'
    );
  END IF;
  
  -- Get booking and table
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  SELECT * INTO v_table FROM tables WHERE id = p_table_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Booking or table not found'
    );
  END IF;
  
  -- Check table capacity
  IF v_booking.number_of_guests > v_table.seats THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Table too small for party size',
      'table_seats', v_table.seats,
      'party_size', v_booking.number_of_guests
    );
  END IF;
  
  -- Check for conflicts
  SELECT COUNT(*)
  INTO v_conflicts
  FROM bookings
  WHERE id != p_booking_id
    AND table_id = p_table_id
    AND booking_date = v_booking.booking_date
    AND status NOT IN ('cancelled', 'no_show')
    AND (
      (booking_time, booking_time + (duration_minutes || ' minutes')::INTERVAL)
      OVERLAPS
      (v_booking.booking_time, v_booking.booking_time + (v_booking.duration_minutes || ' minutes')::INTERVAL)
    );
  
  IF v_conflicts > 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Table is already booked at this time',
      'conflicts', v_conflicts
    );
  END IF;
  
  -- Assign table
  UPDATE bookings
  SET 
    table_id = p_table_id,
    updated_at = NOW()
  WHERE id = p_booking_id;
  
  RETURN json_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'table_id', p_table_id
  );
END;
$$;

COMMENT ON FUNCTION assign_table_to_booking IS 
'Assigns a table to a booking with capacity and conflict validation';

-- ============================================================================
-- 4. GET TABLE OCCUPANCY (for timeline view)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_table_occupancy(
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
          )
          ORDER BY b.booking_time
        )
        FROM bookings b
        WHERE b.table_id = t.id
          AND b.booking_date = p_date
          AND b.status NOT IN ('cancelled')
      )
    )
  )
  INTO v_result
  FROM tables t
  WHERE t.location_id = p_location_id
    AND t.is_active = true
  ORDER BY t.table_number;
  
  RETURN COALESCE(v_result, '[]'::JSON);
END;
$$;

COMMENT ON FUNCTION get_table_occupancy IS 
'Returns table occupancy timeline for a specific date';

-- ============================================================================
-- 5. GET CALENDAR STATISTICS (for dashboard widget)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_calendar_stats(
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
      'id', l.id,
      'name', l.name,
      'bookings_count', (
        SELECT COUNT(*)
        FROM bookings b2
        WHERE b2.location_id = l.id
          AND b2.booking_date = p_date
      )
    )),
    'hourly_distribution', (
      SELECT json_object_agg(
        hour_slot,
        booking_count
      )
      FROM (
        SELECT 
          EXTRACT(HOUR FROM b.booking_time)::TEXT || ':00' as hour_slot,
          COUNT(*) as booking_count
        FROM bookings b
        JOIN locations l ON l.id = b.location_id
        WHERE l.tenant_id = p_tenant_id
          AND b.booking_date = p_date
        GROUP BY hour_slot
        ORDER BY hour_slot
      ) hourly
    )
  )
  INTO v_result
  FROM bookings b
  JOIN locations l ON l.id = b.location_id
  WHERE l.tenant_id = p_tenant_id
    AND b.booking_date = p_date;
  
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION get_calendar_stats IS 
'Returns calendar statistics for dashboard widget (all locations)';

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
AS $$
DECLARE
  v_conflicts JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'booking_id', id,
      'customer_name', customer_name,
      'booking_time', booking_time,
      'duration_minutes', duration_minutes,
      'status', status
    )
  )
  INTO v_conflicts
  FROM bookings
  WHERE location_id = p_location_id
    AND table_id = p_table_id
    AND booking_date = p_date
    AND id != COALESCE(p_exclude_booking_id, '00000000-0000-0000-0000-000000000000'::UUID)
    AND status NOT IN ('cancelled', 'no_show')
    AND (
      (booking_time, booking_time + (duration_minutes || ' minutes')::INTERVAL)
      OVERLAPS
      (p_time, p_time + (p_duration_minutes || ' minutes')::INTERVAL)
    );
  
  RETURN json_build_object(
    'has_conflicts', v_conflicts IS NOT NULL,
    'conflicts', COALESCE(v_conflicts, '[]'::JSON)
  );
END;
$$;

COMMENT ON FUNCTION check_booking_conflicts IS 
'Checks for booking conflicts before assigning time/table';

-- ============================================================================
-- 7. BULK UPDATE BOOKING STATUS (for calendar multi-select)
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
  -- Check authorization for all bookings
  IF NOT EXISTS (
    SELECT 1
    FROM bookings b
    JOIN locations l ON l.id = b.location_id
    JOIN memberships m ON m.tenant_id = l.tenant_id
    WHERE b.id = ANY(p_booking_ids)
      AND m.user_id = p_user_id
    HAVING COUNT(*) = array_length(p_booking_ids, 1)
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Unauthorized for some bookings'
    );
  END IF;
  
  -- Update all bookings
  WITH updated AS (
    UPDATE bookings
    SET 
      status = p_new_status,
      updated_at = NOW()
    WHERE id = ANY(p_booking_ids)
    RETURNING id
  )
  SELECT COUNT(*) INTO v_updated_count FROM updated;
  
  RETURN json_build_object(
    'success', true,
    'updated_count', v_updated_count
  );
END;
$$;

COMMENT ON FUNCTION bulk_update_booking_status IS 
'Updates status for multiple bookings at once (for bulk actions in calendar)';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_calendar_bookings TO authenticated;
GRANT EXECUTE ON FUNCTION update_booking_time TO authenticated;
GRANT EXECUTE ON FUNCTION assign_table_to_booking TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_occupancy TO authenticated;
GRANT EXECUTE ON FUNCTION get_calendar_stats TO authenticated;
GRANT EXECUTE ON FUNCTION check_booking_conflicts TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_update_booking_status TO authenticated;

-- ============================================================================
-- INDEXES FOR CALENDAR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_bookings_location_date_time 
  ON bookings(location_id, booking_date, booking_time)
  WHERE status NOT IN ('cancelled');

CREATE INDEX IF NOT EXISTS idx_bookings_table_date_time 
  ON bookings(table_id, booking_date, booking_time)
  WHERE table_id IS NOT NULL AND status NOT IN ('cancelled');

-- ============================================================================
-- ✅ CALENDAR SYSTEM SQL COMPLETE
-- ============================================================================

