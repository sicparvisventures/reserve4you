'use client';

/**
 * Advanced Calendar View - Reserve4You
 * 
 * Professional calendar systeem met drag & drop, multiple views,
 * conflict detection en real-time updates
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, Views, Event as RBCEvent } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addHours } from 'date-fns';
import { nl } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, Users, MapPin, Plus, ChevronLeft, ChevronRight, Grid3x3, List, BarChart3 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { BookingDetailModal } from '@/components/manager/BookingDetailModal';

// Configure date-fns localizer for Dutch
const locales = {
  'nl': nl,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarBooking extends RBCEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  booking_date: string;
  booking_time: string;
  duration_minutes: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  number_of_guests: number;
  status: string;
  table_id?: string;
  table_info?: {
    id: string;
    table_number: string;
    seats: number;
    table_type: string;
  };
  special_requests?: string;
  internal_note?: string;
  color: string;
}

interface CalendarViewProps {
  locationId: string;
  tenantId: string;
}

type ViewType = 'month' | 'week' | 'day' | 'agenda';

export function CalendarView({ locationId, tenantId }: CalendarViewProps) {
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [view, setView] = useState<ViewType>('week');
  const [date, setDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Load bookings for current date range
  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      
      // Calculate date range based on view
      const startDate = new Date(date);
      const endDate = new Date(date);
      
      if (view === 'month') {
        startDate.setDate(1);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
      } else if (view === 'week') {
        const day = startDate.getDay();
        startDate.setDate(startDate.getDate() - day + 1); // Monday
        endDate.setDate(endDate.getDate() + (7 - day));
      } else {
        // day view - same day
      }
      
      const { data, error } = await supabase.rpc('get_calendar_bookings', {
        p_location_id: locationId,
        p_start_date: startDate.toISOString().split('T')[0],
        p_end_date: endDate.toISOString().split('T')[0]
      });
      
      if (error) throw error;
      
      // Transform data to calendar events
      const events: CalendarBooking[] = (data || []).map((booking: any) => ({
        ...booking,
        start: new Date(booking.start),
        end: new Date(booking.end),
      }));
      
      setBookings(events);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [locationId, date, view]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Handle event selection
  const handleSelectEvent = useCallback((event: CalendarBooking) => {
    setSelectedBooking(event);
    setShowDetailModal(true);
  }, []);

  // Handle drag & drop
  const handleEventDrop = useCallback(async ({ event, start, end }: any) => {
    const booking = event as CalendarBooking;
    const newDate = format(start, 'yyyy-MM-dd');
    const newTime = format(start, 'HH:mm:ss');
    
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase.rpc('update_booking_time', {
        p_booking_id: booking.id,
        p_new_date: newDate,
        p_new_time: newTime,
        p_user_id: user.id
      });
      
      if (error) throw error;
      
      if (data.success) {
        // Update local state
        setBookings(prev => prev.map(b => 
          b.id === booking.id 
            ? { ...b, start, end, booking_date: newDate, booking_time: newTime }
            : b
        ));
      } else {
        alert(data.error || 'Failed to update booking');
        // Reload bookings to revert
        loadBookings();
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Fout bij het verplaatsen van de reservering');
      loadBookings();
    }
  }, [loadBookings]);

  // Handle slot selection (create new booking)
  const handleSelectSlot = useCallback(({ start, end }: { start: Date, end: Date }) => {
    // TODO: Open create booking modal
    console.log('Selected slot:', start, end);
  }, []);

  // Custom event styling
  const eventStyleGetter = useCallback((event: CalendarBooking) => {
    return {
      style: {
        backgroundColor: event.color + '33', // 20% opacity
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

  // Custom event component
  const EventComponent = ({ event }: { event: CalendarBooking }) => (
    <div className="flex flex-col">
      <div className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        <span className="font-semibold">{event.customer_name}</span>
      </div>
      <div className="flex items-center gap-2 text-xs opacity-80">
        <Users className="h-3 w-3" />
        <span>{event.number_of_guests} pers</span>
        {event.table_info && (
          <>
            <MapPin className="h-3 w-3" />
            <span>Tafel {event.table_info.table_number}</span>
          </>
        )}
      </div>
    </div>
  );

  // Navigation handlers
  const handleNavigate = useCallback((newDate: Date) => {
    setDate(newDate);
  }, []);

  const goToToday = () => {
    setDate(new Date());
  };

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

  // Stats for current view
  const stats = useMemo(() => {
    const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    const pending = bookings.filter(b => b.status === 'pending').length;
    const totalGuests = bookings.reduce((sum, b) => sum + b.number_of_guests, 0);
    
    return { confirmed, pending, totalGuests, total: bookings.length };
  }, [bookings]);

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Left: Date navigation */}
          <div className="flex items-center gap-2">
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

          {/* Right: View switcher */}
          <div className="flex items-center gap-2">
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
              events={bookings}
              startAccessor="start"
              endAccessor="end"
              view={view}
              onView={(newView) => setView(newView as ViewType)}
              date={date}
              onNavigate={handleNavigate}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              onEventDrop={handleEventDrop}
              selectable
              resizable
              draggableAccessor={() => true}
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

      {/* Calendar Styles */}
      <style jsx global>{`
        .calendar-container .rbc-calendar {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        
        .calendar-container .rbc-header {
          padding: 12px 4px;
          font-weight: 600;
          font-size: 14px;
          background: hsl(var(--muted));
          border-bottom: 1px solid hsl(var(--border));
        }
        
        .calendar-container .rbc-today {
          background-color: hsl(var(--primary) / 0.05);
        }
        
        .calendar-container .rbc-event {
          padding: 4px 8px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .calendar-container .rbc-event:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .calendar-container .rbc-time-slot {
          min-height: 40px;
        }
        
        .calendar-container .rbc-time-content {
          border-top: 1px solid hsl(var(--border));
        }
        
        .calendar-container .rbc-current-time-indicator {
          background-color: hsl(var(--primary));
          height: 2px;
        }
        
        .calendar-container .rbc-toolbar {
          display: none; /* We use custom toolbar */
        }
      `}</style>
    </div>
  );
}

