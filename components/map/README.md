# 🗺️ DiscoverMap Component

## Overzicht

Een professionele, interactieve kaart component voor de Reserve4You discover pagina. Toont restaurants als branded pins met directe reserverings functionaliteit.

## Features

- ✅ Leaflet integratie met custom styling
- ✅ Reserve4You branded markers (#FF5A5F gradient)
- ✅ User location indicator
- ✅ Click-to-reserve functionaliteit
- ✅ Hover effecten
- ✅ Professional popups
- ✅ Responsive design
- ✅ SSR safe (client-side only)
- ✅ Touch-friendly voor mobiel

## Usage

### Basic

```tsx
import { DiscoverMap } from '@/components/map/DiscoverMap';

<DiscoverMap 
  locations={locations}
  userLocation={null}
  className="h-full w-full"
/>
```

### With User Location

```tsx
<DiscoverMap 
  locations={locations}
  userLocation={{ lat: 51.0381, lng: 3.7377 }}
  className="h-full w-full"
/>
```

### In PageHero

```tsx
import { PageHeroWithMap } from '@/components/hero/PageHeroWithMap';
import { DiscoverMap } from '@/components/map/DiscoverMap';

<PageHeroWithMap
  title="Ontdek restaurants"
  description="Vind het perfecte restaurant"
  showMap={true}
  mapComponent={
    <DiscoverMap 
      locations={locations}
      userLocation={userLocation}
      className="h-full w-full"
    />
  }
>
  {/* Search/filter components */}
</PageHeroWithMap>
```

## Props

```typescript
interface DiscoverMapProps {
  // Array van locaties om weer te geven
  locations: Location[];
  
  // Optionele gebruikers locatie (voor blauwe marker)
  userLocation?: { lat: number; lng: number } | null;
  
  // Optional CSS classes
  className?: string;
}

interface Location {
  id: string;
  name: string;
  slug: string;
  latitude: string | null;
  longitude: string | null;
  address_line1?: string;
  city?: string;
  cuisine_type?: string;
  price_range?: number;
  hero_image_url?: string;
}
```

## Styling

### Markers

**Restaurant Pins:**
- Size: 36x36px
- Background: Linear gradient `#FF5A5F` → `#FF385C`
- Border: 3px solid white
- Shadow: `0 4px 12px rgba(255, 90, 95, 0.4)`
- Icon: Huis SVG (wit)

**User Location:**
- Size: 20x20px
- Background: Solid `#0066FF`
- Border: 3px solid white
- Shadow: `0 2px 8px rgba(0,0,0,0.3)`

### Hover Effects

```typescript
// Hover state
transform: scale(1.15);
boxShadow: 0 6px 20px rgba(255, 90, 95, 0.5);

// Default state
transform: scale(1);
boxShadow: 0 4px 12px rgba(255, 90, 95, 0.4);
```

### Popups

- Border radius: 12px
- Padding: 16px
- Shadow: `0 8px 32px rgba(0, 0, 0, 0.12)`
- Min width: 200px
- Max width: 300px

## Behavior

### Automatic Centering

1. **If userLocation provided:**
   - Center: User coordinates
   - Zoom: 12

2. **Else if locations exist:**
   - Fit bounds to show all restaurants
   - Padding: 10%

3. **Else (fallback):**
   - Center: Brussels (50.8503, 4.3517)
   - Zoom: 8

### Click Behavior

1. Click restaurant pin
2. Popup opens with restaurant info
3. Click "Reserveren" button in popup
4. ReserveBookingModal opens
5. Popup closes automatically
6. User can complete reservation

### Touch/Mobile

- Pinch-to-zoom enabled
- Drag to pan enabled
- Touch-friendly marker size
- Tap outside popup to close
- Smooth animations

## Integration

### With ReserveBookingModal

```typescript
// In component
const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

// Global function for popup button
(window as any)[`openReservation_${location.id}`] = () => {
  setSelectedLocation(location);
  setIsBookingModalOpen(true);
  map.closePopup();
};

// Render modal
<ReserveBookingModal
  open={isBookingModalOpen}
  onOpenChange={setIsBookingModalOpen}
  location={{
    id: selectedLocation.id,
    name: selectedLocation.name,
    address_line1: selectedLocation.address_line1,
    city: selectedLocation.city,
  }}
/>
```

## Performance

### Optimization

- Client-side only rendering (SSR safe)
- Dynamic Leaflet import
- Efficient marker rendering
- Optimized tile loading
- Cleanup on unmount

### Loading State

```tsx
{!isClient && (
  <div className="flex items-center justify-center bg-muted/30">
    <div className="text-center">
      <MapPin className="w-6 h-6 text-primary" />
      <p className="text-sm text-muted-foreground">Kaart laden...</p>
    </div>
  </div>
)}
```

## Customization

### Change Tile Provider

```typescript
// Default: CARTO Light
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '...',
  maxZoom: 19,
}).addTo(map);

// Alternative: OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '...',
  maxZoom: 19,
}).addTo(map);

// Alternative: Dark mode
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '...',
  maxZoom: 19,
}).addTo(map);
```

### Change Marker Style

```typescript
const customIcon = L.divIcon({
  className: 'custom-restaurant-marker',
  html: `
    <div style="
      width: 40px;
      height: 40px;
      background: your-custom-gradient;
      /* ... your styles ... */
    ">
      <!-- Your icon SVG -->
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});
```

## Dependencies

```json
{
  "leaflet": "^1.9.4",
  "react-leaflet": "^5.0.0",
  "@types/leaflet": "^1.9.21"
}
```

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ iOS Safari 14+
- ✅ Chrome Android 90+

## Accessibility

- Keyboard navigation support
- ARIA labels on markers
- Screen reader friendly popups
- Focus indicators
- Semantic HTML

## Examples

### Filter by Nearby

```tsx
// User clicks "Bij mij in de buurt"
const nearbyLocations = locations.filter(loc => {
  if (!loc.latitude || !loc.longitude) return false;
  const distance = calculateDistance(
    userLocation.lat,
    userLocation.lng,
    parseFloat(loc.latitude),
    parseFloat(loc.longitude)
  );
  return distance <= 25; // 25km radius
});

<DiscoverMap 
  locations={nearbyLocations}
  userLocation={userLocation}
/>
```

### With Loading State

```tsx
{isLoadingLocations ? (
  <div className="h-full w-full flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
) : (
  <DiscoverMap 
    locations={locations}
    userLocation={userLocation}
  />
)}
```

## Troubleshooting

### Markers not showing

Check if locations have coordinates:
```typescript
const validLocations = locations.filter(
  loc => loc.latitude && loc.longitude
);
console.log('Valid locations:', validLocations.length);
```

### Map not loading

Check console for errors:
```bash
# Verify Leaflet is installed
pnpm list leaflet

# Check imports
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
```

### User location not working

Check browser permissions:
- HTTPS or localhost required
- Check browser console for geolocation errors
- Test in incognito mode

## Related Components

- `PageHeroWithMap` - Hero component with map option
- `ReserveBookingModal` - Reservation modal
- `LocationCard` - Alternative list view

## License

Part of Reserve4You platform - Proprietary

