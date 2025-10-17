-- ============================================================================
-- COMPLETE RESET - RUN THIS FIRST IF YOU HAVE ERRORS
-- ============================================================================
-- This script completely removes all R4Y tables and starts fresh
-- ⚠️ WARNING: THIS DELETES ALL DATA!
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '⚠️  RESETTING R4Y DATABASE';
  RAISE NOTICE '   This will DELETE ALL R4Y data!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 1: Drop all RLS policies
-- ============================================================================

DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
    AND tablename IN (
      'tenants', 'memberships', 'locations', 'tables', 'shifts',
      'policies', 'consumers', 'bookings', 'billing_state',
      'pos_integrations', 'favorites'
    )
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
  RAISE NOTICE '✅ Dropped all RLS policies';
END $$;

-- ============================================================================
-- STEP 2: Drop all triggers
-- ============================================================================

DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
DROP TRIGGER IF EXISTS update_memberships_updated_at ON memberships;
DROP TRIGGER IF EXISTS update_locations_updated_at ON locations;
DROP TRIGGER IF EXISTS update_tables_updated_at ON tables;
DROP TRIGGER IF EXISTS update_shifts_updated_at ON shifts;
DROP TRIGGER IF EXISTS update_policies_updated_at ON policies;
DROP TRIGGER IF EXISTS update_consumers_updated_at ON consumers;
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
DROP TRIGGER IF EXISTS update_billing_state_updated_at ON billing_state;
DROP TRIGGER IF EXISTS update_pos_integrations_updated_at ON pos_integrations;

-- ============================================================================
-- STEP 3: Drop all tables (in correct order due to foreign keys)
-- ============================================================================

DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS pos_integrations CASCADE;
DROP TABLE IF EXISTS billing_state CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS consumers CASCADE;
DROP TABLE IF EXISTS policies CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS tables CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS memberships CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- ============================================================================
-- STEP 4: Drop all types
-- ============================================================================

DROP TYPE IF EXISTS membership_role CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS billing_plan CASCADE;
DROP TYPE IF EXISTS billing_status CASCADE;
DROP TYPE IF EXISTS pos_vendor CASCADE;

-- ============================================================================
-- STEP 5: Drop all functions
-- ============================================================================

DROP FUNCTION IF EXISTS is_tenant_member(UUID, UUID, membership_role);
DROP FUNCTION IF EXISTS is_tenant_member(UUID, UUID);
DROP FUNCTION IF EXISTS get_location_tenant(UUID);
DROP FUNCTION IF EXISTS is_billing_active(UUID);
DROP FUNCTION IF EXISTS create_tenant_with_membership(VARCHAR, VARCHAR, UUID);

-- Keep update_updated_at_column as it's used by the original template
-- DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ R4Y Database Reset Complete!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Next Steps:';
  RAISE NOTICE '   1. Run: 20241017000002_r4y_multi_tenant_schema_safe.sql';
  RAISE NOTICE '   2. Run: 20241017000004_migrate_address_to_json.sql';
  RAISE NOTICE '   3. Run: 20241017000005_fix_tenant_creation_rls_v2.sql';
  RAISE NOTICE '   4. Run: verify_schema.sql';
  RAISE NOTICE '';
  RAISE NOTICE '   Skip: 20241017000003_fix_column_names.sql (not needed)';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

