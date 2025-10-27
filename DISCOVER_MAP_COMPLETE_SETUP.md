# 🗺️ Discover Page Interactive Map - Complete Setup

## Overzicht

De `/discover` pagina heeft nu een volledig interactieve kaart die:
- Automatisch de huidige locatie van de gebruiker toont
- Alle restaurants weergeeft als interactieve pins
- Direct naar het reserveringsformulier leidt bij klik op een pin
- Volledig responsive is (desktop en mobiel)
- Matcht met Reserve4You branding en thema

---

## ✅ Wat is geïmplementeerd

### 1. **DiscoverMap Component** (`/components/map/DiscoverMap.tsx`)
Een volledig interactieve kaart component met:
- ✓ Leaflet integratie (al geïnstalleerd in package.json)
- ✓ Custom restaurant pins met Reserve4You gradient (#FF5A5F)
- ✓ Gebruikers locatie indicator (blauwe cirkel)
- ✓ Click-to-reserve functionaliteit
- ✓ Hover effecten op markers
- ✓ Professional popups met restaurant informatie
- ✓ Automatische zoom naar alle zichtbare restaurants
- ✓ Client-side only rendering (SSR safe)

### 2. **PageHeroWithMap Component** (`/components/hero/PageHeroWithMap.tsx`)
Een flexibele hero component die:
- ✓ Split-screen layout (content links, kaart rechts)
- ✓ Volledig responsive (kaart onder content op mobiel)
- ✓ Backwards compatible (kan zonder kaart gebruikt worden)
- ✓ Subtiele gradient background voor content area
- ✓ Desktop: 50/50 split met 600px kaart hoogte
- ✓ Mobiel: Stacked layout met 400px kaart hoogte

### 3. **Discover Page Updates** (`/app/discover/page.tsx`)
- ✓ Integratie van kaart in hero sectie
- ✓ Doorgifte van locatie data naar kaart
- ✓ Gebruikers coordinaten worden doorgegeven
- ✓ Filter parameters werken met kaart

### 4. **SQL Scripts**
- ✓ `VERIFY_MAP_COORDINATES.sql` - Verificatie van alle coordinaten
- ✓ Controles op volledigheid
- ✓ Test queries voor nearby functionaliteit
- ✓ Templates voor handmatige updates

---

## 🎨 Design & Branding

### Kleuren
- **Primary Gradient**: `#FF5A5F` → `#FF385C` (Reserve4You brand)
- **User Location**: `#0066FF` (blauw)
- **Marker Border**: Wit met subtiele shadow
- **Popup**: Clean wit met rounded corners

### Markers
- **Restaurant Pins**: 36x36px cirkel met huis icoon
- **User Location**: 20x20px cirkel (solide blauw)
- **Hover Effect**: Scale 1.15x + verhoogde shadow
- **Click**: Opent popup met reserveer knop

### Responsive Design

#### Desktop (≥1024px)
```
┌──────────────────────────────────────────┐
│  Content (50%)       │  Map (50%)        │
│  - Titel             │  - Restaurants    │
│  - Beschrijving      │  - User location  │
│  - Filters           │  - Interactive    │
│  Height: 600px       │  Height: 600px    │
└──────────────────────────────────────────┘
```

#### Mobile (<1024px)
```
┌──────────────────────┐
│  Content             │
│  - Titel             │
│  - Beschrijving      │
│  - Filters           │
│  Height: auto        │
├──────────────────────┤
│  Map                 │
│  - Restaurants       │
│  - User location     │
│  Height: 400px       │
└──────────────────────┘
```

---

## 🚀 Gebruik

### Basis URL's

```bash
# Discover pagina met kaart
http://localhost:3007/discover

# Met nearby filter (gebruikt user locatie)
http://localhost:3007/discover?nearby=true

# Met specifieke coordinaten (Gent)
http://localhost:3007/discover?nearby=true&lat=51.03809354486056&lng=3.7377219845246117&radius=25

# Met vandaag filter
http://localhost:3007/discover?today=true

# Gecombineerde filters
http://localhost:3007/discover?nearby=true&lat=51.0381&lng=3.7377&radius=25&today=true
```

### User Flow

1. **Gebruiker bezoekt `/discover`**
   - Kaart laadt met alle publieke restaurants
   - Standaard centreert op Brussel of eerste restaurant

2. **Gebruiker klikt "Bij mij in de buurt"**
   - Browser vraagt locatie permissie
   - Bij toestemming: blauwe marker verschijnt op kaart
   - Kaart zooomt naar gebruiker + nearby restaurants
   - URL update: `?nearby=true&lat=X&lng=Y&radius=25`

3. **Gebruiker klikt op restaurant pin**
   - Popup opent met:
     - Restaurant naam
     - Stad
     - Keuken type
     - Prijsklasse
     - **"Reserveren" knop**

4. **Gebruiker klikt "Reserveren"**
   - ReserveBookingModal opent direct
   - 3-staps reserverings flow
   - Restaurant info is pre-filled

---

## 🗄️ Database Requirements

### Vereiste Kolommen in `locations`

```sql
- id (UUID)
- name (TEXT)
- slug (TEXT)
- latitude (DECIMAL(10, 8))  -- BELANGRIJK: moet ingevuld zijn
- longitude (DECIMAL(11, 8)) -- BELANGRIJK: moet ingevuld zijn
- address_line1 (TEXT)
- city (TEXT)
- cuisine_type (TEXT)
- price_range (INT 1-4)
- is_public (BOOLEAN)
- is_active (BOOLEAN)
```

### Verificatie Script Uitvoeren

```bash
# In Supabase SQL Editor, run:
VERIFY_MAP_COORDINATES.sql
```

Dit script geeft:
- ✓ Overzicht hoeveel locaties coordinaten hebben
- ✓ Lijst van locaties zonder coordinaten
- ✓ Test queries voor afstandsberekening
- ✓ GeoJSON export voor debugging
- ✓ Templates voor handmatige updates

---

## 🔧 Coordinaten Toevoegen

### Automatisch (via trigger)

De database heeft een trigger die automatisch coordinaten toevoegt op basis van stad:

```sql
-- Wordt automatisch uitgevoerd bij INSERT/UPDATE
CREATE TRIGGER trigger_auto_geocode_location
    BEFORE INSERT OR UPDATE OF address_json
    ON locations
    FOR EACH ROW
    EXECUTE FUNCTION auto_set_location_coordinates();
```

### Handmatig (voor exacte coordinaten)

**Methode 1: Google Maps**

1. Zoek het adres op Google Maps
2. Rechtermuisknop op de marker
3. Klik op de coordinaten (worden gekopieerd)
4. Run in Supabase:

```sql
UPDATE locations 
SET 
    latitude = 51.0543,   -- Van Google Maps
    longitude = 3.7174
WHERE slug = 'restaurant-slug';
```

**Methode 2: Bulk update vanuit stad**

```sql
UPDATE locations
SET 
    latitude = coords.lat,
    longitude = coords.lng
FROM (
    SELECT 
        l.id,
        c.lat,
        c.lng
    FROM locations l
    CROSS JOIN LATERAL (
        SELECT lat, lng 
        FROM get_city_coordinates(l.address_json->>'city')
    ) c
    WHERE 
        l.is_public = true 
        AND l.latitude IS NULL
) coords
WHERE locations.id = coords.id;
```

---

## 📱 Mobile Optimalisatie

### Touch Gestures
- ✓ Pinch-to-zoom
- ✓ Drag to pan
- ✓ Tap markers voor popup
- ✓ Tap buiten popup om te sluiten

### Performance
- ✓ Lazy loading (client-side only)
- ✓ Efficient marker rendering
- ✓ Optimized tile loading
- ✓ Smooth animations

### Layout
- ✓ Content boven kaart (natuurlijke scroll flow)
- ✓ Kaart fixed 400px height (mobiel)
- ✓ Rounded corners en border voor polish
- ✓ Touch-friendly marker size (36px)

---

## 🎯 Features Checklist

### Core Functionaliteit
- [x] Interactieve kaart met Leaflet
- [x] Restaurant pins met custom branding
- [x] User locatie indicator
- [x] Click-to-reserve functionaliteit
- [x] Automatische zoom naar content
- [x] Responsive design
- [x] Filter integratie

### User Experience
- [x] Smooth hover effecten
- [x] Professional popups
- [x] Loading states
- [x] Error handling (geen locaties)
- [x] Touch-friendly (mobiel)
- [x] Browser geolocation API

### Branding
- [x] Reserve4You kleuren (#FF5A5F)
- [x] Gradient markers
- [x] Consistent met design system
- [x] Professional polish
- [x] Geen emoji's (zoals gevraagd)

### Technical
- [x] SSR safe (client-side only)
- [x] No linting errors
- [x] TypeScript types
- [x] Proper imports
- [x] Performance optimized

---

## 🧪 Testing

### Desktop Testing

```bash
# Start development server
pnpm dev

# Test URLs:
1. http://localhost:3007/discover
   → Check: Kaart laadt, restaurants zichtbaar

2. http://localhost:3007/discover?nearby=true
   → Check: Browser vraagt locatie, user marker verschijnt

3. Klik op restaurant pin
   → Check: Popup opent, info correct

4. Klik "Reserveren" in popup
   → Check: ReserveBookingModal opent

5. Filters toepassen
   → Check: Kaart update met gefilterde restaurants
```

### Mobile Testing

```bash
# Open in Chrome DevTools
1. F12 → Toggle device toolbar
2. Select iPhone/Android device
3. Test:
   - Content boven kaart
   - Kaart 400px height
   - Touch zoom werkt
   - Markers tappable
   - Popup readable
   - Reserveren knop werkt
```

### Database Testing

```sql
-- Run in Supabase SQL Editor
\i VERIFY_MAP_COORDINATES.sql

-- Expected output:
-- ✅ X restaurants met coordinaten
-- ✅ Afstanden correct berekend
-- ✅ Alle locaties binnen België
```

---

## 🐛 Troubleshooting

### Probleem: Kaart laadt niet

**Oplossing:**
```bash
# Check of Leaflet geïnstalleerd is
pnpm list leaflet react-leaflet

# Herinstalleren indien nodig
pnpm install leaflet react-leaflet @types/leaflet
```

### Probleem: Markers verschijnen niet

**Oplossing:**
```sql
-- Check of locaties coordinaten hebben
SELECT name, latitude, longitude 
FROM locations 
WHERE is_public = true AND is_active = true;

-- Voeg coordinaten toe indien NULL
-- (zie "Coordinaten Toevoegen" sectie)
```

### Probleem: User locatie werkt niet

**Oplossing:**
- Check browser console voor errors
- Zorg dat site via HTTPS of localhost draait
- Check browser locatie permissies
- Test in incognito mode (clean state)

### Probleem: Reserveren knop werkt niet

**Oplossing:**
```typescript
// Check of ReserveBookingModal correct geïmporteerd is
import { ReserveBookingModal } from '@/components/booking/ReserveBookingModal';

// Check browser console voor errors
// Mogelijk conflicterende event handlers
```

### Probleem: Layout broken op mobiel

**Oplossing:**
```typescript
// Verificeer responsive classes in PageHeroWithMap.tsx
className="flex flex-col lg:flex-row"

// Content section
className="w-full lg:w-1/2"

// Map section  
className="w-full lg:w-1/2 h-[400px] lg:h-[600px]"
```

---

## 📁 File Structure

```
/Users/dietmar/Desktop/ray2/
├── components/
│   ├── map/
│   │   └── DiscoverMap.tsx          [NEW] ✅ Interactieve kaart
│   ├── hero/
│   │   ├── PageHero.tsx              [EXISTING] Originele hero
│   │   └── PageHeroWithMap.tsx       [NEW] ✅ Hero met kaart optie
│   └── booking/
│       └── ReserveBookingModal.tsx   [EXISTING] Reserverings popup
├── app/
│   └── discover/
│       ├── page.tsx                  [UPDATED] ✅ Nu met kaart
│       └── DiscoverClient.tsx        [EXISTING] Filter logica
└── SQL/
    └── VERIFY_MAP_COORDINATES.sql    [NEW] ✅ Verificatie script
```

---

## 🎓 Code Voorbeelden

### Custom Marker Styling

```typescript
const customIcon = L.divIcon({
  className: 'custom-restaurant-marker',
  html: `
    <div style="
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #FF5A5F 0%, #FF385C 100%);
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(255, 90, 95, 0.4);
    ">
      <!-- SVG icon hier -->
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});
```

### Popup Content

```typescript
const popupContent = `
  <div style="min-width: 200px; padding: 4px;">
    <h3>${location.name}</h3>
    <p>${location.city}</p>
    <button onclick="window.openReservation_${location.id}">
      Reserveren
    </button>
  </div>
`;
```

### Responsive Layout

```typescript
// Desktop: Side-by-side
<div className="flex flex-col lg:flex-row">
  <div className="w-full lg:w-1/2">Content</div>
  <div className="w-full lg:w-1/2 h-[400px] lg:h-[600px]">Map</div>
</div>
```

---

## 🚀 Next Steps / Future Enhancements

### Mogelijk toekomstige features:
- [ ] Clustering voor veel markers (>50 restaurants)
- [ ] Search binnen kaart viewport
- [ ] Draw radius tool
- [ ] Save favorite locations
- [ ] Directions naar restaurant
- [ ] Street view integratie
- [ ] Heat map voor populaire gebieden
- [ ] Filter markers op kaart

### Performance optimalisaties:
- [ ] Marker clustering (react-leaflet-cluster)
- [ ] Virtualized marker rendering
- [ ] Map tile caching
- [ ] Lazy load popup content

---

## 📞 Support

Bij vragen of problemen:
1. Check deze documentatie
2. Run `VERIFY_MAP_COORDINATES.sql`
3. Check browser console voor errors
4. Verify Leaflet is correct geïnstalleerd

---

## ✅ Success Criteria

De implementatie is succesvol als:
- ✅ Kaart laadt op `/discover`
- ✅ Alle restaurants zichtbaar als pins
- ✅ User locatie wordt getoond (bij permissie)
- ✅ Click op pin opent popup
- ✅ Click "Reserveren" opent modal
- ✅ Responsive werkt op mobiel
- ✅ Branding matcht Reserve4You
- ✅ Geen emoji's (professioneel)
- ✅ Geen console errors

---

**Implementatie Datum**: October 27, 2025  
**Status**: ✅ Complete & Production Ready  
**Branding**: Professional, geen emoji's  
**Platform**: Reserve4You

