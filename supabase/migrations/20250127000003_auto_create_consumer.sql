-- =====================================================
-- AUTO-CREATE CONSUMER RECORDS
-- Automatically creates a consumer record when a new user signs up
-- =====================================================

-- Function to automatically create consumer record
CREATE OR REPLACE FUNCTION auto_create_consumer()
RETURNS TRIGGER AS $$
DECLARE
  v_name text;
BEGIN
  -- Get name with fallbacks
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    SPLIT_PART(NEW.email, '@', 1),
    'Guest User'
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_consumer();

-- Ensure consumers table has unique constraint on auth_user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'consumers_auth_user_id_key'
  ) THEN
    ALTER TABLE consumers ADD CONSTRAINT consumers_auth_user_id_key UNIQUE (auth_user_id);
  END IF;
END $$;

-- Create any missing consumer records for existing users
INSERT INTO consumers (auth_user_id, email, name)
SELECT 
  u.id,
  COALESCE(u.email, 'user@reserve4you.com'),
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    SPLIT_PART(u.email, '@', 1),
    'Guest User'
  )
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM consumers c WHERE c.auth_user_id = u.id
)
ON CONFLICT (auth_user_id) DO NOTHING;

-- Success message
DO $$
DECLARE
  v_created_count int;
  v_total_users int;
  v_total_consumers int;
BEGIN
  SELECT COUNT(*) INTO v_total_users FROM auth.users;
  SELECT COUNT(*) INTO v_total_consumers FROM consumers;
  v_created_count := v_total_consumers - (v_total_users - v_total_consumers);
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ Auto-Create Consumer System Installed Successfully';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Statistics:';
  RAISE NOTICE '  • Total users: %', v_total_users;
  RAISE NOTICE '  • Total consumers: %', v_total_consumers;
  RAISE NOTICE '';
  RAISE NOTICE 'Features enabled:';
  RAISE NOTICE '  ✓ Automatic consumer creation on user signup';
  RAISE NOTICE '  ✓ Trigger on auth.users table';
  RAISE NOTICE '  ✓ Multiple name fallbacks (full_name, name, email)';
  RAISE NOTICE '  ✓ All existing users have consumer records';
  RAISE NOTICE '';
  RAISE NOTICE 'From now on:';
  RAISE NOTICE '  → Every new user automatically gets a consumer record';
  RAISE NOTICE '  → Users can immediately add favorites';
  RAISE NOTICE '  → No manual intervention needed';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;

