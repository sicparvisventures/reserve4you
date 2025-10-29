'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, MapPin, Loader2, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { GooglePlaceAutocomplete } from '@/lib/google-places';

interface GooglePlacesAutocompleteProps {
  onPlaceSelected: (placeId: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function GooglePlacesAutocomplete({ 
  onPlaceSelected, 
  placeholder = 'Zoek je bedrijf op Google...', 
  disabled = false 
}: GooglePlacesAutocompleteProps) {
  const [input, setInput] = useState('');
  const [predictions, setPredictions] = useState<GooglePlaceAutocomplete[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounced search
  const searchPlaces = useCallback(async (searchInput: string) => {
    if (searchInput.length < 3) {
      setPredictions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(
        `/api/google-places/search?input=${encodeURIComponent(searchInput)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        
        // Special handling for API not configured error
        if (errorData.error?.includes('not configured')) {
          throw new Error('Google Places API niet geconfigureerd. Vraag je administrator om de API key toe te voegen.');
        }
        
        throw new Error(errorData.error || 'Failed to search places');
      }

      const data = await response.json();
      setPredictions(data.predictions || []);
      setIsOpen(true);
    } catch (error: any) {
      console.error('Error searching places:', error);
      setError(error.message || 'Fout bij zoeken');
      setPredictions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce timer
  useEffect(() => {
    const timer = setTimeout(() => {
      if (input) {
        searchPlaces(input);
      } else {
        setPredictions([]);
        setIsOpen(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [input, searchPlaces]);

  const handleSelectPlace = (prediction: GooglePlaceAutocomplete) => {
    setInput(prediction.structured_formatting.main_text);
    setIsOpen(false);
    setPredictions([]);
    onPlaceSelected(prediction.place_id);
  };

  return (
    <div ref={wrapperRef} className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10 pr-10 h-11"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-xs text-destructive font-medium">{error}</p>
          {error.includes('niet geconfigureerd') && (
            <p className="text-xs text-muted-foreground mt-1">
              Zie <code className="bg-muted px-1 py-0.5 rounded">VERCEL_ENV_SETUP.md</code> voor instructies.
            </p>
          )}
        </div>
      )}

      {/* Predictions Dropdown */}
      {isOpen && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-background border border-border rounded-xl shadow-lg max-h-80 overflow-y-auto">
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              onClick={() => handleSelectPlace(prediction)}
              className="w-full px-4 py-3 flex items-start gap-3 hover:bg-muted transition-colors text-left border-b border-border last:border-0"
            >
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm">
                  {prediction.structured_formatting.main_text}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {prediction.structured_formatting.secondary_text}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {isOpen && !isLoading && input.length >= 3 && predictions.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-background border border-border rounded-xl shadow-lg p-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Building2 className="h-5 w-5" />
            <p className="text-sm">
              Geen resultaten gevonden voor "{input}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

