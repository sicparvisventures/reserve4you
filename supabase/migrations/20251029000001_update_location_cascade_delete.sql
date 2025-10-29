-- ============================================================================
-- UPDATE LOCATION CASCADE DELETE FUNCTION
-- ============================================================================
-- Updates the location cascade delete function to support new multi-sector tables:
-- - resources (new generic resource table)
-- - service_offerings (new services/menu table) 
-- - recurring_booking_patterns (new recurring bookings table)
-- - intake_form_submissions (if exists)
-- - reviews and review_replies
-- - messages and conversations
-- - notification_preferences
-- - waitlist entries
-- - email_logs
-- - api_usage_logs
-- ============================================================================

-- Drop the old version
DROP FUNCTION IF EXISTS delete_location_cascade(UUID, UUID);

-- Create updated cascade delete function
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
  v_booking_count INT := 0;
  v_table_count INT := 0;
  v_resource_count INT := 0;
  v_service_count INT := 0;
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
  SELECT COUNT(*) INTO v_booking_count FROM public.bookings WHERE location_id = p_location_id;
  SELECT COUNT(*) INTO v_table_count FROM public.tables WHERE location_id = p_location_id;
  
  -- Count new tables (safe: ignore if they don't exist)
  BEGIN
    SELECT COUNT(*) INTO v_resource_count FROM public.resources WHERE location_id = p_location_id;
  EXCEPTION WHEN undefined_table THEN
    v_resource_count := 0;
  END;
  
  BEGIN
    SELECT COUNT(*) INTO v_service_count FROM public.service_offerings WHERE location_id = p_location_id;
  EXCEPTION WHEN undefined_table THEN
    v_service_count := 0;
  END;

  RAISE NOTICE 'Deleting location "%" (%) with % bookings, % tables, % resources, % services', 
    v_location_name, p_location_id, v_booking_count, v_table_count, v_resource_count, v_service_count;

  -- ========================================
  -- DELETE IN CORRECT ORDER (respecting foreign keys)
  -- ========================================

  -- 1. Delete API usage logs (if table exists)
  BEGIN
    DELETE FROM public.api_usage_logs WHERE location_id = p_location_id;
  EXCEPTION WHEN undefined_table THEN
    NULL; -- Table doesn't exist, skip
  END;

  -- 2. Delete email logs (if table exists)
  BEGIN
    DELETE FROM public.email_logs WHERE location_id = p_location_id;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;

  -- 3. Delete waitlist entries
  BEGIN
    DELETE FROM public.waitlist WHERE location_id = p_location_id;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;

  -- 4. Delete notification preferences
  BEGIN
    DELETE FROM public.notification_preferences WHERE location_id = p_location_id;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;

  -- 5. Delete review replies (must be before reviews)
  BEGIN
    DELETE FROM public.review_replies
    WHERE review_id IN (SELECT id FROM public.reviews WHERE location_id = p_location_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;

  -- 6. Delete reviews
  BEGIN
    DELETE FROM public.reviews WHERE location_id = p_location_id;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;

  -- 7. Delete messages (conversations will cascade)
  BEGIN
    DELETE FROM public.messages WHERE location_id = p_location_id;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;

  -- 8. Delete conversations
  BEGIN
    DELETE FROM public.conversations WHERE location_id = p_location_id;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;

  -- 9. Delete intake form submissions (if table exists)
  BEGIN
    DELETE FROM public.intake_form_submissions WHERE booking_id IN (
      SELECT id FROM public.bookings WHERE location_id = p_location_id
    );
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;

  -- 10. Delete recurring booking patterns (must be before bookings)
  BEGIN
    DELETE FROM public.recurring_booking_patterns WHERE location_id = p_location_id;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;

  -- 11. Delete bookings (critical: must be before tables and resources)
  DELETE FROM public.bookings WHERE location_id = p_location_id;

  -- 12. Delete favorites (references location)
  DELETE FROM public.favorites WHERE location_id = p_location_id;

  -- 13. Delete service offerings (must be before resources, as services can reference staff)
  BEGIN
    DELETE FROM public.service_offerings WHERE location_id = p_location_id;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;

  -- 14. Delete resources (new generic resource table)
  BEGIN
    DELETE FROM public.resources WHERE location_id = p_location_id;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;

  -- 15. Delete tables (old restaurant-specific table)
  DELETE FROM public.tables WHERE location_id = p_location_id;

  -- 16. Delete shifts (references location)
  DELETE FROM public.shifts WHERE location_id = p_location_id;

  -- 17. Delete policies (references location)
  DELETE FROM public.policies WHERE location_id = p_location_id;

  -- 18. Delete POS integrations (references location)
  BEGIN
    DELETE FROM public.pos_integrations WHERE location_id = p_location_id;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;

  -- 19. Finally, delete the location itself
  DELETE FROM public.locations WHERE id = p_location_id;

  RAISE NOTICE 'Location "%" deleted successfully with all associated data', v_location_name;
  
  RETURN TRUE;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to delete location: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN FALSE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_location_cascade(UUID, UUID) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION delete_location_cascade IS 
  'Cascade delete a location and all associated data (updated for multi-sector support). Only callable by tenant OWNER or MANAGER.';

-- Verification message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================================';
  RAISE NOTICE '✅ Location Cascade Delete Function Updated (Multi-Sector)';
  RAISE NOTICE '================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'NEW: Now safely deletes these additional tables:';
  RAISE NOTICE '  ✅ resources (generic resource table)';
  RAISE NOTICE '  ✅ service_offerings (services/menu items)';
  RAISE NOTICE '  ✅ recurring_booking_patterns (recurring appointments)';
  RAISE NOTICE '  ✅ intake_form_submissions (forms)';
  RAISE NOTICE '  ✅ reviews & review_replies';
  RAISE NOTICE '  ✅ messages & conversations';
  RAISE NOTICE '  ✅ notification_preferences';
  RAISE NOTICE '  ✅ waitlist entries';
  RAISE NOTICE '  ✅ email_logs & api_usage_logs';
  RAISE NOTICE '';
  RAISE NOTICE 'ORIGINAL: Still deletes these tables:';
  RAISE NOTICE '  ✅ bookings';
  RAISE NOTICE '  ✅ tables';
  RAISE NOTICE '  ✅ shifts';
  RAISE NOTICE '  ✅ policies';
  RAISE NOTICE '  ✅ favorites';
  RAISE NOTICE '  ✅ pos_integrations';
  RAISE NOTICE '';
  RAISE NOTICE 'Usage:';
  RAISE NOTICE '  SELECT delete_location_cascade(';
  RAISE NOTICE '    ''location-id-here''::uuid,';
  RAISE NOTICE '    ''user-id-here''::uuid';
  RAISE NOTICE '  );';
  RAISE NOTICE '';
  RAISE NOTICE 'Security:';
  RAISE NOTICE '  - Only tenant OWNER or MANAGER can delete';
  RAISE NOTICE '  - Deletes ALL associated data (cannot be undone)';
  RAISE NOTICE '  - Safe: Handles missing tables gracefully';
  RAISE NOTICE '================================================================';
  RAISE NOTICE '';
END $$;

