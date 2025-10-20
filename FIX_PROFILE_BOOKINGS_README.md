# Fix Profile & Bookings Issues

## 🐛 Problemen

1. **Profile naam wordt niet opgeslagen** in `/profile` → Account Gegevens
2. **Reservaties niet zichtbaar** in `/profile` → Reserveringen

## 🔍 Root Cause Analysis

### Probleem 1: Profile Naam
- API roept `update_consumer_profile()` stored procedure aan
- Deze procedure bestaat mogelijk niet in jouw database
- OF consumer record bestaat niet voor je user

### Probleem 2: Reservaties
- Code zoekt naar `start_ts` kolom in bookings tabel
- Jouw database heeft: `booking_date` + `booking_time` + `duration_minutes`
- Geen `start_ts` kolom = geen bookings gevonden
- Mogelijk ook: bookings hebben geen `consumer_id` link

## ✅ Oplossing

### Stap 1: Run Main Fix Script

**Bestand**: `FIX_PROFILE_AND_BOOKINGS.sql`

**Wat het doet**:
1. ✅ Voegt `start_ts` en `end_ts` kolommen toe (generated columns)
2. ✅ Linkt bookings aan consumers op basis van email
3. ✅ Maakt consumer records aan voor auth users
4. ✅ Verificatie queries

**Instructies**:
```sql
-- In Supabase SQL Editor
-- Plak en run: FIX_PROFILE_AND_BOOKINGS.sql
```

### Stap 2: Create Profile Update Function (als nodig)

Als je na Stap 1 nog steeds problemen hebt met profile updates:

**Bestand**: `CREATE_UPDATE_CONSUMER_PROFILE_FUNCTION.sql`

**Wat het doet**:
1. ✅ Maakt de `update_consumer_profile()` functie aan
2. ✅ Grant permissions voor authenticated users
3. ✅ Index voor snelle lookups

**Instructies**:
```sql
-- In Supabase SQL Editor
-- Run alleen als profile update nog niet werkt
-- Plak en run: CREATE_UPDATE_CONSUMER_PROFILE_FUNCTION.sql
```

## 🧪 Testing

### Test 1: Profile Update

1. Ga naar `http://localhost:3007/profile`
2. Klik op "Account Gegevens"
3. Wijzig je "Volledige naam"
4. Klik "Opslaan"
5. ✅ Refresh de pagina → naam blijft staan

**Debug als het niet werkt**:
```sql
-- Check if consumer exists for your user
SELECT 
  c.*,
  au.email as auth_email
FROM consumers c
INNER JOIN auth.users au ON c.auth_user_id = au.id
WHERE au.email = 'jouw@email.nl';  -- Vervang met jouw email

-- Check if function exists
SELECT proname, pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'update_consumer_profile';
```

### Test 2: Bookings Display

1. Ga naar `http://localhost:3007/profile`
2. Klik op "Reserveringen"
3. ✅ Je bookings zijn nu zichtbaar!

**Debug als het niet werkt**:
```sql
-- Check your bookings
SELECT 
  b.id,
  b.booking_date,
  b.booking_time,
  b.start_ts,          -- Should NOT be NULL
  b.customer_email,
  b.consumer_id,       -- Should be linked
  c.auth_user_id,
  au.email as user_email
FROM bookings b
LEFT JOIN consumers c ON b.consumer_id = c.id
LEFT JOIN auth.users au ON c.auth_user_id = au.id
WHERE b.customer_email = 'jouw@email.nl'  -- Vervang met jouw email
ORDER BY b.booking_date DESC;
```

## 📊 What Gets Fixed

### Before (Database Schema)
```sql
bookings:
  ❌ No start_ts column
  ❌ No end_ts column
  ❌ consumer_id often NULL
  
consumers:
  ❌ Missing records for auth users
```

### After
```sql
bookings:
  ✅ start_ts (generated from booking_date + booking_time)
  ✅ end_ts (generated from start_ts + duration_minutes)
  ✅ consumer_id linked to consumers table
  
consumers:
  ✅ All auth users have consumer records
  ✅ update_consumer_profile function works
```

## 🔧 Technical Details

### Generated Columns
```sql
-- start_ts is computed from existing data
ALTER TABLE bookings 
ADD COLUMN start_ts TIMESTAMPTZ 
GENERATED ALWAYS AS (
  (booking_date || ' ' || booking_time)::TIMESTAMPTZ
) STORED;

-- end_ts is computed from start_ts + duration
ALTER TABLE bookings 
ADD COLUMN end_ts TIMESTAMPTZ 
GENERATED ALWAYS AS (
  ((booking_date || ' ' || booking_time)::TIMESTAMPTZ + 
   (duration_minutes || ' minutes')::INTERVAL)
) STORED;
```

**Benefits**:
- ✅ Automatically updated when booking_date/time changes
- ✅ No manual updates needed
- ✅ Always in sync
- ✅ Indexed for fast queries

### Consumer Linking Logic
```sql
-- Link bookings by email match
UPDATE bookings b
SET consumer_id = c.id
FROM consumers c
WHERE b.customer_email = c.email
  AND c.auth_user_id IS NOT NULL
  AND b.consumer_id IS NULL;
```

## 🎯 Expected Results

### Profile Page (`/profile`)

**Account Gegevens Tab**:
- ✅ Name field is editable
- ✅ Phone field is editable
- ✅ "Opslaan" button works
- ✅ Success message appears
- ✅ Changes persist after refresh

**Reserveringen Tab**:
- ✅ Your bookings appear
- ✅ Separated into "Aankomende" and "Eerdere" reserveringen
- ✅ Shows location name, date, time, party size
- ✅ Click to see details

## ⚠️ Troubleshooting

### Issue: "update_consumer_profile does not exist"

**Solution**: Run `CREATE_UPDATE_CONSUMER_PROFILE_FUNCTION.sql`

### Issue: "column start_ts does not exist"

**Solution**: Run `FIX_PROFILE_AND_BOOKINGS.sql` (eerste script)

### Issue: Bookings still not showing

**Check 1**: Hebben je bookings een consumer_id?
```sql
SELECT COUNT(*) 
FROM bookings 
WHERE customer_email = 'jouw@email.nl'
  AND consumer_id IS NOT NULL;
```

**Check 2**: Heb je een consumer record?
```sql
SELECT * FROM consumers 
WHERE auth_user_id = (
  SELECT id FROM auth.users WHERE email = 'jouw@email.nl'
);
```

**Fix**: Run het main script opnieuw - het is idempotent (veilig om meerdere keren te runnen).

## 📋 Quick Checklist

Run beide scripts in volgorde:

- [ ] Run `FIX_PROFILE_AND_BOOKINGS.sql` in Supabase SQL Editor
- [ ] Check output - moet SUCCESS messages tonen
- [ ] Test profile update op `/profile`
- [ ] Test bookings display op `/profile` → Reserveringen
- [ ] (Optioneel) Run `CREATE_UPDATE_CONSUMER_PROFILE_FUNCTION.sql` als profile update niet werkt

## 🎉 Success Criteria

- ✅ Profile naam kan worden aangepast en blijft opgeslagen
- ✅ Alle reservaties die je hebt gemaakt zijn zichtbaar
- ✅ Reservaties zijn gesorteerd op datum (nieuwste eerst)
- ✅ Geen console errors in browser
- ✅ Geen SQL errors in Supabase logs

---

**Status**: Ready to fix  
**Estimated time**: 5 minuten  
**Risk level**: Low (scripts zijn idempotent en veilig)

