-- ============================================================================
-- FIX BOOKINGS TABLE + TEST REVIEWS SETUP
-- ============================================================================
-- Dit script:
-- 1. Voegt alle ontbrekende kolommen toe aan de bookings tabel
-- 2. Maakt test data aan voor het review systeem
-- Run dit in de Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- DEEL 1: FIX BOOKINGS TABLE STRUCTUUR
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '🔧 Bookings tabel structuur controleren en bijwerken...';
  
  -- Check en voeg party_size toe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'party_size'
  ) THEN
    ALTER TABLE bookings ADD COLUMN party_size INT DEFAULT 2 CHECK (party_size > 0);
    RAISE NOTICE '  ✅ Kolom party_size toegevoegd';
  ELSE
    -- Maak party_size nullable als het NOT NULL is
    BEGIN
      ALTER TABLE bookings ALTER COLUMN party_size DROP NOT NULL;
      RAISE NOTICE '  ✅ Kolom party_size NOT NULL constraint verwijderd';
    EXCEPTION WHEN others THEN
      RAISE NOTICE '  ✓ Kolom party_size bestaat al';
    END;
  END IF;

  -- Check en voeg number_of_guests toe (alternatieve naam voor party_size)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'number_of_guests'
  ) THEN
    ALTER TABLE bookings ADD COLUMN number_of_guests INT DEFAULT 2;
    RAISE NOTICE '  ✅ Kolom number_of_guests toegevoegd';
  ELSE
    -- Maak number_of_guests nullable als het NOT NULL is
    BEGIN
      ALTER TABLE bookings ALTER COLUMN number_of_guests DROP NOT NULL;
      RAISE NOTICE '  ✅ Kolom number_of_guests NOT NULL constraint verwijderd';
    EXCEPTION WHEN others THEN
      RAISE NOTICE '  ✓ Kolom number_of_guests bestaat al';
    END;
  END IF;

  -- Check en voeg guest_name toe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'guest_name'
  ) THEN
    ALTER TABLE bookings ADD COLUMN guest_name VARCHAR(255);
    RAISE NOTICE '  ✅ Kolom guest_name toegevoegd';
  ELSE
    BEGIN
      ALTER TABLE bookings ALTER COLUMN guest_name DROP NOT NULL;
      RAISE NOTICE '  ✅ Kolom guest_name NOT NULL constraint verwijderd';
    EXCEPTION WHEN others THEN
      RAISE NOTICE '  ✓ Kolom guest_name bestaat al';
    END;
  END IF;

  -- Check en voeg customer_name toe (alternatief voor guest_name)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'customer_name'
  ) THEN
    ALTER TABLE bookings ADD COLUMN customer_name VARCHAR(255);
    RAISE NOTICE '  ✅ Kolom customer_name toegevoegd';
  ELSE
    BEGIN
      ALTER TABLE bookings ALTER COLUMN customer_name DROP NOT NULL;
      RAISE NOTICE '  ✅ Kolom customer_name NOT NULL constraint verwijderd';
    EXCEPTION WHEN others THEN
      RAISE NOTICE '  ✓ Kolom customer_name bestaat al';
    END;
  END IF;

  -- Check en voeg guest_phone toe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'guest_phone'
  ) THEN
    ALTER TABLE bookings ADD COLUMN guest_phone VARCHAR(20);
    RAISE NOTICE '  ✅ Kolom guest_phone toegevoegd';
  ELSE
    BEGIN
      ALTER TABLE bookings ALTER COLUMN guest_phone DROP NOT NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE '  ✓ Kolom guest_phone bestaat al';
    END;
  END IF;

  -- Check en voeg customer_phone toe (alternatief voor guest_phone)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'customer_phone'
  ) THEN
    ALTER TABLE bookings ADD COLUMN customer_phone VARCHAR(20);
    RAISE NOTICE '  ✅ Kolom customer_phone toegevoegd';
  ELSE
    BEGIN
      ALTER TABLE bookings ALTER COLUMN customer_phone DROP NOT NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE '  ✓ Kolom customer_phone bestaat al';
    END;
  END IF;

  -- Check en voeg guest_email toe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'guest_email'
  ) THEN
    ALTER TABLE bookings ADD COLUMN guest_email VARCHAR(255);
    RAISE NOTICE '  ✅ Kolom guest_email toegevoegd';
  ELSE
    BEGIN
      ALTER TABLE bookings ALTER COLUMN guest_email DROP NOT NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE '  ✓ Kolom guest_email bestaat al';
    END;
  END IF;

  -- Check en voeg customer_email toe (alternatief voor guest_email)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'customer_email'
  ) THEN
    ALTER TABLE bookings ADD COLUMN customer_email VARCHAR(255);
    RAISE NOTICE '  ✅ Kolom customer_email toegevoegd';
  ELSE
    BEGIN
      ALTER TABLE bookings ALTER COLUMN customer_email DROP NOT NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE '  ✓ Kolom customer_email bestaat al';
    END;
  END IF;

  -- Check en voeg start_ts toe (als start_time bestaat, rename het)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'start_ts'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'bookings' AND column_name = 'start_time'
    ) THEN
      ALTER TABLE bookings RENAME COLUMN start_time TO start_ts;
      RAISE NOTICE '  ✅ Kolom start_time hernoemd naar start_ts';
    ELSE
      ALTER TABLE bookings ADD COLUMN start_ts TIMESTAMPTZ NOT NULL DEFAULT NOW();
      RAISE NOTICE '  ✅ Kolom start_ts toegevoegd';
    END IF;
  ELSE
    RAISE NOTICE '  ✓ Kolom start_ts bestaat al';
  END IF;

  -- Check en voeg end_ts toe (als end_time bestaat, rename het)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'end_ts'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'bookings' AND column_name = 'end_time'
    ) THEN
      ALTER TABLE bookings RENAME COLUMN end_time TO end_ts;
      RAISE NOTICE '  ✅ Kolom end_time hernoemd naar end_ts';
    ELSE
      ALTER TABLE bookings ADD COLUMN end_ts TIMESTAMPTZ NOT NULL DEFAULT NOW();
      RAISE NOTICE '  ✅ Kolom end_ts toegevoegd';
    END IF;
  ELSE
    RAISE NOTICE '  ✓ Kolom end_ts bestaat al';
  END IF;

  -- Check en voeg status toe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'status'
  ) THEN
    ALTER TABLE bookings ADD COLUMN status booking_status NOT NULL DEFAULT 'PENDING';
    RAISE NOTICE '  ✅ Kolom status toegevoegd';
  ELSE
    -- Verwijder eventuele CHECK constraints op status
    BEGIN
      -- Probeer alle check constraints op bookings te droppen die status bevatten
      DECLARE
        constraint_rec RECORD;
      BEGIN
        FOR constraint_rec IN 
          SELECT constraint_name 
          FROM information_schema.constraint_column_usage 
          WHERE table_name = 'bookings' 
          AND column_name = 'status'
          AND constraint_name LIKE '%check%'
        LOOP
          EXECUTE format('ALTER TABLE bookings DROP CONSTRAINT IF EXISTS %I', constraint_rec.constraint_name);
          RAISE NOTICE '  ✅ Check constraint % verwijderd', constraint_rec.constraint_name;
        END LOOP;
      END;
    EXCEPTION WHEN others THEN
      RAISE NOTICE '  ⚠️  Kon check constraints niet verwijderen (mogelijk niet nodig)';
    END;
    
    RAISE NOTICE '  ✓ Kolom status bestaat al';
  END IF;

  -- Check en voeg payment_status toe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE bookings ADD COLUMN payment_status payment_status NOT NULL DEFAULT 'NONE';
    RAISE NOTICE '  ✅ Kolom payment_status toegevoegd';
  ELSE
    RAISE NOTICE '  ✓ Kolom payment_status bestaat al';
  END IF;

  -- Check en voeg source toe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'source'
  ) THEN
    ALTER TABLE bookings ADD COLUMN source VARCHAR(20) DEFAULT 'WEB';
    RAISE NOTICE '  ✅ Kolom source toegevoegd';
  ELSE
    RAISE NOTICE '  ✓ Kolom source bestaat al';
  END IF;

  -- Check en voeg booking_date toe (of maak NOT NULL constraint optioneel)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'booking_date'
  ) THEN
    ALTER TABLE bookings ADD COLUMN booking_date DATE;
    RAISE NOTICE '  ✅ Kolom booking_date toegevoegd';
  ELSE
    -- Als booking_date bestaat en NOT NULL is, maak het nullable
    BEGIN
      ALTER TABLE bookings ALTER COLUMN booking_date DROP NOT NULL;
      RAISE NOTICE '  ✅ Kolom booking_date NOT NULL constraint verwijderd';
    EXCEPTION WHEN others THEN
      RAISE NOTICE '  ✓ Kolom booking_date bestaat al';
    END;
  END IF;

  -- Check en voeg booking_time toe (of maak NOT NULL constraint optioneel)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'booking_time'
  ) THEN
    ALTER TABLE bookings ADD COLUMN booking_time TIME;
    RAISE NOTICE '  ✅ Kolom booking_time toegevoegd';
  ELSE
    -- Als booking_time bestaat en NOT NULL is, maak het nullable
    BEGIN
      ALTER TABLE bookings ALTER COLUMN booking_time DROP NOT NULL;
      RAISE NOTICE '  ✅ Kolom booking_time NOT NULL constraint verwijderd';
    EXCEPTION WHEN others THEN
      RAISE NOTICE '  ✓ Kolom booking_time bestaat al';
    END;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Bookings tabel structuur is nu correct!';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- DEEL 2: MAAK TEST DATA AAN
-- ============================================================================
DO $$
DECLARE
  v_consumer_id UUID;
  v_location_id UUID;
  v_table_id UUID;
  v_booking_exists BOOLEAN;
  v_location_name TEXT;
  v_location_slug TEXT;
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '🎬 Test data aanmaken...';
  RAISE NOTICE '';

  -- Haal een bestaande locatie op
  SELECT id, name, slug INTO v_location_id, v_location_name, v_location_slug
  FROM locations 
  WHERE slug IN ('chickx', 'poulepoulette', 'chick-x')
  OR (is_public = true AND is_active = true)
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_location_id IS NULL THEN
    RAISE NOTICE '❌ Geen actieve locatie gevonden. Maak eerst een locatie aan.';
    RETURN;
  END IF;

  RAISE NOTICE '📍 Locatie: % (slug: %)', v_location_name, v_location_slug;

  -- Haal een tafel op
  SELECT id INTO v_table_id
  FROM tables
  WHERE location_id = v_location_id
  LIMIT 1;

  IF v_table_id IS NULL THEN
    RAISE NOTICE '⚠️  Geen tafel gevonden (niet verplicht)';
  ELSE
    RAISE NOTICE '🪑 Tafel gevonden';
  END IF;

  -- Zoek of maak test consumer
  SELECT id INTO v_consumer_id
  FROM consumers
  WHERE email = 'reviews@reserve4you.nl'
  LIMIT 1;

  IF v_consumer_id IS NULL THEN
    INSERT INTO consumers (name, phone, email, phone_verified)
    VALUES ('Test Reviewschrijver', '+31612345678', 'reviews@reserve4you.nl', true)
    RETURNING id INTO v_consumer_id;
    RAISE NOTICE '✅ Test consumer aangemaakt';
  ELSE
    RAISE NOTICE '✓ Test consumer bestaat al';
  END IF;

  -- Check of completed booking bestaat
  SELECT EXISTS(
    SELECT 1 FROM bookings
    WHERE location_id = v_location_id
    AND consumer_id = v_consumer_id
    AND status = 'COMPLETED'
  ) INTO v_booking_exists;

  IF NOT v_booking_exists THEN
    -- Maak completed booking met ALLE mogelijke naam varianten
    INSERT INTO bookings (
      location_id,
      table_id,
      consumer_id,
      guest_name,
      customer_name,
      guest_phone,
      customer_phone,
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
    ) VALUES (
      v_location_id,
      v_table_id,
      v_consumer_id,
      'Test Reviewschrijver',
      'Test Reviewschrijver',
      '+31612345678',
      '+31612345678',
      'reviews@reserve4you.nl',
      'reviews@reserve4you.nl',
      4,
      4,
      NOW() - INTERVAL '2 days',
      NOW() - INTERVAL '2 days' + INTERVAL '2 hours',
      (NOW() - INTERVAL '2 days')::DATE,
      (NOW() - INTERVAL '2 days')::TIME,
      'COMPLETED',
      'NONE',
      'WEB'
    );
    RAISE NOTICE '✅ Completed booking aangemaakt';
  ELSE
    RAISE NOTICE '✓ Completed booking bestaat al';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '⭐ Voorbeeld reviews aanmaken...';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- DEEL 3: MAAK VOORBEELD REVIEWS AAN
-- ============================================================================
DO $$
DECLARE
  v_consumer_id UUID;
  v_location_id UUID;
  v_review_id UUID;
  v_owner_user_id UUID;
  v_review_count INT := 0;
BEGIN
  -- Haal locatie en consumer op
  SELECT id INTO v_location_id 
  FROM locations 
  WHERE slug IN ('chickx', 'poulepoulette', 'chick-x')
  OR (is_public = true AND is_active = true)
  ORDER BY created_at DESC
  LIMIT 1;

  SELECT id INTO v_consumer_id
  FROM consumers
  WHERE email = 'reviews@reserve4you.nl'
  LIMIT 1;

  IF v_location_id IS NULL OR v_consumer_id IS NULL THEN
    RAISE NOTICE '⚠️  Kan geen reviews aanmaken';
    RETURN;
  END IF;

  -- Review 1: 5 sterren
  BEGIN
    INSERT INTO reviews (
      location_id,
      consumer_id,
      rating,
      title,
      comment,
      is_verified,
      visit_date,
      is_published
    ) VALUES (
      v_location_id,
      v_consumer_id,
      5,
      'Fantastisch restaurant!',
      'Wat een geweldige ervaring! Het eten was heerlijk, de service was uitstekend en de sfeer was perfect. Zeker een aanrader! We komen zeker terug.',
      true,
      CURRENT_DATE - 5,
      true
    )
    RETURNING id INTO v_review_id;
    
    IF v_review_id IS NOT NULL THEN
      v_review_count := v_review_count + 1;
      RAISE NOTICE '  ✅ Review 1: 5 sterren';
    END IF;
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE '  ✓ Review 1 bestaat al';
  END;

  -- Review 2: 4 sterren
  BEGIN
    INSERT INTO reviews (
      location_id,
      consumer_id,
      rating,
      title,
      comment,
      is_verified,
      visit_date,
      is_published
    ) VALUES (
      v_location_id,
      v_consumer_id,
      4,
      'Lekker eten, iets te druk',
      'Het eten was echt lekker en vers bereid. De enige reden dat ik geen 5 sterren geef is omdat het erg druk was en we lang moesten wachten. Maar de kwaliteit maakt veel goed!',
      true,
      CURRENT_DATE - 10,
      true
    );
    v_review_count := v_review_count + 1;
    RAISE NOTICE '  ✅ Review 2: 4 sterren';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE '  ✓ Review 2 bestaat al';
  END;

  -- Review 3: 5 sterren met reply
  BEGIN
    INSERT INTO reviews (
      location_id,
      consumer_id,
      rating,
      comment,
      is_verified,
      visit_date,
      is_published
    ) VALUES (
      v_location_id,
      v_consumer_id,
      5,
      'Top restaurant! Alles was perfect van A tot Z. Het personeel is super vriendelijk en het eten is van uitstekende kwaliteit. Aanrader!',
      true,
      CURRENT_DATE - 15,
      true
    )
    RETURNING id INTO v_review_id;

    IF v_review_id IS NOT NULL THEN
      v_review_count := v_review_count + 1;
      RAISE NOTICE '  ✅ Review 3: 5 sterren';

      -- Voeg owner reply toe
      SELECT owner_user_id INTO v_owner_user_id
      FROM tenants t
      INNER JOIN locations l ON l.tenant_id = t.id
      WHERE l.id = v_location_id
      LIMIT 1;

      IF v_owner_user_id IS NOT NULL THEN
        INSERT INTO review_replies (review_id, user_id, comment)
        VALUES (
          v_review_id,
          v_owner_user_id,
          'Dank je wel voor je mooie review! We waarderen het enorm dat je de tijd hebt genomen om je ervaring te delen. Tot snel!'
        );
        RAISE NOTICE '  ✅ Owner reply toegevoegd';
      END IF;
    END IF;
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE '  ✓ Review 3 bestaat al';
  END;

  RAISE NOTICE '';
  RAISE NOTICE '✅ % nieuwe review(s) aangemaakt', v_review_count;
END $$;

-- ============================================================================
-- DEEL 4: UPDATE STATISTIEKEN
-- ============================================================================
DO $$
DECLARE
  v_location_id UUID;
BEGIN
  SELECT id INTO v_location_id 
  FROM locations 
  WHERE slug IN ('chickx', 'poulepoulette', 'chick-x')
  OR (is_public = true AND is_active = true)
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_location_id IS NOT NULL THEN
    PERFORM update_location_review_stats(v_location_id);
    RAISE NOTICE '✅ Review statistieken bijgewerkt';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATIE: TOON RESULTATEN
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '📊 RESULTATEN';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

SELECT 
  l.name AS "Restaurant",
  l.slug AS "Slug",
  COALESCE(l.review_count, 0) AS "Reviews",
  ROUND(COALESCE(l.average_rating, 0), 1) AS "⭐ Rating"
FROM locations l
WHERE l.slug IN ('chickx', 'poulepoulette', 'chick-x')
   OR (l.is_public = true AND l.is_active = true)
ORDER BY l.created_at DESC
LIMIT 3;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '📝 LAATSTE REVIEWS';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

SELECT 
  r.rating AS "★",
  c.name AS "Door",
  LEFT(r.comment, 60) || '...' AS "Review",
  CASE WHEN rr.id IS NOT NULL THEN '✓' ELSE ' ' END AS "Reply"
FROM reviews r
INNER JOIN locations l ON l.id = r.location_id
INNER JOIN consumers c ON c.id = r.consumer_id
LEFT JOIN review_replies rr ON rr.review_id = r.id
WHERE l.slug IN ('chickx', 'poulepoulette', 'chick-x')
   OR l.id IN (
     SELECT id FROM locations 
     WHERE is_public = true AND is_active = true 
     ORDER BY created_at DESC 
     LIMIT 1
   )
ORDER BY r.created_at DESC
LIMIT 5;

DO $$
DECLARE
  v_url TEXT;
BEGIN
  SELECT 'http://localhost:3007/p/' || slug INTO v_url
  FROM locations
  WHERE slug IN ('chickx', 'poulepoulette', 'chick-x')
     OR (is_public = true AND is_active = true)
  ORDER BY created_at DESC
  LIMIT 1;

  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ KLAAR!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '🌐 Bekijk reviews op: %', v_url;
  RAISE NOTICE '💡 TIP: Log in en je ziet "Schrijf een review" knop!';
  RAISE NOTICE '';
END $$;

