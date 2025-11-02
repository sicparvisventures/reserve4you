# Migration Fixes Summary

## Errors Fixed

### 1. `column "created_by" does not exist`
**Problem:** RLS policies referenced `created_by` column before verifying it exists
**Fix:** Added column existence checks in DO blocks before creating policies that reference `created_by`

### 2. `relation "location_follows" does not exist`
**Problem:** RLS policies tried to enable RLS on table that might not exist
**Fix:** Wrapped all RLS operations for `location_follows` in DO blocks with table existence checks

### 3. `relation "moment_photos" does not exist`
**Problem:** Triggers and RLS policies referenced table that might not exist
**Fix:** Added table existence checks before creating triggers and RLS policies for `moment_photos`

## All Migrations Updated

### ✅ Migration 1: `20250128000002_social_expansion_complete_phase1.sql`
- Fixed: Consumer column additions now use DO block with existence checks
- All tables properly created with IF NOT EXISTS

### ✅ Migration 2: `20250128000003_social_expansion_rls_policies.sql`
- Fixed: All RLS policy creation wrapped in DO blocks with table/column existence checks
- Safe to run even if some tables don't exist

### ✅ Migration 3: `20250128000004_social_expansion_triggers_functions.sql`
- Fixed: Trigger creation wrapped in DO blocks with table existence checks
- Functions have conditional logic for tables that might not exist

## How to Run

Execute these migrations **in order** in Supabase SQL Editor:

1. **First:** Run `20250128000002_social_expansion_complete_phase1.sql`
   - Should complete without errors
   - Creates all 16 tables

2. **Second:** Run `20250128000003_social_expansion_rls_policies.sql`
   - Now has safety checks
   - Will skip policies if tables don't exist

3. **Third:** Run `20250128000004_social_expansion_triggers_functions.sql`
   - Now has safety checks
   - Will skip triggers if tables don't exist

## Verification Query

After running all migrations, run this to verify everything was created:

```sql
-- Check all tables exist
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
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

All tables should show up with their column counts.

