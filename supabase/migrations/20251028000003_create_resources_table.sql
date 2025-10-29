-- ============================================================================
-- RESERVE4YOU MULTI-SECTOR EXPANSION - STEP 1.3: CREATE RESOURCES TABLE
-- ============================================================================
-- This migration creates the generic "resources" table
-- Resources = Tables (restaurants) OR Rooms (beauty/medical) OR Staff OR Equipment
-- This allows sector-agnostic resource management
-- NOTE: Existing "tables" table remains for backwards compatibility
-- ============================================================================

-- Step 1: Create resources table
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  resource_type resource_type NOT NULL DEFAULT 'TABLE',
  name VARCHAR(100) NOT NULL,
  capacity INT DEFAULT 1 CHECK (capacity > 0),
  
  -- Flexible metadata for sector-specific properties
  -- For TABLES: {"seats": 4, "min_seats": 2, "max_seats": 6, "is_combinable": true, "position_x": 100, "position_y": 200, "group_id": "outdoor"}
  -- For STAFF: {"specializations": ["haircut", "coloring"], "bio": "10 years experience", "photo_url": "https://...", "email": "staff@example.com"}
  -- For ROOMS: {"equipment": ["massage_table", "aromatherapy"], "dimensions": "3x4m", "floor": 2}
  -- For VEHICLES: {"license_plate": "ABC-123", "brand": "Toyota", "model": "Camry", "year": 2020}
  -- For EQUIPMENT: {"specifications": {...}, "maintenance_date": "2024-01-01"}
  metadata JSONB DEFAULT '{}'::jsonb,
  
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint: same name cannot exist twice per location
  CONSTRAINT resources_location_name_key UNIQUE(location_id, name)
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_resources_location_active 
  ON resources(location_id, is_active);
  
CREATE INDEX IF NOT EXISTS idx_resources_type 
  ON resources(resource_type);

CREATE INDEX IF NOT EXISTS idx_resources_location_type
  ON resources(location_id, resource_type);

-- Step 3: Add comments for documentation
COMMENT ON TABLE resources IS 'Generic resources table for all sectors: tables, rooms, staff, equipment, vehicles, spaces';
COMMENT ON COLUMN resources.resource_type IS 'Type of resource: TABLE, ROOM, STAFF, EQUIPMENT, VEHICLE, SPACE';
COMMENT ON COLUMN resources.name IS 'Display name (e.g., "Table 5", "Dr. Smith", "Treatment Room A")';
COMMENT ON COLUMN resources.capacity IS 'Capacity: seats for tables, max occupancy for rooms, 1 for staff';
COMMENT ON COLUMN resources.metadata IS 'Flexible JSONB field for sector-specific properties';

-- Step 4: Enable Row Level Security (RLS)
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Step 5: RLS Policies

-- Policy 1: Public can view active resources
CREATE POLICY "Public can view active resources"
  ON resources FOR SELECT
  TO public
  USING (is_active = true);

-- Policy 2: Authenticated users can view all resources
CREATE POLICY "Authenticated users can view all resources"
  ON resources FOR SELECT
  TO authenticated
  USING (true);

-- Policy 3: Tenant members can manage their resources
CREATE POLICY "Tenant members can manage resources"
  ON resources FOR ALL
  TO authenticated
  USING (
    location_id IN (
      SELECT l.id FROM locations l
      JOIN tenants t ON t.id = l.tenant_id
      JOIN memberships m ON m.tenant_id = t.id
      WHERE m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    location_id IN (
      SELECT l.id FROM locations l
      JOIN tenants t ON t.id = l.tenant_id
      JOIN memberships m ON m.tenant_id = t.id
      WHERE m.user_id = auth.uid()
    )
  );

-- Step 6: Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Add trigger for automatic updated_at
CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 8: Verification and reporting
DO $$
DECLARE
  table_exists BOOLEAN;
  index_count INT;
  policy_count INT;
BEGIN
  -- Check if table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'resources'
  ) INTO table_exists;
  
  -- Count indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes 
  WHERE tablename = 'resources';
  
  -- Count RLS policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'resources';
  
  -- Report results
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ STEP 1.3 COMPLETE: Resources Table Created!';
  RAISE NOTICE '============================================';
  
  IF table_exists THEN
    RAISE NOTICE '✅ Table "resources" created successfully';
    RAISE NOTICE '   - Supports 6 resource types: TABLE, ROOM, STAFF, EQUIPMENT, VEHICLE, SPACE';
    RAISE NOTICE '   - Flexible metadata (JSONB) for sector-specific properties';
    RAISE NOTICE '   - Unique constraint on (location_id, name)';
  ELSE
    RAISE EXCEPTION '❌ Table "resources" was not created';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 Indexes created: %', index_count;
  RAISE NOTICE '🔒 RLS policies created: %', policy_count;
  RAISE NOTICE '✅ Row Level Security enabled';
  RAISE NOTICE '✅ Auto-update trigger configured';
  
  RAISE NOTICE '';
  RAISE NOTICE '📝 NOTES:';
  RAISE NOTICE '   - Existing "tables" table remains for backwards compatibility';
  RAISE NOTICE '   - New sectors (Beauty, Medical, etc.) will use "resources"';
  RAISE NOTICE '   - Restaurants can continue using "tables" or migrate to "resources"';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Ready to create service offerings next!';
  RAISE NOTICE '============================================';
END $$;

-- Optional: Insert sample resources for testing (COMMENTED OUT)
-- Uncomment these if you want to test with sample data
/*
-- Sample TABLE resource (restaurant)
INSERT INTO resources (location_id, resource_type, name, capacity, metadata)
VALUES (
  (SELECT id FROM locations WHERE business_sector = 'RESTAURANT' LIMIT 1),
  'TABLE',
  'Table 1',
  4,
  '{"seats": 4, "min_seats": 2, "max_seats": 4, "position_x": 100, "position_y": 100}'::jsonb
);

-- Sample STAFF resource (beauty salon)
INSERT INTO resources (location_id, resource_type, name, capacity, metadata)
VALUES (
  (SELECT id FROM locations WHERE business_sector = 'BEAUTY_SALON' LIMIT 1),
  'STAFF',
  'Sarah (Hairstylist)',
  1,
  '{"specializations": ["haircut", "coloring", "styling"], "bio": "10+ years experience", "email": "sarah@salon.com"}'::jsonb
);

-- Sample ROOM resource (medical)
INSERT INTO resources (location_id, resource_type, name, capacity, metadata)
VALUES (
  (SELECT id FROM locations WHERE business_sector = 'MEDICAL_PRACTICE' LIMIT 1),
  'ROOM',
  'Consultation Room 1',
  1,
  '{"equipment": ["exam_table", "computer", "stethoscope"], "floor": 1}'::jsonb
);
*/

