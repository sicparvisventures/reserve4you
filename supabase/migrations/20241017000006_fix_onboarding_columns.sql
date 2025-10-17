-- ============================================================================
-- FIX ONBOARDING: Add/Rename Columns for Onboarding Steps 2-8
-- ============================================================================
-- This migration fixes column name mismatches between the database schema
-- and the API expectations for the onboarding flow.
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '🔧 Fixing Onboarding Columns...';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 1: Fix LOCATIONS table
-- ============================================================================

-- Rename opening_hours to opening_hours_json (if exists and target doesn't exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'opening_hours'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'opening_hours_json'
  ) THEN
    ALTER TABLE locations RENAME COLUMN opening_hours TO opening_hours_json;
    RAISE NOTICE '✅ Renamed locations.opening_hours → opening_hours_json';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'opening_hours_json'
  ) THEN
    RAISE NOTICE '⏭️  locations.opening_hours_json already exists';
    -- If both exist, drop the old one
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'locations' AND column_name = 'opening_hours'
    ) THEN
      ALTER TABLE locations DROP COLUMN opening_hours;
      RAISE NOTICE '🗑️  Dropped duplicate locations.opening_hours column';
    END IF;
  ELSE
    RAISE NOTICE '⏭️  locations.opening_hours already renamed or doesn''t exist';
  END IF;
END $$;

-- Rename cuisine_type to cuisine (if exists and target doesn't exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'cuisine_type'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'cuisine'
  ) THEN
    ALTER TABLE locations RENAME COLUMN cuisine_type TO cuisine;
    RAISE NOTICE '✅ Renamed locations.cuisine_type → cuisine';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'cuisine'
  ) THEN
    RAISE NOTICE '⏭️  locations.cuisine already exists';
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'locations' AND column_name = 'cuisine_type'
    ) THEN
      ALTER TABLE locations DROP COLUMN cuisine_type;
      RAISE NOTICE '🗑️  Dropped duplicate locations.cuisine_type column';
    END IF;
  ELSE
    RAISE NOTICE '⏭️  locations.cuisine_type already renamed or doesn''t exist';
  END IF;
END $$;

-- Add slot_minutes if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'slot_minutes'
  ) THEN
    ALTER TABLE locations ADD COLUMN slot_minutes INT NOT NULL DEFAULT 90;
    RAISE NOTICE '✅ Added locations.slot_minutes (default 90)';
  ELSE
    RAISE NOTICE '⏭️  locations.slot_minutes already exists';
  END IF;
END $$;

-- Add buffer_minutes if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'buffer_minutes'
  ) THEN
    ALTER TABLE locations ADD COLUMN buffer_minutes INT NOT NULL DEFAULT 15;
    RAISE NOTICE '✅ Added locations.buffer_minutes (default 15)';
  ELSE
    RAISE NOTICE '⏭️  locations.buffer_minutes already exists';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Fix TABLES table (rename combinable to is_combinable if needed)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tables' AND column_name = 'combinable'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tables' AND column_name = 'is_combinable'
  ) THEN
    ALTER TABLE tables RENAME COLUMN combinable TO is_combinable;
    RAISE NOTICE '✅ Renamed tables.combinable → is_combinable';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tables' AND column_name = 'is_combinable'
  ) THEN
    RAISE NOTICE '⏭️  tables.is_combinable already exists';
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'tables' AND column_name = 'combinable'
    ) THEN
      ALTER TABLE tables DROP COLUMN combinable;
      RAISE NOTICE '🗑️  Dropped duplicate tables.combinable column';
    END IF;
  ELSE
    RAISE NOTICE '⏭️  tables.is_combinable already correct';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Fix SHIFTS table (rename columns for API compatibility)
-- ============================================================================

-- Rename day_of_week to days_of_week (if needed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shifts' AND column_name = 'day_of_week'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shifts' AND column_name = 'days_of_week'
  ) THEN
    ALTER TABLE shifts RENAME COLUMN day_of_week TO days_of_week;
    RAISE NOTICE '✅ Renamed shifts.day_of_week → days_of_week';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shifts' AND column_name = 'days_of_week'
  ) THEN
    RAISE NOTICE '⏭️  shifts.days_of_week already exists';
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'shifts' AND column_name = 'day_of_week'
    ) THEN
      ALTER TABLE shifts DROP COLUMN day_of_week;
      RAISE NOTICE '🗑️  Dropped duplicate shifts.day_of_week column';
    END IF;
  ELSE
    RAISE NOTICE '⏭️  shifts.days_of_week already correct';
  END IF;
END $$;

-- Rename slot_duration_minutes to slot_minutes (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shifts' AND column_name = 'slot_duration_minutes'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shifts' AND column_name = 'slot_minutes'
  ) THEN
    ALTER TABLE shifts RENAME COLUMN slot_duration_minutes TO slot_minutes;
    RAISE NOTICE '✅ Renamed shifts.slot_duration_minutes → slot_minutes';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shifts' AND column_name = 'slot_minutes'
  ) THEN
    RAISE NOTICE '⏭️  shifts.slot_minutes already exists';
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'shifts' AND column_name = 'slot_duration_minutes'
    ) THEN
      ALTER TABLE shifts DROP COLUMN slot_duration_minutes;
      RAISE NOTICE '🗑️  Dropped duplicate shifts.slot_duration_minutes column';
    END IF;
  ELSE
    RAISE NOTICE '⏭️  shifts.slot_minutes already correct';
  END IF;
END $$;

-- Rename max_concurrent_bookings to max_parallel (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shifts' AND column_name = 'max_concurrent_bookings'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shifts' AND column_name = 'max_parallel'
  ) THEN
    ALTER TABLE shifts RENAME COLUMN max_concurrent_bookings TO max_parallel;
    RAISE NOTICE '✅ Renamed shifts.max_concurrent_bookings → max_parallel';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shifts' AND column_name = 'max_parallel'
  ) THEN
    RAISE NOTICE '⏭️  shifts.max_parallel already exists';
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'shifts' AND column_name = 'max_concurrent_bookings'
    ) THEN
      ALTER TABLE shifts DROP COLUMN max_concurrent_bookings;
      RAISE NOTICE '🗑️  Dropped duplicate shifts.max_concurrent_bookings column';
    END IF;
  ELSE
    RAISE NOTICE '⏭️  shifts.max_parallel already correct';
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Fix POLICIES table (column name consistency)
-- ============================================================================

-- Rename cancellation_hours to cancellation_hours_before (if needed - actually keep as is)
-- The API expects cancellationHours which maps to cancellation_hours, so this is OK

-- Add no_show_fee_enabled if it doesn't exist (already exists, just verify)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'policies' AND column_name = 'no_show_fee_enabled'
  ) THEN
    ALTER TABLE policies ADD COLUMN no_show_fee_enabled BOOLEAN NOT NULL DEFAULT false;
    RAISE NOTICE '✅ Added policies.no_show_fee_enabled';
  ELSE
    RAISE NOTICE '⏭️  policies.no_show_fee_enabled already exists';
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Verify all critical columns exist
-- ============================================================================

DO $$
DECLARE
  v_missing_columns TEXT[] := '{}';
BEGIN
  -- Check locations
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'opening_hours_json') THEN
    v_missing_columns := array_append(v_missing_columns, 'locations.opening_hours_json');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'cuisine') THEN
    v_missing_columns := array_append(v_missing_columns, 'locations.cuisine');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'slot_minutes') THEN
    v_missing_columns := array_append(v_missing_columns, 'locations.slot_minutes');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'buffer_minutes') THEN
    v_missing_columns := array_append(v_missing_columns, 'locations.buffer_minutes');
  END IF;
  
  -- Check tables
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tables' AND column_name = 'is_combinable') THEN
    v_missing_columns := array_append(v_missing_columns, 'tables.is_combinable');
  END IF;
  
  -- Check shifts
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shifts' AND column_name = 'days_of_week') THEN
    v_missing_columns := array_append(v_missing_columns, 'shifts.days_of_week');
  END IF;
  
  IF array_length(v_missing_columns, 1) > 0 THEN
    RAISE EXCEPTION 'Missing critical columns: %', array_to_string(v_missing_columns, ', ');
  END IF;
  
  RAISE NOTICE '✅ All critical columns verified!';
END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '🎉 Onboarding Columns Fix Complete!';
  RAISE NOTICE '';
  RAISE NOTICE '✅ locations.opening_hours_json';
  RAISE NOTICE '✅ locations.cuisine';
  RAISE NOTICE '✅ locations.slot_minutes';
  RAISE NOTICE '✅ locations.buffer_minutes';
  RAISE NOTICE '✅ tables.is_combinable';
  RAISE NOTICE '✅ shifts.days_of_week';
  RAISE NOTICE '✅ shifts.slot_minutes';
  RAISE NOTICE '✅ shifts.max_parallel';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Now test onboarding at:';
  RAISE NOTICE '   http://localhost:3007/manager/onboarding?step=1';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

