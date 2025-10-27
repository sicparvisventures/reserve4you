/**
 * LocationPicker Component
 * Dropdown voor het selecteren van favoriete locaties om te delen
 */

'use client';

import { useState, useEffect } from 'react';
import { MapPin, Star, Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Location {
  id: string;
  name: string;
  address?: string;
  city?: string;
  postal_code?: string;
  image_url?: string;
  rating?: number;
  cuisine_type?: string;
}

interface LocationPickerProps {
  onSelectLocation: (location: Location) => void;
  onClose: () => void;
}

export function LocationPicker({ onSelectLocation, onClose }: LocationPickerProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFavoriteLocations();
  }, []);

  const fetchFavoriteLocations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/favorites');
      if (!response.ok) {
        throw new Error('Kon favorieten niet ophalen');
      }

      const data = await response.json();
      
      // Extract location data from favorites
      const favoriteLocations = data.favorites
        ?.map((fav: any) => fav.location)
        .filter((loc: any) => loc !== null) || [];

      setLocations(favoriteLocations);
    } catch (err: any) {
      console.error('Error fetching favorite locations:', err);
      setError(err.message || 'Er is iets misgegaan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-500" />
          Favoriete Locaties
        </h3>
        <Button size="sm" variant="ghost" onClick={onClose} className="h-7 px-2">
          Sluiten
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-8 w-8 text-destructive mb-2" />
          <p className="text-sm text-destructive">{error}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchFavoriteLocations}
            className="mt-3"
          >
            Opnieuw proberen
          </Button>
        </div>
      )}

      {!loading && !error && locations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
            <Star className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            Je hebt nog geen favoriete locaties
          </p>
          <p className="text-xs text-muted-foreground">
            Voeg eerst locaties toe aan je favorieten om ze te kunnen delen
          </p>
        </div>
      )}

      {!loading && !error && locations.length > 0 && (
        <ScrollArea className="flex-1 -mx-4 px-4">
          <div className="space-y-2">
            {locations.map((location) => (
              <button
                key={location.id}
                onClick={() => onSelectLocation(location)}
                className="w-full text-left"
              >
                <Card className="p-3 hover:border-primary hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    {/* Location Image */}
                    {location.image_url ? (
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                        <Image
                          src={location.image_url}
                          alt={location.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}

                    {/* Location Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-sm text-foreground line-clamp-1">
                          {location.name}
                        </h4>
                        {location.rating && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs font-medium text-foreground">
                              {location.rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>

                      {location.address && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {location.address}
                        </p>
                      )}

                      {location.city && (
                        <p className="text-xs text-muted-foreground">
                          {location.postal_code} {location.city}
                        </p>
                      )}
                    </div>

                    {/* Send Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  </div>
                </Card>
              </button>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

