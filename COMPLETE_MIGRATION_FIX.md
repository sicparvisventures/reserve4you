# Complete Migration Fix - Volgorde en Uitleg

## PROBLEEM

Je krijgt errors omdat:
1. De `conversations` tabel al bestaat (van eerdere migration) maar heeft GEEN `created_by` column
2. `CREATE TABLE IF NOT EXISTS` wijzigt bestaande tabellen NIET
3. Index creation faalt omdat de column niet bestaat

## OPLOSSING: Run Migrations in Deze Exacte Volgorde

### STAP 1: Run Safe Schema Migration

**File:** `supabase/migrations/20250128000005_social_expansion_safe_phase1.sql`

Deze maakt alle tabellen aan en probeert de `created_by` column toe te voegen aan bestaande `conversations` tabel.

### STAP 2: Run Final Fix (BELANGRIJK!)

**File:** `supabase/migrations/20250128000006_social_expansion_final_fix.sql`

Deze:
- Voegt `created_by`, `type`, en `name` toe aan bestaande `conversations` tabel
- Maakt ontbrekende tabellen aan (`moment_photos`, `activity_feed`, `location_follows`)
- Maakt alle indexes aan

**Dit is cruciaal!** Run dit altijd na de safe migration.

### STAP 3: Run RLS Policies

**File:** `supabase/migrations/20250128000003_social_expansion_rls_policies.sql`

Nu met alle existence checks - zou moeten werken.

### STAP 4: Run Triggers & Functions

**File:** `supabase/migrations/20250128000004_social_expansion_triggers_functions.sql`

Nu met alle existence checks - zou moeten werken.

---

## Als Je Nog Steeds Errors Krijgt

### Error: "column created_by does not exist"

Run dit handmatig in Supabase SQL Editor:

```sql
-- Check if conversations exists
SELECT table_name FROM information_schema.tables WHERE table_name = 'conversations';

-- Check columns
SELECT column_name FROM information_schema.columns WHERE table_name = 'conversations';

-- Add created_by if missing
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES consumers(id) ON DELETE SET NULL;

-- Add type if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' AND column_name = 'type'
  ) THEN
    ALTER TABLE conversations ADD COLUMN type VARCHAR(20) DEFAULT 'direct';
    UPDATE conversations SET type = 'direct' WHERE type IS NULL;
    ALTER TABLE conversations ALTER COLUMN type SET NOT NULL;
  END IF;
END $$;

-- Create index
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
```

### Error: "relation moment_photos does not exist"

Run dit handmatig:

```sql
CREATE TABLE IF NOT EXISTS moment_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  tags TEXT[],
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moment_photos_booking ON moment_photos(booking_id);
CREATE INDEX IF NOT EXISTS idx_moment_photos_location ON moment_photos(location_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moment_photos_consumer ON moment_photos(consumer_id, created_at DESC);
```

---

## Verificatie Na Alle Migrations

Run dit om te checken of alles correct is:

```sql
-- Check conversations table has all columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'conversations'
ORDER BY column_name;

-- Should show: created_at, created_by, id, name, type, updated_at

-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'moment_photos',
  'activity_feed',
  'location_follows',
  'follows',
  'flow_credits',
  'user_badges'
)
ORDER BY table_name;

-- Should show all 6 tables
```

Als alles correct is, kun je verder met de API endpoints!

