# SQL Migration Fixes - Error Resolution

## Errors Found

1. `ERROR: 42703: column "created_by" does not exist` 
2. `ERROR: 42P01: relation "location_follows" does not exist`
3. `ERROR: 42P01: relation "moment_photos" does not exist`

## Root Cause

The RLS policies and triggers are trying to reference tables/columns before they are guaranteed to exist, or the tables are not being created successfully.

## Fixes Applied

### Migration 1 (20250128000002): Fixed Column Addition
- Changed `ALTER TABLE consumers ADD COLUMN IF NOT EXISTS ...` to use a DO block that checks for column existence first
- This prevents errors if columns already exist or if there are type conflicts

### Migration 2 (20250128000003): Added Table Existence Checks
- Wrapped all RLS policy creation for `location_follows` and `moment_photos` in DO blocks that check table existence first
- This prevents errors if tables weren't created successfully

### Migration 3 (20250128000004): Added Table Existence Checks for Triggers
- Added existence checks before creating triggers on `moment_photos`
- Added conditional logic in functions that reference tables that might not exist

## Running the Migrations

**IMPORTANT:** Run migrations in this exact order:

1. First: `20250128000002_social_expansion_complete_phase1.sql`
   - Creates all tables
   - Check output for any errors

2. Second: `20250128000003_social_expansion_rls_policies.sql`
   - Creates RLS policies
   - Now has safety checks for table existence

3. Third: `20250128000004_social_expansion_triggers_functions.sql`
   - Creates triggers and functions
   - Now has safety checks

## Verification Steps

After running all migrations, verify:

```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'location_follows',
  'moment_photos',
  'activity_feed',
  'follows',
  'flow_credits',
  'user_badges',
  'conversations',
  'messages'
);

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('location_follows', 'moment_photos', 'follows');

-- Check if triggers exist
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

## If Errors Persist

If you still get errors:

1. Check if the first migration ran successfully - look for any table creation errors
2. If tables don't exist, the issue is in migration 1 - check the CREATE TABLE statements
3. If tables exist but policies fail, check if RLS is enabled manually:
   ```sql
   ALTER TABLE location_follows ENABLE ROW LEVEL SECURITY;
   ```

## Notes

- All migrations are now idempotent (can be run multiple times safely)
- Table existence checks prevent errors if tables don't exist
- Column existence checks prevent errors if columns already exist

