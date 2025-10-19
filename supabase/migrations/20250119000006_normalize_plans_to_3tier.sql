-- =====================================================
-- Migration: Normalize Plans to 3-Tier System
-- =====================================================
-- Created: 2025-01-19
-- Purpose: Convert all old 6-tier plan names to new 3-tier
--          (START, PRO, PLUS) for consistency
-- =====================================================

-- 1. Log current state for rollback if needed
DO $$
BEGIN
  RAISE NOTICE 'Current plan distribution:';
  FOR rec IN 
    SELECT plan, COUNT(*) as count 
    FROM billing_state 
    GROUP BY plan 
    ORDER BY plan
  LOOP
    RAISE NOTICE '  % : % tenants', rec.plan, rec.count;
  END LOOP;
END $$;

-- 2. Normalize plan names
-- Mapping:
--   STARTER → START
--   GROWTH → PRO
--   BUSINESS, PREMIUM, ENTERPRISE → PLUS
--   FREE → stays FREE

UPDATE billing_state
SET 
  plan = CASE 
    WHEN plan = 'STARTER' THEN 'START'
    WHEN plan = 'GROWTH' THEN 'PRO'
    WHEN plan IN ('BUSINESS', 'PREMIUM', 'ENTERPRISE') THEN 'PLUS'
    ELSE plan  -- FREE stays FREE
  END,
  updated_at = NOW()
WHERE plan IN ('STARTER', 'GROWTH', 'BUSINESS', 'PREMIUM', 'ENTERPRISE');

-- 3. Ensure paid plans have ACTIVE status (for test mode)
UPDATE billing_state
SET 
  status = 'ACTIVE',
  updated_at = NOW()
WHERE 
  plan IN ('START', 'PRO', 'PLUS')
  AND status NOT IN ('ACTIVE', 'CANCELLED');

-- 4. Ensure FREE plans have appropriate status
UPDATE billing_state
SET 
  status = CASE 
    WHEN status = 'INACTIVE' THEN 'TRIALING'
    ELSE status
  END,
  updated_at = NOW()
WHERE 
  plan = 'FREE'
  AND status NOT IN ('ACTIVE', 'TRIALING', 'CANCELLED');

-- 5. Update check constraint to only allow valid plan names
ALTER TABLE billing_state
DROP CONSTRAINT IF EXISTS billing_state_plan_check;

ALTER TABLE billing_state
ADD CONSTRAINT billing_state_plan_check 
CHECK (plan IN ('FREE', 'START', 'PRO', 'PLUS'));

-- 6. Create function to validate quota limits
CREATE OR REPLACE FUNCTION check_location_quota(p_tenant_id UUID, p_plan TEXT)
RETURNS TABLE (
  allowed BOOLEAN,
  current_count INTEGER,
  max_count INTEGER,
  message TEXT
) AS $$
DECLARE
  v_location_count INTEGER;
  v_max_locations INTEGER;
BEGIN
  -- Get current location count
  SELECT COUNT(*) INTO v_location_count
  FROM locations
  WHERE tenant_id = p_tenant_id;

  -- Determine max locations based on plan
  v_max_locations := CASE 
    WHEN p_plan IN ('FREE', 'START') THEN 1
    WHEN p_plan = 'PRO' THEN 3
    WHEN p_plan = 'PLUS' THEN 999999  -- Effectively unlimited
    ELSE 1
  END;

  -- Return result
  RETURN QUERY SELECT
    (v_location_count < v_max_locations) AS allowed,
    v_location_count AS current_count,
    v_max_locations AS max_count,
    CASE 
      WHEN v_location_count >= v_max_locations THEN 
        'Location limit reached for ' || p_plan || ' plan. Upgrade required.'
      ELSE
        'Can add ' || (v_max_locations - v_location_count) || ' more location(s)'
    END AS message;
END;
$$ LANGUAGE plpgsql;

-- 7. Add index for better performance
CREATE INDEX IF NOT EXISTS idx_billing_state_plan_status 
ON billing_state(plan, status) WHERE status = 'ACTIVE';

-- 8. Add comment to table for documentation
COMMENT ON TABLE billing_state IS 'Stores billing and subscription information for tenants. Plans: FREE (trial), START (€49), PRO (€99), PLUS (€149).';

-- 9. Log results
DO $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_updated_count
  FROM billing_state
  WHERE updated_at > NOW() - INTERVAL '1 minute';
  
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Updated % billing_state records', v_updated_count;
  RAISE NOTICE '';
  RAISE NOTICE 'New plan distribution:';
  
  FOR rec IN 
    SELECT plan, COUNT(*) as count 
    FROM billing_state 
    GROUP BY plan 
    ORDER BY plan
  LOOP
    RAISE NOTICE '  % : % tenants', rec.plan, rec.count;
  END LOOP;
END $$;

-- =====================================================
-- Verification Queries (for manual check)
-- =====================================================

-- Check all billing states are normalized
-- SELECT 
--   t.name,
--   bs.plan,
--   bs.status,
--   (SELECT COUNT(*) FROM locations WHERE tenant_id = t.id) as location_count
-- FROM billing_state bs
-- JOIN tenants t ON t.id = bs.tenant_id
-- ORDER BY t.name;

-- Check quota violations
-- SELECT * FROM check_location_quota(
--   (SELECT id FROM tenants LIMIT 1),
--   (SELECT plan FROM billing_state WHERE tenant_id = (SELECT id FROM tenants LIMIT 1))
-- );

-- =====================================================
-- Rollback (if needed)
-- =====================================================
-- If you need to rollback this migration:
-- 
-- UPDATE billing_state
-- SET plan = CASE 
--   WHEN plan = 'START' THEN 'STARTER'
--   WHEN plan = 'PRO' THEN 'GROWTH'
--   WHEN plan = 'PLUS' THEN 'BUSINESS'
--   ELSE plan
-- END
-- WHERE plan IN ('START', 'PRO', 'PLUS');
-- =====================================================

