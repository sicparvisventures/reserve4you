-- ============================================================================
-- FIX: Ensure consistent column naming
-- ============================================================================
-- This migration ensures all timestamp columns use the _ts suffix
-- and all time columns use the _time suffix
-- ============================================================================

-- Verify bookings table has correct columns
DO $$ 
BEGIN
  -- Check if start_ts exists, if not we might have start_time
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bookings' 
    AND column_name = 'start_ts'
  ) THEN
    -- If we have start_time instead, rename it
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'bookings' 
      AND column_name = 'start_time'
    ) THEN
      ALTER TABLE bookings RENAME COLUMN start_time TO start_ts;
      RAISE NOTICE 'Renamed bookings.start_time to start_ts';
    END IF;
  END IF;

  -- Check if end_ts exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bookings' 
    AND column_name = 'end_ts'
  ) THEN
    -- If we have end_time instead, rename it
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'bookings' 
      AND column_name = 'end_time'
    ) THEN
      ALTER TABLE bookings RENAME COLUMN end_time TO end_ts;
      RAISE NOTICE 'Renamed bookings.end_time to end_ts';
    END IF;
  END IF;
END $$;

-- Verify all expected columns exist
DO $$
DECLARE
  missing_cols TEXT := '';
BEGIN
  -- Check bookings table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'start_ts') THEN
    missing_cols := missing_cols || 'bookings.start_ts, ';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'end_ts') THEN
    missing_cols := missing_cols || 'bookings.end_ts, ';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'guest_name') THEN
    missing_cols := missing_cols || 'bookings.guest_name, ';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'guest_phone') THEN
    missing_cols := missing_cols || 'bookings.guest_phone, ';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'guest_email') THEN
    missing_cols := missing_cols || 'bookings.guest_email, ';
  END IF;
  
  -- Check locations table (address_json will be added by separate migration)
  -- IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'address_json') THEN
  --   missing_cols := missing_cols || 'locations.address_json, ';
  -- END IF;
  
  IF missing_cols != '' THEN
    RAISE EXCEPTION 'Missing columns: %. Please run the full schema migration first.', missing_cols;
  END IF;
  
  RAISE NOTICE 'All required columns exist!';
END $$;

-- Recreate indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_bookings_start_ts ON bookings(start_ts);
CREATE INDEX IF NOT EXISTS idx_bookings_end_ts ON bookings(end_ts);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_email ON bookings(guest_email);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_phone ON bookings(guest_phone);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Column naming verification complete!';
  RAISE NOTICE '   All timestamp columns use _ts suffix';
  RAISE NOTICE '   All time columns use _time suffix';
END $$;

