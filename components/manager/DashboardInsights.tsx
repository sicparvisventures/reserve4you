'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Calendar,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Star,
  Activity,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { nl } from 'date-fns/locale';

interface DashboardInsightsProps {
  tenantId: string;
  locations: any[];
  bookings: any[];
}

export function DashboardInsights({ tenantId, locations, bookings }: DashboardInsightsProps) {
  const [insightsData, setInsightsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, [tenantId, bookings]);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      // Calculate insights from bookings data
      const today = new Date();
      const last7Days = subDays(today, 7);
      const last30Days = subDays(today, 30);
      
      // Recent bookings (last 7 days)
      const recentBookings = bookings.filter(b => 
        new Date(b.created_at) >= last7Days
      );

      // Last 30 days bookings
      const last30DaysBookings = bookings.filter(b => 
        new Date(b.created_at) >= last30Days
      );

      // Popular times analysis
      const timeSlotCounts: { [key: string]: number } = {};
      bookings.forEach(b => {
        if (b.booking_time) {
          const hour = parseInt(b.booking_time.split(':')[0]);
          const timeSlot = `${hour}:00`;
          timeSlotCounts[timeSlot] = (timeSlotCounts[timeSlot] || 0) + 1;
        }
      });

      // Location performance
      const locationStats: { [key: string]: any } = {};
      locations.forEach(loc => {
        const locBookings = bookings.filter(b => b.location_id === loc.id);
        const confirmed = locBookings.filter(b => b.status === 'confirmed').length;
        const total = locBookings.length;
        const totalGuests = locBookings.reduce((sum, b) => sum + (b.number_of_guests || 0), 0);
        
        locationStats[loc.id] = {
          name: loc.name,
          bookingsCount: total,
          confirmedCount: confirmed,
          confirmationRate: total > 0 ? Math.round((confirmed / total) * 100) : 0,
          totalGuests,
          avgPartySize: total > 0 ? Math.round(totalGuests / total) : 0,
        };
      });

      // Day of week analysis
      const dayOfWeekCounts: { [key: string]: number } = {};
      bookings.forEach(b => {
        if (b.booking_date) {
          const date = new Date(b.booking_date);
          const day = format(date, 'EEEE', { locale: nl });
          dayOfWeekCounts[day] = (dayOfWeekCounts[day] || 0) + 1;
        }
      });

      // Status breakdown
      const statusCounts = {
        confirmed: bookings.filter(b => b.status === 'confirmed').length,
        pending: bookings.filter(b => b.status === 'pending').length,
        cancelled: bookings.filter(b => b.status === 'cancelled').length,
        no_show: bookings.filter(b => b.status === 'no_show').length,
        completed: bookings.filter(b => b.status === 'completed').length,
      };

      // Growth metrics
      const thisWeekStart = startOfWeek(today, { locale: nl });
      const thisWeekEnd = endOfWeek(today, { locale: nl });
      const thisWeekBookings = bookings.filter(b => {
        const date = new Date(b.created_at);
        return date >= thisWeekStart && date <= thisWeekEnd;
      });

      const lastWeekStart = subDays(thisWeekStart, 7);
      const lastWeekEnd = subDays(thisWeekEnd, 7);
      const lastWeekBookings = bookings.filter(b => {
        const date = new Date(b.created_at);
        return date >= lastWeekStart && date <= lastWeekEnd;
      });

      const weeklyGrowth = lastWeekBookings.length > 0
        ? Math.round(((thisWeekBookings.length - lastWeekBookings.length) / lastWeekBookings.length) * 100)
        : 0;

      setInsightsData({
        recentBookingsCount: recentBookings.length,
        last30DaysCount: last30DaysBookings.length,
        popularTimes: Object.entries(timeSlotCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5),
        locationStats: Object.values(locationStats)
          .sort((a: any, b: any) => b.bookingsCount - a.bookingsCount),
        dayOfWeekStats: Object.entries(dayOfWeekCounts)
          .sort((a, b) => b[1] - a[1]),
        statusCounts,
        weeklyGrowth,
        thisWeekCount: thisWeekBookings.length,
        lastWeekCount: lastWeekBookings.length,
      });
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !insightsData) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-8 bg-muted rounded w-3/4"></div>
              <div className="h-20 bg-muted rounded"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Inzichten & Analyses</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Prestatie-overzicht van alle vestigingen
          </p>
        </div>
      </div>

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
            {insightsData.weeklyGrowth >= 0 ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-foreground">
              {insightsData.weeklyGrowth >= 0 ? '+' : ''}{insightsData.weeklyGrowth}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">Groei deze week</p>
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {insightsData.thisWeekCount} vs {insightsData.lastWeekCount} vorige week
            </p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-foreground">{insightsData.last30DaysCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Laatste 30 dagen</p>
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {Math.round(insightsData.last30DaysCount / 30)} gem. per dag
            </p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-foreground">
              {bookings.length > 0 
                ? Math.round((insightsData.statusCounts.confirmed / bookings.length) * 100)
                : 0}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">Bevestigingsratio</p>
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {insightsData.statusCounts.confirmed} van {bookings.length} totaal
            </p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </div>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-foreground">
              {insightsData.statusCounts.cancelled + insightsData.statusCounts.no_show}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Geannuleerd/No-show</p>
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {bookings.length > 0 
                ? Math.round(((insightsData.statusCounts.cancelled + insightsData.statusCounts.no_show) / bookings.length) * 100)
                : 0}% van totaal
            </p>
          </div>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Popular Times */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Populairste Tijden</h3>
              <p className="text-xs text-muted-foreground">Top 5 drukste uren</p>
            </div>
          </div>
          <div className="space-y-3">
            {insightsData.popularTimes.map(([time, count]: [string, number], index: number) => (
              <div key={time} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="w-8 text-center">
                    {index + 1}
                  </Badge>
                  <span className="text-sm font-medium">{time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full"
                      style={{ 
                        width: `${(count / insightsData.popularTimes[0][1]) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground w-8 text-right">
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Location Performance */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-green-500/10">
              <MapPin className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Vestigingen</h3>
              <p className="text-xs text-muted-foreground">Prestatie-overzicht</p>
            </div>
          </div>
          <div className="space-y-3">
            {insightsData.locationStats.slice(0, 5).map((loc: any) => (
              <div key={loc.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate flex-1 mr-2">{loc.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {loc.bookingsCount}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-success" />
                    <span>{loc.confirmationRate}%</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{loc.totalGuests} gasten</span>
                  </div>
                  <span>•</span>
                  <span>Ø {loc.avgPartySize} pers.</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Day of Week Analysis */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Drukste Dagen</h3>
              <p className="text-xs text-muted-foreground">Per dag van de week</p>
            </div>
          </div>
          <div className="space-y-3">
            {insightsData.dayOfWeekStats.slice(0, 7).map(([day, count]: [string, number], index: number) => (
              <div key={day} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="w-8 text-center">
                    {index + 1}
                  </Badge>
                  <span className="text-sm font-medium capitalize">{day}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-600 rounded-full"
                      style={{ 
                        width: `${(count / insightsData.dayOfWeekStats[0][1]) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground w-8 text-right">
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Status Distribution */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <PieChart className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Status Verdeling</h3>
            <p className="text-xs text-muted-foreground">Overzicht van alle reserveringen</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="text-center p-4 rounded-lg bg-success/5 border border-success/20">
            <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{insightsData.statusCounts.confirmed}</p>
            <p className="text-xs text-muted-foreground mt-1">Bevestigd</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-warning/5 border border-warning/20">
            <Clock className="h-8 w-8 text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{insightsData.statusCounts.pending}</p>
            <p className="text-xs text-muted-foreground mt-1">In afwachting</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <Star className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{insightsData.statusCounts.completed}</p>
            <p className="text-xs text-muted-foreground mt-1">Voltooid</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-destructive/5 border border-destructive/20">
            <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{insightsData.statusCounts.cancelled}</p>
            <p className="text-xs text-muted-foreground mt-1">Geannuleerd</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-orange-500/5 border border-orange-500/20">
            <AlertCircle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{insightsData.statusCounts.no_show}</p>
            <p className="text-xs text-muted-foreground mt-1">No-show</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

