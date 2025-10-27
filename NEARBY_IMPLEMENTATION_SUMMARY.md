# 📍 "Bij Mij in de Buurt" - Implementatie Samenvatting

## ✅ Wat Is Gebouwd

De "Bij mij in de buurt" functionaliteit is volledig geïmplementeerd. Wanneer gebruikers op de knop klikken op `localhost:3007`, worden ze naar `/discover?nearby=true` gestuurd met:

1. **Automatische Locatie Prompt** - Browser vraagt toestemming voor locatietoegang
2. **Real-time Feedback** - Success/error berichten in de UI
3. **Dichtstbijzijnde Restaurants Eerst** - Gesorteerd op afstand (Haversine formule)
4. **25km Radius** - Alleen restaurants binnen 25km worden getoond
5. **Graceful Error Handling** - Duidelijke foutmeldingen bij problemen

## 🔧 Gewijzigde Bestanden

### 1. `/app/discover/DiscoverClient.tsx` ⭐
**Client Component met Geolocation Logic**

#### Nieuwe Features:
```typescript
// State management
const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
const [isGettingLocation, setIsGettingLocation] = useState(false);
const [locationMessage, setLocationMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

// Geolocation request
const requestUserLocation = useCallback(async () => {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      // Success: update URL with lat/lng/radius
      updateFiltersWithLocation(location);
    },
    (error) => {
      // Error: show message and disable nearby filter
      setLocationMessage({ type: 'error', text: errorMessage });
    }
  );
}, []);

// Auto-trigger when nearby filter is activated
useEffect(() => {
  if (activeFilters.nearby && !userLocation) {
    requestUserLocation();
  }
}, [activeFilters.nearby, userLocation, requestUserLocation]);
```

#### UI Feedback:
```tsx
{/* Success/Error Message Banner */}
{locationMessage && (
  <div className="px-4 py-3 rounded-lg flex items-center gap-3">
    <CheckCircle2 className="h-5 w-5" />
    <span>{locationMessage.text}</span>
    <button onClick={() => setLocationMessage(null)}>
      <X className="h-4 w-4" />
    </button>
  </div>
)}
```

#### Loading State in Filter Badge:
```tsx
{isGettingLocation ? (
  <>
    <Loader2 className="h-4 w-4 animate-spin" />
    Locatie ophalen...
  </>
) : (
  <>
    <MapPin className="h-4 w-4" />
    Bij mij in de buurt
  </>
)}
```

### 2. `/app/discover/page.tsx`
**Server Component met Lat/Lng Parameters**

#### Nieuwe URL Parameters:
```typescript
interface SearchParams {
  // ... existing params
  lat?: string;        // ← NIEUW
  lng?: string;        // ← NIEUW
  radius?: string;     // ← NIEUW
}

// Parse and pass to searchLocations
const latitude = params.lat ? parseFloat(params.lat) : undefined;
const longitude = params.lng ? parseFloat(params.lng) : undefined;
const radius = params.radius ? parseFloat(params.radius) : undefined;

const locations = await searchLocations({
  // ... other filters
  nearby,
  latitude,
  longitude,
  radius,
});
```

### 3. `/lib/auth/tenant-dal.ts`
**Bestaande Geo-Filtering Logic** (geen wijzigingen nodig)

De `searchLocations()` functie had al ondersteuning voor:
```typescript
// Filter locaties binnen radius
if ((params.nearby || (params.latitude && params.longitude)) && params.radius) {
  const lat = params.latitude || 50.8503; // Brussels fallback
  const lon = params.longitude || 4.3517;
  const maxRadius = params.radius || 25;
  
  filtered = filtered.filter(loc => {
    const distance = getDistanceInKm(lat, lon, parseFloat(loc.latitude!), parseFloat(loc.longitude!));
    return distance <= maxRadius;
  });
  
  // Sort by distance (nearest first)
  filtered = filtered.sort((a, b) => {
    const distA = getDistanceInKm(lat, lon, parseFloat(a.latitude!), parseFloat(a.longitude!));
    const distB = getDistanceInKm(lat, lon, parseFloat(b.latitude!), parseFloat(b.longitude!));
    return distA - distB;
  });
}
```

## 📁 Nieuwe Bestanden

### 1. `SETUP_NEARBY_GEOLOCATION.sql` 🗄️
**Database Setup Script**

Bevat:
- ✅ Latitude/Longitude kolommen (met checks of ze al bestaan)
- ✅ Indexes voor snelle geo-queries
- ✅ `group_friendly` en `has_deals` kolommen
- ✅ `calculate_distance()` functie (Haversine)
- ✅ Test view: `nearby_locations_brussels`
- ✅ Verificatie queries

### 2. `NEARBY_GEOLOCATION_INSTRUCTIES.md` 📚
**Volledige Documentatie**

Bevat:
- Setup instructies (database + coordinaten toevoegen)
- Hoe het werkt (flow diagrams)
- Configuratie opties
- Browser permissies handling
- Troubleshooting
- Performance tips
- Extra features

### 3. `NEARBY_IMPLEMENTATION_SUMMARY.md` 📋
**Dit document** - Technische samenvatting

## 🚀 User Flow

```
1. Gebruiker op homepage (localhost:3007)
   ↓
2. Klikt "Bij mij in de buurt" knop
   ↓
3. Router naar /discover?nearby=true
   ↓
4. DiscoverClient detecteert nearby=true
   ↓
5. useEffect triggert requestUserLocation()
   ↓
6. Browser prompt: "Allow location access?"
   ↓
   ├─ ALLOWED
   │  ├─ Success banner: "Locatie gevonden!"
   │  ├─ URL update: ?nearby=true&lat=50.85&lng=4.35&radius=25
   │  ├─ Server fetcht locaties met geo-filters
   │  ├─ JS sorteert op afstand
   │  └─ UI toont dichtstbijzijnde restaurants eerst
   │
   └─ DENIED
      ├─ Error banner: "Locatietoegang geweigerd..."
      ├─ Nearby filter wordt uitgezet
      └─ Normale discover pagina (geen geo-filter)
```

## 🎨 UI States

### 1. Normale State (nearby niet actief)
```
[ Bij mij in de buurt ] ← Regular button
```

### 2. Loading State (locatie ophalen)
```
[ 🔄 Locatie ophalen... ] ← Disabled button met spinner
```

### 3. Success State
```
┌────────────────────────────────────────────────┐
│ ✓ Locatie gevonden! Restaurants in je buurt   │ [×]
│   worden getoond.                               │
└────────────────────────────────────────────────┘

[ 📍 Bij mij in de buurt × ] ← Active filter badge
```

### 4. Error State
```
┌────────────────────────────────────────────────┐
│ ⚠ Locatietoegang geweigerd. Sta locatietoe-   │ [×]
│   gang toe in je browser instellingen.         │
└────────────────────────────────────────────────┘

(nearby filter is automatisch uitgezet)
```

## 🔧 Configuratie

### Radius Wijzigen
```typescript
// app/discover/DiscoverClient.tsx:127
params.set('radius', '25'); // ← Wijzig naar gewenste km
```

### Fallback Locatie (als geen toestemming)
```typescript
// lib/auth/tenant-dal.ts:306-307
const lat = params.latitude || 50.8503;  // Brussel
const lon = params.longitude || 4.3517;
```

### Cache Tijd
```typescript
// app/discover/DiscoverClient.tsx:108
maximumAge: 300000, // 5 minuten = 300.000 ms
```

## 📊 Database Requirements

### Benodigde Kolommen in `locations` Table:
```sql
latitude        DECIMAL(10, 8)  -- -90 to 90
longitude       DECIMAL(11, 8)  -- -180 to 180
is_public       BOOLEAN         -- Must be true
is_active       BOOLEAN         -- Must be true
group_friendly  BOOLEAN         -- Voor "Groepen" filter
has_deals       BOOLEAN         -- Voor "Deals" filter
```

### Benodigde Indexes:
```sql
CREATE INDEX idx_locations_coordinates 
ON locations(latitude, longitude)
WHERE is_public = true AND is_active = true;
```

### Benodigde Function:
```sql
CREATE FUNCTION calculate_distance(
  lat1 DECIMAL, lon1 DECIMAL, 
  lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL
-- Haversine formula implementatie
```

## 🧪 Testing

### 1. Database Setup
```bash
# Run in Supabase SQL Editor
SETUP_NEARBY_GEOLOCATION.sql
```

### 2. Voeg Coordinaten Toe
```sql
UPDATE locations 
SET 
  latitude = 50.8503,   -- Google Maps -> Rechtermuisknop -> Coordinaten
  longitude = 4.3517
WHERE slug = 'your-restaurant-slug';
```

### 3. Test in Browser
```bash
npm run dev
# Open: http://localhost:3007
# Klik: "Bij mij in de buurt"
# Allow: Location access
# Check: Restaurants sorted by distance
```

## 🐛 Common Issues

### Issue: "Browser ondersteunt geen locatiedetectie"
**Oorzaak**: Oude browser of geen HTTPS
**Fix**: 
- Gebruik moderne browser (Chrome/Firefox/Safari)
- Localhost werkt zonder HTTPS
- Productie vereist HTTPS

### Issue: Geen restaurants gevonden
**Oorzaak**: Geen locaties met coordinaten in DB
**Fix**:
```sql
-- Check welke locaties coordinaten hebben
SELECT 
  COUNT(*) as total,
  COUNT(latitude) as with_coords
FROM locations
WHERE is_public = true AND is_active = true;

-- Voeg coordinaten toe
UPDATE locations SET latitude = X, longitude = Y WHERE ...
```

### Issue: Incorrecte afstanden
**Oorzaak**: Lat/Lng omgedraaid
**Fix**:
- Latitude komt ALTIJD eerst (range: -90 to 90)
- Longitude komt daarna (range: -180 to 180)
- Formaat: "50.8503, 4.3517" → lat=50.8503, lng=4.3517

## 📈 Performance

### Current Implementation
- ✅ Database fetch met indexes
- ✅ Client-side filtering op afstand
- ✅ Limit tot 50 resultaten
- ✅ 5 minuten cache voor gebruiker locatie
- ⚡ Werkt prima tot ~1000 locaties

### Voor Grotere Schaal (>10k locations)
Overweeg PostGIS extension:
```sql
CREATE EXTENSION postgis;
ALTER TABLE locations ADD COLUMN geom GEOMETRY(Point, 4326);
UPDATE locations SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326);
CREATE INDEX idx_locations_geom ON locations USING GIST(geom);

-- Query with PostGIS (veel sneller)
SELECT * FROM locations 
WHERE ST_DWithin(
  geom, 
  ST_SetSRID(ST_MakePoint(4.3517, 50.8503), 4326)::geography,
  25000  -- 25km in meters
);
```

## ✨ Extra Features (Optioneel)

### 1. Afstand Tonen in UI
```typescript
// components/location/LocationCard.tsx
const distance = getDistanceInKm(userLat, userLng, location.latitude, location.longitude);

<span className="text-xs text-muted-foreground">
  {distance.toFixed(1)} km
</span>
```

### 2. Map View
Integreer Google Maps of Mapbox:
```tsx
<Map
  center={{ lat: userLat, lng: userLng }}
  markers={locations.map(loc => ({
    position: { lat: loc.latitude, lng: loc.longitude },
    title: loc.name
  }))}
/>
```

### 3. Radius Slider
```tsx
<Slider
  value={[radius]}
  onValueChange={([value]) => setRadius(value)}
  min={5}
  max={50}
  step={5}
  label="Zoekradius"
/>
```

## 🎉 Status

✅ **VOLLEDIG GEÏMPLEMENTEERD EN KLAAR VOOR GEBRUIK**

### Checklist:
- ✅ Client-side geolocation request
- ✅ Success/error UI feedback
- ✅ URL parameters (lat/lng/radius)
- ✅ Server-side filtering
- ✅ Distance sorting (nearest first)
- ✅ Loading states
- ✅ Error handling
- ✅ Database setup script
- ✅ Complete documentatie

## 📞 Support

Voor vragen of problemen:
1. Check `NEARBY_GEOLOCATION_INSTRUCTIES.md` voor details
2. Run verificatie queries uit `SETUP_NEARBY_GEOLOCATION.sql`
3. Check browser console voor errors
4. Verify database heeft lat/lng data

---

**Implementatie Datum**: 27 Oktober 2025  
**Files Changed**: 2 (DiscoverClient.tsx, discover/page.tsx)  
**Files Created**: 3 (SQL script, 2x documentatie)  
**Ready for Production**: Ja (na database setup)

