-- ============================================================================
-- BOOKING MANAGEMENT FUNCTIONS
-- ============================================================================
-- Professional booking management for TableFever-style dashboard
-- Functions for updating status, filtering, searching, and analytics
-- ============================================================================

-- ============================================================================
-- 1. UPDATE BOOKING STATUS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_booking_status(
  p_booking_id UUID,
  p_new_status booking_status,
  p_user_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_is_authorized BOOLEAN;
BEGIN
  -- Get tenant_id from booking's location
  SELECT l.tenant_id INTO v_tenant_id
  FROM bookings b
  JOIN locations l ON b.location_id = l.id
  WHERE b.id = p_booking_id;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  -- Check if user is authorized (OWNER, MANAGER, or STAFF of tenant)
  SELECT EXISTS (
    SELECT 1 FROM memberships 
    WHERE tenant_id = v_tenant_id 
      AND user_id = p_user_id 
      AND role IN ('OWNER', 'MANAGER', 'STAFF')
  ) INTO v_is_authorized;

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Unauthorized to update booking';
  END IF;

  -- Update booking status
  UPDATE bookings
  SET 
    status = p_new_status,
    updated_at = NOW()
  WHERE id = p_booking_id;

  -- Log the status change (could add to audit table)
  RAISE NOTICE 'Booking % status changed to % by user %', p_booking_id, p_new_status, p_user_id;

  RETURN TRUE;
END;
$$;

-- ============================================================================
-- 2. GET BOOKING STATS FOR DASHBOARD
-- ============================================================================

CREATE OR REPLACE FUNCTION get_booking_stats(
  p_location_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_bookings BIGINT,
  confirmed_bookings BIGINT,
  pending_bookings BIGINT,
  cancelled_bookings BIGINT,
  no_show_bookings BIGINT,
  total_guests INT,
  avg_party_size NUMERIC,
  peak_hour INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_bookings,
    COUNT(*) FILTER (WHERE status = 'CONFIRMED')::BIGINT as confirmed_bookings,
    COUNT(*) FILTER (WHERE status = 'PENDING')::BIGINT as pending_bookings,
    COUNT(*) FILTER (WHERE status = 'CANCELLED')::BIGINT as cancelled_bookings,
    COUNT(*) FILTER (WHERE status = 'NO_SHOW')::BIGINT as no_show_bookings,
    COALESCE(SUM(party_size), 0)::INT as total_guests,
    COALESCE(AVG(party_size), 0)::NUMERIC(10,1) as avg_party_size,
    COALESCE(
      MODE() WITHIN GROUP (ORDER BY EXTRACT(HOUR FROM start_ts)),
      0
    )::INT as peak_hour
  FROM bookings
  WHERE location_id = p_location_id
    AND DATE(start_ts) = p_date;
END;
$$;

-- ============================================================================
-- 3. GET REVENUE STATS (if deposits enabled)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_revenue_stats(
  p_tenant_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_revenue_cents BIGINT,
  deposit_revenue_cents BIGINT,
  no_show_fees_cents BIGINT,
  total_bookings BIGINT,
  avg_booking_value_cents NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(
      CASE 
        WHEN b.payment_status = 'PAID' AND b.deposit_amount_cents IS NOT NULL 
        THEN b.deposit_amount_cents 
        ELSE 0 
      END
    ), 0)::BIGINT as total_revenue_cents,
    
    COALESCE(SUM(
      CASE 
        WHEN b.payment_status = 'PAID' AND b.deposit_amount_cents IS NOT NULL 
        THEN b.deposit_amount_cents 
        ELSE 0 
      END
    ), 0)::BIGINT as deposit_revenue_cents,
    
    COALESCE(SUM(
      CASE 
        WHEN b.status = 'NO_SHOW' AND p.no_show_fee_cents IS NOT NULL 
        THEN p.no_show_fee_cents 
        ELSE 0 
      END
    ), 0)::BIGINT as no_show_fees_cents,
    
    COUNT(*)::BIGINT as total_bookings,
    
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COALESCE(SUM(
          CASE 
            WHEN b.payment_status = 'PAID' AND b.deposit_amount_cents IS NOT NULL 
            THEN b.deposit_amount_cents 
            ELSE 0 
          END
        ), 0)::NUMERIC / COUNT(*))
      ELSE 0 
    END as avg_booking_value_cents
    
  FROM bookings b
  JOIN locations l ON b.location_id = l.id
  LEFT JOIN policies p ON l.id = p.location_id
  WHERE l.tenant_id = p_tenant_id
    AND DATE(b.start_ts) BETWEEN p_start_date AND p_end_date
    AND b.status NOT IN ('CANCELLED');
END;
$$;

-- ============================================================================
-- 4. BULK UPDATE BOOKINGS
-- ============================================================================

CREATE OR REPLACE FUNCTION bulk_update_booking_status(
  p_booking_ids UUID[],
  p_new_status booking_status,
  p_user_id UUID
)
RETURNS TABLE (
  booking_id UUID,
  success BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking_id UUID;
BEGIN
  FOREACH v_booking_id IN ARRAY p_booking_ids
  LOOP
    BEGIN
      PERFORM update_booking_status(v_booking_id, p_new_status, p_user_id);
      booking_id := v_booking_id;
      success := TRUE;
      error_message := NULL;
      RETURN NEXT;
    EXCEPTION WHEN OTHERS THEN
      booking_id := v_booking_id;
      success := FALSE;
      error_message := SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
END;
$$;

-- ============================================================================
-- 5. GET UPCOMING BOOKINGS WITH DETAILS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_upcoming_bookings(
  p_location_id UUID,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  guest_name VARCHAR,
  guest_email VARCHAR,
  guest_phone VARCHAR,
  party_size INT,
  start_ts TIMESTAMPTZ,
  end_ts TIMESTAMPTZ,
  status booking_status,
  payment_status payment_status,
  table_name VARCHAR,
  table_id UUID,
  special_notes TEXT,
  created_at TIMESTAMPTZ,
  deposit_amount_cents INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.guest_name,
    b.guest_email,
    b.guest_phone,
    b.party_size,
    b.start_ts,
    b.end_ts,
    b.status,
    b.payment_status,
    t.name as table_name,
    t.id as table_id,
    b.special_notes,
    b.created_at,
    b.deposit_amount_cents
  FROM bookings b
  LEFT JOIN tables t ON b.table_id = t.id
  WHERE b.location_id = p_location_id
    AND b.start_ts >= NOW()
    AND b.status NOT IN ('CANCELLED')
  ORDER BY b.start_ts ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ============================================================================
-- 6. SEARCH BOOKINGS
-- ============================================================================

CREATE OR REPLACE FUNCTION search_bookings(
  p_tenant_id UUID,
  p_search_query TEXT,
  p_status booking_status DEFAULT NULL,
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL,
  p_limit INT DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  location_name VARCHAR,
  guest_name VARCHAR,
  guest_email VARCHAR,
  guest_phone VARCHAR,
  party_size INT,
  start_ts TIMESTAMPTZ,
  status booking_status,
  table_name VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    l.name as location_name,
    b.guest_name,
    b.guest_email,
    b.guest_phone,
    b.party_size,
    b.start_ts,
    b.status,
    t.name as table_name
  FROM bookings b
  JOIN locations l ON b.location_id = l.id
  LEFT JOIN tables t ON b.table_id = t.id
  WHERE l.tenant_id = p_tenant_id
    AND (
      p_search_query IS NULL OR
      b.guest_name ILIKE '%' || p_search_query || '%' OR
      b.guest_email ILIKE '%' || p_search_query || '%' OR
      b.guest_phone ILIKE '%' || p_search_query || '%' OR
      b.confirmation_code ILIKE '%' || p_search_query || '%'
    )
    AND (p_status IS NULL OR b.status = p_status)
    AND (p_date_from IS NULL OR DATE(b.start_ts) >= p_date_from)
    AND (p_date_to IS NULL OR DATE(b.start_ts) <= p_date_to)
  ORDER BY b.start_ts DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================================
-- 7. GET TABLE OCCUPANCY FOR TIME SLOT
-- ============================================================================

CREATE OR REPLACE FUNCTION get_table_occupancy(
  p_location_id UUID,
  p_date DATE,
  p_time_slot TIME
)
RETURNS TABLE (
  table_id UUID,
  table_name VARCHAR,
  seats INT,
  is_occupied BOOLEAN,
  booking_id UUID,
  guest_name VARCHAR,
  party_size INT,
  start_time TIME,
  end_time TIME
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as table_id,
    t.name as table_name,
    t.seats,
    CASE WHEN b.id IS NOT NULL THEN TRUE ELSE FALSE END as is_occupied,
    b.id as booking_id,
    b.guest_name,
    b.party_size,
    b.start_ts::TIME as start_time,
    b.end_ts::TIME as end_time
  FROM tables t
  LEFT JOIN bookings b ON t.id = b.table_id
    AND DATE(b.start_ts) = p_date
    AND b.start_ts::TIME <= p_time_slot
    AND b.end_ts::TIME > p_time_slot
    AND b.status IN ('CONFIRMED', 'PENDING')
  WHERE t.location_id = p_location_id
  ORDER BY t.name;
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION update_booking_status TO authenticated;
GRANT EXECUTE ON FUNCTION get_booking_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_revenue_stats TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_update_booking_status TO authenticated;
GRANT EXECUTE ON FUNCTION get_upcoming_bookings TO authenticated;
GRANT EXECUTE ON FUNCTION search_bookings TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_occupancy TO authenticated;

-- ============================================================================
-- ADD MISSING COLUMNS IF NOT EXISTS
-- ============================================================================

DO $$
BEGIN
  -- Add confirmation_code if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'confirmation_code'
  ) THEN
    ALTER TABLE bookings ADD COLUMN confirmation_code VARCHAR(12) UNIQUE;
    RAISE NOTICE 'Added confirmation_code column to bookings';
  END IF;

  -- Add deposit_amount_cents if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'deposit_amount_cents'
  ) THEN
    ALTER TABLE bookings ADD COLUMN deposit_amount_cents INT;
    RAISE NOTICE 'Added deposit_amount_cents column to bookings';
  END IF;

  -- Create index on confirmation_code
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_bookings_confirmation_code'
  ) THEN
    CREATE INDEX idx_bookings_confirmation_code ON bookings(confirmation_code);
    RAISE NOTICE 'Created index on confirmation_code';
  END IF;
END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Booking Management Functions Created';
  RAISE NOTICE '';
  RAISE NOTICE 'Available Functions:';
  RAISE NOTICE '  1. update_booking_status()';
  RAISE NOTICE '  2. get_booking_stats()';
  RAISE NOTICE '  3. get_revenue_stats()';
  RAISE NOTICE '  4. bulk_update_booking_status()';
  RAISE NOTICE '  5. get_upcoming_bookings()';
  RAISE NOTICE '  6. search_bookings()';
  RAISE NOTICE '  7. get_table_occupancy()';
  RAISE NOTICE '';
  RAISE NOTICE 'Ready for professional dashboard!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

