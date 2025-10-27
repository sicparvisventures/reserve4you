# 🔧 Spotlight Troubleshooting Guide

## Error: "Error fetching spotlight locations: {}"

### Step 1: Check Detailed Error

Refresh de homepage nu om de **detailed error** te zien in de console. De error zal nu tonen:
- ✅ Error message
- ✅ Error details
- ✅ Error hint
- ✅ Error code

---

### Step 2: Run Test Queries

Open **Supabase SQL Editor** en run `TEST_SPOTLIGHT.sql`:

```sql
-- 1. Check if columns exist
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'locations' 
  AND column_name LIKE 'spotlight%';
```

**Expected Result:**
```
spotlight_enabled
spotlight_priority
spotlight_activated_at
spotlight_expires_at
spotlight_stripe_subscription_id
```

**If empty:** Columns don't exist yet!

---

### Step 3: Fix Missing Columns

If columns are missing, run in Supabase:

```sql
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS spotlight_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS spotlight_priority INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS spotlight_activated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS spotlight_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS spotlight_stripe_subscription_id TEXT;

CREATE INDEX IF NOT EXISTS idx_locations_spotlight 
ON locations(spotlight_enabled, spotlight_priority DESC, created_at DESC)
WHERE spotlight_enabled = TRUE AND is_active = TRUE AND is_public = TRUE;
```

---

### Step 4: Check if Restaurants Exist

```sql
-- Check if you have any active, public restaurants
SELECT COUNT(*) 
FROM locations 
WHERE is_active = TRUE AND is_public = TRUE;
```

**If 0:** You need to create restaurants first!

**If > 0:** Good! Now activate spotlight:

```sql
-- Activate spotlight for first restaurant
UPDATE locations 
SET 
  spotlight_enabled = TRUE,
  spotlight_priority = 100,
  spotlight_activated_at = NOW()
WHERE is_active = TRUE 
  AND is_public = TRUE
LIMIT 1
RETURNING id, name, spotlight_enabled;
```

---

### Step 5: Verify Setup

```sql
-- Check spotlight status
SELECT 
  name,
  spotlight_enabled,
  spotlight_priority,
  is_active,
  is_public
FROM locations
WHERE spotlight_enabled = TRUE;
```

**Expected:** At least 1 row with `spotlight_enabled = TRUE`

---

### Step 6: Refresh Homepage

```
http://localhost:3000
```

**Expected Result:**
- ✅ No console errors
- ✅ Spotlight carousel visible
- ✅ Your restaurant is shown

---

## Common Issues:

### Issue 1: Column "spotlight_enabled" does not exist

**Error Code:** `42703`

**Fix:**
```sql
-- Run SETUP_SPOTLIGHT_MINIMAL.sql or:
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS spotlight_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS spotlight_priority INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS spotlight_activated_at TIMESTAMPTZ;
```

---

### Issue 2: No restaurants with spotlight enabled

**Symptom:** No errors, but carousel doesn't show

**Fix:**
```sql
UPDATE locations 
SET spotlight_enabled = TRUE, spotlight_priority = 100
WHERE is_active = TRUE AND is_public = TRUE
LIMIT 1;
```

---

### Issue 3: RLS Policy blocks access

**Error:** Permission denied

**Fix:**
```sql
-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'locations';

-- If needed, grant public access:
CREATE POLICY IF NOT EXISTS "Public can view spotlight"
ON locations FOR SELECT TO public
USING (is_active = TRUE AND is_public = TRUE);
```

---

### Issue 4: Restaurants not public/active

**Symptom:** Restaurants exist but not shown

**Fix:**
```sql
-- Make restaurants public and active
UPDATE locations 
SET is_active = TRUE, is_public = TRUE
WHERE id = 'your-restaurant-id';
```

---

## Quick Fixes:

### Reset Spotlight:
```sql
-- Disable all spotlight
UPDATE locations SET spotlight_enabled = FALSE;

-- Enable for specific restaurant
UPDATE locations 
SET spotlight_enabled = TRUE, spotlight_priority = 100
WHERE slug = 'your-restaurant-slug';
```

### Check Everything:
```sql
-- One query to see all the info
SELECT 
  id,
  name,
  slug,
  is_active,
  is_public,
  spotlight_enabled,
  spotlight_priority,
  (SELECT COUNT(*) FROM promotions WHERE location_id = locations.id AND is_active = TRUE) as active_promotions
FROM locations
ORDER BY spotlight_priority DESC NULLS LAST;
```

---

## Still Not Working?

1. **Check Console:** Refresh page and check detailed error
2. **Check Supabase:** Run TEST_SPOTLIGHT.sql
3. **Check Database:** Verify columns exist
4. **Check Data:** Verify restaurants exist and are active/public
5. **Check Spotlight:** Verify at least 1 restaurant has spotlight enabled

---

## Debug Checklist:

```
□ Columns exist (spotlight_enabled, spotlight_priority, etc.)
□ Index exists (idx_locations_spotlight)
□ Restaurants exist in database
□ Restaurants are is_active = TRUE
□ Restaurants are is_public = TRUE
□ At least 1 restaurant has spotlight_enabled = TRUE
□ No console errors on homepage
□ Carousel component renders
```

---

## Success Criteria:

✅ **Homepage loads without errors**  
✅ **Spotlight carousel is visible**  
✅ **Restaurant info is displayed correctly**  
✅ **Navigation works (arrows, dots)**  
✅ **Transitions are smooth**

---

**If all else fails:** Run the complete `SETUP_SPOTLIGHT_FEATURE.sql` script again in Supabase SQL Editor.

