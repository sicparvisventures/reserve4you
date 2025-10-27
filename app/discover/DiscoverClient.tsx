'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X, SlidersHorizontal, MapPin, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface DiscoverClientProps {
  initialQuery?: string;
  initialCuisine?: string;
  initialPrice?: number;
  initialFilters?: {
    nearby?: boolean;
    openNow?: boolean;
    today?: boolean;
    groups?: boolean;
    deals?: boolean;
  };
}

const CUISINE_TYPES = [
  'Italiaans',
  'Frans',
  'Sushi',
  'Grieks',
  'Mexicaans',
  'Thais',
  'Indiaas',
  'Chinees',
  'Belgisch',
  'Mediterraans',
  'Vegetarisch',
  'Vegan',
];

const PRICE_RANGES = [
  { value: 1, label: '€', description: 'Budget' },
  { value: 2, label: '€€', description: 'Betaalbaar' },
  { value: 3, label: '€€€', description: 'Middel' },
  { value: 4, label: '€€€€', description: 'Premium' },
];

export function DiscoverClient({
  initialQuery = '',
  initialCuisine = '',
  initialPrice,
  initialFilters = {},
}: DiscoverClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [query, setQuery] = useState(initialQuery);
  const [selectedCuisine, setSelectedCuisine] = useState(initialCuisine);
  const [selectedPrice, setSelectedPrice] = useState<number | undefined>(initialPrice);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState(initialFilters);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationMessage, setLocationMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const requestUserLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationMessage({ type: 'error', text: 'Je browser ondersteunt geen locatiedetectie' });
      setActiveFilters(prev => ({ ...prev, nearby: false }));
      return;
    }

    setIsGettingLocation(true);
    setLocationMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(location);
        setIsGettingLocation(false);
        setLocationMessage({ type: 'success', text: 'Locatie gevonden! Restaurants in je buurt worden getoond.' });
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => setLocationMessage(null), 5000);
        
        // Update URL with location coordinates
        updateFiltersWithLocation(location);
      },
      (error) => {
        setIsGettingLocation(false);
        
        let errorMessage = 'Kon locatie niet ophalen';
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = 'Locatietoegang geweigerd. Sta locatietoegang toe in je browser instellingen.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = 'Locatie is niet beschikbaar';
        } else if (error.code === error.TIMEOUT) {
          errorMessage = 'Locatieverzoek time-out';
        }
        
        setLocationMessage({ type: 'error', text: errorMessage });
        setActiveFilters(prev => ({ ...prev, nearby: false }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    );
  }, []);

  // Request geolocation when nearby filter is activated
  useEffect(() => {
    if (activeFilters.nearby && !userLocation) {
      requestUserLocation();
    }
  }, [activeFilters.nearby, userLocation, requestUserLocation]);

  const updateFiltersWithLocation = (location?: {lat: number, lng: number}) => {
    const params = new URLSearchParams();
    
    if (query) params.set('query', query);
    if (selectedCuisine) params.set('cuisine', selectedCuisine);
    if (selectedPrice) params.set('price', selectedPrice.toString());
    if (activeFilters.nearby) {
      params.set('nearby', 'true');
      if (location || userLocation) {
        const loc = location || userLocation;
        params.set('lat', loc!.lat.toString());
        params.set('lng', loc!.lng.toString());
        params.set('radius', '25'); // 25km radius
      }
    }
    if (activeFilters.openNow) params.set('open_now', 'true');
    if (activeFilters.today) params.set('today', 'true');
    if (activeFilters.groups) params.set('groups', 'true');
    if (activeFilters.deals) params.set('deals', 'true');
    
    startTransition(() => {
      router.push(`/discover${params.toString() ? `?${params.toString()}` : ''}`);
    });
  };

  const updateFilters = () => {
    // If nearby is active and we have location, use the location-aware update
    if (activeFilters.nearby && userLocation) {
      updateFiltersWithLocation();
    } else {
      // Regular update without location
      const params = new URLSearchParams();
      
      if (query) params.set('query', query);
      if (selectedCuisine) params.set('cuisine', selectedCuisine);
      if (selectedPrice) params.set('price', selectedPrice.toString());
      if (activeFilters.nearby) params.set('nearby', 'true');
      if (activeFilters.openNow) params.set('open_now', 'true');
      if (activeFilters.today) params.set('today', 'true');
      if (activeFilters.groups) params.set('groups', 'true');
      if (activeFilters.deals) params.set('deals', 'true');
      
      startTransition(() => {
        router.push(`/discover${params.toString() ? `?${params.toString()}` : ''}`);
      });
    }
  };

  const clearFilters = () => {
    setQuery('');
    setSelectedCuisine('');
    setSelectedPrice(undefined);
    setActiveFilters({});
    setUserLocation(null);
    
    startTransition(() => {
      router.push('/discover');
    });
  };

  const hasActiveFilters = query || selectedCuisine || selectedPrice || 
    activeFilters.nearby || activeFilters.openNow || activeFilters.today || 
    activeFilters.groups || activeFilters.deals;

  return (
    <div className="space-y-6">
      {/* Location Message Banner */}
      {locationMessage && (
        <div className={`px-4 py-3 rounded-lg flex items-center gap-3 ${
          locationMessage.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {locationMessage.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{locationMessage.text}</span>
          <button 
            onClick={() => setLocationMessage(null)}
            className="ml-auto hover:opacity-70 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Zoek restaurants, gerechten, locatie..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && updateFilters()}
            className="pl-12 h-12 text-base"
          />
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <SlidersHorizontal className="h-5 w-5" />
            Filters
          </Button>
          
          <Button
            size="lg"
            onClick={updateFilters}
            disabled={isPending}
            className="min-w-[120px]"
          >
            {isPending ? 'Zoeken...' : 'Zoeken'}
          </Button>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Actieve filters:</span>
          
          {selectedCuisine && (
            <button
              onClick={() => {
                setSelectedCuisine('');
                updateFilters();
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              {selectedCuisine}
              <X className="h-4 w-4" />
            </button>
          )}
          
          {selectedPrice && (
            <button
              onClick={() => {
                setSelectedPrice(undefined);
                updateFilters();
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              {PRICE_RANGES.find(p => p.value === selectedPrice)?.label}
              <X className="h-4 w-4" />
            </button>
          )}

          {activeFilters.nearby && (
            <button
              onClick={() => {
                setActiveFilters(prev => ({ ...prev, nearby: false }));
                setUserLocation(null);
                updateFilters();
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
              disabled={isGettingLocation}
            >
              {isGettingLocation ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Locatie ophalen...
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4" />
                  Bij mij in de buurt
                  <X className="h-4 w-4" />
                </>
              )}
            </button>
          )}

          {activeFilters.openNow && (
            <button
              onClick={() => {
                setActiveFilters(prev => ({ ...prev, openNow: false }));
                updateFilters();
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              Nu open
              <X className="h-4 w-4" />
            </button>
          )}

          {activeFilters.today && (
            <button
              onClick={() => {
                setActiveFilters(prev => ({ ...prev, today: false }));
                updateFilters();
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              Vandaag beschikbaar
              <X className="h-4 w-4" />
            </button>
          )}

          {activeFilters.groups && (
            <button
              onClick={() => {
                setActiveFilters(prev => ({ ...prev, groups: false }));
                updateFilters();
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              Groepen
              <X className="h-4 w-4" />
            </button>
          )}

          {activeFilters.deals && (
            <button
              onClick={() => {
                setActiveFilters(prev => ({ ...prev, deals: false }));
                updateFilters();
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              Speciale deals
              <X className="h-4 w-4" />
            </button>
          )}
          
          <button
            onClick={clearFilters}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
          >
            Wis alle filters
          </button>
        </div>
      )}

      {/* Expanded Filters */}
      {showFilters && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-6 animate-slide-up">
          {/* Cuisine Type */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Type keuken</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {CUISINE_TYPES.map((cuisine) => (
                <button
                  key={cuisine}
                  onClick={() => setSelectedCuisine(cuisine === selectedCuisine ? '' : cuisine)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCuisine === cuisine
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  {cuisine}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Prijsklasse</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PRICE_RANGES.map((price) => (
                <button
                  key={price.value}
                  onClick={() => setSelectedPrice(price.value === selectedPrice ? undefined : price.value)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedPrice === price.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="text-lg font-bold text-foreground mb-1">{price.label}</div>
                  <div className="text-xs text-muted-foreground">{price.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Apply Filters Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="ghost"
              onClick={() => setShowFilters(false)}
            >
              Annuleren
            </Button>
            <Button
              onClick={() => {
                updateFilters();
                setShowFilters(false);
              }}
              disabled={isPending}
            >
              Filters toepassen
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

