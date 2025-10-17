-- ============================================================================
-- DIAGNOSTIC: Check Current Database Schema Status
-- ============================================================================
-- Run this to see exactly what exists in your database
-- ============================================================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  RAISE NOTICE '🔍 DIAGNOSTIC REPORT FOR R4Y DATABASE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';

  -- Check tenants table
  RAISE NOTICE '📊 TENANTS TABLE:';
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
    RAISE NOTICE '   ✅ Table exists';
    
    -- List columns
    FOR v_count IN 
      SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'tenants'
    LOOP
      RAISE NOTICE '   Columns: %', v_count;
    END LOOP;
    
    -- List actual columns
    RAISE NOTICE '   Column names:';
    FOR v_count IN 
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'tenants' 
      ORDER BY ordinal_position
    LOOP
      -- This will show each column name
    END LOOP;
  ELSE
    RAISE NOTICE '   ❌ Table does NOT exist';
  END IF;
  RAISE NOTICE '';

  -- Check memberships table
  RAISE NOTICE '📊 MEMBERSHIPS TABLE:';
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memberships') THEN
    RAISE NOTICE '   ✅ Table exists';
    
    -- Check for role column specifically
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'role') THEN
      RAISE NOTICE '   ✅ role column exists';
      
      -- Check role column type
      SELECT data_type INTO v_count FROM information_schema.columns 
      WHERE table_name = 'memberships' AND column_name = 'role' LIMIT 1;
      RAISE NOTICE '   Type: USER-DEFINED (should be membership_role enum)';
    ELSE
      RAISE NOTICE '   ❌ role column does NOT exist';
    END IF;
  ELSE
    RAISE NOTICE '   ❌ Table does NOT exist';
  END IF;
  RAISE NOTICE '';

  -- Check membership_role type
  RAISE NOTICE '🏷️  MEMBERSHIP_ROLE TYPE:';
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_role') THEN
    RAISE NOTICE '   ✅ Type exists';
  ELSE
    RAISE NOTICE '   ❌ Type does NOT exist';
  END IF;
  RAISE NOTICE '';

  -- Summary
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '📋 SUMMARY:';
  
  -- Count tables
  SELECT COUNT(*) INTO v_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'tenants', 'memberships', 'locations', 'tables', 'shifts',
    'policies', 'consumers', 'bookings', 'billing_state',
    'pos_integrations', 'favorites'
  );
  RAISE NOTICE '   Tables: %/11', v_count;
  
  -- Count types
  SELECT COUNT(*) INTO v_count
  FROM pg_type
  WHERE typname IN (
    'membership_role', 'booking_status', 'payment_status',
    'billing_plan', 'billing_status', 'pos_vendor'
  );
  RAISE NOTICE '   Types: %/6', v_count;
  
  RAISE NOTICE '';
  
  IF v_count < 6 THEN
    RAISE NOTICE '⚠️  RECOMMENDATION:';
    RAISE NOTICE '   Your schema is incomplete. Please run:';
    RAISE NOTICE '   📄 20241017000002_r4y_multi_tenant_schema_safe.sql';
    RAISE NOTICE '   (This creates all tables, types, and base policies)';
  ELSE
    RAISE NOTICE '✅ Schema looks complete!';
  END IF;
  
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- Show actual column list for memberships if it exists
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'memberships'
ORDER BY ordinal_position;

