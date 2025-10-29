-- =====================================================
-- FAVORITES RLS POLICIES
-- Row Level Security policies for favorites table
-- =====================================================

-- Enable RLS on favorites table if not already enabled
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can create own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can delete own favorites" ON favorites;
DROP POLICY IF EXISTS "Service role full access to favorites" ON favorites;

-- =====================================================
-- POLICY: Users can view their own favorites
-- =====================================================

CREATE POLICY "Users can view own favorites"
ON favorites
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM consumers
    WHERE consumers.id = favorites.consumer_id
      AND consumers.auth_user_id = auth.uid()
  )
);

-- =====================================================
-- POLICY: Users can create their own favorites
-- =====================================================

CREATE POLICY "Users can create own favorites"
ON favorites
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM consumers
    WHERE consumers.id = favorites.consumer_id
      AND consumers.auth_user_id = auth.uid()
  )
);

-- =====================================================
-- POLICY: Users can delete their own favorites
-- =====================================================

CREATE POLICY "Users can delete own favorites"
ON favorites
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM consumers
    WHERE consumers.id = favorites.consumer_id
      AND consumers.auth_user_id = auth.uid()
  )
);

-- =====================================================
-- POLICY: Service role has full access
-- =====================================================

CREATE POLICY "Service role full access to favorites"
ON favorites
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- POLICY: Allow anonymous to view public favorites (optional)
-- Uncomment if you want to show favorite counts publicly
-- =====================================================

-- CREATE POLICY "Anonymous can view favorite counts"
-- ON favorites
-- FOR SELECT
-- TO anon
-- USING (true);

-- =====================================================
-- INDEXES (if not already created)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_favorites_location_id ON favorites(location_id);
CREATE INDEX IF NOT EXISTS idx_favorites_consumer_id ON favorites(consumer_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at DESC);

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT, INSERT, DELETE ON favorites TO authenticated;
GRANT ALL ON favorites TO service_role;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✓ Favorites RLS Policies Installed Successfully';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'RLS Policies created:';
  RAISE NOTICE '  ✓ Users can view own favorites';
  RAISE NOTICE '  ✓ Users can create own favorites';
  RAISE NOTICE '  ✓ Users can delete own favorites';
  RAISE NOTICE '  ✓ Service role full access';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Test adding a favorite from the UI';
  RAISE NOTICE '  2. Check notifications are created';
  RAISE NOTICE '  3. Test removing favorites';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END$$;

