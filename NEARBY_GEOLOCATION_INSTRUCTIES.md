# 📍 Bij Mij in de Buurt - Geolocation Functionaliteit

## ✅ Wat is geïmplementeerd

Wanneer gebruikers op de "Bij mij in de buurt" knop klikken op `localhost:3007`, worden ze naar `/discover?nearby=true` gestuurd en gebeurt het volgende:

1. **Automatische locatie prompt** - De browser vraagt toestemming om de locatie van de gebruiker te gebruiken
2. **Dichtstbijzijnde restaurants** - Restaurants worden gesorteerd op afstand (dichtstbij eerst)
3. **25km radius** - Alleen restaurants binnen 25km worden getoond
4. **Real-time feedback** - Loading state tijdens het ophalen van de locatie
5. **Error handling** - Duidelijke foutmeldingen bij problemen

## 🚀 Setup Instructies

### Stap 1: Database Setup
Voer het SQL script uit in je Supabase dashboard:

```bash
# Open: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
# Kopieer en plak de inhoud van: SETUP_NEARBY_GEOLOCATION.sql
```

Dit script:
- ✅ Voegt `latitude` en `longitude` kolommen toe (indien nodig)
- ✅ Maakt indexes voor snelle geo-queries
- ✅ Voegt `group_friendly` en `has_deals` kolommen toe
- ✅ Maakt een `calculate_distance()` functie (Haversine formule)
- ✅ Maakt een test view voor verificatie

### Stap 2: Coordinaten Toevoegen
Je moet latitude/longitude toevoegen aan je locations:

```sql
-- Voorbeeld voor Brussel (Grand Place)
UPDATE locations 
SET 
  latitude = 50.8503,
  longitude = 4.3517
WHERE slug = 'your-restaurant-slug';

-- Voorbeeld voor Gent
UPDATE locations 
SET 
  latitude = 51.0543,
  longitude = 3.7174
WHERE slug = 'another-restaurant';
```

#### Hoe krijg je coordinaten?
1. Ga naar [Google Maps](https://maps.google.com)
2. Zoek het restaurant adres
3. Rechtermuisknop op de locatie marker
4. Klik op de coordinaten (bijv. "50.8503, 4.3517")
5. Kopieer en plak in de SQL query

### Stap 3: Test de Functionaliteit

1. Start je development server:
```bash
npm run dev
```

2. Ga naar: `http://localhost:3007`

3. Klik op de "Bij mij in de buurt" knop

4. Sta locatietoegang toe in je browser

5. Je zou nu restaurants moeten zien, gesorteerd op afstand

## 🎯 Hoe het Werkt

### Frontend Flow

```
Gebruiker klikt "Bij mij in de buurt"
    ↓
Router naar /discover?nearby=true
    ↓
DiscoverClient detecteert nearby=true
    ↓
useEffect triggert requestUserLocation()
    ↓
Browser vraagt om location permission
    ↓
Gebruiker geeft toestemming
    ↓
Coordinaten worden opgehaald
    ↓
URL wordt ge-update met lat/lng/radius
    ↓
Server fetcht locaties met geo-filters
    ↓
Resultaten worden gesorteerd op afstand
    ↓
Dichtstbijzijnde restaurants worden getoond
```

### Backend Logic (tenant-dal.ts)

```typescript
// Filter locaties binnen radius
if (params.nearby && params.latitude && params.longitude && params.radius) {
  filtered = filtered.filter(loc => {
    const distance = getDistanceInKm(
      params.latitude,
      params.longitude,
      parseFloat(loc.latitude),
      parseFloat(loc.longitude)
    );
    return distance <= params.radius;
  });
  
  // Sorteer op afstand
  filtered = filtered.sort((a, b) => {
    const distA = getDistanceInKm(...);
    const distB = getDistanceInKm(...);
    return distA - distB;
  });
}
```

## 🔧 Configuratie Opties

### Radius Aanpassen
In `DiscoverClient.tsx` regel 127:
```typescript
params.set('radius', '25'); // Wijzig naar gewenste radius in km
```

### Default Locatie (Fallback)
In `tenant-dal.ts` regel 306-307:
```typescript
const lat = params.latitude || 50.8503;  // Brussel centrum
const lon = params.longitude || 4.3517;
```

### Cache Tijd voor Locatie
In `DiscoverClient.tsx` regel 103:
```typescript
maximumAge: 300000, // 5 minuten (in milliseconds)
```

## 📱 Browser Permissies

### Toestemming Gegeven
✅ Gebruiker krijgt toast: "Locatie gevonden! Restaurants in je buurt worden getoond."
✅ URL wordt ge-update met lat/lng parameters
✅ Restaurants worden gefilterd en gesorteerd

### Toestemming Geweigerd  
❌ Nearby filter wordt automatisch uitgezet
❌ Gebruiker krijgt error toast
❌ Fallback: alle restaurants worden getoond (zonder geo-filter)

### Browser Ondersteunt Geen Geolocation
❌ Toast: "Je browser ondersteunt geen locatiedetectie"
❌ Nearby filter wordt uitgezet

## 🐛 Troubleshooting

### Geen restaurants in de buurt?
```sql
-- Check welke locaties coordinaten hebben
SELECT 
    COUNT(*) as total_locations,
    COUNT(latitude) as with_latitude,
    COUNT(longitude) as with_longitude
FROM locations
WHERE is_public = true AND is_active = true;
```

### Locatie niet gevonden op localhost?
- Localhost werkt alleen met HTTPS of als exception in Chrome
- Gebruik `http://localhost` (niet 127.0.0.1)
- Of test op een echte domain met HTTPS

### Incorrecte afstanden?
- Check of lat/lng correct zijn (niet omgedraaid!)
- Latitude is altijd tussen -90 en 90
- Longitude is altijd tussen -180 en 180
- Formaat: DECIMAL(10, 8) voor latitude, DECIMAL(11, 8) voor longitude

## 🎨 UI States

### Loading State
```tsx
{isGettingLocation ? (
  <>
    <Loader2 className="h-4 w-4 animate-spin" />
    Locatie ophalen...
  </>
) : (
  // Normal state
)}
```

### Active Filter Badge
```tsx
<button disabled={isGettingLocation}>
  <MapPin className="h-4 w-4" />
  Bij mij in de buurt
  <X className="h-4 w-4" />
</button>
```

## 📊 Performance

### Database Indexes
✅ `idx_locations_coordinates` - Voor snelle geo-queries
✅ Partial index: `WHERE is_public = true AND is_active = true`

### Optimalisatie Tips
- Limit results tot 50 (zie tenant-dal.ts regel 329)
- Cache gebruiker locatie voor 5 minuten
- Filter eerst op database, dan op afstand in JS

### Voor Productie (>10k locations)
Overweeg PostGIS extension:
```sql
CREATE EXTENSION postgis;
ALTER TABLE locations ADD COLUMN geom GEOMETRY(Point, 4326);
CREATE INDEX idx_locations_geom ON locations USING GIST(geom);
```

## 🔗 Gerelateerde Files

- `/app/discover/page.tsx` - Server component
- `/app/discover/DiscoverClient.tsx` - Client component met geolocation
- `/lib/auth/tenant-dal.ts` - searchLocations() functie
- `/components/hero/HeroSection.tsx` - Homepage buttons
- `SETUP_NEARBY_GEOLOCATION.sql` - Database setup script

## ✨ Extra Features

### Combinatie met andere filters
```typescript
// Nearby + Open Now + Deals
/discover?nearby=true&open_now=true&deals=true&lat=50.8503&lng=4.3517&radius=25
```

### Afstand Tonen (Optioneel)
Je kunt de afstand tonen in de LocationCard:
```typescript
// In LocationCard.tsx
const distance = getDistanceInKm(userLat, userLng, location.latitude, location.longitude);
<span>{distance.toFixed(1)} km</span>
```

## 🎉 Klaar!

De "Bij mij in de buurt" functionaliteit is nu volledig geïmplementeerd! 

Test het op: `http://localhost:3007`

Voor vragen, check de code comments of de gerelateerde bestanden.

