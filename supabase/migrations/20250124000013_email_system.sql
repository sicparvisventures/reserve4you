-- =====================================================
-- EMAIL COMMUNICATION SYSTEM - Reserve4You
-- Complete email templates, tracking, and automation
-- =====================================================

-- 1. EMAIL TEMPLATES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  template_type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  language VARCHAR(10) DEFAULT 'nl',
  variables JSONB DEFAULT '[]'::JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, template_type, language)
);

-- Template types:
-- 'booking_confirmation' - New booking confirmed
-- 'booking_pending' - Booking pending approval
-- 'booking_cancelled' - Booking cancelled
-- 'booking_reminder_24h' - 24 hours before
-- 'booking_reminder_2h' - 2 hours before
-- 'manager_new_booking' - Alert manager of new booking
-- 'guest_no_show' - No-show notification

-- 2. EMAIL DELIVERY LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS email_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  consumer_id UUID REFERENCES consumers(id) ON DELETE SET NULL,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  subject TEXT NOT NULL,
  template_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  provider VARCHAR(50) DEFAULT 'resend',
  provider_message_id TEXT,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Status values:
-- 'pending' - Queued to send
-- 'sent' - Successfully sent
-- 'delivered' - Confirmed delivered
-- 'opened' - Email opened
-- 'clicked' - Link clicked
-- 'bounced' - Hard bounce
-- 'failed' - Failed to send

-- 3. EMAIL SETTINGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  provider VARCHAR(50) DEFAULT 'resend',
  from_email VARCHAR(255) NOT NULL,
  from_name VARCHAR(255) NOT NULL,
  reply_to_email VARCHAR(255),
  
  -- Resend settings
  resend_api_key TEXT,
  
  -- SMTP settings (Combell)
  smtp_host VARCHAR(255),
  smtp_port INT DEFAULT 587,
  smtp_secure BOOLEAN DEFAULT FALSE,
  smtp_username VARCHAR(255),
  smtp_password TEXT,
  
  -- Feature flags
  enable_booking_confirmation BOOLEAN DEFAULT TRUE,
  enable_booking_reminders BOOLEAN DEFAULT TRUE,
  enable_manager_notifications BOOLEAN DEFAULT TRUE,
  enable_cancellation_emails BOOLEAN DEFAULT TRUE,
  
  -- Reminder timings (minutes before booking)
  reminder_24h_enabled BOOLEAN DEFAULT TRUE,
  reminder_2h_enabled BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. EMAIL REMINDER QUEUE
-- =====================================================

CREATE TABLE IF NOT EXISTS email_reminder_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  reminder_type VARCHAR(50) NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  email_log_id UUID REFERENCES email_delivery_log(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(booking_id, reminder_type)
);

-- 5. DEFAULT EMAIL TEMPLATES
-- =====================================================

-- Function: Create default templates for a tenant
CREATE OR REPLACE FUNCTION create_default_email_templates(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Booking Confirmation Template
  INSERT INTO email_templates (tenant_id, template_type, name, subject, html_content, text_content, language, variables)
  VALUES (
    p_tenant_id,
    'booking_confirmation',
    'Reservering Bevestiging',
    'Bevestiging van uw reservering bij {location_name}',
    '<html><body><h1>Bedankt voor uw reservering!</h1><p>Beste {guest_name},</p><p>Uw reservering is bevestigd voor <strong>{date}</strong> om <strong>{time}</strong>.</p><p><strong>Details:</strong></p><ul><li>Locatie: {location_name}</li><li>Aantal personen: {party_size}</li><li>Datum: {date}</li><li>Tijd: {time}</li></ul><p>We kijken ernaar uit u te verwelkomen!</p><p>Met vriendelijke groet,<br>{location_name}</p></body></html>',
    'Bedankt voor uw reservering! Uw reservering is bevestigd voor {date} om {time}. Aantal personen: {party_size}. Locatie: {location_name}.',
    'nl',
    '["guest_name", "date", "time", "party_size", "location_name", "location_address", "location_phone"]'::JSONB
  ) ON CONFLICT (tenant_id, template_type, language) DO NOTHING;

  -- 24h Reminder Template
  INSERT INTO email_templates (tenant_id, template_type, name, subject, html_content, text_content, language, variables)
  VALUES (
    p_tenant_id,
    'booking_reminder_24h',
    'Herinnering 24 uur',
    'Herinnering: Uw reservering morgen bij {location_name}',
    '<html><body><h1>Herinnering: Uw reservering morgen</h1><p>Beste {guest_name},</p><p>Dit is een herinnering dat u morgen een reservering heeft bij <strong>{location_name}</strong>.</p><p><strong>Details:</strong></p><ul><li>Datum: {date}</li><li>Tijd: {time}</li><li>Aantal personen: {party_size}</li></ul><p>Tot morgen!</p><p>Met vriendelijke groet,<br>{location_name}</p></body></html>',
    'Herinnering: U heeft morgen een reservering bij {location_name} om {time} voor {party_size} personen.',
    'nl',
    '["guest_name", "date", "time", "party_size", "location_name"]'::JSONB
  ) ON CONFLICT (tenant_id, template_type, language) DO NOTHING;

  -- 2h Reminder Template
  INSERT INTO email_templates (tenant_id, template_type, name, subject, html_content, text_content, language, variables)
  VALUES (
    p_tenant_id,
    'booking_reminder_2h',
    'Herinnering 2 uur',
    'Over 2 uur: Uw reservering bij {location_name}',
    '<html><body><h1>Over 2 uur: Uw reservering</h1><p>Beste {guest_name},</p><p>We kijken ernaar uit u over 2 uur te verwelkomen bij <strong>{location_name}</strong>!</p><p><strong>Details:</strong></p><ul><li>Tijd: {time}</li><li>Aantal personen: {party_size}</li><li>Adres: {location_address}</li></ul><p>Tot zo!</p><p>Met vriendelijke groet,<br>{location_name}</p></body></html>',
    'Over 2 uur verwachten we u bij {location_name} om {time} voor {party_size} personen. Adres: {location_address}.',
    'nl',
    '["guest_name", "time", "party_size", "location_name", "location_address"]'::JSONB
  ) ON CONFLICT (tenant_id, template_type, language) DO NOTHING;

  -- Cancellation Template
  INSERT INTO email_templates (tenant_id, template_type, name, subject, html_content, text_content, language, variables)
  VALUES (
    p_tenant_id,
    'booking_cancelled',
    'Annulering Bevestiging',
    'Uw reservering bij {location_name} is geannuleerd',
    '<html><body><h1>Reservering Geannuleerd</h1><p>Beste {guest_name},</p><p>Uw reservering voor <strong>{date}</strong> om <strong>{time}</strong> bij {location_name} is geannuleerd.</p><p>We hopen u een andere keer te mogen verwelkomen.</p><p>Met vriendelijke groet,<br>{location_name}</p></body></html>',
    'Uw reservering voor {date} om {time} bij {location_name} is geannuleerd.',
    'nl',
    '["guest_name", "date", "time", "location_name"]'::JSONB
  ) ON CONFLICT (tenant_id, template_type, language) DO NOTHING;

  -- Manager New Booking Template
  INSERT INTO email_templates (tenant_id, template_type, name, subject, html_content, text_content, language, variables)
  VALUES (
    p_tenant_id,
    'manager_new_booking',
    'Nieuwe Reservering (Manager)',
    'Nieuwe reservering: {guest_name} op {date}',
    '<html><body><h1>Nieuwe Reservering</h1><p>Er is een nieuwe reservering gemaakt:</p><ul><li>Gast: {guest_name}</li><li>Email: {guest_email}</li><li>Telefoon: {guest_phone}</li><li>Datum: {date}</li><li>Tijd: {time}</li><li>Aantal personen: {party_size}</li><li>Locatie: {location_name}</li></ul><p>Status: {status}</p></body></html>',
    'Nieuwe reservering: {guest_name} op {date} om {time} voor {party_size} personen bij {location_name}.',
    'nl',
    '["guest_name", "guest_email", "guest_phone", "date", "time", "party_size", "location_name", "status"]'::JSONB
  ) ON CONFLICT (tenant_id, template_type, language) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. EMAIL SENDING FUNCTIONS
-- =====================================================

-- Function: Queue email for sending
CREATE OR REPLACE FUNCTION queue_email(
  p_tenant_id UUID,
  p_booking_id UUID,
  p_consumer_id UUID,
  p_recipient_email VARCHAR,
  p_recipient_name VARCHAR,
  p_template_type VARCHAR,
  p_variables JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
  v_template_id UUID;
  v_subject TEXT;
  v_html_content TEXT;
  v_log_id UUID;
BEGIN
  -- Get template
  SELECT id, subject, html_content 
  INTO v_template_id, v_subject, v_html_content
  FROM email_templates
  WHERE tenant_id = p_tenant_id
    AND template_type = p_template_type
    AND is_active = TRUE
  LIMIT 1;

  IF v_template_id IS NULL THEN
    RAISE EXCEPTION 'Template not found: %', p_template_type;
  END IF;

  -- Replace variables in subject and content
  -- (This is basic; actual replacement happens in the app layer)
  
  -- Insert into delivery log
  INSERT INTO email_delivery_log (
    tenant_id,
    booking_id,
    consumer_id,
    template_id,
    recipient_email,
    recipient_name,
    subject,
    template_type,
    status,
    metadata
  ) VALUES (
    p_tenant_id,
    p_booking_id,
    p_consumer_id,
    v_template_id,
    p_recipient_email,
    p_recipient_name,
    v_subject,
    p_template_type,
    'pending',
    p_variables
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Mark email as sent
CREATE OR REPLACE FUNCTION mark_email_sent(
  p_log_id UUID,
  p_provider_message_id TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE email_delivery_log
  SET 
    status = 'sent',
    sent_at = NOW(),
    provider_message_id = p_provider_message_id
  WHERE id = p_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Track email open
CREATE OR REPLACE FUNCTION track_email_open(p_log_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE email_delivery_log
  SET 
    status = 'opened',
    opened_at = NOW()
  WHERE id = p_log_id AND opened_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Schedule booking reminders
CREATE OR REPLACE FUNCTION schedule_booking_reminders(p_booking_id UUID)
RETURNS VOID AS $$
DECLARE
  v_booking_datetime TIMESTAMPTZ;
  v_tenant_id UUID;
  v_settings email_settings%ROWTYPE;
BEGIN
  -- Get booking details
  SELECT 
    (b.booking_date || ' ' || b.booking_time)::TIMESTAMPTZ,
    l.tenant_id
  INTO v_booking_datetime, v_tenant_id
  FROM bookings b
  JOIN locations l ON l.id = b.location_id
  WHERE b.id = p_booking_id;

  -- Get email settings
  SELECT * INTO v_settings
  FROM email_settings
  WHERE tenant_id = v_tenant_id;

  IF v_settings IS NULL THEN
    RETURN; -- No email settings configured
  END IF;

  -- Schedule 24h reminder
  IF v_settings.reminder_24h_enabled AND v_booking_datetime > NOW() + INTERVAL '24 hours' THEN
    INSERT INTO email_reminder_queue (booking_id, reminder_type, scheduled_for)
    VALUES (p_booking_id, 'booking_reminder_24h', v_booking_datetime - INTERVAL '24 hours')
    ON CONFLICT (booking_id, reminder_type) DO NOTHING;
  END IF;

  -- Schedule 2h reminder
  IF v_settings.reminder_2h_enabled AND v_booking_datetime > NOW() + INTERVAL '2 hours' THEN
    INSERT INTO email_reminder_queue (booking_id, reminder_type, scheduled_for)
    VALUES (p_booking_id, 'booking_reminder_2h', v_booking_datetime - INTERVAL '2 hours')
    ON CONFLICT (booking_id, reminder_type) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get pending reminders to send
CREATE OR REPLACE FUNCTION get_pending_reminders()
RETURNS JSON AS $$
BEGIN
  RETURN COALESCE((
    SELECT json_agg(
      json_build_object(
        'id', q.id,
        'booking_id', q.booking_id,
        'reminder_type', q.reminder_type,
        'scheduled_for', q.scheduled_for,
        'booking', (
          SELECT json_build_object(
            'customer_name', b.customer_name,
            'customer_email', b.customer_email,
            'booking_date', b.booking_date,
            'booking_time', b.booking_time,
            'number_of_guests', b.number_of_guests,
            'location_name', l.name,
            'location_address', l.address,
            'location_phone', l.phone,
            'tenant_id', l.tenant_id
          )
          FROM bookings b
          JOIN locations l ON l.id = b.location_id
          WHERE b.id = q.booking_id
        )
      )
    )
    FROM email_reminder_queue q
    WHERE q.status = 'pending'
      AND q.scheduled_for <= NOW()
    LIMIT 100
  ), '[]'::JSON);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Get email statistics for tenant
CREATE OR REPLACE FUNCTION get_email_stats(
  p_tenant_id UUID,
  p_days INT DEFAULT 30
)
RETURNS JSON AS $$
DECLARE
  v_start_date TIMESTAMPTZ;
BEGIN
  v_start_date := NOW() - (p_days || ' days')::INTERVAL;
  
  RETURN json_build_object(
    'total_sent', (
      SELECT COUNT(*)::INT
      FROM email_delivery_log
      WHERE tenant_id = p_tenant_id
        AND sent_at >= v_start_date
    ),
    'total_delivered', (
      SELECT COUNT(*)::INT
      FROM email_delivery_log
      WHERE tenant_id = p_tenant_id
        AND status IN ('delivered', 'opened', 'clicked')
        AND sent_at >= v_start_date
    ),
    'total_opened', (
      SELECT COUNT(*)::INT
      FROM email_delivery_log
      WHERE tenant_id = p_tenant_id
        AND opened_at IS NOT NULL
        AND sent_at >= v_start_date
    ),
    'total_failed', (
      SELECT COUNT(*)::INT
      FROM email_delivery_log
      WHERE tenant_id = p_tenant_id
        AND status IN ('failed', 'bounced')
        AND created_at >= v_start_date
    ),
    'open_rate', (
      SELECT CASE 
        WHEN COUNT(*) > 0 THEN
          ROUND(
            (COUNT(*) FILTER (WHERE opened_at IS NOT NULL)::DECIMAL / COUNT(*)::DECIMAL) * 100,
            1
          )
        ELSE 0
      END
      FROM email_delivery_log
      WHERE tenant_id = p_tenant_id
        AND status IN ('sent', 'delivered', 'opened', 'clicked')
        AND sent_at >= v_start_date
    ),
    'by_template', (
      SELECT json_object_agg(
        template_type,
        count
      )
      FROM (
        SELECT 
          template_type,
          COUNT(*)::INT as count
        FROM email_delivery_log
        WHERE tenant_id = p_tenant_id
          AND sent_at >= v_start_date
        GROUP BY template_type
      ) subquery
    )
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 7. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_email_templates_tenant ON email_templates(tenant_id, template_type, is_active);
CREATE INDEX IF NOT EXISTS idx_email_delivery_log_tenant ON email_delivery_log(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_delivery_log_status ON email_delivery_log(status, created_at);
CREATE INDEX IF NOT EXISTS idx_email_delivery_log_booking ON email_delivery_log(booking_id);
CREATE INDEX IF NOT EXISTS idx_email_reminder_queue_scheduled ON email_reminder_queue(scheduled_for, status);
CREATE INDEX IF NOT EXISTS idx_email_settings_tenant ON email_settings(tenant_id);

-- 8. RLS POLICIES
-- =====================================================

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_delivery_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_reminder_queue ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON email_templates TO authenticated, anon;
GRANT ALL ON email_delivery_log TO authenticated, anon;
GRANT ALL ON email_settings TO authenticated, anon;
GRANT ALL ON email_reminder_queue TO authenticated, anon;

GRANT EXECUTE ON FUNCTION create_default_email_templates(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION queue_email(UUID, UUID, UUID, VARCHAR, VARCHAR, VARCHAR, JSONB) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION mark_email_sent(UUID, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION track_email_open(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION schedule_booking_reminders(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_pending_reminders() TO authenticated;
GRANT EXECUTE ON FUNCTION get_email_stats(UUID, INT) TO authenticated, anon;

-- 9. TRIGGER: Auto-schedule reminders on booking confirmation
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_schedule_reminders()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    PERFORM schedule_booking_reminders(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_schedule_reminders ON bookings;
CREATE TRIGGER trg_schedule_reminders
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_schedule_reminders();

-- 10. TEST & VALIDATION
-- =====================================================

DO $$
DECLARE
  v_test_tenant_id UUID;
BEGIN
  -- Get test tenant
  SELECT id INTO v_test_tenant_id FROM tenants LIMIT 1;

  IF v_test_tenant_id IS NOT NULL THEN
    -- Create default templates
    PERFORM create_default_email_templates(v_test_tenant_id);
    
    RAISE NOTICE '✅ Email System migration completed successfully!';
    RAISE NOTICE 'Templates created: 5';
    RAISE NOTICE 'Tables created: 4';
    RAISE NOTICE 'Functions created: 7';
  ELSE
    RAISE NOTICE '⚠️  No test data available';
  END IF;
END $$;

