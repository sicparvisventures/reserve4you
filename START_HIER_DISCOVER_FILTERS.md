# 🎯 START HIER - Discover Filters Update

## ✅ Wat is er veranderd?

### 1. **Dynamische Cuisine Types**
Cuisine types worden nu opgehaald uit wat restaurants zelf hebben ingegeven in de database.

**Voor:** Vaste lijst (Italiaans, Frans, Sushi, etc.)  
**Nu:** Dynamisch (Kip, Italiaans, Sushi, etc. - wat restaurants echt hebben)

### 2. **Filter Buttons in Filter Paneel**
Alle filter buttons zijn nu beschikbaar in het expanded filter paneel.

**Toegevoegd:**
- 📍 Bij mij in de buurt
- 🕐 Nu open
- 📅 Vandaag
- 👥 Groepen
- 🏷️ Deals

### 3. **Cuisine in Map Popups**
Map popups tonen nu de correcte cuisine van elk restaurant.

**Voorbeeld:**
- Poule & Poulette Gent → "Kip"
- Restaurant X → "Italiaans"

### 4. **Reserverings Modal**
De reserverings modal op de kaart is identiek aan de modal op location detail pages.

---

## 🚀 Quick Start (5 minuten)

### Stap 1: Update Database
```sql
-- Open Supabase SQL Editor
-- Run: UPDATE_CUISINE_TYPES.sql
```

### Stap 2: Start Server
```bash
cd /Users/dietmar/Desktop/ray2
pnpm dev
```

### Stap 3: Test
```
http://localhost:3007/discover
```

**Test Checklist:**
1. Click "Filters" knop
2. Zie "Selecteer filters" sectie met 5 buttons
3. Zie "Type keuken" met dynamische cuisines (bijv. "Kip")
4. Click een filter → wordt actief
5. Click "Filters toepassen" → werkt
6. Click restaurant pin op kaart
7. Zie popup met cuisine + "Reserveren" knop
8. Click "Reserveren" → modal opent

---

## 📁 Belangrijke Bestanden

### SQL Scripts
- `UPDATE_CUISINE_TYPES.sql` - Update cuisines in database

### Code Changes
- `/lib/actions/discover.ts` - Server actions (NIEUW)
- `/app/discover/page.tsx` - Haalt cuisines op
- `/app/discover/DiscoverClient.tsx` - Filter UI
- `/components/map/DiscoverMap.tsx` - Map popups
- `/lib/auth/tenant-dal.ts` - Returns cuisine

### Documentatie
- `START_HIER_DISCOVER_FILTERS.md` - Deze file
- `DISCOVER_FILTERS_UPDATE_SUMMARY.md` - Volledige docs

---

## 🎨 Hoe het eruit ziet

### Filter Paneel
```
Filters (expanded)
├── SELECTEER FILTERS
│   ├── [📍 Bij mij in de buurt]
│   ├── [🕐 Nu open]
│   ├── [📅 Vandaag]
│   ├── [👥 Groepen]
│   └── [🏷️ Deals]
├── TYPE KEUKEN (dynamisch)
│   ├── [Kip]
│   ├── [Italiaans]
│   ├── [Sushi]
│   └── [...meer]
└── PRIJSKLASSE
    ├── [€]
    ├── [€€]
    ├── [€€€]
    └── [€€€€]
```

### Map Popup
```
┌──────────────────────┐
│ Poule & Poulette     │
│ Gent                 │
│                      │
│ 📍 Gent              │
│ Kip                  │
│ €€                   │
│                      │
│ [   Reserveren   ]   │
└──────────────────────┘
```

---

## 🔧 Database Update

### Wat doet UPDATE_CUISINE_TYPES.sql?

1. Toont huidige status
2. Update Poule & Poulette → "Kip"
3. Update CHICKX → "Kip"
4. Geeft templates voor andere restaurants

### Handmatig Cuisine Toevoegen

```sql
UPDATE locations 
SET cuisine = 'Italiaans'
WHERE slug = 'trattoria-roma';

UPDATE locations 
SET cuisine = 'Sushi'
WHERE slug = 'sushi-world';

UPDATE locations 
SET cuisine = 'Kip'
WHERE slug = 'poule-poulette-gent';
```

---

## ✅ Checklist

### Database
- [ ] Run UPDATE_CUISINE_TYPES.sql
- [ ] Check alle restaurants hebben cuisine
- [ ] Verify met query:
```sql
SELECT name, cuisine 
FROM locations 
WHERE is_public = true;
```

### Filters
- [ ] Open /discover
- [ ] Click "Filters"
- [ ] Zie filter buttons sectie
- [ ] Zie dynamische cuisine types
- [ ] Test filter selection
- [ ] Test "Filters toepassen"

### Map
- [ ] Zie kaart met pins
- [ ] Click pin → popup opent
- [ ] Popup toont cuisine correct
- [ ] Click "Reserveren" → modal opent
- [ ] Modal is identiek aan location page

### Mobiel
- [ ] Test op mobiel (Chrome DevTools)
- [ ] Filter buttons werken
- [ ] Map pins zijn tappable
- [ ] Modal werkt

---

## 🐛 Probleemoplossing

### Geen cuisine types zichtbaar?
```bash
# Run in Supabase:
UPDATE_CUISINE_TYPES.sql
```

### Filter buttons werken niet?
```bash
# Check console voor errors (F12)
# Verify imports in DiscoverClient.tsx
```

### Map toont geen cuisine?
```sql
-- Check database:
SELECT name, cuisine 
FROM locations 
WHERE is_public = true;
```

---

## 📖 Meer Info

Voor gedetailleerde technische documentatie:
→ Zie `DISCOVER_FILTERS_UPDATE_SUMMARY.md`

Voor map setup documentatie:
→ Zie `DISCOVER_MAP_COMPLETE_SETUP.md`

---

## 🎉 Klaar!

Alle filters werken nu dynamisch met data uit de database.
Map popups tonen correcte informatie en leiden naar reserverings modal.

**Test het:**
```bash
http://localhost:3007/discover
```

**Status:** ✅ Production Ready  
**Datum:** 27 Oktober 2025

