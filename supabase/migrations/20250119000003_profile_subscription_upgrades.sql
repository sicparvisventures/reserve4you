-- ============================================================================
-- PROFILE SUBSCRIPTION UPGRADES
-- ============================================================================
-- This migration adds functions and policies to support subscription upgrades
-- from the profile page.
-- ============================================================================

-- Ensure billing_state table exists with all required columns
-- ============================================================================

DO $$
BEGIN
    -- Check if billing_state table exists, if not create it
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'billing_state') THEN
        CREATE TABLE billing_state (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            plan VARCHAR(50) NOT NULL DEFAULT 'FREE',
            status VARCHAR(50) NOT NULL DEFAULT 'INACTIVE',
            stripe_customer_id TEXT,
            stripe_subscription_id TEXT,
            current_period_start TIMESTAMPTZ,
            current_period_end TIMESTAMPTZ,
            cancel_at TIMESTAMPTZ,
            canceled_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(tenant_id)
        );
        RAISE NOTICE '✅ Created billing_state table';
    ELSE
        RAISE NOTICE '⏭️  billing_state table already exists';
    END IF;

    -- Ensure all required columns exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'billing_state' AND column_name = 'plan') THEN
        ALTER TABLE billing_state ADD COLUMN plan VARCHAR(50) NOT NULL DEFAULT 'FREE';
        RAISE NOTICE '✅ Added plan column to billing_state';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'billing_state' AND column_name = 'status') THEN
        ALTER TABLE billing_state ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'INACTIVE';
        RAISE NOTICE '✅ Added status column to billing_state';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'billing_state' AND column_name = 'stripe_customer_id') THEN
        ALTER TABLE billing_state ADD COLUMN stripe_customer_id TEXT;
        RAISE NOTICE '✅ Added stripe_customer_id column to billing_state';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'billing_state' AND column_name = 'stripe_subscription_id') THEN
        ALTER TABLE billing_state ADD COLUMN stripe_subscription_id TEXT;
        RAISE NOTICE '✅ Added stripe_subscription_id column to billing_state';
    END IF;

END $$;


-- Function to get user's tenants with billing info
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_tenants_with_billing(user_uuid UUID)
RETURNS TABLE (
    tenant_id UUID,
    tenant_name TEXT,
    tenant_brand_color VARCHAR(7),
    role membership_role,
    billing_plan VARCHAR(50),
    billing_status VARCHAR(50),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    location_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id AS tenant_id,
        t.name AS tenant_name,
        t.brand_color AS tenant_brand_color,
        m.role,
        COALESCE(bs.plan, 'FREE') AS billing_plan,
        COALESCE(bs.status, 'INACTIVE') AS billing_status,
        bs.stripe_customer_id,
        bs.stripe_subscription_id,
        COUNT(DISTINCT l.id) AS location_count
    FROM tenants t
    INNER JOIN memberships m ON m.tenant_id = t.id
    LEFT JOIN billing_state bs ON bs.tenant_id = t.id
    LEFT JOIN locations l ON l.tenant_id = t.id
    WHERE m.user_id = user_uuid
    GROUP BY t.id, t.name, t.brand_color, m.role, bs.plan, bs.status, bs.stripe_customer_id, bs.stripe_subscription_id
    ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;


-- Function to check if user can upgrade a tenant subscription
-- ============================================================================

CREATE OR REPLACE FUNCTION can_user_upgrade_tenant(
    user_uuid UUID,
    tenant_uuid UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    user_role membership_role;
BEGIN
    -- Get user's role in this tenant
    SELECT role INTO user_role
    FROM memberships
    WHERE user_id = user_uuid AND tenant_id = tenant_uuid;

    -- Only owners can upgrade
    RETURN user_role = 'OWNER';
END;
$$ LANGUAGE plpgsql STABLE;


-- Function to initialize billing state for a tenant
-- ============================================================================

CREATE OR REPLACE FUNCTION initialize_tenant_billing(
    tenant_uuid UUID,
    initial_plan VARCHAR(50) DEFAULT 'FREE'
)
RETURNS billing_state AS $$
DECLARE
    result billing_state;
BEGIN
    -- Insert or get existing billing state
    INSERT INTO billing_state (tenant_id, plan, status)
    VALUES (tenant_uuid, initial_plan, 'INACTIVE')
    ON CONFLICT (tenant_id) DO UPDATE
    SET updated_at = NOW()
    RETURNING * INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql;


-- Function to update billing state (called by webhook)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_tenant_billing(
    tenant_uuid UUID,
    new_plan VARCHAR(50),
    new_status VARCHAR(50),
    customer_id TEXT DEFAULT NULL,
    subscription_id TEXT DEFAULT NULL,
    period_start TIMESTAMPTZ DEFAULT NULL,
    period_end TIMESTAMPTZ DEFAULT NULL
)
RETURNS billing_state AS $$
DECLARE
    result billing_state;
BEGIN
    UPDATE billing_state
    SET 
        plan = new_plan,
        status = new_status,
        stripe_customer_id = COALESCE(customer_id, stripe_customer_id),
        stripe_subscription_id = COALESCE(subscription_id, stripe_subscription_id),
        current_period_start = COALESCE(period_start, current_period_start),
        current_period_end = COALESCE(period_end, current_period_end),
        updated_at = NOW()
    WHERE tenant_id = tenant_uuid
    RETURNING * INTO result;

    -- If no row was updated, insert new row
    IF result IS NULL THEN
        INSERT INTO billing_state (
            tenant_id, 
            plan, 
            status, 
            stripe_customer_id, 
            stripe_subscription_id,
            current_period_start,
            current_period_end
        )
        VALUES (
            tenant_uuid, 
            new_plan, 
            new_status, 
            customer_id, 
            subscription_id,
            period_start,
            period_end
        )
        RETURNING * INTO result;
    END IF;

    RETURN result;
END;
$$ LANGUAGE plpgsql;


-- RLS Policies for billing_state
-- ============================================================================

-- Enable RLS
ALTER TABLE billing_state ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view billing for their tenants" ON billing_state;
DROP POLICY IF EXISTS "Owners can update billing for their tenants" ON billing_state;
DROP POLICY IF EXISTS "Service role has full access to billing_state" ON billing_state;

-- Users can view billing info for tenants they're members of
CREATE POLICY "Users can view billing for their tenants"
ON billing_state FOR SELECT
TO authenticated
USING (
    tenant_id IN (
        SELECT tenant_id FROM memberships WHERE user_id = auth.uid()
    )
);

-- Only owners can update billing (though usually done via service role)
CREATE POLICY "Owners can update billing for their tenants"
ON billing_state FOR UPDATE
TO authenticated
USING (
    tenant_id IN (
        SELECT tenant_id FROM memberships 
        WHERE user_id = auth.uid() AND role = 'OWNER'
    )
);

-- Service role has full access
CREATE POLICY "Service role has full access to billing_state"
ON billing_state FOR ALL
TO service_role
USING (true);


-- Grant permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_user_tenants_with_billing TO authenticated;
GRANT EXECUTE ON FUNCTION can_user_upgrade_tenant TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_tenant_billing TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION update_tenant_billing TO service_role;

GRANT SELECT ON billing_state TO authenticated;
GRANT ALL ON billing_state TO service_role;


-- Indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_billing_state_tenant_id ON billing_state(tenant_id);
CREATE INDEX IF NOT EXISTS idx_billing_state_stripe_customer ON billing_state(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_state_stripe_subscription ON billing_state(stripe_subscription_id);


-- Comments for documentation
-- ============================================================================

COMMENT ON FUNCTION get_user_tenants_with_billing IS 
'Returns all tenants for a user with their billing information and location count.';

COMMENT ON FUNCTION can_user_upgrade_tenant IS 
'Checks if a user has permission to upgrade a tenant subscription (must be owner).';

COMMENT ON FUNCTION initialize_tenant_billing IS 
'Creates initial billing state for a tenant with default FREE plan.';

COMMENT ON FUNCTION update_tenant_billing IS 
'Updates billing state for a tenant. Called by Stripe webhook handlers.';

COMMENT ON TABLE billing_state IS 
'Stores billing and subscription state for each tenant. One row per tenant.';

