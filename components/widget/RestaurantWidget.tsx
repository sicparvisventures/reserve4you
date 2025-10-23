/**
 * Restaurant Widget Component
 * 
 * Embeddable widget voor externe websites
 * Toont restaurant kaarten met promoties en reserveer functionaliteit
 */

'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Euro, Calendar, Tag, X, Loader2 } from 'lucide-react';

interface WidgetLocation {
  id: string;
  name: string;
  slug: string;
  description?: string;
  cuisine?: string;
  price_range?: number;
  city?: string;
  address_line1?: string;
  image_url?: string;
  hero_image_url?: string;
  has_deals?: boolean;
  promotions?: {
    id: string;
    title: string;
    description: string;
    discount_type: string;
    discount_value?: number;
    image_url?: string;
    valid_from: string;
    valid_until?: string;
  }[];
}

interface WidgetConfig {
  id: string;
  widget_name: string;
  theme: 'light' | 'dark' | 'auto';
  primary_color: string;
  logo_url?: string;
  show_logo: boolean;
  logo_position: 'top' | 'left' | 'center';
  layout: 'grid' | 'list' | 'carousel';
  cards_per_row: number;
  card_style: 'modern' | 'classic' | 'minimal';
  show_promotions: boolean;
  show_cuisine: boolean;
  show_price_range: boolean;
  show_city: boolean;
  show_description: boolean;
  booking_button_text: string;
  booking_button_color: string;
  max_width: number;
  max_height?: number;
  custom_css?: string;
  enable_animations: boolean;
  enable_hover_effects: boolean;
  corner_radius: number;
}

interface RestaurantWidgetProps {
  widgetCode: string;
  apiUrl?: string;
}

export function RestaurantWidget({ widgetCode, apiUrl = '/api/widget' }: RestaurantWidgetProps) {
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [locations, setLocations] = useState<WidgetLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<WidgetLocation | null>(null);

  useEffect(() => {
    fetchWidgetData();
  }, [widgetCode]);

  const fetchWidgetData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/${widgetCode}`);
      
      if (!response.ok) {
        throw new Error('Widget niet gevonden');
      }
      
      const data = await response.json();
      setConfig(data.config);
      setLocations(data.locations || []);
      
      // Track widget view
      trackEvent('view');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij laden van widget');
    } finally {
      setLoading(false);
    }
  };

  const trackEvent = async (eventType: string, locationId?: string) => {
    if (!config) return;
    
    try {
      await fetch(`${apiUrl}/${widgetCode}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: eventType,
          location_id: locationId,
          referrer_url: window.location.href,
          user_agent: navigator.userAgent,
        }),
      });
    } catch (err) {
      console.error('Failed to track event:', err);
    }
  };

  const handleBookingClick = (location: WidgetLocation) => {
    trackEvent('click', location.id);
    setSelectedLocation(location);
    trackEvent('booking_start', location.id);
    
    // Open in new window or iframe
    const bookingUrl = `${window.location.origin}/p/${location.slug}`;
    window.open(bookingUrl, '_blank', 'width=800,height=900');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="p-8 text-center text-red-600">
        <p>{error || 'Widget configuratie niet gevonden'}</p>
      </div>
    );
  }

  const isDark = config.theme === 'dark' || 
    (config.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const getGridColumns = () => {
    switch (config.layout) {
      case 'list':
        return 'grid-cols-1';
      case 'carousel':
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      default:
        return `grid-cols-1 md:grid-cols-${Math.min(config.cards_per_row, 2)} lg:grid-cols-${config.cards_per_row}`;
    }
  };

  return (
    <div
      className={`r4y-widget ${isDark ? 'dark' : 'light'}`}
      style={{
        maxWidth: `${config.max_width}px`,
        maxHeight: config.max_height ? `${config.max_height}px` : 'auto',
        margin: '0 auto',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        ...(!isDark ? {
          '--background': '0 0% 100%',
          '--foreground': '222.2 84% 4.9%',
          '--card': '0 0% 100%',
          '--card-foreground': '222.2 84% 4.9%',
          '--primary': config.primary_color,
          '--muted': '210 40% 96.1%',
          '--muted-foreground': '215.4 16.3% 46.9%',
          '--border': '214.3 31.8% 91.4%',
          '--radius': `${config.corner_radius}px`,
        } as React.CSSProperties : {
          '--background': '222.2 84% 4.9%',
          '--foreground': '210 40% 98%',
          '--card': '222.2 84% 4.9%',
          '--card-foreground': '210 40% 98%',
          '--primary': config.primary_color,
          '--muted': '217.2 32.6% 17.5%',
          '--muted-foreground': '215 20.2% 65.1%',
          '--border': '217.2 32.6% 17.5%',
          '--radius': `${config.corner_radius}px`,
        } as React.CSSProperties),
      }}
    >
      {/* Custom CSS */}
      {config.custom_css && (
        <style dangerouslySetInnerHTML={{ __html: config.custom_css }} />
      )}

      {/* Logo */}
      {config.show_logo && config.logo_url && (
        <div 
          className={`mb-6 ${
            config.logo_position === 'center' ? 'text-center' : 
            config.logo_position === 'left' ? 'text-left' : 'text-center'
          }`}
        >
          <img 
            src={config.logo_url} 
            alt={config.widget_name}
            className="h-12 inline-block"
            style={{ maxHeight: '48px' }}
          />
        </div>
      )}

      {/* Locations Grid */}
      {locations.length > 0 ? (
        <div className={`grid ${getGridColumns()} gap-6`}>
          {locations.map((location) => (
            <LocationWidgetCard
              key={location.id}
              location={location}
              config={config}
              onBookingClick={handleBookingClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>Geen restaurants beschikbaar</p>
        </div>
      )}
    </div>
  );
}

interface LocationWidgetCardProps {
  location: WidgetLocation;
  config: WidgetConfig;
  onBookingClick: (location: WidgetLocation) => void;
}

function LocationWidgetCard({ location, config, onBookingClick }: LocationWidgetCardProps) {
  const imageUrl = location.image_url || location.hero_image_url;
  const activePromotions = location.promotions?.slice(0, 1) || [];

  return (
    <Card 
      className={`overflow-hidden ${config.enable_hover_effects ? 'hover:shadow-lg' : ''} ${config.enable_animations ? 'transition-all duration-300' : ''} group`}
      style={{ borderRadius: `${config.corner_radius}px` }}
    >
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={location.name}
            className={`w-full h-full object-cover ${config.enable_animations && config.enable_hover_effects ? 'group-hover:scale-105 transition-transform duration-300' : ''}`}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.parentElement) {
                e.currentTarget.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center"><span class="text-6xl">🍽️</span></div>';
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl">🍽️</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {config.show_cuisine && location.cuisine && (
            <Badge variant="secondary" className="backdrop-blur-sm">
              {location.cuisine}
            </Badge>
          )}
          {config.show_promotions && location.has_deals && (
            <Badge className="backdrop-blur-sm bg-emerald-500 text-white border-0 shadow-md">
              Aanbieding
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-3">
          <h3 className={`text-lg font-semibold mb-1 ${config.enable_hover_effects ? 'group-hover:text-primary transition-colors' : ''}`}>
            {location.name}
          </h3>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {config.show_city && location.city && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{location.city}</span>
              </div>
            )}
            {config.show_price_range && location.price_range && (
              <div className="flex items-center gap-1">
                {Array.from({ length: location.price_range }).map((_, i) => (
                  <Euro key={i} className="h-3 w-3" />
                ))}
              </div>
            )}
          </div>
        </div>

        {config.show_description && location.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {location.description}
          </p>
        )}

        {/* Promotions */}
        {config.show_promotions && activePromotions.length > 0 && (
          <div className="mb-3 p-3 bg-emerald-50 dark:bg-emerald-950 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-start gap-2">
              <Tag className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-emerald-900 dark:text-emerald-100">
                  {activePromotions[0].title}
                </p>
                {activePromotions[0].description && (
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 line-clamp-2">
                    {activePromotions[0].description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Booking Button */}
        <Button
          className="w-full"
          style={{ 
            backgroundColor: config.booking_button_color,
            color: 'white',
          }}
          onClick={() => onBookingClick(location)}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {config.booking_button_text}
        </Button>
      </div>
    </Card>
  );
}

