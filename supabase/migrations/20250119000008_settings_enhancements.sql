-- ============================================
-- SETTINGS ENHANCEMENTS MIGRATION
-- ============================================
-- This migration ensures all settings-related fields exist
-- and adds any missing columns for the comprehensive settings page

-- 1. Ensure tenants table has all necessary fields
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS brand_color VARCHAR(7) DEFAULT '#FF5A5F',
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 2. Ensure locations table has all necessary fields
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS website VARCHAR(255),
ADD COLUMN IF NOT EXISTS slot_minutes INT DEFAULT 90,
ADD COLUMN IF NOT EXISTS buffer_minutes INT DEFAULT 15,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 3. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_locations_tenant_active ON locations(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_locations_public ON locations(is_public);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant ON memberships(tenant_id);

-- 4. Update existing NULL values
UPDATE locations SET 
  slot_minutes = 90 
WHERE slot_minutes IS NULL;

UPDATE locations SET 
  buffer_minutes = 15 
WHERE buffer_minutes IS NULL;

UPDATE locations SET 
  is_active = true 
WHERE is_active IS NULL;

UPDATE tenants SET 
  brand_color = '#FF5A5F' 
WHERE brand_color IS NULL OR brand_color = '';

-- 5. Add constraints
ALTER TABLE locations
ALTER COLUMN slot_minutes SET NOT NULL,
ALTER COLUMN buffer_minutes SET NOT NULL,
ALTER COLUMN is_active SET NOT NULL;

ALTER TABLE locations
ADD CONSTRAINT check_slot_minutes CHECK (slot_minutes >= 15 AND slot_minutes <= 480),
ADD CONSTRAINT check_buffer_minutes CHECK (buffer_minutes >= 0 AND buffer_minutes <= 60);

-- 6. Comments for documentation
COMMENT ON COLUMN tenants.brand_color IS 'Hex color code for brand identity (e.g., #FF5A5F)';
COMMENT ON COLUMN tenants.logo_url IS 'URL to uploaded logo image';
COMMENT ON COLUMN locations.website IS 'Restaurant website URL';
COMMENT ON COLUMN locations.slot_minutes IS 'Default reservation duration in minutes (15-480)';
COMMENT ON COLUMN locations.buffer_minutes IS 'Time buffer between reservations in minutes (0-60)';
COMMENT ON COLUMN locations.is_active IS 'Whether location is operationally active';

-- 7. Create function to get complete location settings
CREATE OR REPLACE FUNCTION get_location_settings(p_location_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'location', json_build_object(
      'id', l.id,
      'name', l.name,
      'slug', l.slug,
      'description', l.description,
      'cuisine', l.cuisine,
      'price_range', l.price_range,
      'address_json', l.address_json,
      'phone', l.phone,
      'email', l.email,
      'website', l.website,
      'opening_hours_json', l.opening_hours_json,
      'slot_minutes', l.slot_minutes,
      'buffer_minutes', l.buffer_minutes,
      'is_public', l.is_public,
      'is_active', l.is_active,
      'image_url', l.image_url,
      'image_public_id', l.image_public_id
    ),
    'tables', (
      SELECT json_agg(json_build_object(
        'id', t.id,
        'name', t.name,
        'seats', t.seats,
        'is_combinable', t.is_combinable,
        'group_id', t.group_id
      ))
      FROM tables t
      WHERE t.location_id = l.id
      AND t.is_active = true
    ),
    'shifts', (
      SELECT json_agg(json_build_object(
        'id', s.id,
        'name', s.name,
        'start_time', s.start_time,
        'end_time', s.end_time,
        'days_of_week', s.days_of_week,
        'max_parallel', s.max_parallel
      ))
      FROM shifts s
      WHERE s.location_id = l.id
      AND s.is_active = true
    )
  ) INTO v_result
  FROM locations l
  WHERE l.id = p_location_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_location_settings IS 'Get complete settings data for a location including tables and shifts';

-- 8. Create function to validate tenant settings
CREATE OR REPLACE FUNCTION validate_tenant_settings(p_tenant_id UUID)
RETURNS TABLE(
  is_valid BOOLEAN,
  missing_fields TEXT[],
  warnings TEXT[]
) AS $$
DECLARE
  v_missing TEXT[] := ARRAY[]::TEXT[];
  v_warnings TEXT[] := ARRAY[]::TEXT[];
  v_tenant RECORD;
  v_location_count INT;
BEGIN
  -- Get tenant data
  SELECT * INTO v_tenant FROM tenants WHERE id = p_tenant_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, ARRAY['Tenant not found'], ARRAY[]::TEXT[];
    RETURN;
  END IF;
  
  -- Check required tenant fields
  IF v_tenant.name IS NULL OR v_tenant.name = '' THEN
    v_missing := array_append(v_missing, 'tenant.name');
  END IF;
  
  -- Check locations
  SELECT COUNT(*) INTO v_location_count FROM locations WHERE tenant_id = p_tenant_id;
  
  IF v_location_count = 0 THEN
    v_warnings := array_append(v_warnings, 'No locations configured');
  END IF;
  
  -- Check if at least one location is public
  IF v_location_count > 0 THEN
    IF NOT EXISTS (SELECT 1 FROM locations WHERE tenant_id = p_tenant_id AND is_public = true) THEN
      v_warnings := array_append(v_warnings, 'No public locations (reservations disabled)');
    END IF;
  END IF;
  
  RETURN QUERY SELECT 
    (array_length(v_missing, 1) IS NULL), 
    v_missing,
    v_warnings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validate_tenant_settings IS 'Validate tenant configuration and return missing fields and warnings';

-- 9. Create view for settings overview
CREATE OR REPLACE VIEW v_settings_overview AS
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  t.brand_color,
  t.logo_url,
  COUNT(DISTINCT l.id) as location_count,
  COUNT(DISTINCT l.id) FILTER (WHERE l.is_public = true) as public_location_count,
  COUNT(DISTINCT m.id) as team_member_count,
  b.plan as billing_plan,
  b.status as billing_status,
  t.created_at,
  t.updated_at
FROM tenants t
LEFT JOIN locations l ON l.tenant_id = t.id
LEFT JOIN memberships m ON m.tenant_id = t.id
LEFT JOIN billing_state b ON b.tenant_id = t.id
GROUP BY t.id, t.name, t.brand_color, t.logo_url, t.created_at, t.updated_at, b.plan, b.status;

COMMENT ON VIEW v_settings_overview IS 'Overview of tenant settings and configuration status';

-- 10. Grant permissions
GRANT SELECT ON v_settings_overview TO authenticated;
GRANT EXECUTE ON FUNCTION get_location_settings TO authenticated;
GRANT EXECUTE ON FUNCTION validate_tenant_settings TO authenticated;

-- 11. Verification queries
SELECT 
  'Tenants with complete settings' as check_name,
  COUNT(*) as count
FROM tenants
WHERE name IS NOT NULL 
  AND name != '' 
  AND brand_color IS NOT NULL;

SELECT 
  'Locations with complete settings' as check_name,
  COUNT(*) as count
FROM locations
WHERE name IS NOT NULL 
  AND slug IS NOT NULL
  AND address_json IS NOT NULL
  AND slot_minutes IS NOT NULL
  AND buffer_minutes IS NOT NULL;

-- Done!
SELECT '✅ Settings enhancements migration completed successfully!' as status;

