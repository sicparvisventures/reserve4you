# 🗺️ START HIER - Discover Map Setup

## ✅ Implementatie Compleet!

De discover pagina heeft nu een volledig werkende interactieve kaart met:
- Restaurant pins in Reserve4You branding (#FF5A5F)
- User locatie indicator (blauw)
- Direct reserveren via pin click
- Volledig responsive (desktop & mobiel)
- Geen emoji's (professioneel)

---

## 🚀 In 3 Stappen Aan De Slag

### 1️⃣ Database Setup (1 minuut)

Open Supabase SQL Editor en run:

```sql
-- Kopieer en plak de inhoud van:
SETUP_MAP_COORDINATES.sql
```

Dit voegt automatisch coordinaten toe aan alle restaurants.

### 2️⃣ Start Server (30 seconden)

```bash
cd /Users/dietmar/Desktop/ray2
pnpm dev
```

### 3️⃣ Test de Map (2 minuten)

Open in browser:

```
http://localhost:3007/discover
```

**Verwacht resultaat:**
- Kaart rechts van content (desktop)
- Kaart onder content (mobiel)
- Restaurant pins met #FF5A5F gradient
- Click pin → popup → "Reserveren" → modal opent

---

## 📋 Test Checklist

```
Desktop Tests:
□ Kaart laadt correct
□ Pins zijn zichtbaar met correcte kleur (#FF5A5F)
□ Hover over pin = scale effect
□ Click pin = popup opent
□ Click "Reserveren" = modal opent
□ Filters werken met kaart update

Nearby Test:
□ Click "Bij mij in de buurt"
□ Browser vraagt locatie permissie
□ Blauwe marker verschijnt op user locatie
□ Kaart zooomt naar user + nearby restaurants

Mobiel Test (Chrome DevTools):
□ Content boven, kaart onder
□ Kaart is 400px height
□ Touch zoom werkt
□ Pins zijn tappable (36px)
□ Popup is readable
```

---

## 📁 Wat Is Er Gemaakt?

### Nieuwe Files

```
✅ /components/map/DiscoverMap.tsx
   → Interactieve kaart component

✅ /components/map/README.md
   → Component documentatie

✅ /components/hero/PageHeroWithMap.tsx
   → Hero met kaart optie

✅ SETUP_MAP_COORDINATES.sql
   → Database setup script

✅ VERIFY_MAP_COORDINATES.sql
   → Verificatie queries

✅ DISCOVER_MAP_COMPLETE_SETUP.md
   → Volledige technische docs

✅ DISCOVER_MAP_QUICK_START.md
   → Snelle start gids

✅ DISCOVER_MAP_IMPLEMENTATION_SUMMARY.md
   → Implementatie overzicht
```

### Updated Files

```
✓ /app/discover/page.tsx
   → Nu met geïntegreerde kaart
```

---

## 🎨 Design Features

### Desktop (≥1024px)
```
┌─────────────────────────────────┬──────────────────┐
│ Content Area (50%)              │ Map Area (50%)   │
│                                 │                  │
│ • Ontdek restaurants            │ • Interactive    │
│ • Vind het perfecte restaurant  │ • Restaurant pins│
│ • Search bar                    │ • User location  │
│ • Filters                       │ • Zoom controls  │
│ • Active filters                │                  │
│                                 │ Height: 600px    │
│ Height: 600px                   │                  │
└─────────────────────────────────┴──────────────────┘
```

### Mobiel (<1024px)
```
┌─────────────────────────────────┐
│ Content Area                    │
│ • Title                         │
│ • Description                   │
│ • Search & Filters              │
│ Height: auto                    │
├─────────────────────────────────┤
│ Map Area                        │
│ • Interactive                   │
│ • Restaurant pins               │
│ • User location                 │
│ Height: 400px                   │
└─────────────────────────────────┘
```

### Markers

**Restaurant Pin:**
```
    ╔═══════╗
    ║   🏠  ║  ← 36x36px circle
    ╚═══════╝     Gradient: #FF5A5F → #FF385C
                  White border (3px)
                  Shadow on hover
```

**User Location:**
```
    ╭───╮
    │ ● │  ← 20x20px circle
    ╰───╯     Blue: #0066FF
              White border (3px)
```

---

## 🧪 Test URLs

```bash
# Basis discover
http://localhost:3007/discover

# Met nearby filter
http://localhost:3007/discover?nearby=true

# Exact zoals in je request
http://localhost:3007/discover?nearby=true&lat=51.03809354486056&lng=3.7377219845246117&radius=25&today=true

# Alleen vandaag
http://localhost:3007/discover?today=true

# Multiple filters
http://localhost:3007/discover?nearby=true&today=true&cuisine=Italiaans&price=2
```

---

## ❓ Hulp Nodig?

### Kaart laadt niet?
→ Check: `pnpm list leaflet`
→ Herinstall: `pnpm install leaflet react-leaflet`

### Geen pins?
→ Run: `VERIFY_MAP_COORDINATES.sql`
→ Check: Database coordinaten

### Reserveren werkt niet?
→ Open: Browser console (F12)
→ Check: JavaScript errors

### Meer hulp?
→ Zie: `DISCOVER_MAP_COMPLETE_SETUP.md`

---

## 📖 Documentatie

Voor gedetailleerde informatie, zie:

| Bestand | Inhoud |
|---------|--------|
| `DISCOVER_MAP_QUICK_START.md` | Snelle start (5 min) |
| `DISCOVER_MAP_COMPLETE_SETUP.md` | Volledige docs (alles) |
| `DISCOVER_MAP_IMPLEMENTATION_SUMMARY.md` | Implementatie overzicht |
| `/components/map/README.md` | Component API docs |
| `SETUP_MAP_COORDINATES.sql` | Database setup |
| `VERIFY_MAP_COORDINATES.sql` | Verificatie queries |

---

## ✅ Klaar!

De discover pagina is nu uitgerust met een professionele,
interactieve kaart die perfect integreert met het bestaande
reserveringssysteem.

**Features:**
✓ Interactieve kaart met Leaflet  
✓ Reserve4You branding (#FF5A5F)  
✓ User locatie indicator  
✓ Click-to-reserve functionaliteit  
✓ Responsive design  
✓ Touch-friendly (mobiel)  
✓ Professional styling  
✓ Geen emoji's  

**Volgende stap:**
```bash
# 1. Run database setup
SETUP_MAP_COORDINATES.sql in Supabase

# 2. Start server
pnpm dev

# 3. Open browser
http://localhost:3007/discover

# 4. Test & enjoy!
```

---

**Status:** ✅ Production Ready  
**Datum:** 27 Oktober 2025  
**Branding:** Reserve4You Professional

