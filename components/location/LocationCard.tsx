/**
 * Location Card Component
 * 
 * Displays a restaurant card with image, info, and quick actions
 */

'use client';

import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Euro, Heart, Calendar, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReserveBookingModal } from '@/components/booking/ReserveBookingModal';
import { StarRating } from '@/components/reviews/StarRating';
import { getTerminology } from '@/lib/terminology';
import { BusinessSector } from '@/lib/types/terminology';

interface LocationCardProps {
  location: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    cuisine_type?: string;
    cuisine?: string; // Alternative field name
    price_range?: number;
    address_line1?: string;
    city?: string;
    address_json?: { city?: string; street?: string; postalCode?: string }; // JSON format
    hero_image_url?: string;
    image_url?: string; // New: Supabase storage image
    has_deals?: boolean; // Has active promotions
    review_count?: number; // Number of reviews
    average_rating?: number; // Average rating
    business_sector?: string; // For dynamic terminology
  };
  onFavoriteToggle?: (locationId: string) => void;
  isFavorite?: boolean;
  showBookButton?: boolean;
}

export function LocationCard({
  location,
  onFavoriteToggle,
  isFavorite = false,
  showBookButton = true,
}: LocationCardProps) {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  
  // 🔥 Get dynamic terminology based on location sector
  const t = getTerminology(location.business_sector as BusinessSector);
  
  // Get city from either direct field or address_json
  const city = location.city || location.address_json?.city;
  
  // Get cuisine from either field name
  const cuisine = location.cuisine_type || location.cuisine;
  
  // Get image URL (prioritize image_url from Supabase storage)
  const imageUrl = location.image_url || location.hero_image_url;
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <Link href={`/p/${location.slug}`} className="block">
        {/* Image */}
        <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={location.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                // Fallback to emoji if image fails to load
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center"><span class="text-6xl">🍽️</span></div>';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl">🍽️</span>
            </div>
          )}

          {/* Favorite Button */}
          {onFavoriteToggle && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onFavoriteToggle(location.id);
              }}
              className={cn(
                'absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-colors',
                isFavorite
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background/70 text-foreground hover:bg-background'
              )}
            >
              <Heart
                className={cn('h-5 w-5', isFavorite && 'fill-current')}
              />
            </button>
          )}

          {/* Cuisine Badge */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {cuisine && (
              <Badge variant="secondary" className="backdrop-blur-sm">
                {cuisine}
              </Badge>
            )}
            {location.has_deals && (
              <Badge className="backdrop-blur-sm bg-gradient-to-r from-accent-sunset to-secondary-amber text-white border-0 shadow-md">
                Aanbieding
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
              {location.name}
            </h3>
            
            {/* Rating */}
            {location.average_rating && location.review_count && location.review_count > 0 && (
              <div className="mb-2">
                <div className="flex items-center gap-2">
                  <StarRating 
                    rating={location.average_rating} 
                    size="sm"
                    showNumber={true}
                  />
                  <span className="text-xs text-muted-foreground">
                    ({location.review_count} {location.review_count === 1 ? 'beoordeling' : 'beoordelingen'})
                  </span>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {city && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{city}</span>
                </div>
              )}
              {location.price_range && (
                <div className="flex items-center gap-1">
                  {Array.from({ length: location.price_range }).map((_, i) => (
                    <Euro key={i} className="h-3 w-3" />
                  ))}
                </div>
              )}
            </div>
          </div>

          {location.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {location.description}
            </p>
          )}

          {/* Actions */}
          {showBookButton && (
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.preventDefault();
                  setIsBookingModalOpen(true);
                }}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {t.booking.verb || 'Reserveren'}
              </Button>
            </div>
          )}
        </div>
      </Link>

      {/* Booking Modal */}
      <ReserveBookingModal
        open={isBookingModalOpen}
        onOpenChange={setIsBookingModalOpen}
        location={{
          id: location.id,
          name: location.name,
          address_line1: location.address_line1,
          city: city,
        }}
      />
    </Card>
  );
}

