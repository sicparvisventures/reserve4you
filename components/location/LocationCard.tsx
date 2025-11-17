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
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group bg-white border-0 shadow-sm rounded-xl">
      <Link href={`/p/${location.slug}`} className="block">
        {/* Image - Vinted style: larger, square aspect ratio */}
        <div className="relative aspect-square bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={location.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                // Fallback to raylogo if image fails to load
                e.currentTarget.src = '/raylogo.png';
                e.currentTarget.className = 'w-full h-full object-contain p-8';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-8">
              <img src="/raylogo.png" alt="Reserve4You" className="w-full h-full object-contain" />
            </div>
          )}

          {/* Favorite Button - Vinted style: top right, minimal */}
          {onFavoriteToggle && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onFavoriteToggle(location.id);
              }}
              className={cn(
                'absolute top-2 right-2 p-1.5 rounded-full transition-all z-10',
                isFavorite
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white/90 text-gray-600 hover:bg-white hover:shadow-md'
              )}
            >
              <Heart
                className={cn('h-4 w-4', isFavorite && 'fill-current')}
              />
            </button>
          )}

          {/* Badges - Vinted style: minimal, top left */}
          <div className="absolute top-2 left-2 flex flex-col gap-1.5">
            {location.has_deals && (
              <Badge className="bg-primary text-white border-0 shadow-sm text-xs font-medium px-2 py-0.5">
                Aanbieding
              </Badge>
            )}
            {cuisine && (
              <Badge variant="secondary" className="bg-white/95 text-gray-700 border-0 shadow-sm text-xs font-medium px-2 py-0.5">
                {cuisine}
              </Badge>
            )}
          </div>
        </div>

        {/* Content - Vinted style: compact, clean */}
        <div className="p-3">
          <h3 className="text-base font-semibold text-gray-900 mb-1.5 line-clamp-1 group-hover:text-primary transition-colors">
            {location.name}
          </h3>
          
          {/* Rating - Compact */}
          {location.average_rating && location.review_count && location.review_count > 0 && (
            <div className="mb-1.5">
              <div className="flex items-center gap-1.5">
                <StarRating 
                  rating={location.average_rating} 
                  size="sm"
                  showNumber={true}
                />
                <span className="text-xs text-gray-500">
                  ({location.review_count})
                </span>
              </div>
            </div>
          )}
          
          {/* Location & Price - Vinted style: minimal */}
          <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
            {city && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="line-clamp-1">{city}</span>
              </div>
            )}
            {location.price_range && (
              <div className="flex items-center gap-0.5">
                {Array.from({ length: location.price_range }).map((_, i) => (
                  <Euro key={i} className="h-3 w-3" />
                ))}
              </div>
            )}
          </div>

          {/* Actions - Vinted style: full width, minimal */}
          {showBookButton && (
            <Button
              size="sm"
              className="w-full mt-2 h-9 text-sm font-medium rounded-lg"
              onClick={(e) => {
                e.preventDefault();
                setIsBookingModalOpen(true);
              }}
            >
              <Calendar className="mr-1.5 h-3.5 w-3.5" />
              {t.booking.verb || 'Reserveren'}
            </Button>
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

