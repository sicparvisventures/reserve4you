# Fixed Migration Order - Run These in Exact Order

## PROBLEEM

De originele migrations falen omdat:
1. Tabellen worden niet correct aangemaakt
2. Er zijn dependency issues
3. RLS policies en triggers proberen tabellen te gebruiken die niet bestaan

## OPLOSSING: Gebruik deze Veilige Migrations

### STAP 1: Run Safe Schema Migration (EERST DIT!)

**File:** `supabase/migrations/20250128000005_social_expansion_safe_phase1.sql`

Deze maakt ALLE tabellen aan in één keer met veilige error handling.

**Check na runnen:**
```sql
-- Verify all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'consumer_social_preferences',
  'follows',
  'location_follows',
  'activity_feed',
  'moment_photos',
  'feed_likes',
  'feed_comments',
  'booking_companions',
  'flow_credits',
  'user_badges',
  'conversations',
  'conversation_participants',
  'messages',
  'group_booking_invites',
  'location_trends'
);
```

Je zou 15 (of 14 als booking_companions al bestond) tabellen moeten zien.

### STAP 2: Run RLS Policies (NU MET EXISTENCE CHECKS)

**File:** `supabase/migrations/20250128000003_social_expansion_rls_policies.sql`

Nu met alle existence checks - zou moeten werken zonder errors.

### STAP 3: Run Triggers & Functions (NU MET EXISTENCE CHECKS)

**File:** `supabase/migrations/20250128000004_social_expansion_triggers_functions.sql`

Nu met alle existence checks - zou moeten werken zonder errors.

---

## Als Je Nog Steeds Errors Krijgt

### Error: "column created_by does not exist"

Dit betekent dat de `conversations` tabel niet de `created_by` column heeft.

Run dit:
```sql
-- Check if conversations table exists and has created_by
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'conversations';
```

Als `created_by` ontbreekt:
```sql
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES consumers(id) ON DELETE SET NULL;
```

### Error: "relation X does not exist"

Dit betekent dat de tabel niet succesvol is aangemaakt in Stap 1.

**Oplossing:** Run de Safe Migration opnieuw (`20250128000005_social_expansion_safe_phase1.sql`)

Of maak de ontbrekende tabel handmatig aan met de CREATE TABLE statement uit de safe migration.

---

## Verificatie Script

Run dit NA alle migrations om te verifiëren:

```sql
-- Complete verification
WITH expected_tables AS (
  SELECT unnest(ARRAY[
    'consumer_social_preferences',
    'follows',
    'location_follows',
    'activity_feed',
    'moment_photos',
    'feed_likes',
    'feed_comments',
    'booking_companions',
    'flow_credits',
    'user_badges',
    'conversations',
    'conversation_participants',
    'messages',
    'group_booking_invites',
    'location_trends'
  ]) as table_name
),
existing_tables AS (
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
)
SELECT 
  e.table_name,
  CASE WHEN et.table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM expected_tables e
LEFT JOIN existing_tables et ON e.table_name = et.table_name
ORDER BY e.table_name;
```

Alle tabellen moeten "✅ EXISTS" tonen.

