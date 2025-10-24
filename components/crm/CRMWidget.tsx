'use client';

/**
 * CRM Widget - Reserve4You
 * 
 * Dashboard widget showing CRM stats for all locations
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Star, 
  TrendingUp, 
  UserPlus,
  Cake,
  Heart,
  ChevronRight,
  MapPin,
  Gift
} from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface CRMStats {
  date: string;
  total_guests: number;
  vip_guests: number;
  new_guests: number;
  returning_guests: number;
  upcoming_birthdays: number;
  upcoming_anniversaries: number;
  locations: {
    id: string;
    name: string;
    total_guests: number;
    vip_guests: number;
  }[];
}

interface CRMWidgetProps {
  tenantId: string;
}

export function CRMWidget({ tenantId }: CRMWidgetProps) {
  const [stats, setStats] = useState<CRMStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadStats();
  }, [tenantId, selectedDate]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('get_tenant_crm_stats', {
        p_tenant_id: tenantId,
        p_date: format(selectedDate, 'yyyy-MM-dd')
      });

      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error loading CRM stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-info" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">CRM Overzicht</h3>
            <p className="text-sm text-muted-foreground">
              {format(selectedDate, 'd MMMM yyyy', { locale: nl })}
            </p>
          </div>
        </div>
        
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/manager/${tenantId}/crm`}>
            Alle Locaties
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-20 bg-muted animate-pulse rounded-lg" />
          <div className="h-20 bg-muted animate-pulse rounded-lg" />
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-info/10">
              <div className="text-2xl font-bold text-info">{stats.total_guests}</div>
              <div className="text-xs text-muted-foreground">Totaal</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-warning/10">
              <div className="text-2xl font-bold text-warning">{stats.vip_guests}</div>
              <div className="text-xs text-muted-foreground">VIP</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-success/10">
              <div className="text-2xl font-bold text-success">{stats.new_guests}</div>
              <div className="text-xs text-muted-foreground">Nieuw</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-primary/10">
              <div className="text-2xl font-bold text-primary">{stats.returning_guests}</div>
              <div className="text-xs text-muted-foreground">Terugkerend</div>
            </div>
          </div>

          {/* Special Occasions */}
          {(stats.upcoming_birthdays > 0 || stats.upcoming_anniversaries > 0) && (
            <div className="space-y-2">
              {stats.upcoming_birthdays > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-gradient-to-r from-pink-500/5 to-transparent">
                  <div className="h-8 w-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
                    <Cake className="h-4 w-4 text-pink-500" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">Aankomende Verjaardagen</div>
                    <div className="text-xs text-muted-foreground">
                      {stats.upcoming_birthdays} in de komende 30 dagen
                    </div>
                  </div>
                  <Badge className="bg-pink-500/20 text-pink-500 border-pink-500">
                    {stats.upcoming_birthdays}
                  </Badge>
                </div>
              )}

              {stats.upcoming_anniversaries > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-gradient-to-r from-purple-500/5 to-transparent">
                  <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Heart className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">Aankomende Jubilea</div>
                    <div className="text-xs text-muted-foreground">
                      {stats.upcoming_anniversaries} in de komende 30 dagen
                    </div>
                  </div>
                  <Badge className="bg-purple-500/20 text-purple-500 border-purple-500">
                    {stats.upcoming_anniversaries}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Growth Indicator */}
          {stats.new_guests > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-gradient-to-r from-success/5 to-transparent">
              <TrendingUp className="h-5 w-5 text-success" />
              <div className="flex-1">
                <div className="font-semibold">Groei Deze Maand</div>
                <div className="text-sm text-muted-foreground">
                  {stats.new_guests} nieuwe gasten toegevoegd
                </div>
              </div>
            </div>
          )}

          {/* Locations Breakdown */}
          {stats.locations && stats.locations.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Per Locatie
              </h4>
              <div className="space-y-2">
                {stats.locations
                  .sort((a, b) => b.total_guests - a.total_guests)
                  .slice(0, 5)
                  .map((location) => (
                    <div
                      key={location.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm font-medium">{location.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{location.total_guests} gasten</Badge>
                        {location.vip_guests > 0 && (
                          <Badge variant="outline" className="border-warning text-warning">
                            <Star className="h-3 w-3 mr-1" />
                            {location.vip_guests}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="pt-4 border-t">
            <Button className="w-full gradient-bg" asChild>
              <Link href={`/manager/${tenantId}/crm`}>
                <Users className="h-4 w-4 mr-2" />
                Bekijk Alle Gasten
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Geen data beschikbaar</p>
        </div>
      )}
    </Card>
  );
}

