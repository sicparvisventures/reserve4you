'use client';

/**
 * Calendar Widget - Reserve4You
 * 
 * Dashboard widget showing calendar stats for all locations
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp, Users, Clock, MapPin, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface CalendarStats {
  date: string;
  total_bookings: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  no_show: number;
  total_guests: number;
  locations: {
    id: string;
    name: string;
    bookings_count: number;
  }[];
  hourly_distribution: Record<string, number>;
}

interface CalendarWidgetProps {
  tenantId: string;
}

export function CalendarWidget({ tenantId }: CalendarWidgetProps) {
  const [stats, setStats] = useState<CalendarStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadStats();
  }, [tenantId, selectedDate]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('get_calendar_stats', {
        p_tenant_id: tenantId,
        p_date: format(selectedDate, 'yyyy-MM-dd')
      });

      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error loading calendar stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get busiest hour
  const busiestHour = stats?.hourly_distribution 
    ? Object.entries(stats.hourly_distribution).sort((a, b) => b[1] - a[1])[0]
    : null;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Calendar Overzicht</h3>
            <p className="text-sm text-muted-foreground">
              {format(selectedDate, 'd MMMM yyyy', { locale: nl })}
            </p>
          </div>
        </div>
        
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/manager/${tenantId}/calendar`}>
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
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{stats.total_bookings}</div>
              <div className="text-xs text-muted-foreground">Totaal</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-success/10">
              <div className="text-2xl font-bold text-success">{stats.confirmed}</div>
              <div className="text-xs text-muted-foreground">Bevestigd</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-warning/10">
              <div className="text-2xl font-bold text-warning">{stats.pending}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-primary/10">
              <div className="text-2xl font-bold text-primary">{stats.total_guests}</div>
              <div className="text-xs text-muted-foreground">Gasten</div>
            </div>
          </div>

          {/* Busiest Hour */}
          {busiestHour && (
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-gradient-to-r from-primary/5 to-transparent">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <div className="font-semibold">Drukste Tijd</div>
                <div className="text-sm text-muted-foreground">
                  {busiestHour[0]} met {busiestHour[1]} reserveringen
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
                  .sort((a, b) => b.bookings_count - a.bookings_count)
                  .slice(0, 5)
                  .map((location) => (
                    <div
                      key={location.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm font-medium">{location.name}</span>
                      <Badge variant="secondary">{location.bookings_count}</Badge>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="pt-4 border-t">
            <Button className="w-full gradient-bg" asChild>
              <Link href={`/manager/${tenantId}/location/${stats.locations?.[0]?.id}`}>
                <Calendar className="h-4 w-4 mr-2" />
                Open Calendar
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Geen data beschikbaar</p>
        </div>
      )}
    </Card>
  );
}

