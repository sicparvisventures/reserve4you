# R4Y Database Migration Guide

## 🎯 Quick Start - Fresh Installation

Als je **geen bestaande data** hebt en een fresh start wilt:

### Stap 1: Reset Database (Optional - alleen als je opnieuw wilt beginnen)
```sql
-- ⚠️ WARNING: This DELETES ALL DATA!

-- Drop all R4Y tables
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS pos_integrations CASCADE;
DROP TABLE IF EXISTS billing_state CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS consumers CASCADE;
DROP TABLE IF EXISTS policies CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS tables CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS memberships CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- Drop all types
DROP TYPE IF EXISTS membership_role CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS billing_plan CASCADE;
DROP TYPE IF EXISTS billing_status CASCADE;
DROP TYPE IF EXISTS pos_vendor CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS is_tenant_member(UUID, UUID);
DROP FUNCTION IF EXISTS get_location_tenant(UUID);
DROP FUNCTION IF EXISTS is_billing_active(UUID);
DROP FUNCTION IF EXISTS update_updated_at_column();
```

### Stap 2: Run Safe Migration
Ga naar Supabase SQL Editor en run:
```
supabase/migrations/20241017000002_r4y_multi_tenant_schema_safe.sql
```

### Stap 3: Verify
Run:
```
supabase/migrations/verify_schema.sql
```

Je zou moeten zien: **"🎉 SUCCESS!"**

---

## 🔄 Upgrading Existing Database

Als je **al een database hebt** met data:

### Stap 1: Verify Current State
```
supabase/migrations/verify_schema.sql
```

Dit vertelt je wat er ontbreekt.

### Stap 2: Run Migrations in Order

#### A. Create Tables & Types (Safe - won't duplicate)
```
supabase/migrations/20241017000002_r4y_multi_tenant_schema_safe.sql
```

#### B. Fix Column Names (Renames start_time → start_ts)
```
supabase/migrations/20241017000003_fix_column_names.sql
```

#### C. Migrate Address to JSON (Converts old address columns)
```
supabase/migrations/20241017000004_migrate_address_to_json.sql
```

### Stap 3: Verify Again
```
supabase/migrations/verify_schema.sql
```

---

## 🐛 Common Issues & Solutions

### Issue: "type already exists"
**Cause:** You've run the migration before.

**Solution:** Use the safe migration (`20241017000002`) which handles this automatically.

### Issue: "column start_ts does not exist"
**Cause:** Your bookings table uses old column names (start_time, end_time).

**Solution:** Run `20241017000003_fix_column_names.sql`

### Issue: "column address_json does not exist"
**Cause:** Your locations table uses old address structure (address_line1, city, etc.).

**Solution:** Run `20241017000004_migrate_address_to_json.sql`

### Issue: "relation does not exist"
**Cause:** Tables haven't been created yet.

**Solution:** Run the base migration first (`20241017000002`)

---

## 📊 Expected Schema After Migration

### Tables (11)
- `tenants` - Restaurant groups/organizations
- `memberships` - Team members with roles
- `locations` - Restaurant locations
- `tables` - Physical tables
- `shifts` - Service periods
- `policies` - Cancellation & deposit rules
- `consumers` - Guest users
- `bookings` - Reservations
- `billing_state` - Subscription status
- `pos_integrations` - POS system connections
- `favorites` - User favorites

### Custom Types (6)
- `membership_role` - OWNER, MANAGER, STAFF
- `booking_status` - PENDING, CONFIRMED, CANCELLED, NO_SHOW, COMPLETED, WAITLIST
- `payment_status` - NONE, REQUIRES_PAYMENT, PAID, FAILED, REFUNDED
- `billing_plan` - START, PRO, PLUS
- `billing_status` - ACTIVE, PAST_DUE, CANCELLED, TRIALING, INACTIVE, UNPAID
- `pos_vendor` - LIGHTSPEED, SQUARE, TOAST, CLOVER

### Key Columns

**bookings table:**
- `start_ts` TIMESTAMPTZ (not start_time)
- `end_ts` TIMESTAMPTZ (not end_time)
- `guest_name`, `guest_phone`, `guest_email`

**locations table:**
- `address_json` JSONB (not separate columns)
- `opening_hours_json` JSONB
- `slot_minutes` INTEGER
- `buffer_minutes` INTEGER

**shifts table:**
- `start_time` TIME (not TIMESTAMPTZ)
- `end_time` TIME
- `day_of_week` INTEGER (0-6)

---

## 🔍 Manual Verification Queries

### Check all tables exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'tenants', 'memberships', 'locations', 'tables', 
    'shifts', 'policies', 'consumers', 'bookings', 
    'billing_state', 'pos_integrations', 'favorites'
  )
ORDER BY table_name;
```
**Expected:** 11 rows

### Check all types exist
```sql
SELECT typname 
FROM pg_type 
WHERE typname IN (
  'membership_role', 'booking_status', 'payment_status', 
  'billing_plan', 'billing_status', 'pos_vendor'
)
ORDER BY typname;
```
**Expected:** 6 rows

### Check critical columns
```sql
-- Bookings columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
  AND column_name IN ('start_ts', 'end_ts', 'guest_name', 'guest_phone', 'guest_email')
ORDER BY column_name;

-- Locations columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'locations' 
  AND column_name IN ('address_json', 'opening_hours_json', 'slot_minutes', 'buffer_minutes')
ORDER BY column_name;
```
**Expected:** All columns should be present with correct types

### Check RLS is enabled
```sql
SELECT 
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'tenants', 'memberships', 'locations', 'tables', 
    'shifts', 'policies', 'consumers', 'bookings', 
    'billing_state', 'pos_integrations', 'favorites'
  )
ORDER BY tablename;
```
**Expected:** All should have `rowsecurity = true`

---

## 🆘 Nuclear Option - Complete Reset

If everything is broken and you want to start fresh:

```sql
-- 1. Drop EVERYTHING R4Y related
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- 2. Recreate extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. Run the safe migration
-- (Copy contents of 20241017000002_r4y_multi_tenant_schema_safe.sql)
```

---

## ✅ Success Indicators

After successful migration, you should see:

```
🎉 SUCCESS! Your database schema is correctly configured!
   ✅ 11/11 tables
   ✅ 6/6 types  
   ✅ 4/4 functions
   ✅ 11/11 tables with RLS
```

---

## 📞 Still Having Issues?

Run the verify script and send the output:
```
supabase/migrations/verify_schema.sql
```

The output will show exactly what's missing or misconfigured.

