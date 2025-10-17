-- ============================================================================
-- COMPREHENSIVE SCHEMA FIX
-- ============================================================================
-- This migration ensures ALL tables have the correct columns and structure
-- to match the frontend expectations. It's idempotent and safe to run.
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🔧 Starting comprehensive schema fix...';

    -- ============================================================================
    -- 1. LOCATIONS TABLE
    -- ============================================================================
    RAISE NOTICE '📍 Fixing locations table...';

    -- Ensure address_json exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'address_json') THEN
        ALTER TABLE public.locations ADD COLUMN address_json JSONB;
        RAISE NOTICE '   ✅ Added address_json column';
    END IF;

    -- Migrate any remaining old address columns to address_json
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'address_line1') THEN
        UPDATE public.locations
        SET address_json = jsonb_build_object(
            'street', COALESCE(address_line1, ''),
            'number', '',
            'city', COALESCE(city, ''),
            'postalCode', COALESCE(postal_code, ''),
            'country', COALESCE(country, 'NL')
        )
        WHERE address_json IS NULL;
        RAISE NOTICE '   ✅ Migrated old address data';
    END IF;

    -- Standardize on 'cuisine' (not 'cuisine_type')
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'cuisine_type') THEN
        -- If we have both, merge them
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'cuisine') THEN
            UPDATE public.locations SET cuisine = COALESCE(cuisine, cuisine_type) WHERE cuisine IS NULL;
        ELSE
            -- Rename cuisine_type to cuisine
            ALTER TABLE public.locations RENAME COLUMN cuisine_type TO cuisine;
        END IF;
        -- Drop cuisine_type if it still exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'cuisine_type') THEN
            ALTER TABLE public.locations DROP COLUMN cuisine_type;
        END IF;
        RAISE NOTICE '   ✅ Standardized cuisine column';
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'cuisine') THEN
        ALTER TABLE public.locations ADD COLUMN cuisine VARCHAR(100);
        RAISE NOTICE '   ✅ Added cuisine column';
    END IF;

    -- Add opening_hours_json if it doesn't exist (standardize name)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'opening_hours_json') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'opening_hours') THEN
            ALTER TABLE public.locations RENAME COLUMN opening_hours TO opening_hours_json;
            RAISE NOTICE '   ✅ Renamed opening_hours to opening_hours_json';
        ELSE
            ALTER TABLE public.locations ADD COLUMN opening_hours_json JSONB DEFAULT '{}';
            RAISE NOTICE '   ✅ Added opening_hours_json column';
        END IF;
    END IF;

    -- Add slot_minutes and buffer_minutes if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'slot_minutes') THEN
        ALTER TABLE public.locations ADD COLUMN slot_minutes INT NOT NULL DEFAULT 90;
        RAISE NOTICE '   ✅ Added slot_minutes column';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'buffer_minutes') THEN
        ALTER TABLE public.locations ADD COLUMN buffer_minutes INT NOT NULL DEFAULT 15;
        RAISE NOTICE '   ✅ Added buffer_minutes column';
    END IF;

    -- Ensure critical columns exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'is_public') THEN
        ALTER TABLE public.locations ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE '   ✅ Added is_public column';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'is_active') THEN
        ALTER TABLE public.locations ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
        RAISE NOTICE '   ✅ Added is_active column';
    END IF;

    -- ============================================================================
    -- 2. CONSUMERS TABLE
    -- ============================================================================
    RAISE NOTICE '👤 Fixing consumers table...';

    -- Ensure name and phone columns exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consumers' AND column_name = 'name') THEN
        ALTER TABLE public.consumers ADD COLUMN name VARCHAR(255);
        RAISE NOTICE '   ✅ Added name column to consumers';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consumers' AND column_name = 'phone') THEN
        ALTER TABLE public.consumers ADD COLUMN phone VARCHAR(20);
        RAISE NOTICE '   ✅ Added phone column to consumers';
    END IF;

    -- ============================================================================
    -- 3. BOOKINGS TABLE
    -- ============================================================================
    RAISE NOTICE '📅 Fixing bookings table...';

    -- Ensure start_ts and end_ts columns exist (not just start_time/end_time)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'start_ts') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'start_time') THEN
            ALTER TABLE public.bookings RENAME COLUMN start_time TO start_ts;
            RAISE NOTICE '   ✅ Renamed start_time to start_ts';
        ELSE
            ALTER TABLE public.bookings ADD COLUMN start_ts TIMESTAMPTZ NOT NULL DEFAULT NOW();
            RAISE NOTICE '   ✅ Added start_ts column';
        END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'end_ts') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'end_time') THEN
            ALTER TABLE public.bookings RENAME COLUMN end_time TO end_ts;
            RAISE NOTICE '   ✅ Renamed end_time to end_ts';
        ELSE
            ALTER TABLE public.bookings ADD COLUMN end_ts TIMESTAMPTZ NOT NULL DEFAULT NOW();
            RAISE NOTICE '   ✅ Added end_ts column';
        END IF;
    END IF;

    -- Ensure guest columns exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'guest_name') THEN
        ALTER TABLE public.bookings ADD COLUMN guest_name VARCHAR(255);
        RAISE NOTICE '   ✅ Added guest_name column';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'guest_phone') THEN
        ALTER TABLE public.bookings ADD COLUMN guest_phone VARCHAR(20);
        RAISE NOTICE '   ✅ Added guest_phone column';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'guest_email') THEN
        ALTER TABLE public.bookings ADD COLUMN guest_email VARCHAR(255);
        RAISE NOTICE '   ✅ Added guest_email column';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'special_notes') THEN
        ALTER TABLE public.bookings ADD COLUMN special_notes TEXT;
        RAISE NOTICE '   ✅ Added special_notes column';
    END IF;

    -- Ensure payment columns exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'deposit_amount_cents') THEN
        ALTER TABLE public.bookings ADD COLUMN deposit_amount_cents INT DEFAULT 0;
        RAISE NOTICE '   ✅ Added deposit_amount_cents column';
    END IF;

    -- Ensure idempotency_key exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'idempotency_key') THEN
        ALTER TABLE public.bookings ADD COLUMN idempotency_key VARCHAR(255) UNIQUE;
        RAISE NOTICE '   ✅ Added idempotency_key column';
    END IF;

    -- ============================================================================
    -- 4. BILLING_STATE TABLE
    -- ============================================================================
    RAISE NOTICE '💳 Fixing billing_state table...';

    -- Ensure quota columns exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'billing_state' AND column_name = 'max_locations') THEN
        ALTER TABLE public.billing_state ADD COLUMN max_locations INT NOT NULL DEFAULT 1;
        RAISE NOTICE '   ✅ Added max_locations column';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'billing_state' AND column_name = 'max_bookings_per_month') THEN
        ALTER TABLE public.billing_state ADD COLUMN max_bookings_per_month INT NOT NULL DEFAULT 200;
        RAISE NOTICE '   ✅ Added max_bookings_per_month column';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'billing_state' AND column_name = 'bookings_used_this_month') THEN
        ALTER TABLE public.billing_state ADD COLUMN bookings_used_this_month INT NOT NULL DEFAULT 0;
        RAISE NOTICE '   ✅ Added bookings_used_this_month column';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'billing_state' AND column_name = 'trial_end') THEN
        ALTER TABLE public.billing_state ADD COLUMN trial_end TIMESTAMPTZ;
        RAISE NOTICE '   ✅ Added trial_end column';
    END IF;

    -- ============================================================================
    -- 5. CREATE INDEXES FOR PERFORMANCE
    -- ============================================================================
    RAISE NOTICE '📊 Creating performance indexes...';

    -- Bookings indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_bookings_location_start') THEN
        CREATE INDEX idx_bookings_location_start ON public.bookings(location_id, start_ts);
        RAISE NOTICE '   ✅ Created idx_bookings_location_start';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_bookings_status') THEN
        CREATE INDEX idx_bookings_status ON public.bookings(status);
        RAISE NOTICE '   ✅ Created idx_bookings_status';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_bookings_idempotency_key') THEN
        CREATE INDEX idx_bookings_idempotency_key ON public.bookings(idempotency_key) WHERE idempotency_key IS NOT NULL;
        RAISE NOTICE '   ✅ Created idx_bookings_idempotency_key';
    END IF;

    -- ============================================================================
    -- 6. UPDATE EXISTING DATA TO MATCH NEW SCHEMA
    -- ============================================================================
    RAISE NOTICE '🔄 Updating existing data...';

    -- Ensure all locations have address_json
    UPDATE public.locations
    SET address_json = jsonb_build_object(
        'street', '',
        'number', '',
        'city', '',
        'postalCode', '',
        'country', 'NL'
    )
    WHERE address_json IS NULL;

    -- Ensure all billing_state records have proper quotas based on plan
    UPDATE public.billing_state
    SET
        max_locations = CASE
            WHEN plan = 'FREE' THEN 1
            WHEN plan = 'STARTER' THEN 1
            WHEN plan = 'GROWTH' THEN 3
            WHEN plan = 'BUSINESS' THEN 5
            WHEN plan = 'PREMIUM' THEN 999999
            WHEN plan = 'ENTERPRISE' THEN 999999
            ELSE 1
        END,
        max_bookings_per_month = CASE
            WHEN plan = 'FREE' THEN 50
            WHEN plan = 'STARTER' THEN 200
            WHEN plan = 'GROWTH' THEN 1000
            WHEN plan = 'BUSINESS' THEN 3000
            WHEN plan = 'PREMIUM' THEN 999999
            WHEN plan = 'ENTERPRISE' THEN 999999
            ELSE 50
        END
    WHERE max_locations IS NULL OR max_bookings_per_month IS NULL;

    RAISE NOTICE '✅ Comprehensive schema fix completed successfully!';
END $$;

