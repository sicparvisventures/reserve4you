'use client';

/**
 * Waitlist Widget - Reserve4You
 * 
 * Dashboard widget showing waitlist stats for all locations
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserPlus, TrendingUp, Clock, Check, ChevronRight, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface WaitlistStats {
  date: string;
  total_waiting: number;
  total_notified: number;
  total_converted: number;
  total_expired: number;
  total_cancelled: number;
  conversion_rate: number;
  avg_wait_time_minutes: number;
  locations: {
    id: string;
    name: string;
    waiting_count: number;
  }[];
}

interface WaitlistWidgetProps {
  tenantId: string;
}

export function WaitlistWidget({ tenantId }: WaitlistWidgetProps) {
  const [stats, setStats] = useState<WaitlistStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadStats();
  }, [tenantId, selectedDate]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('get_waitlist_stats', {
        p_tenant_id: tenantId,
        p_date: format(selectedDate, 'yyyy-MM-dd')
      });

      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error loading waitlist stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
            <UserPlus className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Wachtlijst Overzicht</h3>
            <p className="text-sm text-muted-foreground">
              {format(selectedDate, 'd MMMM yyyy', { locale: nl })}
            </p>
          </div>
        </div>
        
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/manager/${tenantId}/waitlist`}>
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
            <div className="text-center p-3 rounded-lg bg-warning/10">
              <div className="text-2xl font-bold text-warning">{stats.total_waiting}</div>
              <div className="text-xs text-muted-foreground">Wachtend</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-info/10">
              <div className="text-2xl font-bold text-info">{stats.total_notified}</div>
              <div className="text-xs text-muted-foreground">Genotificeerd</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-success/10">
              <div className="text-2xl font-bold text-success">{stats.total_converted}</div>
              <div className="text-xs text-muted-foreground">Geconverteerd</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-primary/10">
              <div className="text-2xl font-bold text-primary">{stats.conversion_rate}%</div>
              <div className="text-xs text-muted-foreground">Conversie</div>
            </div>
          </div>

          {/* Avg Wait Time */}
          {stats.avg_wait_time_minutes > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-gradient-to-r from-warning/5 to-transparent">
              <Clock className="h-5 w-5 text-warning" />
              <div className="flex-1">
                <div className="font-semibold">Gemiddelde Wachttijd</div>
                <div className="text-sm text-muted-foreground">
                  {Math.floor(stats.avg_wait_time_minutes / 60)}u {stats.avg_wait_time_minutes % 60}m
                </div>
              </div>
            </div>
          )}

          {/* Conversion Rate Indicator */}
          {stats.conversion_rate > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-gradient-to-r from-success/5 to-transparent">
              <TrendingUp className="h-5 w-5 text-success" />
              <div className="flex-1">
                <div className="font-semibold">Conversie Rate</div>
                <div className="text-sm text-muted-foreground">
                  {stats.conversion_rate}% van wachtlijst wordt boeking
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
                  .filter(loc => loc.waiting_count > 0)
                  .sort((a, b) => b.waiting_count - a.waiting_count)
                  .slice(0, 5)
                  .map((location) => (
                    <div
                      key={location.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm font-medium">{location.name}</span>
                      <Badge variant="outline" className="border-warning text-warning">
                        {location.waiting_count} wachtend
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Empty state for today */}
          {stats.total_waiting === 0 && stats.total_notified === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <Check className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Geen actieve wachtlijst vandaag</p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="pt-4 border-t">
            <Button className="w-full gradient-bg" asChild>
              <Link href={`/manager/${tenantId}/waitlist`}>
                <UserPlus className="h-4 w-4 mr-2" />
                Bekijk Alle Wachtlijsten
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Geen data beschikbaar</p>
        </div>
      )}
    </Card>
  );
}

