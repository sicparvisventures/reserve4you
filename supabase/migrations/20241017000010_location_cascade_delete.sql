-- ============================================================================
-- LOCATION CASCADE DELETE FUNCTION
-- ============================================================================
-- Safely delete a location and all associated data
-- Only callable by tenant OWNER or MANAGER
-- ============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS delete_location_cascade(UUID, UUID);

-- Create the cascade delete function
CREATE OR REPLACE FUNCTION delete_location_cascade(
  p_location_id UUID,
  p_requesting_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_is_authorized BOOLEAN;
  v_location_name VARCHAR;
  v_booking_count INT;
  v_table_count INT;
BEGIN
  -- Get location details and tenant_id
  SELECT tenant_id, name INTO v_tenant_id, v_location_name
  FROM public.locations 
  WHERE id = p_location_id;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Location % not found', p_location_id;
  END IF;

  -- Verify the requesting user is OWNER or MANAGER of the tenant
  SELECT EXISTS (
    SELECT 1 FROM public.memberships 
    WHERE tenant_id = v_tenant_id 
      AND user_id = p_requesting_user_id 
      AND role IN ('OWNER', 'MANAGER')
  ) INTO v_is_authorized;

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Only tenant owners and managers can delete locations';
  END IF;

  -- Log counts for audit trail
  SELECT COUNT(*) INTO v_booking_count 
  FROM public.bookings 
  WHERE location_id = p_location_id;

  SELECT COUNT(*) INTO v_table_count 
  FROM public.tables 
  WHERE location_id = p_location_id;

  RAISE NOTICE 'Deleting location "%" (%) with % bookings and % tables', 
    v_location_name, p_location_id, v_booking_count, v_table_count;

  -- Delete in correct order (respecting foreign keys)
  
  -- 1. Delete bookings (references location and tables)
  DELETE FROM public.bookings
  WHERE location_id = p_location_id;

  -- 2. Delete favorites (references location)
  DELETE FROM public.favorites
  WHERE location_id = p_location_id;

  -- 3. Delete policies (references location)
  DELETE FROM public.policies
  WHERE location_id = p_location_id;

  -- 4. Delete shifts (references location)
  DELETE FROM public.shifts
  WHERE location_id = p_location_id;

  -- 5. Delete tables (references location)
  DELETE FROM public.tables
  WHERE location_id = p_location_id;

  -- 6. Delete POS integrations (references location)
  DELETE FROM public.pos_integrations
  WHERE location_id = p_location_id;

  -- 7. Delete the location itself
  DELETE FROM public.locations
  WHERE id = p_location_id;

  RAISE NOTICE 'Location "%" deleted successfully', v_location_name;
  
  RETURN TRUE;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to delete location: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_location_cascade(UUID, UUID) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION delete_location_cascade IS 
  'Cascade delete a location and all associated data. Only callable by tenant OWNER or MANAGER.';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Location Cascade Delete Function Created';
  RAISE NOTICE '';
  RAISE NOTICE 'Usage:';
  RAISE NOTICE '  SELECT delete_location_cascade(';
  RAISE NOTICE '    ''location-id-here''::uuid,';
  RAISE NOTICE '    ''user-id-here''::uuid';
  RAISE NOTICE '  );';
  RAISE NOTICE '';
  RAISE NOTICE 'Security:';
  RAISE NOTICE '  - Only tenant OWNER or MANAGER can delete';
  RAISE NOTICE '  - Deletes ALL associated data (bookings, tables, shifts, etc.)';
  RAISE NOTICE '  - Cannot be undone';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

