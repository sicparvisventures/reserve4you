-- =====================================================
-- NOTIFICATIONS SYSTEM - FIXED VERSION
-- Complete notification system for Reserve4You
-- =====================================================

-- Clean up existing objects (silent if they don't exist)
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS create_notification CASCADE;
DROP FUNCTION IF EXISTS mark_notification_read CASCADE;
DROP FUNCTION IF EXISTS mark_all_notifications_read CASCADE;
DROP FUNCTION IF EXISTS get_unread_notification_count CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS notification_priority CASCADE;

-- =====================================================
-- ENUMS
-- =====================================================

-- Notification types
CREATE TYPE notification_type AS ENUM (
  'BOOKING_CONFIRMED',
  'BOOKING_CANCELLED',
  'BOOKING_REMINDER',
  'BOOKING_MODIFIED',
  'BOOKING_PENDING',
  'PAYMENT_SUCCESS',
  'PAYMENT_FAILED',
  'SUBSCRIPTION_UPGRADED',
  'SUBSCRIPTION_EXPIRING',
  'SYSTEM_ANNOUNCEMENT',
  'LOCATION_PUBLISHED',
  'REVIEW_REQUEST',
  'MESSAGE_RECEIVED',
  'GENERAL'
);

-- Notification priority
CREATE TYPE notification_priority AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT'
);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type notification_type NOT NULL DEFAULT 'GENERAL',
  priority notification_priority NOT NULL DEFAULT 'MEDIUM',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  booking_id UUID,
  location_id UUID,
  tenant_id UUID,
  action_url TEXT,
  action_label TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Add foreign key constraints
ALTER TABLE notifications
  ADD CONSTRAINT notifications_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Only add foreign keys if tables exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
    ALTER TABLE notifications
      ADD CONSTRAINT notifications_booking_id_fkey 
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'locations') THEN
    ALTER TABLE notifications
      ADD CONSTRAINT notifications_location_id_fkey 
      FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
    ALTER TABLE notifications
      ADD CONSTRAINT notifications_tenant_id_fkey 
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read, created_at DESC) 
  WHERE read = FALSE AND archived = FALSE;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type notification_type,
  p_title TEXT,
  p_message TEXT,
  p_priority notification_priority DEFAULT 'MEDIUM',
  p_booking_id UUID DEFAULT NULL,
  p_location_id UUID DEFAULT NULL,
  p_tenant_id UUID DEFAULT NULL,
  p_action_url TEXT DEFAULT NULL,
  p_action_label TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id, type, title, message, priority,
    booking_id, location_id, tenant_id,
    action_url, action_label, metadata
  ) VALUES (
    p_user_id, p_type, p_title, p_message, p_priority,
    p_booking_id, p_location_id, p_tenant_id,
    p_action_url, p_action_label, p_metadata
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET read = TRUE, read_at = NOW()
  WHERE id = p_notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET read = TRUE, read_at = NOW()
  WHERE user_id = auth.uid() AND read = FALSE AND archived = FALSE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notifications
    WHERE user_id = auth.uid() AND read = FALSE AND archived = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANTS
-- =====================================================

GRANT USAGE ON TYPE notification_type TO authenticated, anon;
GRANT USAGE ON TYPE notification_priority TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION mark_notification_read TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count TO authenticated;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
  v_table_exists BOOLEAN;
  v_enum_count INTEGER;
BEGIN
  -- Check if table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'notifications'
  ) INTO v_table_exists;
  
  IF NOT v_table_exists THEN
    RAISE EXCEPTION 'Notifications table was not created';
  END IF;
  
  -- Check if enums exist
  SELECT COUNT(*) INTO v_enum_count
  FROM pg_type
  WHERE typname IN ('notification_type', 'notification_priority');
  
  IF v_enum_count != 2 THEN
    RAISE EXCEPTION 'Notification enums were not created';
  END IF;
  
  RAISE NOTICE '✓ Notifications table created successfully';
  RAISE NOTICE '✓ Enums created successfully';
  RAISE NOTICE '✓ RLS policies enabled';
  RAISE NOTICE '✓ Helper functions created';
  RAISE NOTICE '';
  RAISE NOTICE 'Notifications system is ready to use!';
  
END $$;

