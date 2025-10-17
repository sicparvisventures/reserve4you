-- ============================================================================
-- R4Y SCHEMA VERIFICATION SCRIPT
-- ============================================================================
-- Run this to check if your database schema is correctly set up
-- This won't make any changes, just reports what's missing or wrong
-- ============================================================================

DO $$
DECLARE
  table_count INT;
  type_count INT;
  function_count INT;
  policy_count INT;
  missing_items TEXT := '';
BEGIN
  RAISE NOTICE '🔍 Starting R4Y Schema Verification...';
  RAISE NOTICE '';
  
  -- ============================================================================
  -- CHECK TABLES
  -- ============================================================================
  RAISE NOTICE '📊 Checking Tables...';
  
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'tenants', 'memberships', 'locations', 'tables', 'shifts',
    'policies', 'consumers', 'bookings', 'billing_state',
    'pos_integrations', 'favorites'
  );
  
  RAISE NOTICE '   Found % out of 11 required tables', table_count;
  
  IF table_count < 11 THEN
    SELECT string_agg(missing_table, ', ')
    INTO missing_items
    FROM (
      SELECT unnest(ARRAY[
        'tenants', 'memberships', 'locations', 'tables', 'shifts',
        'policies', 'consumers', 'bookings', 'billing_state',
        'pos_integrations', 'favorites'
      ]) AS missing_table
      EXCEPT
      SELECT table_name::text
      FROM information_schema.tables
      WHERE table_schema = 'public'
    ) AS missing;
    
    RAISE WARNING '   ❌ Missing tables: %', missing_items;
  ELSE
    RAISE NOTICE '   ✅ All tables present';
  END IF;
  
  -- ============================================================================
  -- CHECK TYPES
  -- ============================================================================
  RAISE NOTICE '';
  RAISE NOTICE '🏷️  Checking Custom Types...';
  
  SELECT COUNT(*) INTO type_count
  FROM pg_type
  WHERE typname IN (
    'membership_role', 'booking_status', 'payment_status',
    'billing_plan', 'billing_status', 'pos_vendor'
  );
  
  RAISE NOTICE '   Found % out of 6 required types', type_count;
  
  IF type_count < 6 THEN
    SELECT string_agg(missing_type, ', ')
    INTO missing_items
    FROM (
      SELECT unnest(ARRAY[
        'membership_role', 'booking_status', 'payment_status',
        'billing_plan', 'billing_status', 'pos_vendor'
      ]) AS missing_type
      EXCEPT
      SELECT typname::text FROM pg_type
    ) AS missing;
    
    RAISE WARNING '   ❌ Missing types: %', missing_items;
  ELSE
    RAISE NOTICE '   ✅ All types present';
  END IF;
  
  -- ============================================================================
  -- CHECK CRITICAL COLUMNS
  -- ============================================================================
  RAISE NOTICE '';
  RAISE NOTICE '📋 Checking Critical Columns...';
  
  -- bookings.start_ts
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'start_ts') THEN
    RAISE NOTICE '   ✅ bookings.start_ts exists';
  ELSE
    RAISE WARNING '   ❌ bookings.start_ts MISSING';
  END IF;
  
  -- bookings.end_ts
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'end_ts') THEN
    RAISE NOTICE '   ✅ bookings.end_ts exists';
  ELSE
    RAISE WARNING '   ❌ bookings.end_ts MISSING';
  END IF;
  
  -- bookings.guest_name
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'guest_name') THEN
    RAISE NOTICE '   ✅ bookings.guest_name exists';
  ELSE
    RAISE WARNING '   ❌ bookings.guest_name MISSING';
  END IF;
  
  -- locations.address_json
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'address_json') THEN
    RAISE NOTICE '   ✅ locations.address_json exists';
  ELSE
    RAISE WARNING '   ❌ locations.address_json MISSING';
  END IF;
  
  -- shifts.start_time (should be TIME, not TIMESTAMPTZ)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shifts' 
    AND column_name = 'start_time'
    AND data_type = 'time without time zone'
  ) THEN
    RAISE NOTICE '   ✅ shifts.start_time exists (TIME type)';
  ELSE
    RAISE WARNING '   ❌ shifts.start_time MISSING or wrong type';
  END IF;
  
  -- ============================================================================
  -- CHECK FUNCTIONS
  -- ============================================================================
  RAISE NOTICE '';
  RAISE NOTICE '⚙️  Checking Helper Functions...';
  
  SELECT COUNT(*) INTO function_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proname IN (
    'is_tenant_member',
    'get_location_tenant',
    'is_billing_active',
    'update_updated_at_column'
  );
  
  RAISE NOTICE '   Found % out of 4 required functions', function_count;
  
  IF function_count < 4 THEN
    RAISE WARNING '   ⚠️  Some functions missing - RLS may not work correctly';
  ELSE
    RAISE NOTICE '   ✅ All functions present';
  END IF;
  
  -- ============================================================================
  -- CHECK RLS
  -- ============================================================================
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Checking Row Level Security...';
  
  SELECT COUNT(*) INTO policy_count
  FROM pg_class
  WHERE relname IN (
    'tenants', 'memberships', 'locations', 'tables', 'shifts',
    'policies', 'consumers', 'bookings', 'billing_state',
    'pos_integrations', 'favorites'
  )
  AND relrowsecurity = true;
  
  RAISE NOTICE '   % out of 11 tables have RLS enabled', policy_count;
  
  IF policy_count < 11 THEN
    RAISE WARNING '   ⚠️  Some tables do not have RLS enabled!';
  ELSE
    RAISE NOTICE '   ✅ RLS enabled on all tables';
  END IF;
  
  -- ============================================================================
  -- FINAL VERDICT
  -- ============================================================================
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  
  IF table_count = 11 AND type_count = 6 AND function_count = 4 AND policy_count = 11 THEN
    RAISE NOTICE '🎉 SUCCESS! Your database schema is correctly configured!';
  ELSE
    RAISE NOTICE '⚠️  INCOMPLETE: Some components are missing';
    RAISE NOTICE 'Run the safe migration: 20241017000002_r4y_multi_tenant_schema_safe.sql';
  END IF;
  
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

