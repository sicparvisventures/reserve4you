-- ============================================================================
-- RESERVE4YOU MULTI-SECTOR EXPANSION - STEP 1.5: EXTEND BOOKINGS TABLE (FIXED)
-- ============================================================================
-- This migration extends the bookings table for multi-sector support
-- Adds: service_offering_id, assigned_staff_id, recurring_pattern_id
-- Enables: Service-based bookings, staff assignments, recurring appointments
-- 100% BACKWARDS COMPATIBLE - existing restaurant bookings unaffected
-- FIXED: Removed references to non-existent columns
-- ============================================================================

-- Step 1: Add new columns to bookings table
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS service_offering_id UUID REFERENCES service_offerings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_staff_id UUID REFERENCES resources(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recurring_pattern_id UUID; -- Will be linked later in Step 1.6

-- Step 2: Add column comments for documentation
COMMENT ON COLUMN bookings.service_offering_id IS 'The specific service being booked (haircut, massage, consultation, menu item, etc.)';
COMMENT ON COLUMN bookings.assigned_staff_id IS 'The specific staff member assigned to this booking (hairdresser, doctor, trainer, etc.)';
COMMENT ON COLUMN bookings.recurring_pattern_id IS 'Links to recurring_booking_patterns if this is part of a recurring series';

-- Step 3: Create indexes for performance (without referencing specific time columns)

-- Index for service queries (find all bookings for a service)
CREATE INDEX IF NOT EXISTS idx_bookings_service 
  ON bookings(service_offering_id)
  WHERE service_offering_id IS NOT NULL;

-- Index for staff assignment queries (find all bookings for a staff member)
CREATE INDEX IF NOT EXISTS idx_bookings_assigned_staff 
  ON bookings(assigned_staff_id)
  WHERE assigned_staff_id IS NOT NULL;

-- Index for recurring bookings
CREATE INDEX IF NOT EXISTS idx_bookings_recurring_pattern
  ON bookings(recurring_pattern_id)
  WHERE recurring_pattern_id IS NOT NULL;

-- Composite index for location + staff (for staff scheduling)
CREATE INDEX IF NOT EXISTS idx_bookings_location_staff
  ON bookings(location_id, assigned_staff_id)
  WHERE assigned_staff_id IS NOT NULL;

-- Step 4: Verification and reporting
DO $$
DECLARE
  column_count INT;
  index_count INT;
  total_bookings INT;
  bookings_with_service INT;
  bookings_with_staff INT;
BEGIN
  -- Count new columns
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns 
  WHERE table_name = 'bookings' 
  AND column_name IN ('service_offering_id', 'assigned_staff_id', 'recurring_pattern_id');
  
  -- Count new indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes 
  WHERE tablename = 'bookings'
  AND (indexname LIKE '%service%' OR indexname LIKE '%staff%' OR indexname LIKE '%recurring%');
  
  -- Count bookings
  SELECT COUNT(*) INTO total_bookings FROM bookings;
  SELECT COUNT(*) INTO bookings_with_service FROM bookings WHERE service_offering_id IS NOT NULL;
  SELECT COUNT(*) INTO bookings_with_staff FROM bookings WHERE assigned_staff_id IS NOT NULL;
  
  -- Report results
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ STEP 1.5 COMPLETE: Bookings Table Extended!';
  RAISE NOTICE '============================================';
  
  IF column_count >= 3 THEN
    RAISE NOTICE '✅ Added 3 new columns to bookings:';
    RAISE NOTICE '   • service_offering_id - Link to specific service';
    RAISE NOTICE '   • assigned_staff_id - Staff member assignment';
    RAISE NOTICE '   • recurring_pattern_id - Recurring bookings support';
  ELSE
    RAISE EXCEPTION '❌ Not all columns were added (found: %)', column_count;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 Statistics:';
  RAISE NOTICE '   Total bookings: %', total_bookings;
  RAISE NOTICE '   Bookings with service: %', bookings_with_service;
  RAISE NOTICE '   Bookings with staff: %', bookings_with_staff;
  
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Indexes created: % new indexes', index_count;
  RAISE NOTICE '   • Service queries optimized';
  RAISE NOTICE '   • Staff scheduling optimized';
  RAISE NOTICE '   • Recurring bookings supported';
  
  RAISE NOTICE '';
  RAISE NOTICE '📝 BACKWARDS COMPATIBILITY:';
  RAISE NOTICE '   • All existing bookings work unchanged';
  RAISE NOTICE '   • New columns are NULL for existing bookings';
  RAISE NOTICE '   • Restaurants can continue as before';
  RAISE NOTICE '   • New sectors use service_offering_id + assigned_staff_id';
  
  RAISE NOTICE '';
  RAISE NOTICE '🎯 NEXT USE CASES ENABLED:';
  RAISE NOTICE '   BEAUTY: Book "Haircut with Sarah" (service + staff)';
  RAISE NOTICE '   MEDICAL: Book "Consultation with Dr. Smith" (service + staff)';
  RAISE NOTICE '   FITNESS: Book "Yoga Class" (service, optional staff)';
  RAISE NOTICE '   RESTAURANT: Book table (existing flow unchanged)';
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Ready for recurring bookings next!';
  RAISE NOTICE '============================================';
END $$;

-- Optional: Check existing bookings compatibility
-- Uncomment to see sample of existing bookings and verify they still work
/*
SELECT 
  id,
  location_id,
  table_id, -- Existing (restaurants)
  service_offering_id, -- New (will be NULL for existing)
  assigned_staff_id, -- New (will be NULL for existing)
  guest_name,
  party_size,
  status
FROM bookings
ORDER BY created_at DESC
LIMIT 5;
*/

