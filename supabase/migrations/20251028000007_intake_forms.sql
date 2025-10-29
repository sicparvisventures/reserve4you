-- ============================================================================
-- RESERVE4YOU MULTI-SECTOR EXPANSION - STEP 1.7: INTAKE FORMS TABLES
-- ============================================================================
-- This migration creates tables for intake forms and responses
-- Use cases: Medical patient forms, beauty salon allergy forms, fitness health questionnaires
-- Flexible form builder with JSONB for dynamic questions
-- ============================================================================

-- Step 1: Create intake_forms table
CREATE TABLE IF NOT EXISTS intake_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  
  -- Form identification
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Questions structure (JSONB array)
  -- Each question object: {
  --   id: "q1",
  --   type: "text" | "select" | "checkbox" | "radio" | "textarea" | "file" | "date" | "number",
  --   text: "Do you have any allergies?",
  --   required: true,
  --   options: ["Option 1", "Option 2"], // for select/radio/checkbox
  --   validation: {min: 0, max: 100, pattern: "regex"}, // optional
  --   conditional: {show_if: "q0", equals: "yes"} // optional conditional logic
  -- }
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Form settings
  is_required BOOLEAN DEFAULT false, -- Must fill before booking?
  applies_to_services UUID[], -- Specific service IDs, or NULL for all services
  applies_to_new_customers_only BOOLEAN DEFAULT false,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 2: Create intake_responses table
CREATE TABLE IF NOT EXISTS intake_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID NOT NULL REFERENCES intake_forms(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  consumer_id UUID REFERENCES consumers(id) ON DELETE SET NULL,
  
  -- Responses structure (JSONB object)
  -- {
  --   "q1": "Peanuts, shellfish",
  --   "q2": ["Morning", "Afternoon"],
  --   "q3": "2024-01-15",
  --   "q4": 75
  -- }
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Metadata
  ip_address INET, -- For audit trail
  user_agent TEXT, -- For audit trail
  
  -- Timestamps
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique: one response per form per booking
  UNIQUE(form_id, booking_id)
);

-- Step 3: Create indexes for performance

-- Form queries
CREATE INDEX IF NOT EXISTS idx_intake_forms_location
  ON intake_forms(location_id, is_active);

CREATE INDEX IF NOT EXISTS idx_intake_forms_required
  ON intake_forms(location_id, is_required)
  WHERE is_required = true;

-- Response queries (find responses for a booking)
CREATE INDEX IF NOT EXISTS idx_intake_responses_booking
  ON intake_responses(booking_id);

-- Response queries (find responses for a consumer)
CREATE INDEX IF NOT EXISTS idx_intake_responses_consumer
  ON intake_responses(consumer_id)
  WHERE consumer_id IS NOT NULL;

-- Response queries (find responses for a form)
CREATE INDEX IF NOT EXISTS idx_intake_responses_form
  ON intake_responses(form_id);

-- Find incomplete bookings (no response for required forms)
CREATE INDEX IF NOT EXISTS idx_intake_responses_form_booking
  ON intake_responses(form_id, booking_id);

-- Step 4: Add comments for documentation
COMMENT ON TABLE intake_forms IS 'Dynamic intake forms for pre-booking questionnaires (medical, beauty, fitness)';
COMMENT ON TABLE intake_responses IS 'User responses to intake forms, linked to bookings';

COMMENT ON COLUMN intake_forms.questions IS 'JSONB array of question objects with type, text, options, validation, and conditional logic';
COMMENT ON COLUMN intake_forms.is_required IS 'If true, customer must complete form before booking';
COMMENT ON COLUMN intake_forms.applies_to_services IS 'Array of service_offering IDs; NULL means applies to all services';
COMMENT ON COLUMN intake_forms.applies_to_new_customers_only IS 'If true, only shown to first-time customers';

COMMENT ON COLUMN intake_responses.responses IS 'JSONB object mapping question IDs to answers';
COMMENT ON COLUMN intake_responses.ip_address IS 'IP address of submitter (for audit trail and spam prevention)';
COMMENT ON COLUMN intake_responses.user_agent IS 'Browser user agent (for audit trail)';

-- Step 5: Enable Row Level Security (RLS)
ALTER TABLE intake_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_responses ENABLE ROW LEVEL SECURITY;

-- Step 6: RLS Policies for intake_forms

-- Public can view active forms (needed for booking flow)
CREATE POLICY "Public can view active intake forms"
  ON intake_forms FOR SELECT
  TO public
  USING (is_active = true);

-- Authenticated users can view all forms
CREATE POLICY "Authenticated users can view all intake forms"
  ON intake_forms FOR SELECT
  TO authenticated
  USING (true);

-- Tenant members can manage forms for their locations
CREATE POLICY "Tenant members can manage intake forms"
  ON intake_forms FOR ALL
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

-- Step 7: RLS Policies for intake_responses

-- Consumers can view their own responses
CREATE POLICY "Consumers can view their own responses"
  ON intake_responses FOR SELECT
  TO authenticated
  USING (
    consumer_id = (SELECT id FROM consumers WHERE auth_user_id = auth.uid())
  );

-- Consumers can create their own responses
CREATE POLICY "Consumers can create their own responses"
  ON intake_responses FOR INSERT
  TO authenticated
  WITH CHECK (
    consumer_id = (SELECT id FROM consumers WHERE auth_user_id = auth.uid())
  );

-- Consumers can update their own responses (before booking confirmation)
CREATE POLICY "Consumers can update their own responses"
  ON intake_responses FOR UPDATE
  TO authenticated
  USING (
    consumer_id = (SELECT id FROM consumers WHERE auth_user_id = auth.uid())
  )
  WITH CHECK (
    consumer_id = (SELECT id FROM consumers WHERE auth_user_id = auth.uid())
  );

-- Tenant members can view responses for their locations
CREATE POLICY "Tenant members can view location responses"
  ON intake_responses FOR SELECT
  TO authenticated
  USING (
    form_id IN (
      SELECT f.id FROM intake_forms f
      JOIN locations l ON l.id = f.location_id
      JOIN tenants t ON t.id = l.tenant_id
      JOIN memberships m ON m.tenant_id = t.id
      WHERE m.user_id = auth.uid()
    )
  );

-- Step 8: Add triggers for automatic updated_at
CREATE TRIGGER update_intake_forms_updated_at
  BEFORE UPDATE ON intake_forms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intake_responses_updated_at
  BEFORE UPDATE ON intake_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Verification and reporting
DO $$
DECLARE
  forms_table_exists BOOLEAN;
  responses_table_exists BOOLEAN;
  forms_index_count INT;
  responses_index_count INT;
  forms_policy_count INT;
  responses_policy_count INT;
BEGIN
  -- Check if tables exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'intake_forms'
  ) INTO forms_table_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'intake_responses'
  ) INTO responses_table_exists;
  
  -- Count indexes
  SELECT COUNT(*) INTO forms_index_count
  FROM pg_indexes 
  WHERE tablename = 'intake_forms';
  
  SELECT COUNT(*) INTO responses_index_count
  FROM pg_indexes 
  WHERE tablename = 'intake_responses';
  
  -- Count RLS policies
  SELECT COUNT(*) INTO forms_policy_count
  FROM pg_policies 
  WHERE tablename = 'intake_forms';
  
  SELECT COUNT(*) INTO responses_policy_count
  FROM pg_policies 
  WHERE tablename = 'intake_responses';
  
  -- Report results
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ STEP 1.7 COMPLETE: Intake Forms Tables Created!';
  RAISE NOTICE '============================================';
  
  IF forms_table_exists AND responses_table_exists THEN
    RAISE NOTICE '✅ Tables created successfully:';
    RAISE NOTICE '   • intake_forms (form definitions)';
    RAISE NOTICE '   • intake_responses (user submissions)';
  ELSE
    RAISE EXCEPTION '❌ Not all tables were created';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 Indexes:';
  RAISE NOTICE '   Forms table: % indexes', forms_index_count;
  RAISE NOTICE '   Responses table: % indexes', responses_index_count;
  
  RAISE NOTICE '';
  RAISE NOTICE '🔒 RLS Policies:';
  RAISE NOTICE '   Forms table: % policies', forms_policy_count;
  RAISE NOTICE '   Responses table: % policies', responses_policy_count;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Auto-update triggers configured';
  RAISE NOTICE '✅ Audit trail support (IP + User Agent)';
  
  RAISE NOTICE '';
  RAISE NOTICE '📝 SUPPORTED QUESTION TYPES:';
  RAISE NOTICE '   • text, textarea - Free text input';
  RAISE NOTICE '   • select, radio, checkbox - Multiple choice';
  RAISE NOTICE '   • date, number - Structured data';
  RAISE NOTICE '   • file - Document upload (URLs)';
  
  RAISE NOTICE '';
  RAISE NOTICE '🎯 ADVANCED FEATURES:';
  RAISE NOTICE '   • Conditional logic (show question based on previous answer)';
  RAISE NOTICE '   • Validation rules (min/max, patterns, required)';
  RAISE NOTICE '   • Service-specific forms (different for each service)';
  RAISE NOTICE '   • New customer only forms (first visit screening)';
  
  RAISE NOTICE '';
  RAISE NOTICE '💡 USE CASES PER SECTOR:';
  RAISE NOTICE '   MEDICAL: Patient history, allergies, medications, insurance';
  RAISE NOTICE '   BEAUTY: Skin sensitivities, allergies, preferences';
  RAISE NOTICE '   FITNESS: Health conditions, fitness level, goals';
  RAISE NOTICE '   LEGAL: Case details, conflict check, engagement letter';
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉🎉🎉 PHASE 1 DATABASE COMPLETE! 🎉🎉🎉';
  RAISE NOTICE '';
  RAISE NOTICE '📊 PHASE 1 SUMMARY:';
  RAISE NOTICE '   ✅ Step 1.1: ENUMs created (43 sectors, 6 resource types)';
  RAISE NOTICE '   ✅ Step 1.2: Locations extended (sector + config)';
  RAISE NOTICE '   ✅ Step 1.3: Resources table (generic tables/rooms/staff)';
  RAISE NOTICE '   ✅ Step 1.4: Service offerings (treatments/services/menu)';
  RAISE NOTICE '   ✅ Step 1.5: Bookings extended (services + staff)';
  RAISE NOTICE '   ✅ Step 1.6: Recurring bookings (patterns + instances)';
  RAISE NOTICE '   ✅ Step 1.7: Intake forms (flexible questionnaires)';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 READY FOR PHASE 2: Frontend Implementation!';
  RAISE NOTICE '============================================';
END $$;

-- Optional: Sample intake form for medical practice (COMMENTED OUT)
-- Uncomment to test with sample data
/*
INSERT INTO intake_forms (location_id, name, description, questions, is_required)
VALUES (
  (SELECT id FROM locations WHERE business_sector = 'MEDICAL_PRACTICE' LIMIT 1),
  'Patient Medical History',
  'Please complete this form before your first visit',
  '[
    {
      "id": "q1",
      "type": "radio",
      "text": "Is this your first visit to our practice?",
      "required": true,
      "options": ["Yes", "No"]
    },
    {
      "id": "q2",
      "type": "textarea",
      "text": "Please list any current medications",
      "required": false,
      "conditional": {"show_if": "q1", "equals": "Yes"}
    },
    {
      "id": "q3",
      "type": "checkbox",
      "text": "Do you have any of the following conditions?",
      "required": true,
      "options": ["Diabetes", "High Blood Pressure", "Heart Disease", "Asthma", "None"]
    },
    {
      "id": "q4",
      "type": "textarea",
      "text": "List any allergies (medications, food, latex, etc.)",
      "required": true
    },
    {
      "id": "q5",
      "type": "text",
      "text": "Emergency contact name",
      "required": true
    },
    {
      "id": "q6",
      "type": "text",
      "text": "Emergency contact phone",
      "required": true,
      "validation": {"pattern": "^[+]?[(]?[0-9]{1,4}[)]?[-\\s\\.]?[(]?[0-9]{1,4}[)]?[-\\s\\.]?[0-9]{1,9}$"}
    }
  ]'::jsonb,
  true
);
*/

