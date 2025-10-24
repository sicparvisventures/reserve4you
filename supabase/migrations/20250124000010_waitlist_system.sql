-- ============================================================================
-- WAITLIST MANAGEMENT SYSTEM - RESERVE4YOU
-- ============================================================================
-- Complete waitlist system with auto-notify, priority management
-- Professional implementation for restaurant reservation management
-- ============================================================================

-- ============================================================================
-- 1. CREATE WAITLIST TABLE
-- ============================================================================

CREATE TYPE waitlist_status AS ENUM (
  'waiting',
  'notified',
  'converted',
  'expired',
  'cancelled'
);

CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  guest_name VARCHAR(255) NOT NULL,
  guest_phone VARCHAR(20),
  guest_email VARCHAR(255),
  party_size INT NOT NULL CHECK (party_size > 0 AND party_size <= 50),
  preferred_date DATE NOT NULL,
  preferred_time_start TIME NOT NULL,
  preferred_time_end TIME,
  status waitlist_status DEFAULT 'waiting',
  notes TEXT,
  priority INT DEFAULT 0,
  notified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  converted_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT valid_time_range CHECK (
    preferred_time_end IS NULL OR preferred_time_end > preferred_time_start
  )
);

-- Indexes for performance
CREATE INDEX idx_waitlist_location ON waitlist(location_id);
CREATE INDEX idx_waitlist_status ON waitlist(status);
CREATE INDEX idx_waitlist_date ON waitlist(preferred_date);
CREATE INDEX idx_waitlist_priority ON waitlist(priority DESC, created_at);
CREATE INDEX idx_waitlist_expires ON waitlist(expires_at) WHERE status = 'notified';

-- RLS Policies
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view waitlist for their tenant locations"
  ON waitlist FOR SELECT
  USING (
    location_id IN (
      SELECT l.id FROM locations l
      JOIN memberships m ON m.tenant_id = l.tenant_id
      WHERE m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert waitlist for their tenant locations"
  ON waitlist FOR INSERT
  WITH CHECK (
    location_id IN (
      SELECT l.id FROM locations l
      JOIN memberships m ON m.tenant_id = l.tenant_id
      WHERE m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update waitlist for their tenant locations"
  ON waitlist FOR UPDATE
  USING (
    location_id IN (
      SELECT l.id FROM locations l
      JOIN memberships m ON m.tenant_id = l.tenant_id
      WHERE m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete waitlist for their tenant locations"
  ON waitlist FOR DELETE
  USING (
    location_id IN (
      SELECT l.id FROM locations l
      JOIN memberships m ON m.tenant_id = l.tenant_id
      WHERE m.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 2. GET WAITLIST FOR LOCATION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_location_waitlist(
  p_location_id UUID,
  p_status waitlist_status DEFAULT NULL
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
        'id', w.id,
        'guest_name', w.guest_name,
        'guest_phone', w.guest_phone,
        'guest_email', w.guest_email,
        'party_size', w.party_size,
        'preferred_date', w.preferred_date,
        'preferred_time_start', w.preferred_time_start,
        'preferred_time_end', w.preferred_time_end,
        'status', w.status,
        'notes', w.notes,
        'priority', w.priority,
        'notified_at', w.notified_at,
        'expires_at', w.expires_at,
        'created_at', w.created_at,
        'waiting_time', EXTRACT(EPOCH FROM (NOW() - w.created_at))::INT,
        'location_name', l.name
      )
      ORDER BY w.priority DESC, w.created_at ASC
    ),
    '[]'::JSON
  )
  INTO v_result
  FROM waitlist w
  JOIN locations l ON l.id = w.location_id
  WHERE w.location_id = p_location_id
    AND (p_status IS NULL OR w.status = p_status);
  
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION get_location_waitlist IS 'Returns waitlist entries for a location';

-- ============================================================================
-- 3. GET WAITLIST STATISTICS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_waitlist_stats(
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
BEGIN
  SELECT json_build_object(
    'date', p_date,
    'total_waiting', COALESCE(COUNT(*) FILTER (WHERE w.status = 'waiting')::INT, 0),
    'total_notified', COALESCE(COUNT(*) FILTER (WHERE w.status = 'notified')::INT, 0),
    'total_converted', COALESCE(COUNT(*) FILTER (WHERE w.status = 'converted')::INT, 0),
    'total_expired', COALESCE(COUNT(*) FILTER (WHERE w.status = 'expired')::INT, 0),
    'total_cancelled', COALESCE(COUNT(*) FILTER (WHERE w.status = 'cancelled')::INT, 0),
    'conversion_rate', CASE 
      WHEN COUNT(*) FILTER (WHERE w.status IN ('converted', 'expired', 'cancelled')) > 0
      THEN ROUND(
        COUNT(*) FILTER (WHERE w.status = 'converted')::DECIMAL / 
        COUNT(*) FILTER (WHERE w.status IN ('converted', 'expired', 'cancelled'))::DECIMAL * 100,
        1
      )
      ELSE 0
    END,
    'avg_wait_time_minutes', COALESCE(
      ROUND(AVG(
        EXTRACT(EPOCH FROM (COALESCE(w.notified_at, NOW()) - w.created_at)) / 60
      ))::INT,
      0
    ) FILTER (WHERE w.status IN ('notified', 'converted')),
    'locations', COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', l.id,
          'name', l.name,
          'waiting_count', (
            SELECT COUNT(*)::INT
            FROM waitlist w2
            WHERE w2.location_id = l.id
              AND w2.preferred_date = p_date
              AND w2.status = 'waiting'
          )
        )
      )
      FROM locations l
      WHERE l.tenant_id = p_tenant_id
    ), '[]'::JSON)
  )
  INTO v_result
  FROM waitlist w
  JOIN locations l ON l.id = w.location_id
  WHERE l.tenant_id = p_tenant_id
    AND w.preferred_date = p_date;
  
  RETURN COALESCE(v_result, json_build_object(
    'date', p_date,
    'total_waiting', 0,
    'total_notified', 0,
    'total_converted', 0,
    'total_expired', 0,
    'total_cancelled', 0,
    'conversion_rate', 0,
    'avg_wait_time_minutes', 0,
    'locations', '[]'::JSON
  ));
END;
$$;

COMMENT ON FUNCTION get_waitlist_stats IS 'Returns waitlist statistics for dashboard';

-- ============================================================================
-- 4. ADD TO WAITLIST
-- ============================================================================

CREATE OR REPLACE FUNCTION add_to_waitlist(
  p_location_id UUID,
  p_guest_name VARCHAR(255),
  p_guest_phone VARCHAR(20),
  p_guest_email VARCHAR(255),
  p_party_size INT,
  p_preferred_date DATE,
  p_preferred_time_start TIME,
  p_preferred_time_end TIME DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_priority INT DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_waitlist_id UUID;
BEGIN
  -- Validate inputs
  IF p_party_size < 1 OR p_party_size > 50 THEN
    RETURN json_build_object('success', false, 'error', 'Invalid party size');
  END IF;
  
  IF p_preferred_date < CURRENT_DATE THEN
    RETURN json_build_object('success', false, 'error', 'Date cannot be in the past');
  END IF;
  
  -- Insert waitlist entry
  INSERT INTO waitlist (
    location_id,
    guest_name,
    guest_phone,
    guest_email,
    party_size,
    preferred_date,
    preferred_time_start,
    preferred_time_end,
    notes,
    priority,
    created_by
  ) VALUES (
    p_location_id,
    p_guest_name,
    p_guest_phone,
    p_guest_email,
    p_party_size,
    p_preferred_date,
    p_preferred_time_start,
    p_preferred_time_end,
    p_notes,
    p_priority,
    auth.uid()
  )
  RETURNING id INTO v_waitlist_id;
  
  RETURN json_build_object(
    'success', true,
    'waitlist_id', v_waitlist_id,
    'message', 'Added to waitlist successfully'
  );
END;
$$;

-- ============================================================================
-- 5. UPDATE WAITLIST STATUS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_waitlist_status(
  p_waitlist_id UUID,
  p_new_status waitlist_status,
  p_converted_booking_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_status waitlist_status;
BEGIN
  -- Get current status
  SELECT status INTO v_current_status
  FROM waitlist
  WHERE id = p_waitlist_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Waitlist entry not found');
  END IF;
  
  -- Update status
  UPDATE waitlist
  SET 
    status = p_new_status,
    notified_at = CASE 
      WHEN p_new_status = 'notified' AND v_current_status != 'notified' 
      THEN NOW() 
      ELSE notified_at 
    END,
    expires_at = CASE 
      WHEN p_new_status = 'notified' AND v_current_status != 'notified'
      THEN NOW() + INTERVAL '30 minutes'
      ELSE expires_at
    END,
    converted_booking_id = CASE 
      WHEN p_new_status = 'converted' 
      THEN p_converted_booking_id 
      ELSE converted_booking_id 
    END,
    updated_at = NOW()
  WHERE id = p_waitlist_id;
  
  RETURN json_build_object(
    'success', true,
    'waitlist_id', p_waitlist_id,
    'status', p_new_status
  );
END;
$$;

-- ============================================================================
-- 6. FIND MATCHING WAITLIST (Auto-Notify System)
-- ============================================================================

CREATE OR REPLACE FUNCTION find_matching_waitlist(
  p_location_id UUID,
  p_date DATE,
  p_time TIME,
  p_party_size INT,
  p_limit INT DEFAULT 5
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
        'id', w.id,
        'guest_name', w.guest_name,
        'guest_phone', w.guest_phone,
        'guest_email', w.guest_email,
        'party_size', w.party_size,
        'preferred_time_start', w.preferred_time_start,
        'preferred_time_end', w.preferred_time_end,
        'priority', w.priority,
        'waiting_time', EXTRACT(EPOCH FROM (NOW() - w.created_at))::INT
      )
      ORDER BY w.priority DESC, w.created_at ASC
    ),
    '[]'::JSON
  )
  INTO v_result
  FROM waitlist w
  WHERE w.location_id = p_location_id
    AND w.preferred_date = p_date
    AND w.status = 'waiting'
    AND w.party_size <= p_party_size  -- Table can fit this party
    AND (
      w.preferred_time_end IS NULL
      OR (p_time >= w.preferred_time_start AND p_time <= w.preferred_time_end)
    )
  LIMIT p_limit;
  
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION find_matching_waitlist IS 'Finds waitlist entries matching available slot';

-- ============================================================================
-- 7. EXPIRE OLD NOTIFICATIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION expire_old_notifications()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expired_count INT;
BEGIN
  WITH expired AS (
    UPDATE waitlist
    SET 
      status = 'expired',
      updated_at = NOW()
    WHERE status = 'notified'
      AND expires_at < NOW()
    RETURNING id
  )
  SELECT COUNT(*)::INT INTO v_expired_count FROM expired;
  
  RETURN v_expired_count;
END;
$$;

COMMENT ON FUNCTION expire_old_notifications IS 'Expires waitlist notifications that are past deadline';

-- ============================================================================
-- 8. GET WAITLIST FOR ALL LOCATIONS (Multi-location view)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_tenant_waitlist(
  p_tenant_id UUID,
  p_status waitlist_status DEFAULT NULL,
  p_date DATE DEFAULT NULL
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
        'id', w.id,
        'location_id', w.location_id,
        'location_name', l.name,
        'guest_name', w.guest_name,
        'guest_phone', w.guest_phone,
        'guest_email', w.guest_email,
        'party_size', w.party_size,
        'preferred_date', w.preferred_date,
        'preferred_time_start', w.preferred_time_start,
        'preferred_time_end', w.preferred_time_end,
        'status', w.status,
        'notes', w.notes,
        'priority', w.priority,
        'notified_at', w.notified_at,
        'expires_at', w.expires_at,
        'created_at', w.created_at,
        'waiting_time', EXTRACT(EPOCH FROM (NOW() - w.created_at))::INT
      )
      ORDER BY w.priority DESC, w.created_at ASC
    ),
    '[]'::JSON
  )
  INTO v_result
  FROM waitlist w
  JOIN locations l ON l.id = w.location_id
  WHERE l.tenant_id = p_tenant_id
    AND (p_status IS NULL OR w.status = p_status)
    AND (p_date IS NULL OR w.preferred_date = p_date);
  
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION get_tenant_waitlist IS 'Returns waitlist for all locations in tenant';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_location_waitlist(UUID, waitlist_status) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_waitlist_stats(UUID, DATE) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION add_to_waitlist(UUID, VARCHAR, VARCHAR, VARCHAR, INT, DATE, TIME, TIME, TEXT, INT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION update_waitlist_status(UUID, waitlist_status, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION find_matching_waitlist(UUID, DATE, TIME, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION expire_old_notifications() TO authenticated;
GRANT EXECUTE ON FUNCTION get_tenant_waitlist(UUID, waitlist_status, DATE) TO authenticated, anon;

-- ============================================================================
-- TEST FUNCTIONS
-- ============================================================================

DO $$
DECLARE
  v_test_location_id UUID;
  v_test_tenant_id UUID;
  v_result JSON;
BEGIN
  SELECT id, tenant_id INTO v_test_location_id, v_test_tenant_id
  FROM locations LIMIT 1;
  
  IF v_test_location_id IS NOT NULL THEN
    SELECT get_location_waitlist(v_test_location_id, NULL) INTO v_result;
    RAISE NOTICE 'get_location_waitlist: % entries', COALESCE(json_array_length(v_result), 0);
    
    SELECT get_waitlist_stats(v_test_tenant_id, CURRENT_DATE) INTO v_result;
    RAISE NOTICE 'get_waitlist_stats: % waiting', (v_result->>'total_waiting');
    
    SELECT get_tenant_waitlist(v_test_tenant_id, NULL, NULL) INTO v_result;
    RAISE NOTICE 'get_tenant_waitlist: % total entries', COALESCE(json_array_length(v_result), 0);
    
    RAISE NOTICE '';
    RAISE NOTICE 'WAITLIST SYSTEM READY!';
  ELSE
    RAISE NOTICE 'No locations (OK for new setup)';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 
  'WAITLIST SYSTEM READY!' as status,
  COUNT(*)::INT as functions,
  (SELECT COUNT(*)::INT FROM pg_tables WHERE tablename = 'waitlist') as table_exists
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname LIKE '%waitlist%'
AND n.nspname = 'public';

