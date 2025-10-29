-- ============================================================================
-- FIX: Complete Onboarding & Billing Fix
-- ============================================================================
-- This migration ensures:
-- 1. All tenants have billing_state with TRIALING status
-- 2. New tenants automatically get billing_state via trigger
-- 3. All accounts can create at least 1 location
-- ============================================================================

-- Step 1: Add missing billing plan enum values if they don't exist
DO $$
BEGIN
    -- Add FREE if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'billing_plan')
        AND enumlabel = 'FREE'
    ) THEN
        ALTER TYPE billing_plan ADD VALUE 'FREE';
        RAISE NOTICE '✅ Added FREE plan';
    END IF;

    -- Add STARTER if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'billing_plan')
        AND enumlabel = 'STARTER'
    ) THEN
        ALTER TYPE billing_plan ADD VALUE 'STARTER';
        RAISE NOTICE '✅ Added STARTER plan';
    END IF;

    -- Add GROWTH if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'billing_plan')
        AND enumlabel = 'GROWTH'
    ) THEN
        ALTER TYPE billing_plan ADD VALUE 'GROWTH';
        RAISE NOTICE '✅ Added GROWTH plan';
    END IF;

    -- Add BUSINESS if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'billing_plan')
        AND enumlabel = 'BUSINESS'
    ) THEN
        ALTER TYPE billing_plan ADD VALUE 'BUSINESS';
        RAISE NOTICE '✅ Added BUSINESS plan';
    END IF;

    -- Add PREMIUM if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'billing_plan')
        AND enumlabel = 'PREMIUM'
    ) THEN
        ALTER TYPE billing_plan ADD VALUE 'PREMIUM';
        RAISE NOTICE '✅ Added PREMIUM plan';
    END IF;

    -- Add ENTERPRISE if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'billing_plan')
        AND enumlabel = 'ENTERPRISE'
    ) THEN
        ALTER TYPE billing_plan ADD VALUE 'ENTERPRISE';
        RAISE NOTICE '✅ Added ENTERPRISE plan';
    END IF;
END $$;

-- Step 2: Create billing_state for ALL tenants that don't have one
-- This ensures both existing and potentially orphaned tenants have billing
INSERT INTO billing_state (
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
    'FREE' as plan,
    'TRIALING' as status,
    1 as max_locations,
    50 as max_bookings_per_month,
    0 as bookings_used_this_month,
    GREATEST(NOW() + INTERVAL '14 days', t.created_at + INTERVAL '30 days') as trial_end,
    NOW() as created_at,
    NOW() as updated_at
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM billing_state bs 
    WHERE bs.tenant_id = t.id
)
ON CONFLICT (tenant_id) DO NOTHING;

-- Step 3: Update any CANCELLED/PAST_DUE billing states to TRIALING
-- This helps accounts that got stuck
UPDATE billing_state
SET 
    status = 'TRIALING',
    trial_end = CASE 
        WHEN trial_end IS NULL OR trial_end < NOW() 
        THEN NOW() + INTERVAL '14 days'
        ELSE trial_end
    END,
    updated_at = NOW()
WHERE status::text IN ('CANCELLED', 'PAST_DUE');

-- Step 4: Create or replace trigger function to auto-create billing_state
CREATE OR REPLACE FUNCTION auto_create_billing_state()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Automatically create a FREE TRIALING billing state for new tenants
    INSERT INTO billing_state (
        tenant_id,
        plan,
        status,
        max_locations,
        max_bookings_per_month,
        bookings_used_this_month,
        trial_end,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        'FREE',
        'TRIALING',
        1, -- Allow 1 location
        50, -- Allow 50 bookings/month
        0,
        NOW() + INTERVAL '14 days', -- 14 day trial
        NOW(),
        NOW()
    )
    ON CONFLICT (tenant_id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- Step 5: Create trigger on tenants table
DROP TRIGGER IF EXISTS trigger_auto_create_billing_state ON tenants;
CREATE TRIGGER trigger_auto_create_billing_state
    AFTER INSERT ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_billing_state();

-- Step 6: Verify all tenants now have billing_state
DO $$
DECLARE
    v_tenants_without_billing INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_tenants_without_billing
    FROM tenants t
    WHERE NOT EXISTS (
        SELECT 1 FROM billing_state bs WHERE bs.tenant_id = t.id
    );
    
    IF v_tenants_without_billing > 0 THEN
        RAISE WARNING '⚠️  Still have % tenants without billing_state', v_tenants_without_billing;
    ELSE
        RAISE NOTICE '✅ All tenants have billing_state';
    END IF;
END $$;

-- Step 7: Create a helper function to check if user can create first location
-- This bypasses strict billing checks for the FIRST location only
CREATE OR REPLACE FUNCTION can_create_first_location(p_tenant_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_location_count INTEGER;
    v_billing_status TEXT;
BEGIN
    -- Check how many locations this tenant already has
    SELECT COUNT(*) INTO v_location_count
    FROM locations
    WHERE tenant_id = p_tenant_id;
    
    -- If they have 0 locations, always allow the first one
    IF v_location_count = 0 THEN
        RETURN TRUE;
    END IF;
    
    -- For additional locations, check billing status
    SELECT status INTO v_billing_status
    FROM billing_state
    WHERE tenant_id = p_tenant_id;
    
    -- Allow if ACTIVE or TRIALING
    RETURN v_billing_status IN ('ACTIVE', 'TRIALING');
END;
$$;

GRANT EXECUTE ON FUNCTION can_create_first_location(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_create_first_location(UUID) TO service_role;

-- Step 8: Show statistics and results
SELECT 
    '🎉 BILLING FIX COMPLETE!' as status,
    (SELECT COUNT(*) FROM tenants) as total_tenants,
    (SELECT COUNT(*) FROM billing_state) as tenants_with_billing,
    (SELECT COUNT(*) FROM billing_state WHERE status::text = 'TRIALING') as trialing_count,
    (SELECT COUNT(*) FROM billing_state WHERE status::text = 'ACTIVE') as active_count,
    (SELECT COUNT(*) FROM billing_state WHERE status::text IN ('CANCELLED', 'PAST_DUE')) as inactive_count,
    (SELECT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_auto_create_billing_state'
    )) as trigger_installed,
    (SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'can_create_first_location'
    )) as helper_function_exists;

-- Show summary of billing states
SELECT 
    t.name as tenant_name,
    bs.plan,
    bs.status,
    bs.max_locations,
    bs.max_bookings_per_month,
    bs.trial_end,
    CASE 
        WHEN bs.trial_end > NOW() THEN CONCAT(EXTRACT(DAY FROM bs.trial_end - NOW())::text, ' dagen trial')
        WHEN bs.trial_end < NOW() THEN 'Trial verlopen'
        ELSE 'Geen trial'
    END as trial_info,
    (SELECT COUNT(*) FROM locations WHERE tenant_id = t.id) as current_locations
FROM tenants t
JOIN billing_state bs ON bs.tenant_id = t.id
ORDER BY t.created_at DESC
LIMIT 20;

