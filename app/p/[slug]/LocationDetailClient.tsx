/**
 * Location Detail Client Component
 * 
 * Interactive location page with tabs and booking button
 */

'use client';

import * as React from 'react';
import { useState } from 'react';
import { BookingSheet } from '@/components/booking/BookingSheet';
import { PromotionsDisplay } from '@/components/promotions/PromotionsDisplay';
import { PublicMenuDisplay } from '@/components/menu/PublicMenuDisplay';
import { ReviewsDisplay } from '@/components/reviews/ReviewsDisplay';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  MapPin,
  Clock,
  Phone,
  Mail,
  Globe,
  Euro,
  Calendar,
  UtensilsCrossed,
  Image as ImageIcon,
  MessageSquare,
} from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface LocationDetailClientProps {
  location: any;
  menuData?: any[];
}

type TabType = 'overview' | 'availability' | 'menu' | 'reviews' | 'location';

export function LocationDetailClient({ location, menuData = [] }: LocationDetailClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [bookingSheetOpen, setBookingSheetOpen] = useState(false);

  const tabs = [
    { id: 'overview' as TabType, label: 'Overzicht', icon: UtensilsCrossed },
    { id: 'availability' as TabType, label: 'Beschikbaarheid', icon: Calendar },
    { id: 'menu' as TabType, label: 'Menu', icon: UtensilsCrossed },
    { id: 'reviews' as TabType, label: 'Reviews', icon: MessageSquare },
    { id: 'location' as TabType, label: 'Locatie', icon: MapPin },
  ];

  // Parse opening hours
  const openingHours = location.opening_hours || {};
  const dayNames: Record<string, string> = {
    MON: 'Maandag',
    TUE: 'Dinsdag',
    WED: 'Woensdag',
    THU: 'Donderdag',
    FRI: 'Vrijdag',
    SAT: 'Zaterdag',
    SUN: 'Zondag',
  };

  return (
    <>
      {/* Hero Section */}
      <div className="relative h-[400px] bg-gradient-to-br from-primary/20 to-primary/5">
        {(location.banner_image_url || location.hero_image_url) ? (
          <img
            src={location.banner_image_url || location.hero_image_url}
            alt={location.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-24 w-24 text-muted-foreground opacity-20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
      </div>

      {/* Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10">
        {/* Header Card */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {location.name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {location.cuisine_type && (
                  <Badge variant="secondary">{location.cuisine_type}</Badge>
                )}
                {location.price_range && (
                  <Badge variant="outline" className="gap-1">
                    {Array.from({ length: location.price_range }).map((_, i) => (
                      <Euro key={i} className="h-3 w-3" />
                    ))}
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {location.address_line1 && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {location.address_line1}, {location.city}
                    </span>
                  </div>
                )}
                {location.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{location.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Booking Button */}
            <div className="flex flex-col gap-2">
              <Button
                size="lg"
                className="w-full md:w-auto"
                onClick={() => setBookingSheetOpen(true)}
              >
                <Calendar className="mr-2 h-5 w-5" />
                Reserveren
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Direct beschikbare tijden
              </p>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="border-b border-border mb-6">
          <div className="flex gap-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-1 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="pb-12">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Promotions */}
              {location.promotions && location.promotions.length > 0 && (
                <PromotionsDisplay 
                  promotions={location.promotions}
                  locationName={location.name}
                />
              )}

              {/* Description */}
              {location.description && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Over ons</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {location.description}
                  </p>
                </Card>
              )}

              {/* Opening Hours */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Openingstijden
                </h2>
                <div className="space-y-2">
                  {Object.keys(openingHours).length > 0 ? (
                    Object.entries(openingHours).map(([day, hours]: [string, any]) => (
                      <div key={day} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{dayNames[day] || day}</span>
                        <span className="font-medium">
                          {Array.isArray(hours) && hours.length > 0
                            ? hours.map((h: any) => `${h.open} - ${h.close}`).join(', ')
                            : 'Gesloten'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Openingstijden niet beschikbaar
                    </p>
                  )}
                </div>
              </Card>

              {/* Contact Info */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Contact</h2>
                <div className="space-y-3">
                  {location.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <a
                        href={`tel:${location.phone}`}
                        className="text-sm hover:text-primary transition-colors"
                      >
                        {location.phone}
                      </a>
                    </div>
                  )}
                  {location.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <a
                        href={`mailto:${location.email}`}
                        className="text-sm hover:text-primary transition-colors"
                      >
                        {location.email}
                      </a>
                    </div>
                  )}
                  {location.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <a
                        href={location.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:text-primary transition-colors"
                      >
                        {location.website}
                      </a>
                    </div>
                  )}
                </div>
              </Card>

              {/* Policies */}
              {location.policy && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Reserveringsbeleid</h2>
                  <div className="space-y-2 text-sm">
                    {location.policy.cancellation_hours && (
                      <p className="text-muted-foreground">
                        Annuleren tot {location.policy.cancellation_hours} uur voor reservering
                      </p>
                    )}
                    {location.policy.deposit_required && (
                      <p className="text-muted-foreground">
                        Aanbetaling vereist voor groepen van{' '}
                        {location.policy.deposit_applies_to_party_size || 6} personen of meer
                      </p>
                    )}
                    {location.policy.max_party_size && (
                      <p className="text-muted-foreground">
                        Maximaal {location.policy.max_party_size} personen per reservering
                      </p>
                    )}
                  </div>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'availability' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Beschikbaarheid</h2>
              <p className="text-muted-foreground mb-4">
                Klik op "Reserveren" om beschikbare tijden te zien en direct te boeken.
              </p>
              <Button onClick={() => setBookingSheetOpen(true)}>
                <Calendar className="mr-2 h-4 w-4" />
                Bekijk beschikbare tijden
              </Button>
            </Card>
          )}

          {activeTab === 'menu' && (
            <PublicMenuDisplay 
              menu={menuData}
              locationName={location.name}
            />
          )}

          {activeTab === 'reviews' && (
            <ReviewsDisplay
              locationId={location.id}
              locationName={location.name}
              averageRating={location.average_rating}
              reviewCount={location.review_count}
              canLeaveReview={false} // TODO: Check if user has completed booking
            />
          )}

          {activeTab === 'location' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Locatie</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Adres:</p>
                  <p className="text-muted-foreground">
                    {location.address_line1}
                    {location.address_line2 && `, ${location.address_line2}`}
                    <br />
                    {location.postal_code} {location.city}
                  </p>
                </div>

                {location.latitude && location.longitude && (
                  <div className="h-[400px] bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">
                      Map integration coming soon (lat: {location.latitude}, lng: {location.longitude})
                    </p>
                  </div>
                )}

                <Button variant="outline" asChild>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${location.address_line1}, ${location.city}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    Open in Google Maps
                  </a>
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Booking Sheet */}
      <BookingSheet
        open={bookingSheetOpen}
        onOpenChange={setBookingSheetOpen}
        locationId={location.id}
        locationName={location.name}
      />
    </>
  );
}

