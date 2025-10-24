-- ============================================================================
-- DIAGNOSE AND FIX REVIEWS SYSTEM
-- ============================================================================
-- Dit script diagnoseert waarom reviews niet zichtbaar zijn en fixt het
-- ============================================================================

-- STAP 1: DIAGNOSTICS - Bekijk wat er is
DO $$
BEGIN
  RAISE NOTICE '🔍 DIAGNOSTICS - Checking reviews system...';
  RAISE NOTICE '';
END $$;

-- Check 1: Zijn er reviews in de database?
SELECT 
  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS "═══════════════",
  '📊 REVIEWS IN DATABASE' AS "Status";

SELECT 
  r.id,
  l.name AS location_name,
  l.slug AS location_slug,
  r.rating,
  r.is_published,
  LEFT(r.comment, 50) AS comment_preview,
  c.name AS consumer_name,
  c.auth_user_id IS NOT NULL AS has_auth_user
FROM reviews r
INNER JOIN locations l ON l.id = r.location_id
INNER JOIN consumers c ON c.id = r.consumer_id
ORDER BY r.created_at DESC
LIMIT 10;

-- Check 2: Zijn de reviews published?
SELECT 
  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS "═══════════════",
  '✅ PUBLISHED REVIEWS STATUS' AS "Status";

SELECT 
  COUNT(*) FILTER (WHERE is_published = true) AS published_count,
  COUNT(*) FILTER (WHERE is_published = false) AS unpublished_count,
  COUNT(*) AS total_count
FROM reviews;

-- Check 3: Consumers met auth_user_id
SELECT 
  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS "═══════════════",
  '👤 CONSUMERS WITH AUTH' AS "Status";

SELECT 
  c.id,
  c.name,
  c.email,
  c.auth_user_id IS NOT NULL AS has_auth,
  COUNT(b.id) AS completed_bookings
FROM consumers c
LEFT JOIN bookings b ON b.consumer_id = c.id AND b.status = 'COMPLETED'
GROUP BY c.id, c.name, c.email, c.auth_user_id
ORDER BY c.created_at DESC
LIMIT 5;

-- Check 4: Completed bookings
SELECT 
  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS "═══════════════",
  '📅 COMPLETED BOOKINGS' AS "Status";

SELECT 
  l.name AS location_name,
  l.slug AS location_slug,
  c.name AS consumer_name,
  c.email AS consumer_email,
  b.status,
  b.start_ts::date AS booking_date
FROM bookings b
INNER JOIN locations l ON l.id = b.location_id
INNER JOIN consumers c ON c.id = b.consumer_id
WHERE b.status = 'COMPLETED'
ORDER BY b.created_at DESC
LIMIT 10;

-- ============================================================================
-- STAP 2: FIX - Zorg dat reviews zichtbaar zijn
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '🔧 FIXING REVIEWS...';
  RAISE NOTICE '';
END $$;

-- Fix 1: Zorg dat alle reviews published zijn
UPDATE reviews 
SET is_published = true 
WHERE is_published = false;

-- Check resultaat
DO $$
DECLARE
  v_updated_count INT;
BEGIN
  SELECT COUNT(*) INTO v_updated_count
  FROM reviews
  WHERE is_published = true;
  
  RAISE NOTICE '✅ % reviews zijn nu published', v_updated_count;
END $$;

-- Fix 2: Zorg dat review stats up-to-date zijn
DO $$
DECLARE
  v_location_id UUID;
BEGIN
  FOR v_location_id IN SELECT DISTINCT location_id FROM reviews
  LOOP
    PERFORM update_location_review_stats(v_location_id);
  END LOOP;
  
  RAISE NOTICE '✅ Review statistieken bijgewerkt voor alle locaties';
END $$;

-- ============================================================================
-- STAP 3: MAAK EEN CONSUMER MET AUTH USER ID
-- ============================================================================
-- Dit zorgt ervoor dat JIJ een review kunt schrijven
DO $$
DECLARE
  v_auth_user_id UUID;
  v_consumer_id UUID;
  v_location_id UUID;
  v_booking_exists BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '👤 CREATING CONSUMER FOR YOUR AUTH USER...';
  RAISE NOTICE '';
  
  -- Haal de eerste auth user op (dat ben jij waarschijnlijk)
  SELECT id INTO v_auth_user_id
  FROM auth.users
  WHERE email NOT LIKE '%test%'
  AND email NOT LIKE '%reserve4you%'
  ORDER BY created_at
  LIMIT 1;
  
  IF v_auth_user_id IS NULL THEN
    RAISE NOTICE '⚠️  Geen auth user gevonden (ben je ingelogd?)';
    RAISE NOTICE '💡 Tip: Log in op http://localhost:3007 en run dit script opnieuw';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Gevonden auth user ID: %', v_auth_user_id;
  
  -- Check of er al een consumer bestaat voor deze user
  SELECT id INTO v_consumer_id
  FROM consumers
  WHERE auth_user_id = v_auth_user_id;
  
  IF v_consumer_id IS NULL THEN
    -- Maak nieuwe consumer
    INSERT INTO consumers (auth_user_id, name, email)
    SELECT 
      v_auth_user_id,
      COALESCE(raw_user_meta_data->>'name', email),
      email
    FROM auth.users
    WHERE id = v_auth_user_id
    RETURNING id INTO v_consumer_id;
    
    RAISE NOTICE '✅ Consumer aangemaakt: %', v_consumer_id;
  ELSE
    RAISE NOTICE '✓ Consumer bestaat al: %', v_consumer_id;
  END IF;
  
  -- Haal een locatie op
  SELECT id INTO v_location_id
  FROM locations
  WHERE slug IN ('chickx', 'poulepoulette')
  OR is_public = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_location_id IS NULL THEN
    RAISE NOTICE '⚠️  Geen locatie gevonden';
    RETURN;
  END IF;
  
  -- Check of er al een completed booking bestaat
  SELECT EXISTS(
    SELECT 1 FROM bookings
    WHERE consumer_id = v_consumer_id
    AND location_id = v_location_id
    AND status = 'COMPLETED'
  ) INTO v_booking_exists;
  
  IF NOT v_booking_exists THEN
    -- Maak een completed booking aan
    INSERT INTO bookings (
      location_id,
      consumer_id,
      guest_name,
      customer_name,
      guest_email,
      customer_email,
      party_size,
      number_of_guests,
      start_ts,
      end_ts,
      booking_date,
      booking_time,
      status,
      payment_status,
      source
    )
    SELECT
      v_location_id,
      v_consumer_id,
      u.email,
      u.email,
      u.email,
      u.email,
      2,
      2,
      NOW() - INTERVAL '3 days',
      NOW() - INTERVAL '3 days' + INTERVAL '2 hours',
      (NOW() - INTERVAL '3 days')::DATE,
      (NOW() - INTERVAL '3 days')::TIME,
      'COMPLETED',
      'NONE',
      'WEB'
    FROM auth.users u
    WHERE u.id = v_auth_user_id;
    
    RAISE NOTICE '✅ Completed booking aangemaakt voor jouw account';
  ELSE
    RAISE NOTICE '✓ Je hebt al een completed booking';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Je kunt nu reviews schrijven!';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STAP 4: VERIFICATIE - Toon eindresultaat
-- ============================================================================
SELECT 
  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS "═══════════════",
  '✅ FINAL STATUS' AS "Status";

-- Toon locaties met reviews
SELECT 
  l.name AS "Restaurant",
  l.slug AS "Slug",
  l.review_count AS "Reviews",
  ROUND(l.average_rating, 1) AS "★ Rating"
FROM locations l
WHERE l.review_count > 0
ORDER BY l.review_count DESC
LIMIT 5;

-- Toon alle published reviews
SELECT 
  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS "═══════════════",
  '⭐ VISIBLE REVIEWS' AS "Status";

SELECT 
  l.name AS "Restaurant",
  r.rating AS "★",
  c.name AS "Door",
  LEFT(r.comment, 60) AS "Review",
  CASE WHEN rr.id IS NOT NULL THEN '✓' ELSE '' END AS "Reply"
FROM reviews r
INNER JOIN locations l ON l.id = r.location_id
INNER JOIN consumers c ON c.id = r.consumer_id
LEFT JOIN review_replies rr ON rr.review_id = r.id
WHERE r.is_published = true
ORDER BY r.created_at DESC
LIMIT 10;

-- ============================================================================
-- HANDIGE INFO VOOR DEBUGGING
-- ============================================================================
DO $$
DECLARE
  v_url TEXT;
BEGIN
  SELECT 'http://localhost:3007/p/' || slug INTO v_url
  FROM locations
  WHERE review_count > 0
  ORDER BY review_count DESC
  LIMIT 1;
  
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ KLAAR!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '🌐 Test reviews op: %', v_url;
  RAISE NOTICE '💡 Log in om reviews te kunnen schrijven';
  RAISE NOTICE '🔄 Refresh de pagina na het runnen van dit script';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Als je nog steeds geen reviews ziet:';
  RAISE NOTICE '   1. Check de browser console (F12) voor errors';
  RAISE NOTICE '   2. Check of /api/reviews?locationId=XXX werkt';
  RAISE NOTICE '   3. Kijk of RLS policies correct zijn';
  RAISE NOTICE '';
END $$;

-- Extra: Toon RLS policies voor reviews
SELECT 
  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS "═══════════════",
  '🔒 RLS POLICIES' AS "Status";

SELECT 
  schemaname,
  tablename,
  policyname,
  cmd AS command,
  qual AS using_clause
FROM pg_policies
WHERE tablename = 'reviews'
ORDER BY policyname;

