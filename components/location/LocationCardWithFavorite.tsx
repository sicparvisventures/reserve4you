/**
 * Location Card With Favorite
 * Client component wrapper that adds favorite functionality to LocationCard
 */

'use client';

import { useState, useEffect } from 'react';
import { LocationCard } from './LocationCard';
import { useRouter } from 'next/navigation';

interface LocationCardWithFavoriteProps {
  location: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    cuisine_type?: string;
    cuisine?: string;
    price_range?: number;
    address_line1?: string;
    city?: string;
    address_json?: { city?: string; street?: string; postalCode?: string };
    hero_image_url?: string;
    image_url?: string;
    has_deals?: boolean;
    review_count?: number;
    average_rating?: number;
  };
  initialIsFavorite?: boolean;
  showBookButton?: boolean;
}

export function LocationCardWithFavorite({
  location,
  initialIsFavorite = false,
  showBookButton = true,
}: LocationCardWithFavoriteProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleFavoriteToggle = async (locationId: string) => {
    if (isLoading) return;

    setIsLoading(true);
    const previousState = isFavorite;
    const action = isFavorite ? 'remove' : 'add';

    // Optimistic update
    setIsFavorite(!isFavorite);

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locationId,
          action,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Revert on error
        setIsFavorite(previousState);
        
        if (response.status === 401) {
          // Not authenticated - redirect to login
          router.push('/login?redirect=/discover');
          return;
        }

        console.error('Error toggling favorite:', data.error);
        console.error('Full error response:', data);
        console.error('Status:', response.status);
      } else {
        // Success - refresh the page data
        router.refresh();
      }
    } catch (error) {
      // Revert on error
      setIsFavorite(previousState);
      console.error('Error toggling favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LocationCard
      location={location}
      onFavoriteToggle={handleFavoriteToggle}
      isFavorite={isFavorite}
      showBookButton={showBookButton}
    />
  );
}

