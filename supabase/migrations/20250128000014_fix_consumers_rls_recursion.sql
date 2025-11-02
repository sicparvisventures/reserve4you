-- ============================================================================
-- FIX CONSUMERS RLS RECURSION
-- ============================================================================
-- Problem: RLS policy on consumers table causes infinite recursion
-- Cause: Policy queries consumers table within its own policy check
-- Solution: Simplify policies to avoid recursion, allow INSERT for authenticated users
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE consumers ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on consumers to start fresh
DROP POLICY IF EXISTS "Users can view own consumer" ON consumers;
DROP POLICY IF EXISTS "Anyone can view public consumer profiles" ON consumers;
DROP POLICY IF EXISTS "Users can update own consumer" ON consumers;
DROP POLICY IF EXISTS "Users can view consumers in conversations" ON consumers;
DROP POLICY IF EXISTS "Users can view own consumer data" ON consumers;
DROP POLICY IF EXISTS "Users can update own consumer data" ON consumers;
DROP POLICY IF EXISTS "Users can insert own consumer profile" ON consumers;
DROP POLICY IF EXISTS "Service role full access to consumers" ON consumers;

-- SIMPLE POLICIES - NO RECURSION

-- 1. Users can view their own consumer record (by auth_user_id only - no subquery to consumers)
CREATE POLICY "Users can view own consumer" ON consumers
  FOR SELECT
  USING (auth_user_id = auth.uid());

-- 2. Users can view public consumer profiles (simple check - no recursion)
CREATE POLICY "Anyone can view public consumer profiles" ON consumers
  FOR SELECT
  USING (is_profile_public = true);

-- 3. Users can insert their own consumer record (by auth_user_id only)
CREATE POLICY "Users can insert own consumer" ON consumers
  FOR INSERT
  WITH CHECK (auth_user_id = auth.uid());

-- 4. Users can update their own consumer record (by auth_user_id only)
CREATE POLICY "Users can update own consumer" ON consumers
  FOR UPDATE
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- NOTE: Service role client bypasses RLS automatically, so no policy needed
-- Service role is used in API routes for consumer lookups and creation

COMMENT ON POLICY "Users can view own consumer" ON consumers IS 
  'Simple policy allowing users to view their own consumer record - no recursion';

COMMENT ON POLICY "Users can insert own consumer" ON consumers IS 
  'Simple policy allowing users to create their own consumer record - no recursion';

