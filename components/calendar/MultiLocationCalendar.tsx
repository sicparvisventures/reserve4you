'use client';

/**
 * Multi-Location Calendar - Reserve4You
 * 
 * Combined calendar view showing all locations in one overview
 */

import { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views, Event as RBCEvent } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { nl } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Clock, Users, MapPin, ChevronLeft, ChevronRight, Grid3x3, List, Building2, Filter } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { BookingDetailModal } from '@/components/manager/BookingDetailModal';

const locales = { 'nl': nl };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface Location {
  id: string;
  name: string;
  address?: string;
}

interface CalendarBooking extends RBCEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  location_id: string;
  location_name: string;
  booking_date: string;
  booking_time: string;
  duration_minutes: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  number_of_guests: number;
  status: string;
  table_id?: string;
  table_info?: any;
  special_requests?: string;
  color: string;
}

interface MultiLocationCalendarProps {
  tenantId: string;
  locations: Location[];
}

type ViewType = 'month' | 'week' | 'day' | 'agenda';

export function MultiLocationCalendar({ tenantId, locations }: MultiLocationCalendarProps) {
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<CalendarBooking[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all');
  const [view, setView] = useState<ViewType>('week');
  const [date, setDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Load bookings for all locations
  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      
      // Calculate date range
      const startDate = new Date(date);
      const endDate = new Date(date);
      
      if (view === 'month') {
        startDate.setDate(1);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
      } else if (view === 'week') {
        const day = startDate.getDay();
        startDate.setDate(startDate.getDate() - day + 1);
        endDate.setDate(endDate.getDate() + (7 - day));
      }
      
      // Load bookings for all locations
      const allBookings: CalendarBooking[] = [];
      
      for (const location of locations) {
        const { data, error } = await supabase.rpc('get_calendar_bookings', {
          p_location_id: location.id,
          p_start_date: startDate.toISOString().split('T')[0],
          p_end_date: endDate.toISOString().split('T')[0]
        });
        
        if (error) {
          console.error(`Error loading bookings for ${location.name}:`, error);
          continue;
        }
        
        const locationBookings: CalendarBooking[] = (data || []).map((booking: any) => ({
          ...booking,
          start: new Date(booking.start),
          end: new Date(booking.end),
          location_id: location.id,
          location_name: location.name,
          title: `${location.name}: ${booking.customer_name} (${booking.number_of_guests})`,
        }));
        
        allBookings.push(...locationBookings);
      }
      
      setBookings(allBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [locations, date, view]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Filter bookings by location
  useEffect(() => {
    if (selectedLocationId === 'all') {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter(b => b.location_id === selectedLocationId));
    }
  }, [bookings, selectedLocationId]);

  // Event handlers
  const handleSelectEvent = useCallback((event: CalendarBooking) => {
    setSelectedBooking(event);
    setShowDetailModal(true);
  }, []);

  const handleSelectSlot = useCallback(({ start, end }: { start: Date, end: Date }) => {
    console.log('Selected slot:', start, end);
  }, []);

  const eventStyleGetter = useCallback((event: CalendarBooking) => {
    return {
      style: {
        backgroundColor: event.color + '33',
        borderLeft: `4px solid ${event.color}`,
        color: '#111111',
        border: 'none',
        borderRadius: '8px',
        padding: '4px 8px',
        fontSize: '14px',
        fontWeight: 600,
      }
    };
  }, []);

  const EventComponent = ({ event }: { event: CalendarBooking }) => (
    <div className="flex flex-col">
      <div className="flex items-center gap-1">
        <Building2 className="h-3 w-3" />
        <span className="font-semibold truncate">{event.location_name}</span>
      </div>
      <div className="flex items-center gap-1 text-xs">
        <span className="truncate">{event.customer_name}</span>
        <Users className="h-3 w-3" />
        <span>{event.number_of_guests}</span>
      </div>
    </div>
  );

  const handleNavigate = useCallback((newDate: Date) => {
    setDate(newDate);
  }, []);

  const goToToday = () => setDate(new Date());
  
  const goToPrevious = () => {
    const newDate = new Date(date);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(date);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setDate(newDate);
  };

  // Stats
  const stats = {
    total: filteredBookings.length,
    confirmed: filteredBookings.filter(b => b.status === 'confirmed').length,
    pending: filteredBookings.filter(b => b.status === 'pending').length,
    totalGuests: filteredBookings.reduce((sum, b) => sum + b.number_of_guests, 0),
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Left: Date navigation */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={goToPrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Vandaag
            </Button>
            <Button variant="outline" size="sm" onClick={goToNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="ml-4">
              <h2 className="text-xl font-bold">
                {format(date, view === 'day' ? 'EEEE d MMMM yyyy' : 'MMMM yyyy', { locale: nl })}
              </h2>
            </div>
          </div>

          {/* Right: Filters and views */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Location filter */}
            <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Locaties</SelectItem>
                {locations.map(location => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View switcher */}
            <Button
              variant={view === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('day')}
            >
              <List className="h-4 w-4 mr-2" />
              Dag
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('week')}
            >
              <Grid3x3 className="h-4 w-4 mr-2" />
              Week
            </Button>
            <Button
              variant={view === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('month')}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Maand
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
          <div>
            <p className="text-sm text-muted-foreground">Totaal</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Bevestigd</p>
            <p className="text-2xl font-bold text-success">{stats.confirmed}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-warning">{stats.pending}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Gasten</p>
            <p className="text-2xl font-bold">{stats.totalGuests}</p>
          </div>
        </div>

        {/* Location chips */}
        {selectedLocationId === 'all' && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
            {locations.map(location => {
              const locationBookingCount = bookings.filter(b => b.location_id === location.id).length;
              return (
                <Badge
                  key={location.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => setSelectedLocationId(location.id)}
                >
                  <Building2 className="h-3 w-3 mr-1" />
                  {location.name} ({locationBookingCount})
                </Badge>
              );
            })}
          </div>
        )}
      </Card>

      {/* Calendar */}
      <Card className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-[600px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Laden...</p>
            </div>
          </div>
        ) : (
          <div className="calendar-container" style={{ height: '600px' }}>
            <Calendar
              localizer={localizer}
              events={filteredBookings}
              startAccessor="start"
              endAccessor="end"
              view={view}
              onView={(newView) => setView(newView as ViewType)}
              date={date}
              onNavigate={handleNavigate}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              eventPropGetter={eventStyleGetter}
              components={{
                event: EventComponent
              }}
              messages={{
                today: 'Vandaag',
                previous: 'Vorige',
                next: 'Volgende',
                month: 'Maand',
                week: 'Week',
                day: 'Dag',
                agenda: 'Agenda',
                date: 'Datum',
                time: 'Tijd',
                event: 'Reservering',
                noEventsInRange: 'Geen reserveringen in deze periode',
                showMore: (count) => `+ ${count} meer`,
              }}
              step={15}
              timeslots={4}
              min={new Date(2025, 0, 1, 9, 0)}
              max={new Date(2025, 0, 1, 23, 0)}
              culture="nl"
            />
          </div>
        )}
      </Card>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <BookingDetailModal
          open={showDetailModal}
          onOpenChange={setShowDetailModal}
          bookingId={selectedBooking.id}
          onUpdate={loadBookings}
        />
      )}
    </div>
  );
}

