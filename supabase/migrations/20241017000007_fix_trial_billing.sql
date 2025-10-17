-- ============================================================================
-- FIX: Add Trial Billing State for Existing Tenants
-- ============================================================================
-- This fixes the "Active subscription required" error during onboarding
-- by creating a TRIALING billing state for tenants without one
-- ============================================================================

-- Create trial billing state for tenants that don't have one yet
INSERT INTO public.billing_state (
  tenant_id,
  plan,
  status,
  max_locations,
  max_bookings_per_month,
  bookings_used_this_month,
  trial_end,
  created_at,
  updated_at
)
SELECT 
  t.id as tenant_id,
  'START' as plan,
  'TRIALING' as status,
  1 as max_locations,
  200 as max_bookings_per_month,
  0 as bookings_used_this_month,
  NOW() + INTERVAL '14 days' as trial_end,
  NOW() as created_at,
  NOW() as updated_at
FROM public.tenants t
LEFT JOIN public.billing_state bs ON bs.tenant_id = t.id
WHERE bs.tenant_id IS NULL;  -- Only for tenants without billing state

-- Verify the results
SELECT 
  t.name as tenant_name,
  bs.plan,
  bs.status,
  bs.max_locations,
  bs.trial_end,
  bs.created_at
FROM public.tenants t
LEFT JOIN public.billing_state bs ON bs.tenant_id = t.id
ORDER BY t.created_at DESC;

-- Success message
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.billing_state
  WHERE status = 'TRIALING';
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ Trial Billing States Created!';
  RAISE NOTICE '   Total TRIALING tenants: %', v_count;
  RAISE NOTICE '   Trial period: 14 days from now';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Tenants can now:';
  RAISE NOTICE '   ✓ Create locations during onboarding';
  RAISE NOTICE '   ✓ Complete onboarding flow';
  RAISE NOTICE '   ✓ Subscribe later (step 6)';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

