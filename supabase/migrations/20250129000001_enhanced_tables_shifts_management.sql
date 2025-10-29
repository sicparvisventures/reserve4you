-- Enhanced Tables and Shifts Management Migration
-- Adds necessary columns, indexes, and constraints for professional table and shift management

-- Tables enhancements
DO $$ 
BEGIN
  -- Ensure is_combinable column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tables' AND column_name = 'is_combinable'
  ) THEN
    ALTER TABLE tables ADD COLUMN is_combinable BOOLEAN DEFAULT FALSE;
  END IF;

  -- Ensure group_id column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tables' AND column_name = 'group_id'
  ) THEN
    ALTER TABLE tables ADD COLUMN group_id VARCHAR(50);
  END IF;
END $$;

-- Create index on group_id for faster lookups of combinable tables
CREATE INDEX IF NOT EXISTS idx_tables_group_id 
  ON tables(group_id) 
  WHERE group_id IS NOT NULL;

-- Create index on location_id + is_active for faster active table queries
CREATE INDEX IF NOT EXISTS idx_tables_location_active 
  ON tables(location_id, is_active) 
  WHERE is_active = true;

-- Shifts enhancements
DO $$ 
BEGIN
  -- Ensure days_of_week column exists (should be array of integers)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shifts' AND column_name = 'days_of_week'
  ) THEN
    -- If old day_of_week column exists, migrate data
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'shifts' AND column_name = 'day_of_week'
    ) THEN
      ALTER TABLE shifts ADD COLUMN days_of_week INT[];
      UPDATE shifts SET days_of_week = day_of_week WHERE day_of_week IS NOT NULL;
      ALTER TABLE shifts DROP COLUMN day_of_week;
    ELSE
      ALTER TABLE shifts ADD COLUMN days_of_week INT[] DEFAULT ARRAY[]::INT[];
    END IF;
  END IF;

  -- Ensure slot_minutes column exists (prefer this over slot_duration_minutes)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shifts' AND column_name = 'slot_minutes'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'shifts' AND column_name = 'slot_duration_minutes'
    ) THEN
      ALTER TABLE shifts ADD COLUMN slot_minutes INT;
      UPDATE shifts SET slot_minutes = slot_duration_minutes WHERE slot_duration_minutes IS NOT NULL;
    ELSE
      ALTER TABLE shifts ADD COLUMN slot_minutes INT DEFAULT 90;
    END IF;
  END IF;

  -- Ensure buffer_minutes exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shifts' AND column_name = 'buffer_minutes'
  ) THEN
    ALTER TABLE shifts ADD COLUMN buffer_minutes INT DEFAULT 15;
  END IF;

  -- Ensure max_parallel exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shifts' AND column_name = 'max_parallel'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'shifts' AND column_name = 'max_concurrent_bookings'
    ) THEN
      ALTER TABLE shifts ADD COLUMN max_parallel INT;
      UPDATE shifts SET max_parallel = max_concurrent_bookings WHERE max_concurrent_bookings IS NOT NULL;
    ELSE
      ALTER TABLE shifts ADD COLUMN max_parallel INT;
    END IF;
  END IF;

  -- Ensure is_active exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shifts' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE shifts ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- Create indexes for shifts for faster availability queries
CREATE INDEX IF NOT EXISTS idx_shifts_location_active 
  ON shifts(location_id, is_active) 
  WHERE is_active = true;

-- Create GIN index for days_of_week array for faster contains queries
CREATE INDEX IF NOT EXISTS idx_shifts_days_of_week 
  ON shifts USING GIN(days_of_week);

-- Add helpful comments
COMMENT ON COLUMN tables.is_combinable IS 
  'Whether this table can be combined with others for larger parties';
COMMENT ON COLUMN tables.group_id IS 
  'Group identifier for combining tables (e.g., "A", "Terrace", "VIP")';

COMMENT ON COLUMN shifts.days_of_week IS 
  'Array of day numbers (0=Sunday, 1=Monday, ..., 6=Saturday) when this shift is active';
COMMENT ON COLUMN shifts.slot_minutes IS 
  'Default duration of a booking slot in minutes';
COMMENT ON COLUMN shifts.buffer_minutes IS 
  'Buffer time between bookings in minutes';
COMMENT ON COLUMN shifts.max_parallel IS 
  'Maximum number of concurrent bookings allowed during this shift (NULL = unlimited)';

-- Function to validate shift days_of_week
CREATE OR REPLACE FUNCTION validate_shift_days()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure days_of_week contains valid day numbers (0-6)
  IF EXISTS (
    SELECT 1 FROM unnest(NEW.days_of_week) AS day 
    WHERE day < 0 OR day > 6
  ) THEN
    RAISE EXCEPTION 'days_of_week must contain values between 0 (Sunday) and 6 (Saturday)';
  END IF;
  
  -- Ensure at least one day is selected
  IF array_length(NEW.days_of_week, 1) IS NULL OR array_length(NEW.days_of_week, 1) = 0 THEN
    RAISE EXCEPTION 'At least one day must be selected for the shift';
  END IF;
  
  -- Ensure start_time is before end_time
  IF NEW.start_time >= NEW.end_time THEN
    RAISE EXCEPTION 'start_time must be before end_time';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for shift validation
DROP TRIGGER IF EXISTS trg_validate_shift_days ON shifts;
CREATE TRIGGER trg_validate_shift_days
  BEFORE INSERT OR UPDATE ON shifts
  FOR EACH ROW
  EXECUTE FUNCTION validate_shift_days();

-- Function to get combinable tables for a party size
CREATE OR REPLACE FUNCTION get_combinable_tables(
  p_location_id UUID,
  p_party_size INT
)
RETURNS TABLE (
  table_ids UUID[],
  total_seats INT,
  table_names TEXT
) AS $$
BEGIN
  -- First, try to find a single table that fits
  RETURN QUERY
  SELECT 
    ARRAY[t.id]::UUID[] AS table_ids,
    t.seats AS total_seats,
    t.name::TEXT AS table_names
  FROM tables t
  WHERE t.location_id = p_location_id
    AND t.is_active = true
    AND t.seats >= p_party_size
  ORDER BY t.seats ASC
  LIMIT 1;
  
  -- If no single table found and we have results, return
  IF FOUND THEN
    RETURN;
  END IF;
  
  -- Try to find combinable tables
  RETURN QUERY
  SELECT 
    array_agg(t.id ORDER BY t.seats DESC)::UUID[] AS table_ids,
    SUM(t.seats)::INT AS total_seats,
    string_agg(t.name, ' + ' ORDER BY t.seats DESC)::TEXT AS table_names
  FROM tables t
  WHERE t.location_id = p_location_id
    AND t.is_active = true
    AND t.is_combinable = true
    AND t.group_id IS NOT NULL
  GROUP BY t.group_id
  HAVING SUM(t.seats) >= p_party_size
  ORDER BY SUM(t.seats) ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_combinable_tables IS 
  'Finds the best table or combination of tables for a given party size';

-- Function to check table availability for a time slot
CREATE OR REPLACE FUNCTION is_table_available(
  p_table_id UUID,
  p_booking_date DATE,
  p_start_time TIME,
  p_duration_minutes INT,
  p_buffer_minutes INT DEFAULT 15,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_end_time TIME;
  v_booking_count INT;
BEGIN
  -- Calculate end time
  v_end_time := (p_start_time::INTERVAL + (p_duration_minutes || ' minutes')::INTERVAL)::TIME;
  
  -- Check for overlapping bookings
  SELECT COUNT(*) INTO v_booking_count
  FROM bookings
  WHERE table_id = p_table_id
    AND booking_date = p_booking_date
    AND status IN ('pending', 'confirmed', 'seated')
    AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id)
    AND (
      -- New booking overlaps with existing
      (booking_time, (booking_time::INTERVAL + (COALESCE(duration_minutes, 120) + p_buffer_minutes)::TEXT::INTERVAL)::TIME) 
      OVERLAPS 
      (p_start_time, v_end_time + (p_buffer_minutes || ' minutes')::INTERVAL)
    );
  
  RETURN v_booking_count = 0;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION is_table_available IS 
  'Checks if a table is available for a specific date and time, considering buffer time';

-- RLS Policies for new functionality
-- Tables are already covered by existing RLS, but ensure combinable tables can be queried

-- Shifts RLS - Managers can manage shifts for their locations
DROP POLICY IF EXISTS "Managers can manage shifts for their locations" ON shifts;
CREATE POLICY "Managers can manage shifts for their locations"
  ON shifts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM locations l
      JOIN memberships m ON m.tenant_id = l.tenant_id
      WHERE l.id = shifts.location_id
        AND m.user_id = auth.uid()
        AND m.role IN ('OWNER', 'MANAGER')
    )
  );

-- Public can view active shifts (for availability checking)
DROP POLICY IF EXISTS "Public can view active shifts" ON shifts;
CREATE POLICY "Public can view active shifts"
  ON shifts FOR SELECT
  USING (is_active = true);

-- Verify installation
DO $$
DECLARE
  v_tables_count INT;
  v_shifts_count INT;
  v_combinable_count INT;
BEGIN
  SELECT COUNT(*) INTO v_tables_count FROM tables;
  SELECT COUNT(*) INTO v_shifts_count FROM shifts;
  SELECT COUNT(*) INTO v_combinable_count FROM tables WHERE is_combinable = true;
  
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Enhanced Tables & Shifts Management';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Total Tables: %', v_tables_count;
  RAISE NOTICE 'Combinable Tables: %', v_combinable_count;
  RAISE NOTICE 'Total Shifts: %', v_shifts_count;
  RAISE NOTICE '====================================';
END $$;

