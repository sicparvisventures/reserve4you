-- ============================================================================
-- RESERVE4YOU MULTI-SECTOR EXPANSION - STEP 1.1: CREATE ENUMS
-- ============================================================================
-- This migration adds the business_sector and resource_type ENUMs
-- Required for multi-sector support without breaking existing functionality
-- ============================================================================

-- Business sectors ENUM
-- Defines all supported business types in Reserve4You
CREATE TYPE business_sector AS ENUM (
  -- Hospitality (existing)
  'RESTAURANT',
  'CAFE', 
  'BAR',
  
  -- Beauty & Wellness
  'BEAUTY_SALON',
  'HAIR_SALON',
  'NAIL_STUDIO',
  'SPA',
  'MASSAGE_THERAPY',
  'TANNING_SALON',
  
  -- Healthcare
  'MEDICAL_PRACTICE',
  'DENTIST',
  'PHYSIOTHERAPY',
  'PSYCHOLOGY',
  'VETERINARY',
  
  -- Fitness & Sports
  'GYM',
  'YOGA_STUDIO',
  'PERSONAL_TRAINING',
  'DANCE_STUDIO',
  'MARTIAL_ARTS',
  
  -- Professional Services
  'LEGAL',
  'ACCOUNTING',
  'CONSULTING',
  'FINANCIAL_ADVISORY',
  
  -- Education
  'TUTORING',
  'MUSIC_LESSONS',
  'LANGUAGE_SCHOOL',
  'DRIVING_SCHOOL',
  
  -- Automotive
  'CAR_REPAIR',
  'CAR_WASH',
  'CAR_RENTAL',
  
  -- Home Services
  'CLEANING',
  'PLUMBING',
  'ELECTRICIAN',
  'GARDENING',
  
  -- Events & Entertainment
  'EVENT_VENUE',
  'PHOTO_STUDIO',
  'ESCAPE_ROOM',
  'BOWLING',
  
  -- Accommodation
  'HOTEL',
  'VACATION_RENTAL',
  'COWORKING_SPACE',
  'MEETING_ROOM',
  
  -- Other
  'OTHER'
);

-- Resource types ENUM
-- Generic resource types that replace sector-specific terminology
-- TABLE = Restaurant tables
-- ROOM = Treatment rooms, meeting rooms, etc.
-- STAFF = Employees, doctors, trainers, etc.
-- EQUIPMENT = Massage tables, gym equipment, etc.
-- VEHICLE = Cars for repair/rental
-- SPACE = Generic space (coworking, event venue)
CREATE TYPE resource_type AS ENUM (
  'TABLE',
  'ROOM',
  'STAFF',
  'EQUIPMENT',
  'VEHICLE',
  'SPACE'
);

-- Add comments for documentation
COMMENT ON TYPE business_sector IS 'All supported business sectors in Reserve4You platform';
COMMENT ON TYPE resource_type IS 'Generic resource types used across all sectors';

-- Verification query (run this to check if ENUMs were created)
DO $$
BEGIN
  -- Check if business_sector enum exists
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'business_sector') THEN
    RAISE NOTICE '✅ ENUM business_sector created successfully with % values', 
      (SELECT count(*) FROM pg_enum WHERE enumtypid = 'business_sector'::regtype);
  ELSE
    RAISE EXCEPTION '❌ ENUM business_sector was not created';
  END IF;
  
  -- Check if resource_type enum exists
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resource_type') THEN
    RAISE NOTICE '✅ ENUM resource_type created successfully with % values',
      (SELECT count(*) FROM pg_enum WHERE enumtypid = 'resource_type'::regtype);
  ELSE
    RAISE EXCEPTION '❌ ENUM resource_type was not created';
  END IF;
  
  RAISE NOTICE '✅ STEP 1.1 COMPLETE: Multi-sector ENUMs created successfully!';
END $$;

