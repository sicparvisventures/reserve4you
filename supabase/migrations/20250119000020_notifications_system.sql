-- =====================================================
-- NOTIFICATIONS SYSTEM
-- Complete notification system for Reserve4You
-- =====================================================

-- Drop existing objects if they exist
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP TABLE IF EXISTS notifications CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS notification_priority CASCADE;

-- =====================================================
-- ENUMS
-- =====================================================

-- Notification types
CREATE TYPE notification_type AS ENUM (
  'BOOKING_CONFIRMED',      -- Booking was confirmed
  'BOOKING_CANCELLED',      -- Booking was cancelled
  'BOOKING_REMINDER',       -- Reminder for upcoming booking
  'BOOKING_MODIFIED',       -- Booking details changed
  'BOOKING_PENDING',        -- New booking pending approval
  'PAYMENT_SUCCESS',        -- Payment successful
  'PAYMENT_FAILED',         -- Payment failed
  'SUBSCRIPTION_UPGRADED',  -- Subscription plan upgraded
  'SUBSCRIPTION_EXPIRING',  -- Subscription expiring soon
  'SYSTEM_ANNOUNCEMENT',    -- System-wide announcement
  'LOCATION_PUBLISHED',     -- Location went live
  'REVIEW_REQUEST',         -- Request for review
  'MESSAGE_RECEIVED',       -- New message received
  'GENERAL'                 -- General notification
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
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User reference (who receives the notification)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification details
  type notification_type NOT NULL DEFAULT 'GENERAL',
  priority notification_priority NOT NULL DEFAULT 'MEDIUM',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Optional references
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  
  -- Action link (optional)
  action_url TEXT,
  action_label TEXT,
  
  -- Status
  read BOOLEAN NOT NULL DEFAULT FALSE,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  
  -- Indexes
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Index for fetching user's notifications efficiently
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_priority ON notifications(priority);

-- Composite index for common queries
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read, created_at DESC) 
WHERE read = FALSE AND archived = FALSE;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (mark as read, archive)
CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: System can insert notifications (for backend/triggers)
CREATE POLICY "System can insert notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to create a notification
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
    user_id,
    type,
    title,
    message,
    priority,
    booking_id,
    location_id,
    tenant_id,
    action_url,
    action_label,
    metadata
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_priority,
    p_booking_id,
    p_location_id,
    p_tenant_id,
    p_action_url,
    p_action_label,
    p_metadata
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET 
    read = TRUE,
    read_at = NOW()
  WHERE 
    id = p_notification_id
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET 
    read = TRUE,
    read_at = NOW()
  WHERE 
    user_id = auth.uid()
    AND read = FALSE
    AND archived = FALSE;
    
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notifications
    WHERE 
      user_id = auth.uid()
      AND read = FALSE
      AND archived = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SAMPLE NOTIFICATIONS (for testing)
-- =====================================================

-- Note: These are examples and won't insert without valid user_ids
-- Uncomment and modify with actual user_ids for testing

/*
-- Welcome notification
INSERT INTO notifications (user_id, type, priority, title, message, action_url, action_label)
VALUES (
  'your-user-id-here',
  'SYSTEM_ANNOUNCEMENT',
  'MEDIUM',
  'Welkom bij Reserve4You!',
  'Bedankt voor je registratie. Ontdek nu de beste restaurants in je omgeving.',
  '/discover',
  'Ontdek Restaurants'
);

-- Booking confirmation
INSERT INTO notifications (user_id, type, priority, title, message, booking_id, action_url, action_label)
VALUES (
  'your-user-id-here',
  'BOOKING_CONFIRMED',
  'HIGH',
  'Reservering bevestigd',
  'Je reservering bij Restaurant XYZ op 20 januari om 19:00 is bevestigd.',
  'booking-id-here',
  '/profile',
  'Bekijk Reservering'
);
*/

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant usage on types
GRANT USAGE ON TYPE notification_type TO authenticated;
GRANT USAGE ON TYPE notification_priority TO authenticated;

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE notifications IS 'Stores user notifications for bookings, system announcements, and other events';
COMMENT ON COLUMN notifications.user_id IS 'The user who receives this notification';
COMMENT ON COLUMN notifications.type IS 'Type of notification (booking, payment, system, etc.)';
COMMENT ON COLUMN notifications.priority IS 'Priority level of the notification';
COMMENT ON COLUMN notifications.read IS 'Whether the notification has been read';
COMMENT ON COLUMN notifications.archived IS 'Whether the notification is archived';
COMMENT ON COLUMN notifications.metadata IS 'Additional metadata in JSON format';

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    RAISE NOTICE 'Notifications table created successfully';
  ELSE
    RAISE EXCEPTION 'Notifications table was not created';
  END IF;
END $$;

