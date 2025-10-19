-- ============================================================================
-- ADD MISSING COLUMNS FOR DISCOVER PAGE
-- ============================================================================
-- This migration adds any missing columns needed for the discover functionality
-- and standardizes column names.
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🔧 Adding missing columns for discover page...';

    -- Ensure cuisine_type column exists (if only 'cuisine' exists, add cuisine_type as alias)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'locations' AND column_name = 'cuisine_type'
    ) THEN
        -- Check if 'cuisine' exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'locations' AND column_name = 'cuisine'
        ) THEN
            -- Add cuisine_type and sync with cuisine
            ALTER TABLE public.locations ADD COLUMN cuisine_type VARCHAR(100);
            UPDATE public.locations SET cuisine_type = cuisine WHERE cuisine IS NOT NULL;
            RAISE NOTICE '✅ Added cuisine_type column and synced with cuisine';
        ELSE
            -- Neither exists, add cuisine_type
            ALTER TABLE public.locations ADD COLUMN cuisine_type VARCHAR(100);
            RAISE NOTICE '✅ Added cuisine_type column';
        END IF;
    ELSE
        RAISE NOTICE '⏭️  cuisine_type column already exists';
    END IF;

    -- Ensure address field exists (some queries expect single 'address' field)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'locations' AND column_name = 'address'
    ) THEN
        -- Add address column
        ALTER TABLE public.locations ADD COLUMN address TEXT;
        
        -- Populate from address_line1 if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'locations' AND column_name = 'address_line1'
        ) THEN
            UPDATE public.locations 
            SET address = CONCAT_WS(', ', 
                address_line1, 
                NULLIF(address_line2, '')
            )
            WHERE address_line1 IS NOT NULL;
            RAISE NOTICE '✅ Added address column and populated from address_line1';
        -- Or populate from address_json if it exists
        ELSIF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'locations' AND column_name = 'address_json'
        ) THEN
            UPDATE public.locations 
            SET address = CONCAT_WS(' ', 
                address_json->>'street',
                address_json->>'number'
            )
            WHERE address_json IS NOT NULL;
            RAISE NOTICE '✅ Added address column and populated from address_json';
        ELSE
            RAISE NOTICE '✅ Added address column (empty)';
        END IF;
    ELSE
        RAISE NOTICE '⏭️  address column already exists';
    END IF;

    -- Ensure image_url exists (some cards expect this)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'locations' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE public.locations ADD COLUMN image_url TEXT;
        
        -- Copy from hero_image_url if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'locations' AND column_name = 'hero_image_url'
        ) THEN
            UPDATE public.locations 
            SET image_url = hero_image_url 
            WHERE hero_image_url IS NOT NULL;
            RAISE NOTICE '✅ Added image_url column and copied from hero_image_url';
        ELSE
            RAISE NOTICE '✅ Added image_url column';
        END IF;
    ELSE
        RAISE NOTICE '⏭️  image_url column already exists';
    END IF;

    -- Ensure latitude and longitude are TEXT (for compatibility)
    -- Some parts of the code expect these as TEXT
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'locations' 
        AND column_name = 'latitude' 
        AND data_type != 'text'
    ) THEN
        ALTER TABLE public.locations 
        ALTER COLUMN latitude TYPE TEXT USING latitude::TEXT;
        RAISE NOTICE '✅ Changed latitude to TEXT type';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'locations' 
        AND column_name = 'longitude' 
        AND data_type != 'text'
    ) THEN
        ALTER TABLE public.locations 
        ALTER COLUMN longitude TYPE TEXT USING longitude::TEXT;
        RAISE NOTICE '✅ Changed longitude to TEXT type';
    END IF;

    RAISE NOTICE '✅ Discover columns migration complete!';
END $$;


-- Create trigger to keep cuisine and cuisine_type in sync
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_cuisine_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- When cuisine is updated, update cuisine_type
    IF NEW.cuisine IS DISTINCT FROM OLD.cuisine THEN
        NEW.cuisine_type := NEW.cuisine;
    END IF;
    
    -- When cuisine_type is updated, update cuisine
    IF NEW.cuisine_type IS DISTINCT FROM OLD.cuisine_type THEN
        NEW.cuisine := NEW.cuisine_type;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS sync_cuisine_trigger ON locations;
CREATE TRIGGER sync_cuisine_trigger
    BEFORE INSERT OR UPDATE ON locations
    FOR EACH ROW
    EXECUTE FUNCTION sync_cuisine_fields();

COMMENT ON TRIGGER sync_cuisine_trigger ON locations IS 
'Keeps cuisine and cuisine_type columns in sync for backwards compatibility';

