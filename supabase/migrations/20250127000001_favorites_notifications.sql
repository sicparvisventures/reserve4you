-- =====================================================
-- FAVORITES NOTIFICATIONS SYSTEM
-- Automatically notify location owners when someone favorites their location
-- =====================================================

-- Add LOCATION_FAVORITED to notification_type enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    AND t.typname = 'notification_type'
    AND e.enumlabel = 'LOCATION_FAVORITED'
  ) THEN
    ALTER TYPE notification_type ADD VALUE 'LOCATION_FAVORITED';
  END IF;
END$$;

-- =====================================================
-- FUNCTION: Create notification when location is favorited
-- =====================================================

CREATE OR REPLACE FUNCTION notify_location_favorited()
RETURNS TRIGGER AS $$
DECLARE
  v_location_name TEXT;
  v_location_slug TEXT;
  v_tenant_id UUID;
  v_consumer_name TEXT;
  v_consumer_email TEXT;
  v_owner_user_id UUID;
  v_notification_title TEXT;
  v_notification_message TEXT;
BEGIN
  -- Get location details
  SELECT 
    l.name, 
    l.slug, 
    l.tenant_id,
    t.owner_user_id
  INTO 
    v_location_name, 
    v_location_slug, 
    v_tenant_id,
    v_owner_user_id
  FROM locations l
  JOIN tenants t ON t.id = l.tenant_id
  WHERE l.id = NEW.location_id;

  -- Get consumer details
  SELECT 
    COALESCE(c.name, u.email, 'Een gast') as consumer_name,
    u.email as consumer_email
  INTO 
    v_consumer_name,
    v_consumer_email
  FROM consumers c
  JOIN auth.users u ON u.id = c.auth_user_id
  WHERE c.id = NEW.consumer_id;

  -- Skip if we couldn't find the owner
  IF v_owner_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Create notification title and message
  v_notification_title := 'Nieuwe favoriet';
  v_notification_message := v_consumer_name || ' heeft ' || v_location_name || ' toegevoegd aan favorieten';

  -- Create notification for the location owner
  INSERT INTO notifications (
    user_id,
    type,
    priority,
    title,
    message,
    location_id,
    tenant_id,
    action_url,
    action_label,
    metadata,
    read,
    archived,
    created_at,
    updated_at
  ) VALUES (
    v_owner_user_id,
    'LOCATION_FAVORITED'::notification_type,
    'LOW'::notification_priority,
    v_notification_title,
    v_notification_message,
    NEW.location_id,
    v_tenant_id,
    '/dashboard/locations/' || v_location_slug,
    'Bekijk locatie',
    jsonb_build_object(
      'consumer_id', NEW.consumer_id,
      'consumer_name', v_consumer_name,
      'consumer_email', v_consumer_email,
      'favorited_at', NEW.created_at
    ),
    FALSE,
    FALSE,
    NOW(),
    NOW()
  );

  -- Also notify location managers if they exist
  INSERT INTO notifications (
    user_id,
    type,
    priority,
    title,
    message,
    location_id,
    tenant_id,
    action_url,
    action_label,
    metadata,
    read,
    archived,
    created_at,
    updated_at
  )
  SELECT 
    m.user_id,
    'LOCATION_FAVORITED'::notification_type,
    'LOW'::notification_priority,
    v_notification_title,
    v_notification_message,
    NEW.location_id,
    v_tenant_id,
    '/dashboard/locations/' || v_location_slug,
    'Bekijk locatie',
    jsonb_build_object(
      'consumer_id', NEW.consumer_id,
      'consumer_name', v_consumer_name,
      'consumer_email', v_consumer_email,
      'favorited_at', NEW.created_at
    ),
    FALSE,
    FALSE,
    NOW(),
    NOW()
  FROM memberships m
  WHERE m.tenant_id = v_tenant_id
    AND m.role IN ('OWNER', 'ADMIN', 'MANAGER')
    AND m.user_id != v_owner_user_id; -- Don't duplicate for owner

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER: Execute notification function on favorite
-- =====================================================

DROP TRIGGER IF EXISTS trigger_notify_location_favorited ON favorites;

CREATE TRIGGER trigger_notify_location_favorited
  AFTER INSERT ON favorites
  FOR EACH ROW
  EXECUTE FUNCTION notify_location_favorited();

-- =====================================================
-- INDEXES for better performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_favorites_location_id ON favorites(location_id);
CREATE INDEX IF NOT EXISTS idx_favorites_consumer_id ON favorites(consumer_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at DESC);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✓ Favorites Notifications System Installed Successfully';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Features enabled:';
  RAISE NOTICE '  ✓ Automatic notifications when location is favorited';
  RAISE NOTICE '  ✓ Notifications sent to location owner and managers';
  RAISE NOTICE '  ✓ Includes consumer information in notification metadata';
  RAISE NOTICE '  ✓ Direct link to location dashboard';
  RAISE NOTICE '';
  RAISE NOTICE 'New notification type added:';
  RAISE NOTICE '  • LOCATION_FAVORITED';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END$$;

