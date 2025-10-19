-- =====================================================
-- FLOOR PLAN & AUTO-ACCEPT FEATURES
-- =====================================================
-- Adds visual floor plan positioning and auto-accept bookings
-- Migration: 20250119000010

BEGIN;

-- =====================================================
-- 1. ADD FLOOR PLAN COLUMNS TO TABLES
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '=== Adding Floor Plan Columns to Tables ===';
END $$;

-- Add position columns for drag-and-drop floor plan
ALTER TABLE public.tables 
  ADD COLUMN IF NOT EXISTS position_x INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS position_y INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS floor_level INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS shape VARCHAR(20) DEFAULT 'circle',
  ADD COLUMN IF NOT EXISTS rotation INTEGER DEFAULT 0;

-- Add comments
COMMENT ON COLUMN public.tables.position_x IS 'X coordinate on floor plan canvas (in pixels)';
COMMENT ON COLUMN public.tables.position_y IS 'Y coordinate on floor plan canvas (in pixels)';
COMMENT ON COLUMN public.tables.floor_level IS 'Floor level (1=ground, 2=first floor, etc.)';
COMMENT ON COLUMN public.tables.shape IS 'Visual shape on floor plan: circle, square, rectangle';
COMMENT ON COLUMN public.tables.rotation IS 'Rotation angle in degrees (0-359)';

-- =====================================================
-- 2. ADD AUTO-ACCEPT SETTINGS TO LOCATIONS
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '=== Adding Auto-Accept Settings to Locations ===';
END $$;

ALTER TABLE public.locations 
  ADD COLUMN IF NOT EXISTS auto_accept_bookings BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS booking_buffer_minutes INTEGER DEFAULT 15,
  ADD COLUMN IF NOT EXISTS max_advance_booking_days INTEGER DEFAULT 90;

-- Add comments
COMMENT ON COLUMN public.locations.auto_accept_bookings IS 'Auto-confirm bookings without manual approval';
COMMENT ON COLUMN public.locations.booking_buffer_minutes IS 'Minimum time buffer between bookings (in minutes)';
COMMENT ON COLUMN public.locations.max_advance_booking_days IS 'Maximum days in advance for bookings';

-- =====================================================
-- 3. UPDATE DEFAULT TABLE POSITIONS
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '=== Setting Default Positions for Existing Tables ===';
END $$;

-- Position existing tables in a grid layout
-- This creates a nice default layout for existing tables
WITH numbered_tables AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY location_id ORDER BY table_number) as row_num
  FROM public.tables
  WHERE position_x = 0 AND position_y = 0
)
UPDATE public.tables t
SET 
  position_x = 100 + ((nt.row_num - 1) % 4) * 150,  -- 4 columns
  position_y = 100 + ((nt.row_num - 1) / 4) * 150,  -- Rows
  shape = CASE 
    WHEN t.seats <= 2 THEN 'circle'
    WHEN t.seats <= 4 THEN 'square'
    ELSE 'rectangle'
  END
FROM numbered_tables nt
WHERE t.id = nt.id;

-- =====================================================
-- 4. CREATE FUNCTION: CHECK AUTO-ACCEPT STATUS
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '=== Creating Auto-Accept Check Function ===';
END $$;

CREATE OR REPLACE FUNCTION public.get_booking_status_for_location(
  p_location_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auto_accept BOOLEAN;
BEGIN
  -- Get auto-accept setting
  SELECT auto_accept_bookings INTO v_auto_accept
  FROM public.locations
  WHERE id = p_location_id;
  
  -- Return appropriate status
  IF v_auto_accept THEN
    RETURN 'confirmed';
  ELSE
    RETURN 'pending';
  END IF;
END;
$$;

COMMENT ON FUNCTION public.get_booking_status_for_location IS 
  'Returns booking status (confirmed/pending) based on location auto-accept setting';

-- =====================================================
-- 5. CREATE FUNCTION: UPDATE FLOOR PLAN POSITIONS
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '=== Creating Floor Plan Update Function ===';
END $$;

CREATE OR REPLACE FUNCTION public.update_table_positions(
  p_positions JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_table_data JSONB;
  v_table_id UUID;
  v_position_x INTEGER;
  v_position_y INTEGER;
  v_user_id UUID;
  v_is_owner BOOLEAN;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Loop through positions array
  FOR v_table_data IN SELECT * FROM jsonb_array_elements(p_positions)
  LOOP
    v_table_id := (v_table_data->>'table_id')::UUID;
    v_position_x := (v_table_data->>'x')::INTEGER;
    v_position_y := (v_table_data->>'y')::INTEGER;
    
    -- Check ownership
    SELECT EXISTS(
      SELECT 1 FROM public.tables t
      JOIN public.locations l ON t.location_id = l.id
      JOIN public.tenants te ON l.tenant_id = te.id
      WHERE t.id = v_table_id
      AND te.owner_user_id = v_user_id
    ) INTO v_is_owner;
    
    IF NOT v_is_owner THEN
      RAISE EXCEPTION 'Not authorized to update table positions';
    END IF;
    
    -- Update position
    UPDATE public.tables
    SET 
      position_x = v_position_x,
      position_y = v_position_y,
      updated_at = NOW()
    WHERE id = v_table_id;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.update_table_positions IS 
  'Bulk update table positions on floor plan (drag-and-drop)';

-- =====================================================
-- 6. CREATE TRIGGER: AUTO-SET BOOKING STATUS
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '=== Creating Auto-Accept Trigger ===';
END $$;

CREATE OR REPLACE FUNCTION public.set_booking_status_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auto_accept BOOLEAN;
BEGIN
  -- Only set status if it's 'pending' (from user creation)
  IF NEW.status = 'pending' THEN
    -- Check location auto-accept setting
    SELECT auto_accept_bookings INTO v_auto_accept
    FROM public.locations
    WHERE id = NEW.location_id;
    
    -- Auto-confirm if enabled
    IF v_auto_accept THEN
      NEW.status := 'confirmed';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_set_booking_status ON public.bookings;

-- Create trigger
CREATE TRIGGER trigger_set_booking_status
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_booking_status_on_insert();

COMMENT ON TRIGGER trigger_set_booking_status ON public.bookings IS 
  'Auto-confirms bookings based on location auto-accept setting';

-- =====================================================
-- 7. CREATE VIEW: FLOOR PLAN DATA
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '=== Creating Floor Plan View ===';
END $$;

CREATE OR REPLACE VIEW public.floor_plan_view AS
SELECT 
  t.id,
  t.location_id,
  t.table_number,
  t.seats,
  t.position_x,
  t.position_y,
  t.floor_level,
  t.shape,
  t.rotation,
  t.is_active,
  t.description,
  l.name as location_name,
  COUNT(DISTINCT b.id) FILTER (
    WHERE b.booking_date = CURRENT_DATE 
    AND b.status IN ('confirmed', 'seated')
  ) as bookings_today,
  BOOL_OR(
    b.booking_date = CURRENT_DATE 
    AND b.booking_time <= CURRENT_TIME + INTERVAL '1 hour'
    AND b.booking_time >= CURRENT_TIME - INTERVAL '2 hours'
    AND b.status IN ('confirmed', 'seated')
  ) as currently_occupied
FROM public.tables t
JOIN public.locations l ON t.location_id = l.id
LEFT JOIN public.bookings b ON t.id = b.table_id
GROUP BY t.id, l.id, l.name;

COMMENT ON VIEW public.floor_plan_view IS 
  'Floor plan with real-time occupancy status';

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '=== Granting Permissions ===';
END $$;

-- Grant access to authenticated users
GRANT SELECT ON public.floor_plan_view TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_table_positions TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_booking_status_for_location TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_booking_status_for_location TO anon;

-- =====================================================
-- 9. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '=== Creating Performance Indexes ===';
END $$;

-- Index for floor plan queries
CREATE INDEX IF NOT EXISTS idx_tables_floor_position 
  ON public.tables(location_id, floor_level, position_x, position_y);

-- Index for booking status queries
CREATE INDEX IF NOT EXISTS idx_bookings_status_date 
  ON public.bookings(location_id, status, booking_date);

-- =====================================================
-- 10. SAMPLE DATA UPDATE
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '=== Updating Sample Data ===';
END $$;

-- Enable auto-accept for demo locations (optional)
-- Uncomment to enable:
-- UPDATE public.locations 
-- SET auto_accept_bookings = true 
-- WHERE is_public = true;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ FLOOR PLAN & AUTO-ACCEPT MIGRATION COMPLETE';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'New Features:';
  RAISE NOTICE '  ✓ Tables have position_x, position_y for floor plan';
  RAISE NOTICE '  ✓ Locations have auto_accept_bookings setting';
  RAISE NOTICE '  ✓ Auto-confirm trigger on bookings';
  RAISE NOTICE '  ✓ Bulk position update function';
  RAISE NOTICE '  ✓ Floor plan view with occupancy';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Build FloorPlanEditor component';
  RAISE NOTICE '  2. Add auto-accept toggle to location settings';
  RAISE NOTICE '  3. Test drag-and-drop functionality';
  RAISE NOTICE '';
END $$;

COMMIT;

