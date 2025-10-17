# 🔧 FIX ONBOARDING - Complete Guide

## 🐛 **Het Probleem**

Stap 2 (Locatie) en verdere stappen van de onboarding werkten niet omdat:
- ❌ Database kolom `opening_hours` maar API verwacht `opening_hours_json`
- ❌ Database kolom `cuisine_type` maar API verwacht `cuisine`
- ❌ Database kolom `day_of_week` maar API verwacht `days_of_week`
- ❌ Database kolom `slot_duration_minutes` maar API verwacht `slot_minutes`
- ❌ Database kolom `max_concurrent_bookings` maar API verwacht `max_parallel`
- ❌ Kolommen `slot_minutes` en `buffer_minutes` ontbraken in `locations` table

---

## ✅ **De Oplossing**

Ik heb een migration gemaakt die alle kolommen fix en hernoemt naar de juiste namen.

---

## 🚀 **RUN DEZE MIGRATION**

Open **Supabase SQL Editor** en run:

```sql
-- Kopieer de VOLLEDIGE inhoud van:
/Users/dietmar/Desktop/ray2/supabase/migrations/20241017000006_fix_onboarding_columns.sql
```

---

## 📊 **Expected Output**

```
🔧 Fixing Onboarding Columns...

✅ Renamed locations.opening_hours → opening_hours_json
✅ Renamed locations.cuisine_type → cuisine
✅ Added locations.slot_minutes (default 90)
✅ Added locations.buffer_minutes (default 15)
✅ Renamed shifts.day_of_week → days_of_week
✅ Renamed shifts.slot_duration_minutes → slot_minutes
✅ Renamed shifts.max_concurrent_bookings → max_parallel
✅ All critical columns verified!

🎉 Onboarding Columns Fix Complete!

📋 Now test onboarding at:
   http://localhost:3007/manager/onboarding?step=1
```

---

## 🧪 **TEST DE VOLLEDIGE ONBOARDING**

### **Stap 1: Bedrijfsinformatie** ✅
```
Bedrijfsnaam: Test Restaurant
Merk kleur: #FF5A5F
Beschrijving: Een test restaurant
```

### **Stap 2: Locatie informatie** ⭐ (Dit werkte niet, nu WEL!)
```
Naam: Test Restaurant Amsterdam
Slug: test-restaurant-amsterdam
Adres:
  Straat: Kalverstraat
  Nummer: 123
  Stad: Amsterdam
  Postcode: 1012 NZ
Telefoon: +31612345678
Email: info@testrestaurant.nl
Openingstijden:
  Ma-Vr: 11:00 - 22:00
  Za-Zo: 12:00 - 23:00
Keuken type: Italian
Beschrijving: Een gezellig restaurant
Standaard tijd: 90 min
Buffer tijd: 15 min
```
**Klik "Volgende"** → Zou nu moeten werken!

### **Stap 3: Tafels & Shifts** ⭐
Voeg tafels en shifts toe.
**Klik "Volgende"** → Zou nu moeten werken!

### **Stap 4: Policies** ⭐
Stel beleid in voor annuleringen en deposits.
**Klik "Volgende"** → Zou nu moeten werken!

### **Stap 5-8: Verdere stappen**
Deze zouden nu ook moeten werken.

---

## 🔍 **Verify De Fix**

Na de migration, check deze query in Supabase SQL Editor:

```sql
-- Check locations columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'locations'
AND column_name IN (
  'opening_hours_json', 'cuisine', 'slot_minutes', 'buffer_minutes',
  'opening_hours', 'cuisine_type'  -- these should NOT exist anymore
)
ORDER BY column_name;

-- Expected output:
-- buffer_minutes    | integer  | 15
-- cuisine           | character varying |
-- opening_hours_json| jsonb    | '{}'::jsonb
-- slot_minutes      | integer  | 90

-- Should NOT show:
-- opening_hours (oude naam)
-- cuisine_type (oude naam)
```

```sql
-- Check shifts columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'shifts'
AND column_name IN (
  'days_of_week', 'slot_minutes', 'max_parallel',
  'day_of_week', 'slot_duration_minutes', 'max_concurrent_bookings'  -- old names
)
ORDER BY column_name;

-- Expected output:
-- days_of_week     | ARRAY
-- max_parallel     | integer
-- slot_minutes     | integer

-- Should NOT show:
-- day_of_week (oude naam)
-- slot_duration_minutes (oude naam)
-- max_concurrent_bookings (oude naam)
```

---

## 📋 **Complete Migration Checklist**

Als je de volledige database opnieuw wilt opbouwen:

```
☐ 1. RESET_AND_START_FRESH.sql
☐ 2. 20241017000002_r4y_multi_tenant_schema_safe.sql (UPDATED!)
☐ 3. 20241017000004_migrate_address_to_json.sql
☐ 4. 20241017000005_fix_tenant_creation_rls_v2.sql
☐ 5. 20241017000006_fix_onboarding_columns.sql (NEW!)
☐ 6. verify_schema.sql
☐ 7. Test onboarding
```

**Of voor bestaande database:**
```
☐ 1. 20241017000006_fix_onboarding_columns.sql (RUN THIS NOW!)
☐ 2. Test onboarding
```

---

## 🎯 **Kolom Mapping**

| Database (oud) | Database (nieuw) | API Verwacht | Status |
|----------------|------------------|--------------|--------|
| `opening_hours` | `opening_hours_json` | `openingHours` → `opening_hours_json` | ✅ Fixed |
| `cuisine_type` | `cuisine` | `cuisine` | ✅ Fixed |
| - | `slot_minutes` | `slotMinutes` → `slot_minutes` | ✅ Added |
| - | `buffer_minutes` | `bufferMinutes` → `buffer_minutes` | ✅ Added |
| `day_of_week` | `days_of_week` | `daysOfWeek` → `days_of_week` | ✅ Fixed |
| `slot_duration_minutes` | `slot_minutes` | `slotMinutes` → `slot_minutes` | ✅ Fixed |
| `max_concurrent_bookings` | `max_parallel` | `maxParallel` → `max_parallel` | ✅ Fixed |

---

## 💡 **Waarom Dit Nodig Was**

De Next.js API routes gebruiken camelCase (`openingHours`, `slotMinutes`) maar Supabase kolommen gebruiken snake_case. De validation schemas mappen deze automatisch:

```typescript
// Frontend (camelCase)
openingHours: [...] 
slotMinutes: 90

// API mapping naar database (snake_case)
opening_hours_json: [...]
slot_minutes: 90
```

De database had de verkeerde kolom namen, dus de mapping faalde.

---

## 🚨 **Troubleshooting**

### **"Column still doesn't exist"**
Run de diagnostic query hierboven om te zien welke kolommen er zijn.

### **"Cannot rename column"**
De kolom bestaat mogelijk niet, of is al hernoemd. De migration is safe en skipt al correcte kolommen.

### **"Still getting errors in onboarding"**
Check de browser console (F12) voor specifieke errors. Deel de error met me.

---

## ✅ **TL;DR**

1. ✅ Run `20241017000006_fix_onboarding_columns.sql`
2. ✅ Test onboarding: `http://localhost:3007/manager/onboarding?step=1`
3. ✅ Stap 2 (Locatie) zou nu moeten werken!
4. ✅ Alle verdere stappen zouden nu moeten werken!

---

**Run de migration nu en test de onboarding! Laat me weten of het werkt!** 🚀

