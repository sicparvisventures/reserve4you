'use client';

/**
 * Timeline View - Reserve4You
 * 
 * Resengo-style horizontal timeline showing all tables
 * with their bookings displayed as blocks
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Users, Clock } from 'lucide-react';
import { format, addHours, set } from 'date-fns';
import { nl } from 'date-fns/locale';
import { createClient } from '@/lib/supabase/client';
import { BookingDetailModal } from '@/components/manager/BookingDetailModal';

interface TimelineBooking {
  id: string;
  customer_name: string;
  number_of_guests: number;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: string;
  color: string;
}

interface TableOccupancy {
  table_id: string;
  table_number: string;
  seats: number;
  table_type: string;
  bookings: TimelineBooking[];
}

interface TimelineViewProps {
  locationId: string;
  date: Date;
}

export function TimelineView({ locationId, date }: TimelineViewProps) {
  const [tables, setTables] = useState<TableOccupancy[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(60); // pixels per hour
  const timelineRef = useRef<HTMLDivElement>(null);

  // Time range (9 AM to 11 PM)
  const START_HOUR = 9;
  const END_HOUR = 23;
  const HOURS = END_HOUR - START_HOUR;

  const loadOccupancy = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('get_table_occupancy', {
        p_location_id: locationId,
        p_date: format(date, 'yyyy-MM-dd')
      });

      if (error) throw error;
      setTables(data || []);
    } catch (error) {
      console.error('Error loading occupancy:', error);
    } finally {
      setIsLoading(false);
    }
  }, [locationId, date]);

  useEffect(() => {
    loadOccupancy();
  }, [loadOccupancy]);

  // Convert time string to position
  const timeToPosition = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const totalMinutes = (hours - START_HOUR) * 60 + minutes;
    return (totalMinutes / 60) * zoom;
  };

  // Get duration width
  const getDurationWidth = (durationMinutes: number) => {
    return (durationMinutes / 60) * zoom;
  };

  // Handle booking click
  const handleBookingClick = (booking: any) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  // Zoom controls
  const zoomIn = () => setZoom(prev => Math.min(prev + 20, 200));
  const zoomOut = () => setZoom(prev => Math.max(prev - 20, 40));

  // Current time indicator position
  const currentTimePosition = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    if (hours < START_HOUR || hours >= END_HOUR) return null;
    
    const totalMinutes = (hours - START_HOUR) * 60 + minutes;
    return (totalMinutes / 60) * zoom;
  };

  const currentTime = currentTimePosition();

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Timeline Overzicht</h3>
            <p className="text-sm text-muted-foreground">
              {format(date, 'EEEE d MMMM yyyy', { locale: nl })}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={zoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">{zoom}px/u</span>
            <Button variant="outline" size="sm" onClick={zoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Timeline */}
      <Card className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Laden...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto" ref={timelineRef}>
            <div style={{ minWidth: `${HOURS * zoom + 200}px` }}>
              {/* Time header */}
              <div className="flex border-b sticky top-0 bg-background z-10">
                <div className="w-48 flex-shrink-0 p-4 font-semibold border-r">
                  Tafel
                </div>
                <div className="flex-1 relative">
                  {Array.from({ length: HOURS }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute border-l border-border"
                      style={{
                        left: `${i * zoom}px`,
                        height: '100%',
                        width: `${zoom}px`
                      }}
                    >
                      <div className="p-2 text-sm font-medium">
                        {START_HOUR + i}:00
                      </div>
                    </div>
                  ))}
                  
                  {/* Current time indicator */}
                  {currentTime !== null && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-primary z-20"
                      style={{ left: `${currentTime}px` }}
                    >
                      <div className="absolute -top-1 -left-2 w-4 h-4 rounded-full bg-primary" />
                    </div>
                  )}
                </div>
              </div>

              {/* Tables with bookings */}
              {tables.map((table) => (
                <div key={table.table_id} className="flex border-b hover:bg-muted/50 transition-colors">
                  {/* Table info */}
                  <div className="w-48 flex-shrink-0 p-4 border-r">
                    <div className="font-semibold">Tafel {table.table_number}</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{table.seats} plaatsen</span>
                    </div>
                    {table.table_type && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {table.table_type}
                      </Badge>
                    )}
                  </div>

                  {/* Timeline area */}
                  <div className="flex-1 relative" style={{ height: '80px' }}>
                    {/* Hour grid lines */}
                    {Array.from({ length: HOURS }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute border-l border-border"
                        style={{
                          left: `${i * zoom}px`,
                          height: '100%'
                        }}
                      />
                    ))}

                    {/* Bookings */}
                    {table.bookings?.map((booking) => {
                      const left = timeToPosition(booking.start_time);
                      const width = getDurationWidth(booking.duration_minutes);
                      
                      return (
                        <div
                          key={booking.id}
                          className="absolute top-2 rounded-lg cursor-pointer transition-all hover:scale-105 hover:shadow-lg border-2"
                          style={{
                            left: `${left}px`,
                            width: `${width}px`,
                            height: '60px',
                            backgroundColor: booking.color + '33',
                            borderColor: booking.color,
                          }}
                          onClick={() => handleBookingClick(booking)}
                        >
                          <div className="p-2 h-full flex flex-col justify-between">
                            <div>
                              <div className="font-semibold text-sm truncate">
                                {booking.customer_name}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Users className="h-3 w-3" />
                                <span>{booking.number_of_guests}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <Clock className="h-3 w-3" />
                              <span>
                                {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Empty state */}
              {tables.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Geen tafels gevonden voor deze locatie</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Legend */}
      <Card className="p-4">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#18C96433', border: '2px solid #18C964' }} />
            <span className="text-sm">Bevestigd</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FFB02033', border: '2px solid #FFB020' }} />
            <span className="text-sm">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#71717A33', border: '2px solid #71717A' }} />
            <span className="text-sm">Geannuleerd</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#E11D4833', border: '2px solid #E11D48' }} />
            <span className="text-sm">No-show</span>
          </div>
        </div>
      </Card>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <BookingDetailModal
          open={showDetailModal}
          onOpenChange={setShowDetailModal}
          booking={selectedBooking}
          onStatusUpdate={async () => {
            await loadOccupancy();
          }}
        />
      )}
    </div>
  );
}

