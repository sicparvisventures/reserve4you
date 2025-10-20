-- =====================================================
-- AUTOMATIC BOOKING NOTIFICATIONS SYSTEM
-- Creates notifications for booking events
-- =====================================================

-- =====================================================
-- NOTIFICATION SETTINGS TABLE
-- Allows businesses to customize notification behavior
-- =====================================================

CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  
  -- Notification toggles
  notify_on_new_booking BOOLEAN NOT NULL DEFAULT TRUE,
  notify_on_booking_confirmed BOOLEAN NOT NULL DEFAULT TRUE,
  notify_on_booking_cancelled BOOLEAN NOT NULL DEFAULT TRUE,
  notify_on_booking_modified BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Reminder settings
  send_booking_reminders BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_hours_before INTEGER NOT NULL DEFAULT 24,
  
  -- Who gets notified (for business owners/managers)
  notify_tenant_owner BOOLEAN NOT NULL DEFAULT TRUE,
  notify_location_managers BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Customer notification settings
  send_customer_confirmation BOOLEAN NOT NULL DEFAULT TRUE,
  send_customer_reminder BOOLEAN NOT NULL DEFAULT TRUE,
  customer_reminder_hours_before INTEGER NOT NULL DEFAULT 2,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure unique settings per location or tenant
  UNIQUE(tenant_id, location_id)
);

-- Create indexes
CREATE INDEX idx_notification_settings_tenant ON notification_settings(tenant_id);
CREATE INDEX idx_notification_settings_location ON notification_settings(location_id);

-- Enable RLS
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Policies: Only tenant owners and managers can view/edit settings
CREATE POLICY "Tenant members can view notification settings"
  ON notification_settings FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenant owners can manage notification settings"
  ON notification_settings FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM memberships 
      WHERE user_id = auth.uid() AND role = 'OWNER'
    )
  );

-- =====================================================
-- FUNCTION: Create notification for booking event
-- =====================================================

CREATE OR REPLACE FUNCTION notify_booking_event(
  p_booking_id UUID,
  p_event_type TEXT,
  p_old_status TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_booking RECORD;
  v_consumer RECORD;
  v_location RECORD;
  v_settings RECORD;
  v_notification_id UUID;
  v_title TEXT;
  v_message TEXT;
  v_action_url TEXT;
  v_notification_type notification_type;
  v_priority notification_priority;
BEGIN
  -- Get booking details
  SELECT 
    b.*,
    l.name as location_name,
    l.slug as location_slug,
    l.tenant_id,
    l.id as location_id
  INTO v_booking
  FROM bookings b
  JOIN locations l ON b.location_id = l.id
  WHERE b.id = p_booking_id;
  
  IF NOT FOUND THEN
    RAISE WARNING 'Booking % not found', p_booking_id;
    RETURN;
  END IF;
  
  -- Get consumer details (if exists)
  IF v_booking.consumer_id IS NOT NULL THEN
    SELECT c.*, au.id as auth_user_id
    INTO v_consumer
    FROM consumers c
    LEFT JOIN auth.users au ON c.auth_user_id = au.id
    WHERE c.id = v_booking.consumer_id;
  END IF;
  
  -- Get notification settings
  SELECT * INTO v_settings
  FROM notification_settings
  WHERE tenant_id = v_booking.tenant_id
    AND (location_id = v_booking.location_id OR location_id IS NULL)
  ORDER BY location_id NULLS LAST
  LIMIT 1;
  
  -- If no settings found, use defaults
  IF NOT FOUND THEN
    -- Create default settings
    INSERT INTO notification_settings (tenant_id, location_id)
    VALUES (v_booking.tenant_id, v_booking.location_id)
    RETURNING * INTO v_settings;
  END IF;
  
  -- Build action URL
  v_action_url := '/profile?tab=bookings';
  
  -- Determine notification type and content based on event
  CASE p_event_type
    WHEN 'booking_created' THEN
      IF v_settings.notify_on_new_booking THEN
        v_notification_type := 'BOOKING_PENDING';
        v_priority := 'MEDIUM';
        v_title := 'Reservering Ontvangen';
        v_message := format(
          'Je reservering bij %s op %s om %s is ontvangen en wordt verwerkt.',
          v_booking.location_name,
          to_char(v_booking.booking_date, 'DD-MM-YYYY'),
          v_booking.booking_time
        );
      ELSE
        RETURN; -- Don't notify
      END IF;
      
    WHEN 'booking_confirmed' THEN
      IF v_settings.notify_on_booking_confirmed THEN
        v_notification_type := 'BOOKING_CONFIRMED';
        v_priority := 'HIGH';
        v_title := 'Reservering Bevestigd';
        v_message := format(
          'Je reservering bij %s op %s om %s is bevestigd! We kijken ernaar uit om je te verwelkomen.',
          v_booking.location_name,
          to_char(v_booking.booking_date, 'DD-MM-YYYY'),
          v_booking.booking_time
        );
      ELSE
        RETURN;
      END IF;
      
    WHEN 'booking_cancelled' THEN
      IF v_settings.notify_on_booking_cancelled THEN
        v_notification_type := 'BOOKING_CANCELLED';
        v_priority := 'HIGH';
        v_title := 'Reservering Geannuleerd';
        v_message := format(
          'Je reservering bij %s op %s om %s is geannuleerd.',
          v_booking.location_name,
          to_char(v_booking.booking_date, 'DD-MM-YYYY'),
          v_booking.booking_time
        );
      ELSE
        RETURN;
      END IF;
      
    WHEN 'booking_modified' THEN
      IF v_settings.notify_on_booking_modified THEN
        v_notification_type := 'BOOKING_MODIFIED';
        v_priority := 'MEDIUM';
        v_title := 'Reservering Aangepast';
        v_message := format(
          'Je reservering bij %s is gewijzigd. Nieuwe tijd: %s om %s.',
          v_booking.location_name,
          to_char(v_booking.booking_date, 'DD-MM-YYYY'),
          v_booking.booking_time
        );
      ELSE
        RETURN;
      END IF;
      
    WHEN 'booking_reminder' THEN
      IF v_settings.send_booking_reminders THEN
        v_notification_type := 'BOOKING_REMINDER';
        v_priority := 'HIGH';
        v_title := 'Herinnering: Reservering Vandaag';
        v_message := format(
          'Herinnering: Je hebt vandaag een reservering bij %s om %s voor %s personen.',
          v_booking.location_name,
          v_booking.booking_time,
          v_booking.number_of_guests
        );
      ELSE
        RETURN;
      END IF;
      
    ELSE
      -- Unknown event type
      RETURN;
  END CASE;
  
  -- Create notification for the customer (if they have an auth account)
  IF v_consumer.auth_user_id IS NOT NULL AND v_settings.send_customer_confirmation THEN
    SELECT create_notification(
      v_consumer.auth_user_id,
      v_notification_type,
      v_title,
      v_message,
      v_priority,
      p_booking_id,
      v_booking.location_id,
      v_booking.tenant_id,
      v_action_url,
      'Bekijk Reservering',
      jsonb_build_object(
        'booking_id', p_booking_id,
        'event_type', p_event_type,
        'location_name', v_booking.location_name
      )
    ) INTO v_notification_id;
    
    RAISE NOTICE 'Created notification % for user %', v_notification_id, v_consumer.auth_user_id;
  END IF;
  
  -- TODO: Create notifications for tenant owner and managers
  -- (This would require additional logic to fetch tenant members)
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS: Automatic notification on booking events
-- =====================================================

-- Trigger function for INSERT (new booking)
CREATE OR REPLACE FUNCTION trigger_notify_booking_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM notify_booking_event(NEW.id, 'booking_created');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for UPDATE (status change)
CREATE OR REPLACE FUNCTION trigger_notify_booking_updated()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if status changed
  IF OLD.status != NEW.status THEN
    -- Notify based on new status
    CASE NEW.status
      WHEN 'confirmed' THEN
        PERFORM notify_booking_event(NEW.id, 'booking_confirmed', OLD.status);
      WHEN 'cancelled' THEN
        PERFORM notify_booking_event(NEW.id, 'booking_cancelled', OLD.status);
      ELSE
        -- Other status changes (pending, seated, completed, no_show)
        -- Could add more specific notifications here
        NULL;
    END CASE;
  -- Check if date/time changed
  ELSIF OLD.booking_date != NEW.booking_date OR OLD.booking_time != NEW.booking_time THEN
    PERFORM notify_booking_event(NEW.id, 'booking_modified');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS booking_created_notification ON bookings;
CREATE TRIGGER booking_created_notification
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_booking_created();

DROP TRIGGER IF EXISTS booking_updated_notification ON bookings;
CREATE TRIGGER booking_updated_notification
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_booking_updated();

-- =====================================================
-- HELPER FUNCTION: Get notification settings for tenant
-- =====================================================

CREATE OR REPLACE FUNCTION get_notification_settings(
  p_tenant_id UUID,
  p_location_id UUID DEFAULT NULL
)
RETURNS notification_settings AS $$
DECLARE
  v_settings notification_settings;
BEGIN
  SELECT * INTO v_settings
  FROM notification_settings
  WHERE tenant_id = p_tenant_id
    AND (location_id = p_location_id OR (location_id IS NULL AND p_location_id IS NULL))
  ORDER BY location_id NULLS LAST
  LIMIT 1;
  
  -- If not found, return defaults
  IF NOT FOUND THEN
    v_settings.tenant_id := p_tenant_id;
    v_settings.location_id := p_location_id;
    v_settings.notify_on_new_booking := TRUE;
    v_settings.notify_on_booking_confirmed := TRUE;
    v_settings.notify_on_booking_cancelled := TRUE;
    v_settings.notify_on_booking_modified := TRUE;
    v_settings.send_booking_reminders := TRUE;
    v_settings.reminder_hours_before := 24;
    v_settings.notify_tenant_owner := TRUE;
    v_settings.notify_location_managers := TRUE;
    v_settings.send_customer_confirmation := TRUE;
    v_settings.send_customer_reminder := TRUE;
    v_settings.customer_reminder_hours_before := 2;
  END IF;
  
  RETURN v_settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON notification_settings TO authenticated;
GRANT EXECUTE ON FUNCTION notify_booking_event TO service_role;
GRANT EXECUTE ON FUNCTION get_notification_settings TO authenticated;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'BOOKING NOTIFICATIONS SYSTEM - INSTALLED';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✓ notification_settings table created';
  RAISE NOTICE '✓ Auto-notification triggers installed';
  RAISE NOTICE '✓ RLS policies configured';
  RAISE NOTICE '';
  RAISE NOTICE 'Notifications will now be automatically created for:';
  RAISE NOTICE '  - New bookings (BOOKING_PENDING)';
  RAISE NOTICE '  - Confirmed bookings (BOOKING_CONFIRMED)';
  RAISE NOTICE '  - Cancelled bookings (BOOKING_CANCELLED)';
  RAISE NOTICE '  - Modified bookings (BOOKING_MODIFIED)';
  RAISE NOTICE '';
  RAISE NOTICE 'Configure settings at:';
  RAISE NOTICE '  /manager/[tenantId]/settings/notifications';
  RAISE NOTICE '=================================================';
END $$;

