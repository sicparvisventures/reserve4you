# Step-by-Step Migration Instructions - Social Expansion Phase 1

## IMPORTANT: Run Migrations in Exact Order

Als je errors krijgt, betekent dit dat de tabellen niet succesvol zijn aangemaakt. Volg deze stappen exact:

## OPTIE 1: Gebruik de Safe Migration (Aanbevolen)

Als de eerdere migrations gefaald zijn, gebruik dan deze ene veilige migration:

### Stap 1: Run Safe Schema Migration

Run in Supabase SQL Editor:
```
supabase/migrations/20250128000005_social_expansion_safe_phase1.sql
```

Deze maakt ALLE tabellen aan in één keer met veilige error handling.

### Stap 2: Run RLS Policies

Run in Supabase SQL Editor:
```
supabase/migrations/20250128000003_social_expansion_rls_policies.sql
```

(Nu met alle existence checks - zou moeten werken)

### Stap 3: Run Triggers & Functions

Run in Supabase SQL Editor:
```
supabase/migrations/20250128000004_social_expansion_triggers_functions.sql
```

(Nu met alle existence checks - zou moeten werken)

---

## OPTIE 2: Herstel de Originele Migrations

Als je de originele migrations wilt gebruiken, moet je eerst checken waarom ze falen:

### Diagnose Stap 1: Check Welke Tabellen Bestaan

Run deze query in Supabase SQL Editor:

```sql
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
)
ORDER BY table_name;
```

Als sommige tabellen ontbreken, betekent dit dat de eerste migration gefaald is op een bepaald punt.

### Diagnose Stap 2: Check Consumers Table Columns

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'consumers' 
AND column_name IN (
  'profile_picture_url',
  'bio',
  'favorite_cuisines',
  'top_3_restaurants',
  'is_profile_public',
  'show_in_discover'
)
ORDER BY column_name;
```

Als columns ontbreken, dan faalde het eerste deel van migration 1.

---

## Fix Procedure

### Als Tabellen Ontbreken:

1. Run eerst de Safe Migration (`20250128000005_social_expansion_safe_phase1.sql`)
2. Dit maakt alle ontbrekende tabellen aan

### Als Columns Ontbreken:

Run dit in Supabase SQL Editor:

```sql
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consumers' AND column_name = 'profile_picture_url') THEN
    ALTER TABLE consumers ADD COLUMN profile_picture_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consumers' AND column_name = 'bio') THEN
    ALTER TABLE consumers ADD COLUMN bio TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consumers' AND column_name = 'favorite_cuisines') THEN
    ALTER TABLE consumers ADD COLUMN favorite_cuisines TEXT[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consumers' AND column_name = 'top_3_restaurants') THEN
    ALTER TABLE consumers ADD COLUMN top_3_restaurants UUID[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consumers' AND column_name = 'is_profile_public') THEN
    ALTER TABLE consumers ADD COLUMN is_profile_public BOOLEAN DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consumers' AND column_name = 'show_in_discover') THEN
    ALTER TABLE consumers ADD COLUMN show_in_discover BOOLEAN DEFAULT true;
  END IF;
END $$;
```

---

## Verificatie Na Migrations

Na het runnen van alle migrations, run deze verificatie query:

```sql
-- Check all tables
SELECT 
  'Tables' as type,
  COUNT(*) as count
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
)

UNION ALL

-- Check consumers columns
SELECT 
  'Consumer Columns' as type,
  COUNT(*) as count
FROM information_schema.columns 
WHERE table_name = 'consumers' 
AND column_name IN (
  'profile_picture_url',
  'bio',
  'favorite_cuisines',
  'top_3_restaurants',
  'is_profile_public',
  'show_in_discover'
)

UNION ALL

-- Check RLS enabled
SELECT 
  'RLS Enabled' as type,
  COUNT(*) as count
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
AND tablename IN (
  'follows',
  'location_follows',
  'activity_feed',
  'moment_photos',
  'feed_likes',
  'feed_comments',
  'flow_credits',
  'user_badges',
  'conversations',
  'messages'
)
AND c.relrowsecurity = true;
```

Je zou moeten zien:
- Tables: 15 (of meer als booking_companions al bestond)
- Consumer Columns: 6
- RLS Enabled: 10+ (afhankelijk van welke tabellen bestaan)

---

## Als Errors Persisteren

1. Check Supabase logs voor specifieke error messages
2. Run de Safe Migration (`20250128000005`) eerst
3. Check welke tabellen daarna nog ontbreken
4. Maak ontbrekende tabellen handmatig aan met CREATE TABLE statements

