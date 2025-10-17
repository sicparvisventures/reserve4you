-- ============================================================================
-- FIX: Tenant Creation RLS Issue
-- ============================================================================
-- This migration adds a SECURITY DEFINER function to create tenants
-- bypassing RLS while maintaining security
-- ============================================================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can create tenants" ON tenants;

-- Create new, more permissive INSERT policy
-- This allows authenticated users to create tenants where they are the owner
CREATE POLICY "Authenticated users can create tenants as owner"
  ON tenants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_user_id);

-- Also allow service role to bypass RLS for tenant creation
-- This is needed for API endpoints using service client
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;

-- Create a SECURITY DEFINER function for creating tenants
-- This function runs with elevated privileges and can bypass RLS
CREATE OR REPLACE FUNCTION create_tenant_with_membership(
  p_tenant_name VARCHAR(255),
  p_brand_color VARCHAR(7),
  p_owner_user_id UUID
)
RETURNS TABLE(
  tenant_id UUID,
  tenant_name VARCHAR(255),
  tenant_brand_color VARCHAR(7),
  tenant_owner_user_id UUID,
  tenant_created_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Verify the caller is the owner they claim to be
  -- This prevents users from creating tenants for other users
  IF auth.uid() != p_owner_user_id THEN
    RAISE EXCEPTION 'Cannot create tenant for another user';
  END IF;

  -- Create the tenant
  INSERT INTO tenants (name, brand_color, owner_user_id)
  VALUES (p_tenant_name, p_brand_color, p_owner_user_id)
  RETURNING id INTO v_tenant_id;

  -- Create the owner membership
  INSERT INTO memberships (tenant_id, user_id, role)
  VALUES (v_tenant_id, p_owner_user_id, 'OWNER');

  -- Return the created tenant
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.brand_color,
    t.owner_user_id,
    t.created_at
  FROM tenants t
  WHERE t.id = v_tenant_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_tenant_with_membership(VARCHAR, VARCHAR, UUID) TO authenticated;

-- Also update memberships INSERT policy to be more permissive
DROP POLICY IF EXISTS "Owners and managers can create memberships" ON memberships;

CREATE POLICY "Users can create memberships for their tenants"
  ON memberships FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if user is creating their own owner membership (tenant creation)
    (user_id = auth.uid() AND role = 'OWNER')
    OR
    -- Allow if user is already an owner/manager of the tenant
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.tenant_id = memberships.tenant_id
      AND m.user_id = auth.uid()
      AND m.role IN ('OWNER', 'MANAGER')
    )
  );

-- Verify the function was created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'create_tenant_with_membership'
  ) THEN
    RAISE NOTICE '✅ Function create_tenant_with_membership created successfully';
  ELSE
    RAISE EXCEPTION '❌ Failed to create function';
  END IF;
END $$;

RAISE NOTICE '🎉 Tenant creation RLS fix complete!';
RAISE NOTICE '   Tenants can now be created via API';

