'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Tag,
  Calendar,
  Clock,
  Percent,
  DollarSign,
  Sparkles,
  Users,
  Info,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Promotion {
  id: string;
  title: string;
  description: string;
  terms_conditions: string | null;
  discount_type: 'percentage' | 'fixed_amount' | 'special_offer' | 'buy_one_get_one' | 'happy_hour';
  discount_value: number | null;
  valid_from: string;
  valid_until: string | null;
  valid_days: string[];
  valid_hours: { start: string; end: string } | null;
  image_url: string | null;
  min_party_size: number | null;
  max_party_size: number | null;
  is_featured: boolean;
}

interface PromotionsDisplayProps {
  promotions: Promotion[];
  locationName: string;
}

const DISCOUNT_TYPE_CONFIG = {
  percentage: {
    icon: Percent,
    label: 'Percentage Korting',
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
  },
  fixed_amount: {
    icon: DollarSign,
    label: 'Vast Bedrag Korting',
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
  },
  special_offer: {
    icon: Sparkles,
    label: 'Speciale Aanbieding',
    color: 'from-primary to-primary/80',
    bgColor: 'bg-primary/5',
  },
  buy_one_get_one: {
    icon: Tag,
    label: 'Koop 1 Krijg 1',
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
  },
  happy_hour: {
    icon: Clock,
    label: 'Happy Hour',
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/20',
  },
};

const DAY_NAMES: Record<string, string> = {
  monday: 'Ma',
  tuesday: 'Di',
  wednesday: 'Wo',
  thursday: 'Do',
  friday: 'Vr',
  saturday: 'Za',
  sunday: 'Zo',
};

export function PromotionsDisplay({ promotions, locationName }: PromotionsDisplayProps) {
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);

  if (promotions.length === 0) {
    return null;
  }

  const featuredPromotions = promotions.filter(p => p.is_featured);
  const regularPromotions = promotions.filter(p => !p.is_featured);

  return (
    <div className="space-y-6">
      {/* Featured Promotions - Large Cards */}
      {featuredPromotions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Tag className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">
              Speciale Aanbiedingen
            </h2>
          </div>
          
          <div className="grid gap-4">
            {featuredPromotions.map((promotion) => {
              const config = DISCOUNT_TYPE_CONFIG[promotion.discount_type];
              const Icon = config.icon;
              const isExpiringSoon = promotion.valid_until && 
                new Date(promotion.valid_until) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
              
              return (
                <Card 
                  key={promotion.id} 
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
                  onClick={() => setSelectedPromotion(promotion)}
                >
                  <div className="md:flex">
                    {/* Image */}
                    <div className="md:w-1/3 relative">
                      {promotion.image_url ? (
                        <img
                          src={promotion.image_url}
                          alt={promotion.title}
                          className="w-full h-full object-cover min-h-[200px]"
                        />
                      ) : (
                        <div className={`w-full h-full min-h-[200px] ${config.bgColor} border-r flex items-center justify-center`}>
                          <div className="text-center p-6">
                            <Icon className={`h-16 w-16 mx-auto mb-2 text-gradient-to-br ${config.color} opacity-30`} />
                            <p className="text-sm text-muted-foreground font-medium">Geen afbeelding</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Featured Badge */}
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-primary text-primary-foreground border-0 shadow-lg">
                          Uitgelicht
                        </Badge>
                      </div>

                      {/* Expiring Soon Badge */}
                      {isExpiringSoon && (
                        <div className="absolute top-3 left-3">
                          <Badge variant="destructive" className="gap-1">
                            <Clock className="h-3 w-3" />
                            Eindigt Binnenkort
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="md:w-2/3 p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                            {promotion.title}
                          </h3>
                          
                          <div className="flex items-center gap-3 mb-3">
                            <Badge variant="secondary" className="gap-1">
                              <Icon className="h-3 w-3" />
                              {config.label}
                            </Badge>
                            
                            {promotion.discount_value && (
                              <div className="px-4 py-1.5 rounded-lg bg-emerald-500 text-white font-bold text-base shadow-md">
                                {promotion.discount_type === 'percentage' 
                                  ? `${promotion.discount_value}% korting`
                                  : `€${promotion.discount_value} korting`
                                }
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <p className="text-foreground mb-4 text-lg">
                        {promotion.description}
                      </p>

                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {promotion.valid_until 
                            ? `Geldig t/m ${format(new Date(promotion.valid_until), 'dd MMMM yyyy', { locale: nl })}`
                            : 'Altijd geldig'
                          }
                        </div>
                        
                        {promotion.valid_hours && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {promotion.valid_hours.start} - {promotion.valid_hours.end}
                          </div>
                        )}

                        {(promotion.min_party_size || promotion.max_party_size) && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {promotion.min_party_size && promotion.max_party_size
                              ? `${promotion.min_party_size}-${promotion.max_party_size} personen`
                              : promotion.min_party_size
                                ? `Min. ${promotion.min_party_size} personen`
                                : `Max. ${promotion.max_party_size} personen`
                            }
                          </div>
                        )}
                      </div>

                      {/* Valid Days */}
                      {promotion.valid_days && promotion.valid_days.length < 7 && (
                        <div className="flex gap-1 mb-4">
                          {promotion.valid_days.map((day) => (
                            <Badge key={day} variant="outline" className="text-xs">
                              {DAY_NAMES[day]}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <Button 
                        variant="outline" 
                        className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPromotion(promotion);
                        }}
                      >
                        <Info className="mr-2 h-4 w-4" />
                        Meer Info & Voorwaarden
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Regular Promotions - Compact Cards */}
      {regularPromotions.length > 0 && (
        <div>
          {featuredPromotions.length > 0 && (
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              Meer Aanbiedingen
            </h3>
          )}
          
          <div className="grid md:grid-cols-2 gap-4">
            {regularPromotions.map((promotion) => {
              const config = DISCOUNT_TYPE_CONFIG[promotion.discount_type];
              const Icon = config.icon;
              
              return (
                <Card 
                  key={promotion.id} 
                  className="p-4 cursor-pointer hover:shadow-lg transition-all hover:border-primary group"
                  onClick={() => setSelectedPromotion(promotion)}
                >
                  <div className="flex gap-4">
                    {/* Icon/Image */}
                    <div className={`w-20 h-20 rounded-lg ${config.bgColor} border flex items-center justify-center flex-shrink-0`}>
                      <Icon className="h-10 w-10 text-primary opacity-60" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors truncate">
                        {promotion.title}
                      </h4>
                      
                      {promotion.discount_value && (
                        <div className="inline-block px-2.5 py-1 rounded-md bg-emerald-500 text-white text-sm font-bold mb-2">
                          {promotion.discount_type === 'percentage' 
                            ? `${promotion.discount_value}%`
                            : `€${promotion.discount_value}`
                          }
                        </div>
                      )}
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {promotion.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={!!selectedPromotion} onOpenChange={() => setSelectedPromotion(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedPromotion && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl pr-8">
                  {selectedPromotion.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Image */}
                {selectedPromotion.image_url && (
                  <img
                    src={selectedPromotion.image_url}
                    alt={selectedPromotion.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                )}

                {/* Discount Badge */}
                {selectedPromotion.discount_value && (
                  <div className="flex justify-center">
                    <div className="px-6 py-3 rounded-xl bg-emerald-500 text-white font-bold text-2xl shadow-lg">
                      {selectedPromotion.discount_type === 'percentage' 
                        ? `${selectedPromotion.discount_value}% korting`
                        : `€${selectedPromotion.discount_value} korting`
                      }
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Beschrijving</h3>
                  <p className="text-foreground whitespace-pre-wrap">
                    {selectedPromotion.description}
                  </p>
                </div>

                {/* Details Grid */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm font-medium">Geldigheid</span>
                    </div>
                    <p className="text-sm text-foreground">
                      {format(new Date(selectedPromotion.valid_from), 'dd MMM yyyy', { locale: nl })}
                      {selectedPromotion.valid_until && (
                        <> t/m {format(new Date(selectedPromotion.valid_until), 'dd MMM yyyy', { locale: nl })}</>
                      )}
                    </p>
                  </div>

                  {selectedPromotion.valid_hours && (
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">Tijden</span>
                      </div>
                      <p className="text-sm text-foreground">
                        {selectedPromotion.valid_hours.start} - {selectedPromotion.valid_hours.end}
                      </p>
                    </div>
                  )}

                  {selectedPromotion.valid_days && selectedPromotion.valid_days.length < 7 && (
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm font-medium">Geldige Dagen</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {selectedPromotion.valid_days.map((day) => (
                          <Badge key={day} variant="secondary" className="text-xs">
                            {DAY_NAMES[day]}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {(selectedPromotion.min_party_size || selectedPromotion.max_party_size) && (
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Users className="h-4 w-4" />
                        <span className="text-sm font-medium">Groepsgrootte</span>
                      </div>
                      <p className="text-sm text-foreground">
                        {selectedPromotion.min_party_size && selectedPromotion.max_party_size
                          ? `${selectedPromotion.min_party_size}-${selectedPromotion.max_party_size} personen`
                          : selectedPromotion.min_party_size
                            ? `Minimaal ${selectedPromotion.min_party_size} personen`
                            : `Maximaal ${selectedPromotion.max_party_size} personen`
                        }
                      </p>
                    </div>
                  )}
                </div>

                {/* Terms & Conditions */}
                {selectedPromotion.terms_conditions && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
                    <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Voorwaarden
                    </h3>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {selectedPromotion.terms_conditions}
                    </p>
                  </div>
                )}

                {/* Call to Action */}
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Reserveer nu bij {locationName} om te profiteren van deze aanbieding!
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

