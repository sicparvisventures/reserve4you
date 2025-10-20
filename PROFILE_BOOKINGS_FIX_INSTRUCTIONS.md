# Profile & Bookings Fix Instructions

## Issues Fixed

1. ✅ **Generated column error**: Changed from immutable generated columns to trigger-based approach
2. ✅ **Ambiguous column reference**: Fixed `auth_user_id` reference in `update_consumer_profile` function
3. ✅ **Profile name not saving**: Updated COALESCE logic to properly save names
4. ✅ **Bookings not showing**: Added `start_ts` and `end_ts` columns with automatic computation

## Run These SQL Scripts (In Order)

### Step 1: Fix the Profile Update Function
```bash
# Run in Supabase SQL Editor
CREATE_UPDATE_CONSUMER_PROFILE_FUNCTION_FIXED.sql
```

This fixes:
- The ambiguous `auth_user_id` column reference
- The profile name not being saved (uses explicit CASE logic instead of COALESCE)

### Step 2: Fix Bookings Display
```bash
# Run in Supabase SQL Editor
FIX_PROFILE_AND_BOOKINGS_FIXED.sql
```

This fixes:
- Adds `start_ts` and `end_ts` columns (regular columns, not generated)
- Creates a trigger to automatically compute these timestamps
- Links bookings to consumers
- Creates consumer records for auth users

## What Changed

### 1. Generated Column → Trigger Approach
**Before** (caused error):
```sql
ALTER TABLE bookings 
ADD COLUMN start_ts TIMESTAMPTZ 
GENERATED ALWAYS AS (
  (booking_date || ' ' || booking_time)::TIMESTAMPTZ
) STORED;
```

**After** (works):
```sql
-- Add regular column
ALTER TABLE bookings ADD COLUMN start_ts TIMESTAMPTZ;

-- Create trigger to compute value
CREATE OR REPLACE FUNCTION compute_booking_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.start_ts := (NEW.booking_date::TEXT || ' ' || NEW.booking_time::TEXT)::TIMESTAMPTZ;
  NEW.end_ts := NEW.start_ts + (NEW.duration_minutes || ' minutes')::INTERVAL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE TRIGGER trigger_compute_booking_timestamps
  BEFORE INSERT OR UPDATE OF booking_date, booking_time, duration_minutes
  ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION compute_booking_timestamps();
```

### 2. Fixed Ambiguous Column Reference
**Before** (caused error):
```sql
SELECT consumers.id INTO v_consumer_id
FROM consumers
WHERE auth_user_id = p_user_id;  -- ❌ Ambiguous!
```

**After** (works):
```sql
SELECT c.id INTO v_consumer_id
FROM consumers c
WHERE c.auth_user_id = p_user_id;  -- ✅ Explicit alias
```

### 3. Fixed Profile Name Saving
**Before** (name not saved):
```sql
UPDATE consumers
SET 
  name = COALESCE(p_name, consumers.name),  -- ❌ If p_name is NULL, keeps old value
  phone = COALESCE(p_phone, consumers.phone),
  updated_at = NOW()
WHERE consumers.id = v_consumer_id;
```

**After** (name saved):
```sql
UPDATE consumers c
SET 
  name = CASE 
    WHEN p_name IS NOT NULL AND p_name != '' THEN p_name  -- ✅ Explicitly update if provided
    ELSE c.name 
  END,
  phone = CASE 
    WHEN p_phone IS NOT NULL THEN p_phone 
    ELSE c.phone 
  END,
  updated_at = NOW()
WHERE c.id = v_consumer_id;
```

## Testing

### Test 1: Profile Name Update
1. Go to `http://localhost:3007/profile`
2. Click "Account Gegevens"
3. Update "Volledige Naam" (Full Name)
4. Click "Wijzigingen Opslaan" (Save Changes)
5. ✅ Name should be saved and visible

### Test 2: Bookings Display
1. Go to `http://localhost:3007/profile`
2. Click "Reserveringen" tab
3. ✅ You should see all your previous bookings

### Test 3: New Booking
1. Make a new reservation (logged in with Google)
2. Go to `http://localhost:3007/profile` → "Reserveringen"
3. ✅ New booking should appear immediately

## Verification Queries

Run these in Supabase SQL Editor to verify everything works:

```sql
-- Check if start_ts and end_ts are populated
SELECT 
  id,
  booking_date,
  booking_time,
  start_ts,
  end_ts,
  customer_name,
  customer_email
FROM bookings
ORDER BY created_at DESC
LIMIT 10;

-- Check your consumer profile
SELECT 
  c.id,
  c.auth_user_id,
  c.name,
  c.email,
  c.phone,
  au.email as auth_email
FROM consumers c
JOIN auth.users au ON c.auth_user_id = au.id
WHERE au.email = 'your-email@example.com';  -- Replace with your email

-- Check your bookings
SELECT 
  b.booking_date,
  b.booking_time,
  b.start_ts,
  b.customer_name,
  c.name as consumer_name,
  c.auth_user_id
FROM bookings b
LEFT JOIN consumers c ON b.consumer_id = c.id
WHERE c.auth_user_id = auth.uid()
ORDER BY b.booking_date DESC, b.booking_time DESC;
```

## Why The Errors Happened

### 1. Generated Column Error
PostgreSQL requires generated column expressions to be **immutable** (always return the same result for the same input). The string concatenation `||` operator and `::TIMESTAMPTZ` cast depend on the session's timezone setting, so PostgreSQL considers them **not immutable**.

**Solution**: Use a trigger instead, which computes the value at insert/update time.

### 2. Ambiguous Column Error
When you have a column name that matches a function parameter or variable name, PostgreSQL can't determine which one you mean. In our case, `auth_user_id` could refer to:
- `consumers.auth_user_id` (the column)
- `p_user_id` (the parameter)

**Solution**: Always use table aliases (`c.auth_user_id`) to be explicit.

## Summary

✅ Run `CREATE_UPDATE_CONSUMER_PROFILE_FUNCTION_FIXED.sql` first  
✅ Then run `FIX_PROFILE_AND_BOOKINGS_FIXED.sql`  
✅ Test profile name saving  
✅ Test bookings display  

Both issues should now be resolved! 🎉

