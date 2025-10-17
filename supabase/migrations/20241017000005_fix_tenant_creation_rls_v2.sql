-- ============================================================================
-- FIX: Tenant Creation RLS Issue (V2 - Safe Version)
-- ============================================================================
-- This migration adds a SECURITY DEFINER function to create tenants
-- bypassing RLS while maintaining security
-- First checks if all required tables and columns exist
-- ============================================================================

-- Step 1: Verify memberships table exists and has correct structure
DO $$
BEGIN
  -- Check if memberships table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'memberships'
  ) THEN
    RAISE EXCEPTION 'memberships table does not exist. Please run the base schema migration first (20241017000002_r4y_multi_tenant_schema_safe.sql)';
  END IF;

  -- Check if role column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'memberships'
    AND column_name = 'role'
  ) THEN
    RAISE EXCEPTION 'memberships.role column does not exist. Please run the base schema migration first (20241017000002_r4y_multi_tenant_schema_safe.sql)';
  END IF;

  -- Check if tenants table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tenants'
  ) THEN
    RAISE EXCEPTION 'tenants table does not exist. Please run the base schema migration first (20241017000002_r4y_multi_tenant_schema_safe.sql)';
  END IF;

  RAISE NOTICE '✅ All required tables and columns exist';
END $$;

-- Step 2: Drop existing problematic policies
DROP POLICY IF EXISTS "Users can create tenants" ON tenants;
DROP POLICY IF EXISTS "Authenticated users can create tenants as owner" ON tenants;

-- Step 3: Create new, more permissive INSERT policy
-- This allows authenticated users to create tenants where they are the owner
CREATE POLICY "Authenticated users can create tenants as owner"
  ON tenants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_user_id);

-- Step 4: Create a SECURITY DEFINER function for creating tenants
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
  VALUES (p_tenant_name, COALESCE(p_brand_color, '#FF5A5F'), p_owner_user_id)
  RETURNING id INTO v_tenant_id;

  -- Create the owner membership
  INSERT INTO memberships (tenant_id, user_id, role)
  VALUES (v_tenant_id, p_owner_user_id, 'OWNER'::membership_role);

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
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and re-raise
    RAISE NOTICE 'Error in create_tenant_with_membership: %', SQLERRM;
    RAISE;
END;
$$;

-- Step 5: Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_tenant_with_membership(VARCHAR, VARCHAR, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_tenant_with_membership(VARCHAR, VARCHAR, UUID) TO service_role;

-- Step 6: Update memberships INSERT policy to be more permissive
DROP POLICY IF EXISTS "Owners and managers can create memberships" ON memberships;
DROP POLICY IF EXISTS "Users can create memberships for their tenants" ON memberships;

CREATE POLICY "Users can create memberships for their tenants"
  ON memberships FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if user is creating their own owner membership (tenant creation)
    (user_id = auth.uid() AND role = 'OWNER'::membership_role)
    OR
    -- Allow if user is already an owner/manager of the tenant
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.tenant_id = memberships.tenant_id
      AND m.user_id = auth.uid()
      AND m.role IN ('OWNER'::membership_role, 'MANAGER'::membership_role)
    )
  );

-- Step 7: Verify the function was created
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

-- Final success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '🎉 Tenant creation RLS fix complete!';
  RAISE NOTICE '   ✅ Function: create_tenant_with_membership';
  RAISE NOTICE '   ✅ Policy: Authenticated users can create tenants';
  RAISE NOTICE '   ✅ Policy: Users can create memberships';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

