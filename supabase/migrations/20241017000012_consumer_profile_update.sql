-- ============================================================================
-- CONSUMER PROFILE UPDATE FUNCTION
-- ============================================================================
-- Allow consumers to update their profile information
-- ============================================================================

-- ============================================================================
-- 1. UPDATE CONSUMER PROFILE
-- ============================================================================

CREATE OR REPLACE FUNCTION update_consumer_profile(
  p_user_id UUID,
  p_name VARCHAR DEFAULT NULL,
  p_phone VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  auth_user_id UUID,
  name VARCHAR,
  phone VARCHAR,
  email VARCHAR,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_consumer_id UUID;
  v_current_user_id UUID := auth.uid();
BEGIN
  -- Security check: user can only update their own profile
  IF v_current_user_id IS NULL OR v_current_user_id != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only update your own profile';
  END IF;

  -- Check if consumer record exists
  SELECT consumers.id INTO v_consumer_id
  FROM public.consumers
  WHERE auth_user_id = p_user_id;

  -- If consumer doesn't exist, create one
  IF v_consumer_id IS NULL THEN
    INSERT INTO public.consumers (auth_user_id, name, phone, email)
    VALUES (
      p_user_id,
      p_name,
      p_phone,
      (SELECT email FROM auth.users WHERE id = p_user_id)
    )
    RETURNING consumers.id INTO v_consumer_id;
    
    RAISE NOTICE 'Created new consumer profile for user %', p_user_id;
  ELSE
    -- Update existing consumer
    UPDATE public.consumers
    SET 
      name = COALESCE(p_name, consumers.name),
      phone = COALESCE(p_phone, consumers.phone),
      updated_at = NOW()
    WHERE consumers.id = v_consumer_id;
    
    RAISE NOTICE 'Updated consumer profile %', v_consumer_id;
  END IF;

  -- Return updated consumer data
  RETURN QUERY
  SELECT 
    c.id,
    c.auth_user_id,
    c.name,
    c.phone,
    c.email,
    c.updated_at
  FROM public.consumers c
  WHERE c.id = v_consumer_id;
END;
$$;

-- ============================================================================
-- 2. GET OR CREATE CONSUMER
-- ============================================================================

CREATE OR REPLACE FUNCTION get_or_create_consumer(
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  auth_user_id UUID,
  name VARCHAR,
  phone VARCHAR,
  email VARCHAR,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_consumer_id UUID;
  v_user_email VARCHAR;
BEGIN
  -- Security check
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Try to get existing consumer
  SELECT consumers.id INTO v_consumer_id
  FROM public.consumers
  WHERE auth_user_id = p_user_id;

  -- If doesn't exist, create it
  IF v_consumer_id IS NULL THEN
    -- Get email from auth.users
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = p_user_id;

    -- Create consumer
    INSERT INTO public.consumers (auth_user_id, email)
    VALUES (p_user_id, v_user_email)
    RETURNING id INTO v_consumer_id;
    
    RAISE NOTICE 'Created consumer profile for user %', p_user_id;
  END IF;

  -- Return consumer data
  RETURN QUERY
  SELECT 
    c.id,
    c.auth_user_id,
    c.name,
    c.phone,
    c.email,
    c.created_at,
    c.updated_at
  FROM public.consumers c
  WHERE c.id = v_consumer_id;
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION update_consumer_profile TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_consumer TO authenticated;

-- ============================================================================
-- ADD INDEXES
-- ============================================================================

-- Index on auth_user_id for fast lookups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_consumers_auth_user_id'
  ) THEN
    CREATE INDEX idx_consumers_auth_user_id ON consumers(auth_user_id);
    RAISE NOTICE 'Created index on consumers.auth_user_id';
  END IF;
END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Consumer Profile Update Functions Created';
  RAISE NOTICE '';
  RAISE NOTICE 'Available Functions:';
  RAISE NOTICE '  1. update_consumer_profile()';
  RAISE NOTICE '  2. get_or_create_consumer()';
  RAISE NOTICE '';
  RAISE NOTICE 'Consumers can now update their profiles!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

