-- ============================================================================
-- RESERVE4YOU MULTI-SECTOR EXPANSION - STEP 1.4: CREATE SERVICE OFFERINGS TABLE
-- ============================================================================
-- This migration creates the service_offerings table
-- Service Offerings = Menu items (restaurants) OR Treatments (beauty) OR Consultations (medical) OR Classes (fitness)
-- Replaces sector-specific "menu_items" with universal "service_offerings"
-- ============================================================================

-- Step 1: Create service_offerings table
CREATE TABLE IF NOT EXISTS service_offerings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  
  -- Service identification
  service_type VARCHAR(100) NOT NULL, -- e.g., "Haircut", "Massage", "Medical Consultation", "Yoga Class", "Main Course"
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Timing and pricing
  duration_minutes INT NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
  price_cents INT CHECK (price_cents >= 0),
  
  -- Categorization
  category VARCHAR(100), -- e.g., "Hair", "Nails", "Spa" (beauty) OR "Cardiology", "General" (medical) OR "Starters", "Mains" (restaurant)
  
  -- Staff requirements
  requires_specific_staff BOOLEAN DEFAULT false,
  staff_ids UUID[], -- Array of resource IDs (staff members who can perform this service)
  
  -- Flexible metadata for sector-specific properties
  -- For BEAUTY: {"preparation_time": 5, "requires_equipment": ["massage_table"], "commission_percentage": 40}
  -- For MEDICAL: {"requires_insurance": true, "cpt_code": "99213", "follow_up_days": 30}
  -- For FITNESS: {"max_participants": 15, "difficulty_level": "intermediate", "equipment_needed": ["yoga_mat"]}
  -- For RESTAURANT: {"allergens": ["nuts", "dairy"], "dietary_tags": ["vegetarian", "gluten-free"], "course": "main"}
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Availability
  is_available BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  
  -- Image
  image_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_offerings_location 
  ON service_offerings(location_id, is_available);
  
CREATE INDEX IF NOT EXISTS idx_service_offerings_category 
  ON service_offerings(category);

CREATE INDEX IF NOT EXISTS idx_service_offerings_type
  ON service_offerings(service_type);

CREATE INDEX IF NOT EXISTS idx_service_offerings_location_category
  ON service_offerings(location_id, category, is_available);

-- Step 3: Add comments for documentation
COMMENT ON TABLE service_offerings IS 'Universal service offerings: menu items (restaurant), treatments (beauty), consultations (medical), classes (fitness)';
COMMENT ON COLUMN service_offerings.service_type IS 'Type of service: Haircut, Massage, Consultation, Yoga Class, Dish, etc.';
COMMENT ON COLUMN service_offerings.duration_minutes IS 'Service duration in minutes (e.g., 30min haircut, 60min massage, 15min consultation)';
COMMENT ON COLUMN service_offerings.requires_specific_staff IS 'If true, only staff members in staff_ids array can perform this service';
COMMENT ON COLUMN service_offerings.staff_ids IS 'Array of resource IDs (staff) who can perform this service';
COMMENT ON COLUMN service_offerings.metadata IS 'Flexible JSONB field for sector-specific properties';

-- Step 4: Enable Row Level Security (RLS)
ALTER TABLE service_offerings ENABLE ROW LEVEL SECURITY;

-- Step 5: RLS Policies

-- Policy 1: Public can view available services
CREATE POLICY "Public can view available services"
  ON service_offerings FOR SELECT
  TO public
  USING (is_available = true);

-- Policy 2: Authenticated users can view all services
CREATE POLICY "Authenticated users can view all services"
  ON service_offerings FOR SELECT
  TO authenticated
  USING (true);

-- Policy 3: Tenant members can manage their services
CREATE POLICY "Tenant members can manage services"
  ON service_offerings FOR ALL
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

-- Step 6: Add trigger for automatic updated_at
CREATE TRIGGER update_service_offerings_updated_at
  BEFORE UPDATE ON service_offerings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Verification and reporting
DO $$
DECLARE
  table_exists BOOLEAN;
  index_count INT;
  policy_count INT;
BEGIN
  -- Check if table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'service_offerings'
  ) INTO table_exists;
  
  -- Count indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes 
  WHERE tablename = 'service_offerings';
  
  -- Count RLS policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'service_offerings';
  
  -- Report results
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ STEP 1.4 COMPLETE: Service Offerings Table Created!';
  RAISE NOTICE '============================================';
  
  IF table_exists THEN
    RAISE NOTICE '✅ Table "service_offerings" created successfully';
    RAISE NOTICE '   - Supports all service types: Treatments, Consultations, Classes, Menu Items';
    RAISE NOTICE '   - Duration-based scheduling (haircut 30min, massage 60min, etc.)';
    RAISE NOTICE '   - Staff assignment support (specific staff per service)';
    RAISE NOTICE '   - Flexible metadata (JSONB) for sector-specific properties';
  ELSE
    RAISE EXCEPTION '❌ Table "service_offerings" was not created';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 Indexes created: %', index_count;
  RAISE NOTICE '🔒 RLS policies created: %', policy_count;
  RAISE NOTICE '✅ Row Level Security enabled';
  RAISE NOTICE '✅ Auto-update trigger configured';
  
  RAISE NOTICE '';
  RAISE NOTICE '📝 EXAMPLES PER SECTOR:';
  RAISE NOTICE '   BEAUTY: Haircut (30min, €35), Massage (60min, €65)';
  RAISE NOTICE '   MEDICAL: General Consultation (15min, €50), Physio Session (45min, €45)';
  RAISE NOTICE '   FITNESS: Yoga Class (60min, €15), Personal Training (45min, €60)';
  RAISE NOTICE '   RESTAURANT: Steak (€28), Pasta (€18) - with duration for table turnover';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Ready to extend bookings table next!';
  RAISE NOTICE '============================================';
END $$;

-- Optional: Insert sample service offerings for testing (COMMENTED OUT)
-- Uncomment these if you want to test with sample data
/*
-- Sample BEAUTY service
INSERT INTO service_offerings (location_id, service_type, name, description, duration_minutes, price_cents, category, metadata)
VALUES (
  (SELECT id FROM locations WHERE business_sector = 'BEAUTY_SALON' LIMIT 1),
  'Haircut',
  'Women''s Haircut & Blow Dry',
  'Professional haircut with styling and blow dry',
  60,
  3500,
  'Hair',
  '{"preparation_time": 5, "requires_equipment": ["scissors", "blow_dryer"], "commission_percentage": 40}'::jsonb
);

-- Sample MEDICAL service
INSERT INTO service_offerings (location_id, service_type, name, description, duration_minutes, price_cents, category, requires_specific_staff)
VALUES (
  (SELECT id FROM locations WHERE business_sector = 'MEDICAL_PRACTICE' LIMIT 1),
  'Medical Consultation',
  'General Consultation',
  'General medical consultation and examination',
  15,
  5000,
  'General Practice',
  true
);

-- Sample FITNESS service
INSERT INTO service_offerings (location_id, service_type, name, description, duration_minutes, price_cents, category, metadata)
VALUES (
  (SELECT id FROM locations WHERE business_sector = 'YOGA_STUDIO' LIMIT 1),
  'Yoga Class',
  'Vinyasa Flow - Intermediate',
  'Dynamic yoga flow for intermediate practitioners',
  60,
  1500,
  'Yoga',
  '{"max_participants": 15, "difficulty_level": "intermediate", "equipment_needed": ["yoga_mat"]}'::jsonb
);

-- Sample RESTAURANT menu item (using service_offerings)
INSERT INTO service_offerings (location_id, service_type, name, description, duration_minutes, price_cents, category, metadata)
VALUES (
  (SELECT id FROM locations WHERE business_sector = 'RESTAURANT' LIMIT 1),
  'Main Course',
  'Grilled Salmon',
  'Fresh Atlantic salmon with seasonal vegetables',
  0, -- Duration not critical for restaurant menu items
  2450,
  'Mains',
  '{"allergens": ["fish"], "dietary_tags": ["gluten-free"], "course": "main"}'::jsonb
);
*/

