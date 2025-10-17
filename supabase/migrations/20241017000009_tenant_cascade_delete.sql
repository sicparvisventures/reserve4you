-- ============================================================================
-- TENANT CASCADE DELETE FUNCTION
-- ============================================================================
-- Safely delete a tenant and all associated data
-- Only callable by tenant OWNER
-- ============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS delete_tenant_cascade(UUID, UUID);

-- Create the cascade delete function
CREATE OR REPLACE FUNCTION delete_tenant_cascade(
  p_tenant_id UUID,
  p_requesting_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_owner BOOLEAN;
  v_location_count INT;
  v_booking_count INT;
BEGIN
  -- Verify the requesting user is the OWNER of this tenant
  SELECT EXISTS (
    SELECT 1 FROM public.memberships 
    WHERE tenant_id = p_tenant_id 
      AND user_id = p_requesting_user_id 
      AND role = 'OWNER'
  ) INTO v_is_owner;

  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'Only tenant owners can delete tenants';
  END IF;

  -- Log counts for audit trail
  SELECT COUNT(*) INTO v_location_count FROM public.locations WHERE tenant_id = p_tenant_id;
  SELECT COUNT(*) INTO v_booking_count FROM public.bookings 
    WHERE location_id IN (SELECT id FROM public.locations WHERE tenant_id = p_tenant_id);

  RAISE NOTICE 'Deleting tenant % with % locations and % bookings', 
    p_tenant_id, v_location_count, v_booking_count;

  -- Delete in correct order (respecting foreign keys)
  -- 1. Delete bookings (references locations)
  DELETE FROM public.bookings
  WHERE location_id IN (SELECT id FROM public.locations WHERE tenant_id = p_tenant_id);

  -- 2. Delete favorites (references locations)
  DELETE FROM public.favorites
  WHERE location_id IN (SELECT id FROM public.locations WHERE tenant_id = p_tenant_id);

  -- 3. Delete policies (references locations)
  DELETE FROM public.policies
  WHERE location_id IN (SELECT id FROM public.locations WHERE tenant_id = p_tenant_id);

  -- 4. Delete shifts (references locations)
  DELETE FROM public.shifts
  WHERE location_id IN (SELECT id FROM public.locations WHERE tenant_id = p_tenant_id);

  -- 5. Delete tables (references locations)
  DELETE FROM public.tables
  WHERE location_id IN (SELECT id FROM public.locations WHERE tenant_id = p_tenant_id);

  -- 6. Delete POS integrations (references locations)
  DELETE FROM public.pos_integrations
  WHERE location_id IN (SELECT id FROM public.locations WHERE tenant_id = p_tenant_id);

  -- 7. Delete locations (references tenant)
  DELETE FROM public.locations
  WHERE tenant_id = p_tenant_id;

  -- 8. Delete billing state (references tenant)
  DELETE FROM public.billing_state
  WHERE tenant_id = p_tenant_id;

  -- 9. Delete memberships (references tenant)
  DELETE FROM public.memberships
  WHERE tenant_id = p_tenant_id;

  -- 10. Delete the tenant itself
  DELETE FROM public.tenants
  WHERE id = p_tenant_id;

  RAISE NOTICE 'Tenant % deleted successfully', p_tenant_id;
  
  RETURN TRUE;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to delete tenant: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_tenant_cascade(UUID, UUID) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION delete_tenant_cascade IS 
  'Cascade delete a tenant and all associated data. Only callable by tenant OWNER.';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tenant Cascade Delete Function Created';
  RAISE NOTICE '';
  RAISE NOTICE 'Usage:';
  RAISE NOTICE '  SELECT delete_tenant_cascade(';
  RAISE NOTICE '    ''tenant-id-here''::uuid,';
  RAISE NOTICE '    ''user-id-here''::uuid';
  RAISE NOTICE '  );';
  RAISE NOTICE '';
  RAISE NOTICE 'Security:';
  RAISE NOTICE '  - Only tenant OWNER can delete';
  RAISE NOTICE '  - Deletes ALL associated data';
  RAISE NOTICE '  - Cannot be undone';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

