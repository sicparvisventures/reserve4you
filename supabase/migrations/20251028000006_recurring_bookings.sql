-- ============================================================================
-- RESERVE4YOU MULTI-SECTOR EXPANSION - STEP 1.6: RECURRING BOOKINGS TABLES
-- ============================================================================
-- This migration creates tables for recurring bookings/appointments
-- Use cases: Weekly therapy sessions, monthly haircuts, recurring yoga classes
-- Supports: Daily, Weekly, Bi-weekly, Monthly patterns
-- ============================================================================

-- Step 1: Create recurring_booking_patterns table
CREATE TABLE IF NOT EXISTS recurring_booking_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  consumer_id UUID REFERENCES consumers(id) ON DELETE CASCADE,
  service_offering_id UUID REFERENCES service_offerings(id) ON DELETE SET NULL,
  assigned_staff_id UUID REFERENCES resources(id) ON DELETE SET NULL,
  
  -- Pattern details
  pattern_type VARCHAR(20) NOT NULL CHECK (pattern_type IN ('DAILY', 'WEEKLY', 'BI_WEEKLY', 'MONTHLY')),
  interval INT NOT NULL DEFAULT 1 CHECK (interval > 0),
  days_of_week INT[], -- Array: [1,3,5] for Mon/Wed/Fri (1=Monday, 7=Sunday), NULL for daily/monthly
  
  -- Booking template (used to create each instance)
  party_size INT NOT NULL DEFAULT 1,
  duration_minutes INT NOT NULL DEFAULT 60,
  preferred_time TIME NOT NULL, -- e.g., "14:00" for 2 PM appointments
  
  -- End conditions (at least one must be set)
  total_occurrences INT CHECK (total_occurrences IS NULL OR total_occurrences > 0),
  end_date DATE CHECK (end_date IS NULL OR end_date > CURRENT_DATE),
  
  -- Guest info (copied from first booking)
  guest_name VARCHAR(255) NOT NULL,
  guest_phone VARCHAR(20),
  guest_email VARCHAR(255),
  guest_note TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure at least one end condition is set
  CHECK (total_occurrences IS NOT NULL OR end_date IS NOT NULL)
);

-- Step 2: Create recurring_booking_instances table
-- Tracks each individual booking in the recurring series
CREATE TABLE IF NOT EXISTS recurring_booking_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_id UUID NOT NULL REFERENCES recurring_booking_patterns(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  
  -- Scheduled date/time for this instance
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  
  -- Instance status
  was_created BOOLEAN DEFAULT false, -- Has booking been created yet?
  was_modified BOOLEAN DEFAULT false, -- User changed this specific instance?
  was_cancelled BOOLEAN DEFAULT false, -- User cancelled this specific instance?
  was_skipped BOOLEAN DEFAULT false, -- System skipped (e.g., location closed)
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique: only one instance per pattern per date
  UNIQUE(pattern_id, scheduled_date)
);

-- Step 3: Add foreign key from bookings to recurring patterns
-- Link back from bookings.recurring_pattern_id to recurring_booking_patterns.id
ALTER TABLE bookings
  ADD CONSTRAINT fk_bookings_recurring_pattern
  FOREIGN KEY (recurring_pattern_id)
  REFERENCES recurring_booking_patterns(id)
  ON DELETE SET NULL;

-- Step 4: Create indexes for performance

-- Pattern queries
CREATE INDEX IF NOT EXISTS idx_recurring_patterns_location
  ON recurring_booking_patterns(location_id, is_active);

CREATE INDEX IF NOT EXISTS idx_recurring_patterns_consumer
  ON recurring_booking_patterns(consumer_id, is_active)
  WHERE consumer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_recurring_patterns_staff
  ON recurring_booking_patterns(assigned_staff_id)
  WHERE assigned_staff_id IS NOT NULL;

-- Instance queries (find instances that need booking creation)
CREATE INDEX IF NOT EXISTS idx_recurring_instances_pending
  ON recurring_booking_instances(scheduled_date, was_created)
  WHERE was_created = false AND was_cancelled = false;

CREATE INDEX IF NOT EXISTS idx_recurring_instances_pattern
  ON recurring_booking_instances(pattern_id, scheduled_date);

-- Step 5: Add comments for documentation
COMMENT ON TABLE recurring_booking_patterns IS 'Recurring booking patterns: weekly therapy, monthly haircuts, etc.';
COMMENT ON TABLE recurring_booking_instances IS 'Individual instances of recurring bookings';

COMMENT ON COLUMN recurring_booking_patterns.pattern_type IS 'DAILY, WEEKLY, BI_WEEKLY, or MONTHLY';
COMMENT ON COLUMN recurring_booking_patterns.days_of_week IS 'Array of weekday numbers (1=Mon, 7=Sun) for weekly/bi-weekly patterns';
COMMENT ON COLUMN recurring_booking_patterns.total_occurrences IS 'Total number of bookings to create (alternative to end_date)';
COMMENT ON COLUMN recurring_booking_patterns.end_date IS 'Last date to create bookings (alternative to total_occurrences)';

COMMENT ON COLUMN recurring_booking_instances.was_created IS 'True when booking has been created in bookings table';
COMMENT ON COLUMN recurring_booking_instances.was_modified IS 'True if user changed time/date for this specific instance';
COMMENT ON COLUMN recurring_booking_instances.was_cancelled IS 'True if user cancelled this specific instance';

-- Step 6: Enable Row Level Security (RLS)
ALTER TABLE recurring_booking_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_booking_instances ENABLE ROW LEVEL SECURITY;

-- Step 7: RLS Policies for recurring_booking_patterns

-- Consumers can view their own patterns
CREATE POLICY "Consumers can view their own recurring patterns"
  ON recurring_booking_patterns FOR SELECT
  TO authenticated
  USING (consumer_id = (SELECT id FROM consumers WHERE auth_user_id = auth.uid()));

-- Consumers can manage their own patterns
CREATE POLICY "Consumers can manage their own recurring patterns"
  ON recurring_booking_patterns FOR ALL
  TO authenticated
  USING (consumer_id = (SELECT id FROM consumers WHERE auth_user_id = auth.uid()))
  WITH CHECK (consumer_id = (SELECT id FROM consumers WHERE auth_user_id = auth.uid()));

-- Tenant members can view patterns for their locations
CREATE POLICY "Tenant members can view location recurring patterns"
  ON recurring_booking_patterns FOR SELECT
  TO authenticated
  USING (
    location_id IN (
      SELECT l.id FROM locations l
      JOIN tenants t ON t.id = l.tenant_id
      JOIN memberships m ON m.tenant_id = t.id
      WHERE m.user_id = auth.uid()
    )
  );

-- Step 8: RLS Policies for recurring_booking_instances

-- Allow read access to instances via their pattern
CREATE POLICY "Users can view instances of their patterns"
  ON recurring_booking_instances FOR SELECT
  TO authenticated
  USING (
    pattern_id IN (
      SELECT id FROM recurring_booking_patterns
      WHERE consumer_id = (SELECT id FROM consumers WHERE auth_user_id = auth.uid())
    )
    OR
    pattern_id IN (
      SELECT rbp.id FROM recurring_booking_patterns rbp
      JOIN locations l ON l.id = rbp.location_id
      JOIN tenants t ON t.id = l.tenant_id
      JOIN memberships m ON m.tenant_id = t.id
      WHERE m.user_id = auth.uid()
    )
  );

-- Step 9: Add triggers for automatic updated_at
CREATE TRIGGER update_recurring_patterns_updated_at
  BEFORE UPDATE ON recurring_booking_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recurring_instances_updated_at
  BEFORE UPDATE ON recurring_booking_instances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 10: Verification and reporting
DO $$
DECLARE
  patterns_table_exists BOOLEAN;
  instances_table_exists BOOLEAN;
  patterns_index_count INT;
  instances_index_count INT;
  patterns_policy_count INT;
  instances_policy_count INT;
BEGIN
  -- Check if tables exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'recurring_booking_patterns'
  ) INTO patterns_table_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'recurring_booking_instances'
  ) INTO instances_table_exists;
  
  -- Count indexes
  SELECT COUNT(*) INTO patterns_index_count
  FROM pg_indexes 
  WHERE tablename = 'recurring_booking_patterns';
  
  SELECT COUNT(*) INTO instances_index_count
  FROM pg_indexes 
  WHERE tablename = 'recurring_booking_instances';
  
  -- Count RLS policies
  SELECT COUNT(*) INTO patterns_policy_count
  FROM pg_policies 
  WHERE tablename = 'recurring_booking_patterns';
  
  SELECT COUNT(*) INTO instances_policy_count
  FROM pg_policies 
  WHERE tablename = 'recurring_booking_instances';
  
  -- Report results
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ STEP 1.6 COMPLETE: Recurring Bookings Tables Created!';
  RAISE NOTICE '============================================';
  
  IF patterns_table_exists AND instances_table_exists THEN
    RAISE NOTICE '✅ Tables created successfully:';
    RAISE NOTICE '   • recurring_booking_patterns (pattern definitions)';
    RAISE NOTICE '   • recurring_booking_instances (individual occurrences)';
  ELSE
    RAISE EXCEPTION '❌ Not all tables were created';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 Indexes:';
  RAISE NOTICE '   Patterns table: % indexes', patterns_index_count;
  RAISE NOTICE '   Instances table: % indexes', instances_index_count;
  
  RAISE NOTICE '';
  RAISE NOTICE '🔒 RLS Policies:';
  RAISE NOTICE '   Patterns table: % policies', patterns_policy_count;
  RAISE NOTICE '   Instances table: % policies', instances_policy_count;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Foreign key added: bookings.recurring_pattern_id';
  RAISE NOTICE '✅ Auto-update triggers configured';
  
  RAISE NOTICE '';
  RAISE NOTICE '📝 SUPPORTED PATTERNS:';
  RAISE NOTICE '   • DAILY: Every day or every N days';
  RAISE NOTICE '   • WEEKLY: Specific days each week (Mon/Wed/Fri)';
  RAISE NOTICE '   • BI_WEEKLY: Every 2 weeks on specific days';
  RAISE NOTICE '   • MONTHLY: Same date each month';
  
  RAISE NOTICE '';
  RAISE NOTICE '🎯 USE CASES:';
  RAISE NOTICE '   MEDICAL: Weekly physical therapy (8 sessions)';
  RAISE NOTICE '   BEAUTY: Monthly haircut (ongoing)';
  RAISE NOTICE '   FITNESS: Yoga class every Mon/Wed/Fri (3 months)';
  RAISE NOTICE '   THERAPY: Bi-weekly counseling (until June 2025)';
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Ready for intake forms next!';
  RAISE NOTICE '============================================';
END $$;

-- Optional: Sample recurring pattern (COMMENTED OUT)
-- Uncomment to test with sample data
/*
-- Example: Weekly physical therapy (8 sessions total)
INSERT INTO recurring_booking_patterns (
  location_id,
  consumer_id,
  service_offering_id,
  assigned_staff_id,
  pattern_type,
  interval,
  days_of_week,
  party_size,
  duration_minutes,
  preferred_time,
  total_occurrences,
  guest_name,
  guest_email,
  guest_phone
) VALUES (
  (SELECT id FROM locations WHERE business_sector = 'PHYSIOTHERAPY' LIMIT 1),
  (SELECT id FROM consumers LIMIT 1),
  (SELECT id FROM service_offerings WHERE service_type = 'Physio Session' LIMIT 1),
  (SELECT id FROM resources WHERE resource_type = 'STAFF' LIMIT 1),
  'WEEKLY',
  1, -- Every week
  ARRAY[2,4], -- Tuesday and Thursday
  1,
  45,
  '14:00'::TIME,
  8, -- 8 sessions total (4 weeks)
  'John Doe',
  'john@example.com',
  '+32-123-456-789'
);
*/

