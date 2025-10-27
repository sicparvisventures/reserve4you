# 🗺️ Discover Map - Quick Start

## 🚀 Snel aan de slag in 3 stappen

### 1️⃣ Setup Database Coordinaten

```bash
# Open Supabase SQL Editor
# Kopieer en plak: SETUP_MAP_COORDINATES.sql
# Klik op "Run"
```

Dit script:
- ✅ Voegt automatisch coordinaten toe aan alle locaties
- ✅ Gebruikt stad uit address_json
- ✅ Fallback naar Brussel centrum indien nodig

### 2️⃣ Start Development Server

```bash
cd /Users/dietmar/Desktop/ray2
pnpm dev
```

### 3️⃣ Test de Map

Open in browser:

```
http://localhost:3007/discover
```

**✅ Verwachte resultaat:**
- Kaart zichtbaar rechts (of onder op mobiel)
- Restaurant pins met Reserve4You branding (#FF5A5F)
- Klik op pin → popup met "Reserveren" knop
- Klik "Reserveren" → reserverings modal opent

---

## 🧪 Snelle Tests

### Test 1: Basis Functionaliteit
```
URL: http://localhost:3007/discover
Check: Kaart laadt ✓
Check: Pins zichtbaar ✓
Check: Click pin → popup ✓
Check: Click "Reserveren" → modal ✓
```

### Test 2: Nearby Filter
```
URL: http://localhost:3007/discover?nearby=true
Check: Browser vraagt locatie permissie ✓
Check: Blauwe user marker verschijnt ✓
Check: Kaart zooomt naar user + nearby restaurants ✓
```

### Test 3: Mobiel
```
Chrome DevTools → Toggle Device Toolbar
Device: iPhone 14 Pro
Check: Content boven kaart ✓
Check: Kaart 400px height ✓
Check: Touch zoom werkt ✓
Check: Pins tappable ✓
```

---

## 📁 Aangemaakte Bestanden

```
✅ /components/map/DiscoverMap.tsx
   → Interactieve kaart component

✅ /components/hero/PageHeroWithMap.tsx
   → Hero met optionele kaart

✅ /app/discover/page.tsx (UPDATED)
   → Nu met geïntegreerde kaart

✅ SETUP_MAP_COORDINATES.sql
   → Database setup script

✅ VERIFY_MAP_COORDINATES.sql
   → Verificatie queries

✅ DISCOVER_MAP_COMPLETE_SETUP.md
   → Complete documentatie
```

---

## 🎨 Features

### Desktop
- Split-screen: Content 50% | Map 50%
- Map height: 600px
- Hover effects op markers
- Professional gradient pins

### Mobiel
- Stacked: Content boven, Map onder
- Map height: 400px
- Touch-friendly (36px pins)
- Pinch-to-zoom enabled

### Branding
- Primary: #FF5A5F (Reserve4You)
- Gradient markers
- Smooth animations
- Geen emoji's (professioneel)

---

## ❓ Problemen?

### Kaart laadt niet
```bash
# Check Leaflet installatie
pnpm list leaflet
```

### Geen pins zichtbaar
```sql
-- Check coordinaten in database
SELECT name, latitude, longitude 
FROM locations 
WHERE is_public = true;
```

### Meer hulp nodig?
→ Zie `DISCOVER_MAP_COMPLETE_SETUP.md` voor volledige documentatie

---

## ✅ Checklist

- [ ] SQL setup script uitgevoerd
- [ ] Dev server draait
- [ ] Discover pagina laadt
- [ ] Kaart zichtbaar
- [ ] Pins klikbaar
- [ ] Reserveren werkt
- [ ] Mobiel getest

---

**Klaar om te gebruiken!** 🎉

Voor meer details, zie:
- `DISCOVER_MAP_COMPLETE_SETUP.md` - Volledige documentatie
- `SETUP_MAP_COORDINATES.sql` - Database setup
- `VERIFY_MAP_COORDINATES.sql` - Verificatie queries

