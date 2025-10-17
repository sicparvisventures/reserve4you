-- ============================================================================
-- ADD NEW BILLING TIERS: 6-Tier System
-- ============================================================================
-- Adds FREE, STARTER, GROWTH, BUSINESS, PREMIUM, ENTERPRISE tiers
-- Replaces old START, PRO, PLUS with new 6-tier structure
-- ============================================================================

-- Step 1: Add new enum values to billing_plan
ALTER TYPE billing_plan ADD VALUE IF NOT EXISTS 'FREE';
ALTER TYPE billing_plan ADD VALUE IF NOT EXISTS 'STARTER';
ALTER TYPE billing_plan ADD VALUE IF NOT EXISTS 'GROWTH';
ALTER TYPE billing_plan ADD VALUE IF NOT EXISTS 'BUSINESS';
ALTER TYPE billing_plan ADD VALUE IF NOT EXISTS 'PREMIUM';
ALTER TYPE billing_plan ADD VALUE IF NOT EXISTS 'ENTERPRISE';

-- Step 2: Update existing billing_state records to new tiers (migration)
-- Map old tiers to new tiers
UPDATE public.billing_state
SET plan = CASE 
  WHEN plan = 'START' THEN 'STARTER'::billing_plan
  WHEN plan = 'PRO' THEN 'GROWTH'::billing_plan
  WHEN plan = 'PLUS' THEN 'PREMIUM'::billing_plan
  ELSE plan
END
WHERE plan IN ('START', 'PRO', 'PLUS');

-- Step 3: Update quotas for new tier structure
UPDATE public.billing_state
SET 
  max_locations = CASE plan
    WHEN 'FREE' THEN 1
    WHEN 'STARTER' THEN 1
    WHEN 'GROWTH' THEN 3
    WHEN 'BUSINESS' THEN 5
    WHEN 'PREMIUM' THEN 999999  -- Virtually unlimited
    WHEN 'ENTERPRISE' THEN 999999
    ELSE max_locations
  END,
  max_bookings_per_month = CASE plan
    WHEN 'FREE' THEN 50
    WHEN 'STARTER' THEN 200
    WHEN 'GROWTH' THEN 1000
    WHEN 'BUSINESS' THEN 3000
    WHEN 'PREMIUM' THEN 999999  -- Virtually unlimited
    WHEN 'ENTERPRISE' THEN 999999
    ELSE max_bookings_per_month
  END;

-- Step 4: Verify the migration
SELECT 
  plan,
  COUNT(*) as tenant_count,
  max_locations,
  max_bookings_per_month
FROM public.billing_state
GROUP BY plan, max_locations, max_bookings_per_month
ORDER BY 
  CASE plan
    WHEN 'FREE' THEN 1
    WHEN 'STARTER' THEN 2
    WHEN 'GROWTH' THEN 3
    WHEN 'BUSINESS' THEN 4
    WHEN 'PREMIUM' THEN 5
    WHEN 'ENTERPRISE' THEN 6
    ELSE 99
  END;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '🎉 New 6-Tier Billing System Activated!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Available Tiers:';
  RAISE NOTICE '   1. FREE       - €0    - 1 loc,  50 bookings/month';
  RAISE NOTICE '   2. STARTER    - €29   - 1 loc,  200 bookings/month';
  RAISE NOTICE '   3. GROWTH     - €79   - 3 locs, 1000 bookings/month';
  RAISE NOTICE '   4. BUSINESS   - €149  - 5 locs, 3000 bookings/month';
  RAISE NOTICE '   5. PREMIUM    - €299  - ∞ locs, ∞ bookings/month';
  RAISE NOTICE '   6. ENTERPRISE - Custom - ∞ everything + SLA';
  RAISE NOTICE '';
  RAISE NOTICE '✅ All existing subscriptions migrated to new tiers';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

