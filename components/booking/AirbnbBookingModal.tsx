'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  User,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useTerminology } from '@/lib/hooks/useTerminology';

interface AirbnbBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: {
    id: string;
    name: string;
    address_line1?: string;
    city?: string;
  };
}

type BookingStep = 'guests' | 'date' | 'time' | 'details' | 'loading' | 'success' | 'error';

const GUEST_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export function AirbnbBookingModal({ open, onOpenChange, location }: AirbnbBookingModalProps) {
  // 🔥 Get dynamic terminology
  const t = useTerminology();
  
  const [step, setStep] = useState<BookingStep>('guests');
  const [error, setError] = useState<string>('');
  
  // Booking data
  const [guests, setGuests] = useState(2);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());

  // Time slots state
  const [availableTimeSlots, setAvailableTimeSlots] = useState<Array<{time: string, available: boolean}>>([]);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep('guests');
        setError('');
        setGuests(2);
        setSelectedDate(null);
        setSelectedTime('');
        setName('');
        setEmail('');
        setPhone('');
        setSpecialRequests('');
      }, 300);
    }
  }, [open]);

  // Load available time slots when date is selected
  useEffect(() => {
    if (selectedDate && step === 'time') {
      loadTimeSlots();
    }
  }, [selectedDate, guests, step]);

  const loadTimeSlots = async () => {
    if (!selectedDate) return;
    
    setLoadingTimeSlots(true);
    try {
      const supabase = createClient();
      const dateStr = selectedDate.toISOString().split('T')[0];

      // Get existing bookings for this date
      const { data: bookings } = await supabase
        .from('bookings')
        .select('booking_time, table_id, number_of_guests, duration_minutes')
        .eq('location_id', location.id)
        .eq('booking_date', dateStr)
        .in('status', ['pending', 'confirmed', 'seated']);

      // Get all tables for this location
      const { data: tables } = await supabase
        .from('tables')
        .select('id, seats')
        .eq('location_id', location.id)
        .eq('is_active', true);

      // Generate time slots from 12:00 to 22:00
      const slots = [];
      for (let hour = 12; hour <= 22; hour++) {
        for (let minute of [0, 30]) {
          if (hour === 22 && minute === 30) continue; // Stop at 22:00
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          
          // Check availability for this time slot
          const isAvailable = checkTimeSlotAvailability(
            time,
            guests,
            tables || [],
            bookings || []
          );

          slots.push({ time, available: isAvailable });
        }
      }

      setAvailableTimeSlots(slots);
    } catch (err) {
      console.error('Error loading time slots:', err);
    } finally {
      setLoadingTimeSlots(false);
    }
  };

  const checkTimeSlotAvailability = (
    time: string,
    guestCount: number,
    tables: any[],
    bookings: any[]
  ): boolean => {
    // Find tables that can accommodate the guests
    const suitableTables = tables.filter(t => t.seats >= guestCount);
    if (suitableTables.length === 0) return false;

    // Check if any suitable table is available at this time
    const timeMinutes = timeToMinutes(time);
    const durationMinutes = 120; // Default 2 hours

    for (const table of suitableTables) {
      const tableBookings = bookings.filter(b => b.table_id === table.id);
      let isTableAvailable = true;

      for (const booking of tableBookings) {
        const bookingStart = timeToMinutes(booking.booking_time);
        const bookingEnd = bookingStart + (booking.duration_minutes || 120);

        // Check for overlap
        if (
          (timeMinutes >= bookingStart && timeMinutes < bookingEnd) ||
          (timeMinutes + durationMinutes > bookingStart && timeMinutes < bookingStart)
        ) {
          isTableAvailable = false;
          break;
        }
      }

      if (isTableAvailable) return true;
    }

    return false;
  };

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      setError('Selecteer datum en tijd');
      return;
    }

    if (!name || !email) {
      setError('Vul naam en email in');
      return;
    }

    setStep('loading');
    setError('');

    try {
      const supabase = createClient();
      const dateStr = selectedDate.toISOString().split('T')[0];

      // Get consumer ID if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      let consumerId = null;

      if (user) {
        const { data: consumer } = await supabase
          .from('consumers')
          .select('id')
          .eq('auth_user_id', user.id)
          .maybeSingle();
        consumerId = consumer?.id;
      }

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          location_id: location.id,
          consumer_id: consumerId,
          booking_date: dateStr,
          booking_time: selectedTime,
          number_of_guests: guests,
          customer_name: name,
          customer_email: email,
          customer_phone: phone || null,
          special_requests: specialRequests || null,
          status: 'pending',
          duration_minutes: 120,
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Try to assign a table automatically
      try {
        const { data: assignedTableId } = await supabase
          .rpc('assign_best_table', {
            p_location_id: location.id,
            p_booking_date: dateStr,
            p_booking_time: selectedTime,
            p_number_of_guests: guests,
            p_duration_minutes: 120,
          });

        if (assignedTableId && booking) {
          await supabase
            .from('bookings')
            .update({ table_id: assignedTableId })
            .eq('id', booking.id);
        }
      } catch (assignError) {
        console.log('Could not auto-assign table:', assignError);
        // This is OK - booking is still created
      }

      setStep('success');
    } catch (err: any) {
      console.error('Booking error:', err);
      setError(err.message || 'Er ging iets mis bij het maken van de reservering.');
      setStep('error');
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    // Add empty slots for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const isDateSelectable = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    
    return date >= today && date <= maxDate;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const monthNames = [
    'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
    'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
  ];

  const dayNames = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0">
        {/* Guests Selection */}
        {step === 'guests' && (
          <div className="p-6">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-semibold">
                {location.name}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {location.city}
              </p>
            </DialogHeader>

            <div className="space-y-6">
              <div>
                <Label className="text-base font-semibold mb-4 block">
                  Aantal {t.customer.plural.toLowerCase()}
                </Label>
                <div className="grid grid-cols-4 gap-3">
                  {GUEST_OPTIONS.map((count) => (
                    <button
                      key={count}
                      onClick={() => setGuests(count)}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all flex items-center justify-center font-semibold',
                        guests === count
                          ? 'border-primary bg-primary text-white'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              <Button 
                onClick={() => setStep('date')}
                className="w-full h-12 text-base"
                size="lg"
              >
                Verder
              </Button>
            </div>
          </div>
        )}

        {/* Date Selection */}
        {step === 'date' && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('guests')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <DialogTitle className="text-xl font-semibold">
                  Kies een datum
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {guests} {guests === 1 ? t.customer.singular.toLowerCase() : t.customer.plural.toLowerCase()}
                </p>
              </div>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newMonth = new Date(currentMonth);
                  newMonth.setMonth(newMonth.getMonth() - 1);
                  if (newMonth >= new Date()) {
                    setCurrentMonth(newMonth);
                  }
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newMonth = new Date(currentMonth);
                  newMonth.setMonth(newMonth.getMonth() + 1);
                  const maxMonth = new Date();
                  maxMonth.setMonth(maxMonth.getMonth() + 3);
                  if (newMonth <= maxMonth) {
                    setCurrentMonth(newMonth);
                  }
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="mb-6">
              <div className="grid grid-cols-7 gap-2 mb-2">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {getDaysInMonth(currentMonth).map((date, idx) => {
                  if (!date) {
                    return <div key={`empty-${idx}`} />;
                  }

                  const isSelectable = isDateSelectable(date);
                  const isSelected = selectedDate?.toDateString() === date.toDateString();

                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => {
                        if (isSelectable) {
                          setSelectedDate(date);
                        }
                      }}
                      disabled={!isSelectable}
                      className={cn(
                        'aspect-square rounded-lg text-sm font-medium transition-all',
                        isSelected
                          ? 'bg-primary text-white'
                          : isSelectable
                          ? 'hover:bg-primary/10 border border-border'
                          : 'text-muted-foreground opacity-50 cursor-not-allowed'
                      )}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              onClick={() => setStep('time')}
              disabled={!selectedDate}
              className="w-full h-12 text-base"
              size="lg"
            >
              Verder
            </Button>
          </div>
        )}

        {/* Time Selection */}
        {step === 'time' && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('date')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <DialogTitle className="text-xl font-semibold">
                  Kies een tijd
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedDate && formatDate(selectedDate)}
                </p>
              </div>
            </div>

            {loadingTimeSlots ? (
              <div className="py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
                <p className="text-sm text-muted-foreground">
                  Beschikbaarheid checken...
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3 mb-6 max-h-[400px] overflow-y-auto">
                  {availableTimeSlots.map(({ time, available }) => (
                    <button
                      key={time}
                      onClick={() => {
                        if (available) {
                          setSelectedTime(time);
                        }
                      }}
                      disabled={!available}
                      className={cn(
                        'p-3 rounded-lg text-sm font-medium transition-all',
                        selectedTime === time
                          ? 'bg-primary text-white'
                          : available
                          ? 'border border-border hover:border-primary'
                          : 'border border-border text-muted-foreground opacity-50 cursor-not-allowed'
                      )}
                    >
                      {time}
                    </button>
                  ))}
                </div>

                <Button
                  onClick={() => setStep('details')}
                  disabled={!selectedTime}
                  className="w-full h-12 text-base"
                  size="lg"
                >
                  Verder
                </Button>
              </>
            )}
          </div>
        )}

        {/* Contact Details */}
        {step === 'details' && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('time')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <DialogTitle className="text-xl font-semibold">
                Jouw gegevens
              </DialogTitle>
            </div>

            {/* Summary */}
            <div className="mb-6 p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{guests} {guests === 1 ? t.customer.singular.toLowerCase() : t.customer.plural.toLowerCase()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span>{selectedDate && formatDate(selectedDate)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{selectedTime}</span>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="name">
                  <User className="inline h-4 w-4 mr-2" />
                  Naam *
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Volledige naam"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="inline h-4 w-4 mr-2" />
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="uw.email@voorbeeld.nl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="inline h-4 w-4 mr-2" />
                  Telefoon
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+32 123 45 67 89"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requests">
                  Speciale wensen (optioneel)
                </Label>
                <Textarea
                  id="requests"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Allergieën, kinderstoel, etc."
                  rows={3}
                />
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!name || !email}
              className="w-full h-12 text-base"
              size="lg"
            >
              Reservering Bevestigen
            </Button>
          </div>
        )}

        {/* Loading */}
        {step === 'loading' && (
          <div className="p-6 py-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Reservering wordt gemaakt...
            </h3>
            <p className="text-sm text-muted-foreground">
              Even geduld alstublieft
            </p>
          </div>
        )}

        {/* Success */}
        {step === 'success' && (
          <div className="p-6 py-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Reservering gelukt!
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Je ontvangt binnen enkele minuten een bevestiging per email.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg text-left space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Restaurant:</span>
                <span className="font-medium">{location.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Datum:</span>
                <span className="font-medium">
                  {selectedDate && formatDate(selectedDate)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tijd:</span>
                <span className="font-medium">{selectedTime}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t.customer.plural}:</span>
                <span className="font-medium">{guests}</span>
              </div>
            </div>
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Sluiten
            </Button>
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <div className="p-6 py-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Er ging iets mis
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {error}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Sluiten
              </Button>
              <Button
                onClick={() => setStep('details')}
                className="flex-1"
              >
                Opnieuw proberen
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

