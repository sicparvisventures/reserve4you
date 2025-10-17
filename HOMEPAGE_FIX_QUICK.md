# 🔴 HOMEPAGE TOONT GEEN RESTAURANTS

## ❌ PROBLEEM:
```
Geen restaurants gevonden. Voeg eerst locaties toe in het manager portaal.
```

**Maar je HEB restaurants aangemaakt!**

---

## 🔍 ROOT CAUSE:

Homepage filtert op:
```typescript
searchLocations → .eq('is_public', true).eq('is_active', true)
```

Je restaurants zijn waarschijnlijk:
- ✅ Aangemaakt
- ❌ NIET gepubliceerd (`is_public = false`)
- ❌ NIET actief (`is_active = false`)

---

## ✅ OPLOSSING: PUBLICEER JE RESTAURANTS

### **OPTIE 1: SQL Script (Quick) ⭐**

Run dit in **Supabase SQL Editor**:

```sql
-- File: CHECK_AND_PUBLISH_LOCATIONS.sql
```

**Dit doet:**
1. ✅ Checkt welke locations niet public zijn
2. ✅ Zet `is_public = TRUE` en `is_active = TRUE`
3. ✅ Alleen voor locations met tables + shifts
4. ✅ Shows summary

---

### **OPTIE 2: Via Manager Portal**

1. Ga naar dashboard
2. Klik op je location
3. Ga door onboarding tot **Step 8 (Preview)**
4. Klik **"Publiceer Restaurant"** button
5. Done! ✅

---

### **OPTIE 3: Manual SQL**

Meest simpel - run dit:

```sql
-- Publish ALL locations
UPDATE locations
SET 
    is_public = TRUE,
    is_active = TRUE,
    updated_at = NOW()
WHERE is_public = FALSE OR is_active = FALSE;

-- Check result
SELECT name, slug, is_public, is_active
FROM locations
ORDER BY created_at DESC;
```

---

## 🎯 **VERIFY:**

### **Check Status:**
```sql
SELECT 
    name,
    slug,
    is_public,
    is_active,
    address_json->>'city' AS city
FROM locations
ORDER BY created_at DESC;
```

**Expected:**
```
name          | slug          | is_public | is_active | city
--------------|---------------|-----------|-----------|----------
My Restaurant | my-restaurant | true      | true      | Amsterdam
```

### **Check Homepage:**

1. Refresh: `http://localhost:3007`
2. Section: "Vanavond beschikbaar"
3. Should show your restaurants! ✅

---

## 📋 **REQUIREMENTS FOR VISIBILITY:**

Een location verschijnt ALLEEN op homepage als:

✅ `is_public = TRUE`
✅ `is_active = TRUE`
✅ Heeft minimaal 1 table
✅ Heeft minimaal 1 shift

**Optional (nice to have):**
- Policy configured
- Hero image
- Description
- Cuisine type

---

## 🚀 **RUN THIS NOW:**

```sql
-- Quick publish (run in Supabase SQL Editor)

UPDATE locations
SET 
    is_public = TRUE,
    is_active = TRUE
WHERE is_public = FALSE OR is_active = FALSE;

SELECT 
    name,
    is_public,
    is_active,
    COUNT(DISTINCT t.id) AS tables,
    COUNT(DISTINCT s.id) AS shifts
FROM locations l
LEFT JOIN tables t ON l.location_id = t.id
LEFT JOIN shifts s ON l.location_id = s.id
GROUP BY l.id, l.name, l.is_public, l.is_active;
```

---

## ✅ AFTER PUBLISHING:

1. ✅ Refresh `http://localhost:3007`
2. ✅ See "Vanavond beschikbaar" section
3. ✅ Your restaurants should appear!
4. ✅ Click restaurant card
5. ✅ Make a reservation!

---

## 🎉 KLAAR!

Na het publiceren:
- ✅ Restaurants zichtbaar op homepage
- ✅ Consumenten kunnen reserveren
- ✅ LocationCard toont restaurant info
- ✅ Booking flow werkt

**Publiceer nu je restaurants!** 🚀

