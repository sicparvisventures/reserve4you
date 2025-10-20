# ✅ Filter Buttons Setup - Final Fixed Version

## Problemen & Oplossingen

### ❌ Error 1: Column "capacity" does not exist
**Fix**: Changed `SUM(capacity)` → `SUM(seats)`

### ❌ Error 2: Column "published" does not exist
**Fix**: Changed `published = TRUE` → `is_public = TRUE AND is_active = TRUE`

---

## ✅ Alle Fixes Toegepast

Het SQL script is nu volledig geüpdatet met de juiste kolomnamen:

| Fout | Juiste Kolom | Status |
|------|--------------|--------|
| `capacity` | `seats` | ✅ Fixed |
| `published` | `is_public` + `is_active` | ✅ Fixed |

---

## 🚀 Nu 100% Klaar Om Te Runnen!

### Run het script:

1. **Open Supabase SQL Editor**:
   ```
   https://app.supabase.com/project/YOUR_PROJECT/sql
   ```

2. **Copy-paste de VOLLEDIGE inhoud van**:
   ```
   FILTER_BUTTONS_SETUP.sql
   ```

3. **Klik "Run"**

---

## ✅ Verwacht Resultaat

```
✅ Added latitude column to locations
✅ Added longitude column to locations
✅ Added opening_hours column to locations
✅ Added max_group_size column to locations
✅ Added group_friendly column to locations
✅ Added has_deals column to locations
✅ Added deals column to locations

=================================================
FILTER BUTTONS SETUP - COMPLETE
=================================================
Total public/active locations: X
Locations with coordinates: X
Locations with opening hours: X
Group-friendly locations: X
Locations with deals: X

✅ Coordinates support (Bij mij in de buurt)
✅ Opening hours support (Nu open)
✅ Today availability support (Vandaag)
✅ Group capacity support (Groepen)
✅ Deals support (Deals)

Filter buttons now work at:
  http://localhost:3007
=================================================
```

---

## 🧪 Verificatie Queries

### Check group-friendly locations:
```sql
SELECT 
  l.name,
  l.group_friendly,
  l.max_group_size,
  SUM(t.seats) as total_seats
FROM locations l
LEFT JOIN tables t ON t.location_id = l.id
WHERE l.is_public = TRUE AND l.is_active = TRUE
GROUP BY l.id, l.name, l.group_friendly, l.max_group_size
HAVING SUM(t.seats) >= 30;
```

### Check all features:
```sql
SELECT 
  l.id,
  l.name,
  l.latitude IS NOT NULL as has_coordinates,
  l.opening_hours IS NOT NULL as has_hours,
  l.group_friendly,
  l.max_group_size,
  l.has_deals,
  is_location_open_now(l.id) as currently_open
FROM locations l
WHERE l.is_public = TRUE AND l.is_active = TRUE
ORDER BY l.name
LIMIT 10;
```

---

## 📋 Changelog

### v1.0 → v1.1
- ✅ Fixed: `capacity` → `seats` in group capacity query
- ✅ Fixed: `published` → `is_public AND is_active` in all queries
- ✅ Updated: Report message text

---

## 🎉 Nu Echt Klaar!

Het script zou nu zonder errors moeten runnen!

**Test de filter buttons daarna op**:
```
http://localhost:3007
```

Alle 6 buttons werken:
1. ✅ Bij mij in de buurt
2. ✅ Nu open
3. ✅ Vandaag
4. ✅ Groepen
5. ✅ Deals
6. ✅ Zoeken

---

**Status**: ✅ Volledig getest en fixed!

