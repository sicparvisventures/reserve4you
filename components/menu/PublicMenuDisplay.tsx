'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UtensilsCrossed, Clock, Flame, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  dietary_info: string[];
  allergens: string[];
  is_featured: boolean;
  prep_time_minutes: number | null;
  calories: number | null;
  spice_level: number | null;
}

interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  items: MenuItem[];
}

interface PublicMenuDisplayProps {
  menu: MenuCategory[];
  locationName: string;
}

const DIETARY_INFO_LABELS: Record<string, string> = {
  vegetarian: 'Vegetarisch',
  vegan: 'Veganistisch',
  'gluten-free': 'Glutenvrij',
  'dairy-free': 'Lactosevrij',
  halal: 'Halal',
  kosher: 'Koosjer',
};

const ALLERGEN_LABELS: Record<string, string> = {
  nuts: 'Noten',
  dairy: 'Zuivel',
  eggs: 'Eieren',
  fish: 'Vis',
  shellfish: 'Schaaldieren',
  soy: 'Soja',
  wheat: 'Tarwe',
  gluten: 'Gluten',
};

export function PublicMenuDisplay({ menu, locationName }: PublicMenuDisplayProps) {
  if (!menu || menu.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <UtensilsCrossed className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Menu wordt binnenkort toegevoegd
          </h3>
          <p className="text-sm text-muted-foreground">
            Ons team is bezig met het toevoegen van ons menu. Kom snel terug!
          </p>
        </div>
      </Card>
    );
  }

  // Get featured items across all categories
  const featuredItems = menu
    .flatMap(cat => cat.items)
    .filter(item => item.is_featured)
    .slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Featured Items Section */}
      {featuredItems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Star className="h-6 w-6 text-amber-500 fill-amber-500" />
            <h2 className="text-2xl font-bold text-foreground">Aanbevolen</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredItems.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Image */}
                <div className="relative h-48 bg-muted">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UtensilsCrossed className="h-16 w-16 text-muted-foreground opacity-20" />
                    </div>
                  )}
                  {item.spice_level && item.spice_level > 0 && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-background/80 backdrop-blur-sm border-0 gap-1">
                        {Array.from({ length: item.spice_level }).map((_, i) => (
                          <Flame key={i} className="h-3 w-3 text-red-500 fill-red-500" />
                        ))}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-foreground">{item.name}</h3>
                    <span className="font-bold text-primary whitespace-nowrap ml-2">
                      €{item.price.toFixed(2)}
                    </span>
                  </div>
                  
                  {item.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {item.prep_time_minutes && (
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {item.prep_time_minutes} min
                      </Badge>
                    )}
                    {item.calories && (
                      <Badge variant="outline">
                        {item.calories} kcal
                      </Badge>
                    )}
                  </div>

                  {/* Dietary Info */}
                  {item.dietary_info && item.dietary_info.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.dietary_info.map((info) => (
                        <Badge key={info} variant="secondary" className="text-xs">
                          {DIETARY_INFO_LABELS[info] || info}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      {menu.map((category) => {
        if (category.items.length === 0) return null;

        return (
          <div key={category.id}>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground">{category.name}</h2>
              {category.description && (
                <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
              )}
            </div>

            <div className="space-y-4">
              {category.items.map((item) => (
                <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex gap-4">
                    {/* Image */}
                    {item.image_url && (
                      <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{item.name}</h3>
                            {item.is_featured && (
                              <Star className="h-4 w-4 text-amber-500 fill-amber-500 flex-shrink-0" />
                            )}
                            {item.spice_level && item.spice_level > 0 && (
                              <div className="flex gap-0.5">
                                {Array.from({ length: item.spice_level }).map((_, i) => (
                                  <Flame key={i} className="h-3 w-3 text-red-500 fill-red-500" />
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {item.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {item.description}
                            </p>
                          )}

                          {/* Dietary & Allergens */}
                          <div className="flex flex-wrap gap-2">
                            {item.dietary_info && item.dietary_info.length > 0 && item.dietary_info.map((info) => (
                              <Badge key={info} variant="secondary" className="text-xs">
                                {DIETARY_INFO_LABELS[info] || info}
                              </Badge>
                            ))}
                            {item.allergens && item.allergens.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                Bevat: {item.allergens.map(a => ALLERGEN_LABELS[a] || a).join(', ')}
                              </Badge>
                            )}
                          </div>

                          {/* Meta Info */}
                          {(item.prep_time_minutes || item.calories) && (
                            <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                              {item.prep_time_minutes && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {item.prep_time_minutes} min
                                </span>
                              )}
                              {item.calories && (
                                <span>{item.calories} kcal</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Price */}
                        <span className="font-bold text-lg text-primary whitespace-nowrap">
                          €{item.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

