-- ============================================================================
-- FIX AUTH AND AUTO USER CREATION
-- ============================================================================
-- This migration fixes the authentication flow by:
-- 1. Creating users automatically when they sign up
-- 2. Fixing RLS policies to allow proper access
-- 3. Adding a trigger to create user profiles automatically
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new user into public.users table
  INSERT INTO public.users (supabase_user_id, has_access, created_at, updated_at)
  VALUES (NEW.id, false, NOW(), NOW())
  ON CONFLICT (supabase_user_id) DO NOTHING;
  
  -- Also create a consumer record for this user
  INSERT INTO public.consumers (auth_user_id, name, email, created_at, updated_at)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'User'), NEW.email, NOW(), NOW())
  ON CONFLICT (auth_user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call function on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure RLS is enabled on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Service role has full access to users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Create updated RLS policies for users table
CREATE POLICY "Users can view own data"
  ON public.users FOR SELECT
  TO authenticated
  USING (auth.uid() = supabase_user_id);

CREATE POLICY "Users can update own data"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = supabase_user_id)
  WITH CHECK (auth.uid() = supabase_user_id);

-- Allow users to insert their own profile (called by trigger)
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = supabase_user_id);

-- Service role has full access
CREATE POLICY "Service role has full access to users"
  ON public.users FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure consumers table has proper RLS
ALTER TABLE public.consumers ENABLE ROW LEVEL SECURITY;

-- Drop old consumer policies
DROP POLICY IF EXISTS "Users can view own consumer data" ON public.consumers;
DROP POLICY IF EXISTS "Users can update own consumer data" ON public.consumers;
DROP POLICY IF EXISTS "Service role has full access to consumers" ON public.consumers;
DROP POLICY IF EXISTS "Users can insert own consumer profile" ON public.consumers;

-- Create RLS policies for consumers table
CREATE POLICY "Users can view own consumer data"
  ON public.consumers FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own consumer data"
  ON public.consumers FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own consumer profile"
  ON public.consumers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_user_id);

-- Service role has full access
CREATE POLICY "Service role has full access to consumers"
  ON public.consumers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Update create_user_profile function to be idempotent
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS void AS $$
BEGIN
  -- Insert user record
  INSERT INTO public.users (supabase_user_id, has_access)
  VALUES (auth.uid(), false)
  ON CONFLICT (supabase_user_id) DO NOTHING;
  
  -- Insert consumer record with user data from auth.users
  INSERT INTO public.consumers (auth_user_id, name, email)
  SELECT 
    auth.uid(),
    COALESCE(raw_user_meta_data->>'full_name', email, 'User'),
    email
  FROM auth.users
  WHERE id = auth.uid()
  ON CONFLICT (auth_user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_user_profile() TO authenticated;

-- Backfill: Create user records for existing auth users that don't have profiles yet
DO $$
DECLARE
  auth_user RECORD;
  users_created INT := 0;
  consumers_created INT := 0;
BEGIN
  -- Loop through all auth.users
  FOR auth_user IN 
    SELECT id, email, created_at
    FROM auth.users
    WHERE id NOT IN (SELECT supabase_user_id FROM public.users)
  LOOP
    -- Create user record
    INSERT INTO public.users (supabase_user_id, has_access, created_at, updated_at)
    VALUES (auth_user.id, false, auth_user.created_at, NOW())
    ON CONFLICT (supabase_user_id) DO NOTHING;
    
    users_created := users_created + 1;
    
    -- Create consumer record with user info
    INSERT INTO public.consumers (auth_user_id, name, email, created_at, updated_at)
    VALUES (
      auth_user.id, 
      COALESCE(
        (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = auth_user.id),
        auth_user.email,
        'User'
      ),
      auth_user.email,
      auth_user.created_at,
      NOW()
    )
    ON CONFLICT (auth_user_id) DO NOTHING;
    
    consumers_created := consumers_created + 1;
  END LOOP;
  
  IF users_created > 0 THEN
    RAISE NOTICE '✅ Created % user records for existing auth users', users_created;
    RAISE NOTICE '✅ Created % consumer records for existing auth users', consumers_created;
  ELSE
    RAISE NOTICE '⏭️  No missing user records found';
  END IF;
END $$;

-- Add email column to users table if it doesn't exist (for easier debugging)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'email'
  ) THEN
    ALTER TABLE public.users ADD COLUMN email TEXT;
    RAISE NOTICE '✅ Added email column to users table';
  ELSE
    RAISE NOTICE '⏭️  Email column already exists';
  END IF;
END $$;

-- Function to sync email from auth.users
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET email = NEW.email
  WHERE supabase_user_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync email on auth.users changes
DROP TRIGGER IF EXISTS on_auth_user_email_changed ON auth.users;
CREATE TRIGGER on_auth_user_email_changed
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_email();

-- Backfill emails for existing users
UPDATE public.users
SET email = auth.users.email
FROM auth.users
WHERE public.users.supabase_user_id = auth.users.id
  AND public.users.email IS NULL;

-- Summary
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ AUTH FIX MIGRATION COMPLETE';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✓ Auto user creation trigger added';
  RAISE NOTICE '✓ RLS policies updated for users and consumers';
  RAISE NOTICE '✓ Existing auth users backfilled';
  RAISE NOTICE '✓ Email sync trigger added';
  RAISE NOTICE '';
  RAISE NOTICE 'New users will automatically get:';
  RAISE NOTICE '  - User record in public.users';
  RAISE NOTICE '  - Consumer record in public.consumers';
  RAISE NOTICE '  - Proper RLS access to their own data';
  RAISE NOTICE '================================================';
END $$;

