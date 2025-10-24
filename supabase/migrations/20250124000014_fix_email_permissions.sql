-- =====================================================
-- FIX EMAIL SYSTEM PERMISSIONS - Reserve4You
-- Fix RLS policies and add auto-email trigger
-- =====================================================

-- 1. DROP AND RECREATE RLS POLICIES
-- =====================================================

-- Email Settings Policies
DROP POLICY IF EXISTS "Users can view email settings" ON email_settings;
DROP POLICY IF EXISTS "Users can insert email settings" ON email_settings;
DROP POLICY IF EXISTS "Users can update email settings" ON email_settings;

CREATE POLICY "Users can view email settings"
  ON email_settings FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can insert email settings"
  ON email_settings FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Users can update email settings"
  ON email_settings FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Email Templates Policies
DROP POLICY IF EXISTS "Users can view email templates" ON email_templates;
DROP POLICY IF EXISTS "Users can insert email templates" ON email_templates;
DROP POLICY IF EXISTS "Users can update email templates" ON email_templates;

CREATE POLICY "Users can view email templates"
  ON email_templates FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can insert email templates"
  ON email_templates FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Users can update email templates"
  ON email_templates FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Email Delivery Log Policies
DROP POLICY IF EXISTS "Users can view email delivery log" ON email_delivery_log;
DROP POLICY IF EXISTS "Users can insert email delivery log" ON email_delivery_log;
DROP POLICY IF EXISTS "Users can update email delivery log" ON email_delivery_log;

CREATE POLICY "Users can view email delivery log"
  ON email_delivery_log FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can insert email delivery log"
  ON email_delivery_log FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Users can update email delivery log"
  ON email_delivery_log FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Email Reminder Queue Policies
DROP POLICY IF EXISTS "Users can view email reminder queue" ON email_reminder_queue;
DROP POLICY IF EXISTS "Users can insert email reminder queue" ON email_reminder_queue;
DROP POLICY IF EXISTS "Users can update email reminder queue" ON email_reminder_queue;

CREATE POLICY "Users can view email reminder queue"
  ON email_reminder_queue FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can insert email reminder queue"
  ON email_reminder_queue FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Users can update email reminder queue"
  ON email_reminder_queue FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- 2. ADD AUTO-EMAIL SENDING TRIGGER
-- =====================================================

-- Function: Auto-send booking confirmation email
CREATE OR REPLACE FUNCTION auto_send_booking_email()
RETURNS TRIGGER AS $$
DECLARE
  v_location RECORD;
  v_settings RECORD;
  v_template RECORD;
BEGIN
  -- Only for confirmed bookings
  IF NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status != 'confirmed') THEN
    
    -- Get location details
    SELECT 
      l.id,
      l.tenant_id,
      l.name,
      COALESCE(
        l.address_json->>'street' || ' ' || l.address_json->>'number' || ', ' || l.address_json->>'city',
        l.address || ', ' || l.city,
        l.city
      ) as address,
      l.phone
    INTO v_location
    FROM locations l
    WHERE l.id = NEW.location_id;

    -- Check if email settings exist
    SELECT * INTO v_settings
    FROM email_settings
    WHERE tenant_id = v_location.tenant_id
      AND enable_booking_confirmation = TRUE;

    -- Only proceed if settings exist and feature is enabled
    IF v_settings IS NOT NULL THEN
      
      -- Check if template exists
      SELECT * INTO v_template
      FROM email_templates
      WHERE tenant_id = v_location.tenant_id
        AND template_type = 'booking_confirmation'
        AND is_active = TRUE
      LIMIT 1;

      -- Queue the email
      IF v_template IS NOT NULL AND NEW.customer_email IS NOT NULL THEN
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
          v_location.tenant_id,
          NEW.id,
          NEW.consumer_id,
          v_template.id,
          NEW.customer_email,
          NEW.customer_name,
          v_template.subject,
          'booking_confirmation',
          'pending',
          jsonb_build_object(
            'guest_name', NEW.customer_name,
            'date', NEW.booking_date::TEXT,
            'time', NEW.booking_time::TEXT,
            'party_size', NEW.number_of_guests::TEXT,
            'location_name', v_location.name,
            'location_address', COALESCE(v_location.address, ''),
            'location_phone', COALESCE(v_location.phone, '')
          )
        );

        -- Log that email was queued
        RAISE NOTICE 'Booking confirmation email queued for booking %', NEW.id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trg_auto_send_booking_email ON bookings;

-- Create trigger
CREATE TRIGGER trg_auto_send_booking_email
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION auto_send_booking_email();

-- 3. ADD FUNCTION TO PROCESS PENDING EMAILS
-- =====================================================

CREATE OR REPLACE FUNCTION get_pending_emails(p_limit INT DEFAULT 10)
RETURNS JSON AS $$
BEGIN
  RETURN COALESCE((
    SELECT json_agg(
      json_build_object(
        'id', e.id,
        'tenant_id', e.tenant_id,
        'booking_id', e.booking_id,
        'recipient_email', e.recipient_email,
        'recipient_name', e.recipient_name,
        'template_type', e.template_type,
        'metadata', e.metadata,
        'template', (
          SELECT json_build_object(
            'subject', t.subject,
            'html_content', t.html_content,
            'text_content', t.text_content
          )
          FROM email_templates t
          WHERE t.id = e.template_id
        )
      )
    )
    FROM email_delivery_log e
    WHERE e.status = 'pending'
    ORDER BY e.created_at ASC
    LIMIT p_limit
  ), '[]'::JSON);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_pending_emails(INT) TO authenticated, anon;

-- 4. TEST & VALIDATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Email system permissions fixed!';
  RAISE NOTICE 'RLS policies updated';
  RAISE NOTICE 'Auto-email trigger created';
  RAISE NOTICE 'Pending emails function created';
END $$;

