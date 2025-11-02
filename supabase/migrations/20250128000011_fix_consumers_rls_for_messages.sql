-- ============================================================================
-- FIX CONSUMERS RLS - Allow viewing consumer data for conversations
-- ============================================================================
-- Problem: Users can't see other users' consumer data in conversations
-- Cause: RLS policies only allow viewing own consumer or public profiles
-- Solution: Add policy to allow viewing consumers in conversations
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE consumers ENABLE ROW LEVEL SECURITY;

-- Add policy: Users can view consumers they have conversations with
-- SIMPLE: Check via conversation_participants without recursion
DROP POLICY IF EXISTS "Users can view consumers in conversations" ON consumers;
CREATE POLICY "Users can view consumers in conversations"
  ON consumers FOR SELECT
  USING (
    -- Allow if both users are participants in the same conversation
    -- We check this by looking for conversations where:
    -- 1. Current user is a participant
    -- 2. The target consumer is also a participant in the same conversation
    EXISTS (
      SELECT 1 
      FROM conversation_participants cp_current
      INNER JOIN consumers c_current ON c_current.id = cp_current.consumer_id
      WHERE c_current.auth_user_id = auth.uid()
      AND EXISTS (
        SELECT 1 
        FROM conversation_participants cp_other
        WHERE cp_other.conversation_id = cp_current.conversation_id
        AND cp_other.consumer_id = consumers.id
      )
    )
  );

COMMENT ON POLICY "Users can view consumers in conversations" ON consumers IS 
  'Users can view consumer data (id, email, name) for users they have conversations with';

