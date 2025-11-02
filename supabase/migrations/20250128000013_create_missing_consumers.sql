-- ============================================================================
-- CREATE MISSING CONSUMER RECORDS
-- ============================================================================
-- This migration ensures all authenticated users have a consumer record
-- It creates consumer records for any auth.users that don't have one yet
-- ============================================================================

-- Create missing consumer records for existing auth users
INSERT INTO consumers (auth_user_id, email, name, created_at, updated_at)
SELECT 
  u.id,
  COALESCE(u.email, 'user@reserve4you.com'),
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    SPLIT_PART(COALESCE(u.email, 'user@reserve4you.com'), '@', 1),
    'Gebruiker'
  ),
  u.created_at,
  NOW()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM consumers c WHERE c.auth_user_id = u.id
)
ON CONFLICT (auth_user_id) DO NOTHING;

-- Report results
DO $$
DECLARE
  v_created_count int;
  v_total_users int;
  v_total_consumers int;
BEGIN
  SELECT COUNT(*) INTO v_total_users FROM auth.users;
  SELECT COUNT(*) INTO v_total_consumers FROM consumers WHERE auth_user_id IS NOT NULL;
  
  SELECT COUNT(*) INTO v_created_count
  FROM auth.users u
  WHERE EXISTS (
    SELECT 1 FROM consumers c 
    WHERE c.auth_user_id = u.id 
    AND c.created_at >= NOW() - INTERVAL '1 minute'
  );
  
  RAISE NOTICE '✅ Total auth users: %', v_total_users;
  RAISE NOTICE '✅ Total consumers: %', v_total_consumers;
  IF v_created_count > 0 THEN
    RAISE NOTICE '✅ Created % missing consumer records', v_created_count;
  ELSE
    RAISE NOTICE '⏭️  No missing consumer records found (all users already have consumer records)';
  END IF;
END $$;

-- Ensure the function exists for the trigger
CREATE OR REPLACE FUNCTION auto_create_consumer()
RETURNS TRIGGER AS $func$
DECLARE
  v_name text;
BEGIN
  -- Get name with fallbacks
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    SPLIT_PART(NEW.email, '@', 1),
    'Gebruiker'
  );
  
  -- Create consumer record
  INSERT INTO public.consumers (
    auth_user_id,
    email,
    name
  ) VALUES (
    NEW.id,
    COALESCE(NEW.email, 'user@reserve4you.com'),
    v_name
  )
  ON CONFLICT (auth_user_id) DO NOTHING;
  
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists for future users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_consumer();

COMMENT ON FUNCTION auto_create_consumer() IS 'Automatically creates a consumer record when a new user signs up';

