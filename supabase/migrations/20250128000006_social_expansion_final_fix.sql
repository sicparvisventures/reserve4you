-- ============================================================================
-- SOCIAL EXPANSION - FINAL FIX FOR EXISTING TABLES
-- ============================================================================
-- Run this AFTER the safe migration if you get errors about missing columns
-- This script fixes existing tables that may have been created earlier
-- ============================================================================

-- Fix conversations table - add missing columns if table exists
DO $$
BEGIN
  -- Check if conversations table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') THEN
    -- Add created_by if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'conversations' AND column_name = 'created_by'
    ) THEN
      ALTER TABLE conversations ADD COLUMN created_by UUID REFERENCES consumers(id) ON DELETE SET NULL;
      RAISE NOTICE 'Added created_by column to conversations';
    END IF;
    
    -- Add type if missing (with default)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'conversations' AND column_name = 'type'
    ) THEN
      ALTER TABLE conversations ADD COLUMN type VARCHAR(20) DEFAULT 'direct';
      -- Update existing rows to have type
      UPDATE conversations SET type = 'direct' WHERE type IS NULL;
      -- Now make it NOT NULL
      ALTER TABLE conversations ALTER COLUMN type SET NOT NULL;
      RAISE NOTICE 'Added type column to conversations';
    END IF;
    
    -- Add name if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'conversations' AND column_name = 'name'
    ) THEN
      ALTER TABLE conversations ADD COLUMN name TEXT;
      RAISE NOTICE 'Added name column to conversations';
    END IF;
    
    -- Create indexes if columns exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'created_by') THEN
      CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'type') THEN
      CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);
    END IF;
  END IF;
END $$;

-- Ensure all other tables exist (moment_photos, etc.)
-- This will only create them if they don't exist
CREATE TABLE IF NOT EXISTS moment_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  tags TEXT[],
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id UUID NOT NULL,
  metadata JSONB,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS location_follows (
  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (consumer_id, location_id)
);

-- Create indexes for these tables
CREATE INDEX IF NOT EXISTS idx_moment_photos_booking ON moment_photos(booking_id);
CREATE INDEX IF NOT EXISTS idx_moment_photos_location ON moment_photos(location_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moment_photos_consumer ON moment_photos(consumer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_feed_actor ON activity_feed(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_public ON activity_feed(is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_type ON activity_feed(activity_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_target ON activity_feed(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_location_follows_consumer ON location_follows(consumer_id);
CREATE INDEX IF NOT EXISTS idx_location_follows_location ON location_follows(location_id);

-- ============================================================================
-- END OF FINAL FIX
-- ============================================================================

