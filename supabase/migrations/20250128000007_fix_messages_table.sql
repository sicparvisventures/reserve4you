-- ============================================================================
-- FIX MESSAGES TABLE - Restore compatibility with existing messages system
-- ============================================================================
-- This migration fixes the messages table to support both old and new structures
-- Problem: Social expansion migrations changed message_content to message_text
-- Solution: Add message_content column if missing, keep both for compatibility
-- ============================================================================

-- Check if messages table exists and add missing columns
DO $$
BEGIN
  -- Add message_content column if it doesn't exist (old structure)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    -- First, ensure message_text column exists (for new structure)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'messages' AND column_name = 'message_text'
    ) THEN
      ALTER TABLE messages ADD COLUMN message_text TEXT;
    END IF;
    
    -- Add message_content column if it doesn't exist (old structure)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'messages' AND column_name = 'message_content'
    ) THEN
      ALTER TABLE messages ADD COLUMN message_content TEXT;
    END IF;
    
    -- Migrate data: if message_content exists but message_text doesn't, copy it
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'messages' AND column_name = 'message_content'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'messages' AND column_name = 'message_text'
    ) THEN
      UPDATE messages 
      SET message_text = message_content 
      WHERE message_content IS NOT NULL AND (message_text IS NULL OR message_text = '');
    END IF;
    
    -- Migrate data: if message_text exists but message_content doesn't, copy it
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'messages' AND column_name = 'message_text'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'messages' AND column_name = 'message_content'
    ) THEN
      UPDATE messages 
      SET message_content = message_text 
      WHERE message_text IS NOT NULL AND (message_content IS NULL OR message_content = '');
    END IF;
    
    -- Add location_id column if it doesn't exist (old structure)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'messages' AND column_name = 'location_id'
    ) THEN
      ALTER TABLE messages ADD COLUMN location_id UUID REFERENCES locations(id) ON DELETE SET NULL;
    END IF;
    
    -- Add location_data column if it doesn't exist (old structure)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'messages' AND column_name = 'location_data'
    ) THEN
      ALTER TABLE messages ADD COLUMN location_data JSONB;
    END IF;
    
    -- Add deleted_at column if it doesn't exist (old structure)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'messages' AND column_name = 'deleted_at'
    ) THEN
      ALTER TABLE messages ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
    
    -- Add is_edited column if it doesn't exist (old structure)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'messages' AND column_name = 'is_edited'
    ) THEN
      ALTER TABLE messages ADD COLUMN is_edited BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add metadata column if it doesn't exist (new structure)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'messages' AND column_name = 'metadata'
    ) THEN
      ALTER TABLE messages ADD COLUMN metadata JSONB;
    END IF;
  END IF;
END $$;

-- Create a trigger to sync message_text and message_content
-- This function safely syncs between both columns if they exist
CREATE OR REPLACE FUNCTION sync_message_content()
RETURNS TRIGGER AS $$
DECLARE
  has_message_content BOOLEAN;
  has_message_text BOOLEAN;
BEGIN
  -- Check which columns exist by querying information_schema
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'message_content'
  ) INTO has_message_content;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'message_text'
  ) INTO has_message_text;
  
  -- Sync from message_content to message_text (if both exist)
  IF has_message_content AND has_message_text THEN
    IF NEW.message_content IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.message_content IS DISTINCT FROM NEW.message_content) THEN
      NEW.message_text := NEW.message_content;
    END IF;
    
    -- Sync from message_text to message_content (if both exist)
    IF NEW.message_text IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.message_text IS DISTINCT FROM NEW.message_text) THEN
      NEW.message_content := NEW.message_text;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS sync_message_content_trigger ON messages;
CREATE TRIGGER sync_message_content_trigger
  BEFORE INSERT OR UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION sync_message_content();

-- Recreate indexes for location_id if they don't exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'messages' AND column_name = 'location_id'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_messages_location ON messages(location_id) WHERE location_id IS NOT NULL;
    END IF;
    
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'messages' AND column_name = 'deleted_at'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_messages_deleted ON messages(deleted_at) WHERE deleted_at IS NULL;
    END IF;
  END IF;
END $$;

-- Update RLS policies to allow reading messages with either structure
DO $$
BEGIN
  -- Check if policy exists and update it
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'messages' 
    AND policyname = 'Users can view messages in their conversations'
  ) THEN
    -- Policy already exists, leave it
    NULL;
  ELSIF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'messages' 
    AND policyname = 'Users can send messages'
  ) THEN
    -- Policy exists with different name, add view policy
    DROP POLICY IF EXISTS "Users can view messages in conversations" ON messages;
    CREATE POLICY "Users can view messages in conversations"
      ON messages FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM conversation_participants cp
          WHERE cp.conversation_id = messages.conversation_id
          AND cp.consumer_id = (
            SELECT id FROM consumers WHERE auth_user_id = auth.uid()
          )
        )
      );
  END IF;
END $$;

-- Add comments if columns exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'message_content'
  ) THEN
    COMMENT ON COLUMN messages.message_content IS 'Message content (old structure - maintained for compatibility)';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'message_text'
  ) THEN
    COMMENT ON COLUMN messages.message_text IS 'Message text (new structure - synced with message_content)';
  END IF;
END $$;

