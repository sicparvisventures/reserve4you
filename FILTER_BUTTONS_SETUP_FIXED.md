# ✅ Filter Buttons Setup - Fixed Version

## Wat Was Het Probleem?

**Error**:
```
ERROR: 42703: column "capacity" does not exist
LINE 236: HAVING SUM(capacity) >= 30
```

**Oorzaak**: 
De `tables` tabel heeft een kolom genaamd `seats`, niet `capacity`.

**Oplossing**: 
`FILTER_BUTTONS_SETUP.sql` is geüpdatet om `SUM(seats)` te gebruiken in plaats van `SUM(capacity)`.

---

## ✅ Fixed SQL Script

**Bestand**: `FILTER_BUTTONS_SETUP.sql`

**Lijn 236 gewijzigd van**:
```sql
HAVING SUM(capacity) >= 30
```

**Naar**:
```sql
HAVING SUM(seats) >= 30
```

---

## 🚀 Nu Klaar Om Te Runnen!

### Run het script:

1. Open Supabase SQL Editor:
   ```
   https://app.supabase.com/project/YOUR_PROJECT/sql
   ```

2. Copy-paste de **volledige inhoud** van:
   ```
   FILTER_BUTTONS_SETUP.sql
   ```

3. Klik **"Run"**

### Verwacht resultaat:

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
Total published locations: X
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

## ✅ Verificatie

### Check of het werkt:

```sql
-- Check group-friendly locations
SELECT 
  l.name,
  l.group_friendly,
  l.max_group_size,
  SUM(t.seats) as total_seats
FROM locations l
LEFT JOIN tables t ON t.location_id = l.id
WHERE l.published = TRUE
GROUP BY l.id, l.name, l.group_friendly, l.max_group_size
HAVING SUM(t.seats) >= 30;
```

---

## 🎉 Klaar!

Het script zou nu zonder errors moeten runnen!

**Test de filter buttons op**:
```
http://localhost:3007
```

---

**Status**: ✅ Fixed en klaar om te gebruiken!

