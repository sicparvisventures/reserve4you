-- =====================================================
-- Migration: Fix Billing State and Quotas
-- =====================================================
-- Created: 2025-01-19
-- Purpose: Ensure billing states are correct after upgrades
--          and normalize plan names for consistency
-- =====================================================

-- 1. Normalize plan names to match PLAN_LIMITS in code
UPDATE billing_state
SET 
  plan = CASE 
    WHEN plan = 'STARTER' THEN 'START'
    WHEN plan = 'GROWTH' THEN 'PRO'
    WHEN plan = 'BUSINESS' THEN 'PLUS'
    WHEN plan = 'PREMIUM' THEN 'PLUS'
    ELSE plan
  END,
  updated_at = NOW()
WHERE plan IN ('STARTER', 'GROWTH', 'BUSINESS', 'PREMIUM');

-- 2. Ensure paid plans are ACTIVE (for test mode)
UPDATE billing_state
SET 
  status = 'ACTIVE',
  updated_at = NOW()
WHERE 
  plan IN ('START', 'PRO', 'PLUS')
  AND status NOT IN ('ACTIVE', 'CANCELLED');

-- 3. Ensure FREE plans are TRIALING or ACTIVE
UPDATE billing_state
SET 
  status = 'TRIALING',
  updated_at = NOW()
WHERE 
  plan = 'FREE'
  AND status NOT IN ('ACTIVE', 'TRIALING', 'CANCELLED');

-- 4. Create billing_state for any tenant that doesn't have one
INSERT INTO billing_state (tenant_id, plan, status, created_at, updated_at)
SELECT 
  t.id,
  'FREE',
  'TRIALING',
  NOW(),
  NOW()
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM billing_state bs WHERE bs.tenant_id = t.id
)
ON CONFLICT (tenant_id) DO NOTHING;

-- 5. Add index on updated_at for better query performance
CREATE INDEX IF NOT EXISTS idx_billing_state_updated_at 
ON billing_state(updated_at DESC);

-- 6. Add index on plan and status combination
CREATE INDEX IF NOT EXISTS idx_billing_state_plan_status 
ON billing_state(plan, status);

-- 7. Add a function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_billing_state_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger to auto-update timestamp
DROP TRIGGER IF EXISTS billing_state_updated_at_trigger ON billing_state;
CREATE TRIGGER billing_state_updated_at_trigger
  BEFORE UPDATE ON billing_state
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION update_billing_state_timestamp();

-- 9. Add check constraint to ensure valid plan values
ALTER TABLE billing_state
DROP CONSTRAINT IF EXISTS billing_state_plan_check;

ALTER TABLE billing_state
ADD CONSTRAINT billing_state_plan_check 
CHECK (plan IN ('FREE', 'START', 'PRO', 'PLUS', 'STARTER', 'GROWTH', 'BUSINESS', 'PREMIUM', 'ENTERPRISE'));

-- 10. Add check constraint to ensure valid status values
ALTER TABLE billing_state
DROP CONSTRAINT IF EXISTS billing_state_status_check;

ALTER TABLE billing_state
ADD CONSTRAINT billing_state_status_check 
CHECK (status IN ('INACTIVE', 'ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELLED', 'SUSPENDED'));

-- =====================================================
-- Verification Query
-- =====================================================
-- Run this to verify the migration worked:
-- 
-- SELECT 
--   t.name,
--   bs.plan,
--   bs.status,
--   bs.updated_at,
--   (SELECT COUNT(*) FROM locations WHERE tenant_id = t.id) as location_count
-- FROM tenants t
-- LEFT JOIN billing_state bs ON bs.tenant_id = t.id
-- ORDER BY t.name;
-- =====================================================

