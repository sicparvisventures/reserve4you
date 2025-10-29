'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  Loader2,
  ChevronRight,
  Mail,
  Phone,
  User,
  AlertCircle,
  Check,
  X,
  MessageSquare,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useTerminology } from '@/lib/hooks/useTerminology';

interface ReserveBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: {
    id: string;
    name: string;
    address_line1?: string;
    city?: string;
  };
}

type BookingStep = 1 | 2 | 3;

const GUEST_OPTIONS = [2, 4, 6, 8];

export function ReserveBookingModal({ open, onOpenChange, location }: ReserveBookingModalProps) {
  // 🔥 Get dynamic terminology
  const t = useTerminology();
  
  const [step, setStep] = useState<BookingStep>(1);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authUser, setAuthUser] = useState<any | null>(null);
  const [consumer, setConsumer] = useState<any | null>(null);
  
  // Booking data
  const [guests, setGuests] = useState(2);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  // Time slots state
  const [availableTimeSlots, setAvailableTimeSlots] = useState<Array<{time: string, available: boolean}>>([]);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);

  // Load auth user data when modal opens
  useEffect(() => {
    if (open && step === 3) {
      loadUserData();
    }
  }, [open, step]);

  const loadUserData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setAuthUser(user);
        
        // Get consumer record
        const { data: consumerData } = await supabase
          .from('consumers')
          .select('*')
          .eq('auth_user_id', user.id)
          .single();
        
        if (consumerData) {
          setConsumer(consumerData);
          // Auto-fill form with user data
          setName(consumerData.name || user.user_metadata?.full_name || user.email?.split('@')[0] || '');
          setEmail(consumerData.email || user.email || '');
          setPhone(consumerData.phone || user.phone || '');
        } else {
          // User has no consumer record yet, use auth data
          setName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
          setEmail(user.email || '');
          setPhone(user.phone || '');
        }
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      // Silent fail - user can still manually enter data
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep(1);
        setError('');
        setSuccess(false);
        setGuests(2);
        setSelectedDate('');
        setSelectedTime('');
        setName('');
        setEmail('');
        setPhone('');
        setSpecialRequests('');
        setAvailableTimeSlots([]);
      }, 300);
    }
  }, [open]);

  // Load available time slots when date is selected
  useEffect(() => {
    if (selectedDate && step === 2) {
      loadTimeSlots();
    }
  }, [selectedDate, guests]);

  const loadTimeSlots = async () => {
    if (!selectedDate) return;
    
    setLoadingTimeSlots(true);
    setError('');
    try {
      const supabase = createClient();

      // First, check if there are any shifts configured for this location
      const selectedDateObj = new Date(selectedDate);
      const dayOfWeek = selectedDateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.

      const { data: shifts, error: shiftsError } = await supabase
        .from('shifts')
        .select('*')
        .eq('location_id', location.id)
        .eq('is_active', true)
        .contains('days_of_week', [dayOfWeek]);

      if (shiftsError) {
        console.error('Error loading shifts:', shiftsError);
        throw new Error('Fout bij laden van openingstijden');
      }

      if (!shifts || shifts.length === 0) {
        setError('Dit restaurant heeft nog geen openingstijden geconfigureerd. Neem contact op met het restaurant.');
        setAvailableTimeSlots([]);
        setLoadingTimeSlots(false);
        return;
      }

      // Get existing bookings for this date
      const { data: bookings } = await supabase
        .from('bookings')
        .select('booking_time, table_id, number_of_guests, duration_minutes')
        .eq('location_id', location.id)
        .eq('booking_date', selectedDate)
        .in('status', ['pending', 'confirmed', 'seated']);

      // Get all tables for this location
      const { data: tables, error: tablesError } = await supabase
        .from('tables')
        .select('id, seats')
        .eq('location_id', location.id)
        .eq('is_active', true);

      if (tablesError) {
        console.error('Error loading tables:', tablesError);
        throw new Error('Fout bij laden van tafels');
      }

      if (!tables || tables.length === 0) {
        setError('Dit restaurant heeft geen actieve tafels. Neem contact op met het restaurant.');
        setAvailableTimeSlots([]);
        setLoadingTimeSlots(false);
        return;
      }

      // Generate time slots based on shifts
      const slots: Array<{time: string, available: boolean}> = [];
      for (const shift of shifts) {
        const [startHour, startMinute] = shift.start_time.split(':').map(Number);
        const [endHour, endMinute] = shift.end_time.split(':').map(Number);
        
        const startMinutes = startHour * 60 + startMinute;
        const endMinutes = endHour * 60 + endMinute;
        
        // Generate 30-minute intervals
        for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
          const hour = Math.floor(minutes / 60);
          const minute = minutes % 60;
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          
          const isAvailable = checkTimeSlotAvailability(
            time,
            guests,
            tables,
            bookings || []
          );

          // Avoid duplicate time slots from overlapping shifts
          if (!slots.find(s => s.time === time)) {
            slots.push({ time, available: isAvailable });
          }
        }
      }

      // Sort slots by time
      slots.sort((a, b) => a.time.localeCompare(b.time));

      setAvailableTimeSlots(slots);
    } catch (err: any) {
      console.error('Error loading time slots:', err);
      setError(err.message || 'Fout bij laden van beschikbare tijden');
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
    const suitableTables = tables.filter(t => t.seats >= guestCount);
    if (suitableTables.length === 0) return false;

    const timeMinutes = timeToMinutes(time);
    const durationMinutes = 120;

    for (const table of suitableTables) {
      const tableBookings = bookings.filter(b => b.table_id === table.id);
      let isTableAvailable = true;

      for (const booking of tableBookings) {
        const bookingStart = timeToMinutes(booking.booking_time);
        const bookingEnd = bookingStart + (booking.duration_minutes || 120);

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

  const handlePartySizeSelect = (size: number) => {
    setGuests(size);
    setStep(2);
  };

  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedTime(''); // Reset time when date changes
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      setError('Selecteer datum en tijd');
      return;
    }

    if (!name || !email) {
      setError('Vul naam en e-mailadres in');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Vul een geldig e-mailadres in');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const supabase = createClient();

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

      // Check auto-accept setting
      const { data: locationData } = await supabase
        .from('locations')
        .select('auto_accept_bookings')
        .eq('id', location.id)
        .single();

      const initialStatus = locationData?.auto_accept_bookings ? 'confirmed' : 'pending';

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          location_id: location.id,
          consumer_id: consumerId,
          booking_date: selectedDate,
          booking_time: selectedTime,
          number_of_guests: guests,
          customer_name: name,
          customer_email: email,
          customer_phone: phone || null,
          special_requests: specialRequests || null,
          status: initialStatus,
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
            p_booking_date: selectedDate,
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
      }

      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
      }, 2500);
    } catch (err: any) {
      console.error('Booking error:', err);
      
      // Better error message handling
      let errorMessage = 'Er ging iets mis bij het maken van de reservering.';
      
      if (err?.message) {
        errorMessage = err.message;
      } else if (err?.error_description) {
        errorMessage = err.error_description;
      } else if (err?.error) {
        errorMessage = typeof err.error === 'string' ? err.error : JSON.stringify(err.error);
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const canGoBack = step > 1 && !submitting && !success;
  const handleBack = () => {
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full p-0 bg-background">
        <div className="h-full flex flex-col">
          {/* Header with R4Y branding */}
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <CalendarIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <SheetTitle className="text-2xl font-bold text-foreground">
                    Reserveren
                  </SheetTitle>
                  <p className="text-sm text-muted-foreground font-medium mt-0.5">
                    {location.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="rounded-lg p-2 hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SheetDescription className="text-sm text-muted-foreground mt-2 text-left">
              {step === 1 && `Selecteer het aantal ${t.customer.plural.toLowerCase()}`}
              {step === 2 && 'Kies uw gewenste datum en tijd'}
              {step === 3 && 'Vul uw contactgegevens in'}
            </SheetDescription>
          </SheetHeader>

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-4 px-6 py-4 border-b border-border">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all',
                    s === step 
                      ? 'bg-primary text-white' 
                      : s < step 
                      ? 'bg-primary text-white' 
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {s < step ? <Check className="h-4 w-4" /> : s}
                </div>
                <span className={cn(
                  'text-sm font-medium',
                  s === step ? 'text-foreground' : s < step ? 'text-primary' : 'text-muted-foreground'
                )}>
                  {s === 1 && t.customer.plural}
                  {s === 2 && 'Datum & Tijd'}
                  {s === 3 && 'Gegevens'}
                </span>
                {s < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </div>
            ))}
          </div>

          <SheetBody className="flex-1 overflow-y-auto px-6 pt-6 pb-6">
            {error && (
              <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive flex items-start gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 rounded-lg bg-green-500/10 border border-green-500/20 p-4 text-sm text-green-700 flex items-start gap-3">
                <Check className="h-5 w-5 shrink-0 mt-0.5" />
                <span className="font-medium">Reservering gelukt! Je ontvangt een bevestiging per email.</span>
              </div>
            )}

            {/* Step 1: Party Size */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  {GUEST_OPTIONS.map((size) => (
                    <button
                      key={size}
                      onClick={() => handlePartySizeSelect(size)}
                      className={cn(
                        'flex flex-col items-center justify-center h-24 rounded-lg border-2 transition-all',
                        'hover:border-primary hover:bg-primary/5',
                        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                        'border-border bg-card'
                      )}
                    >
                      <Users className="h-6 w-6 text-primary mb-2" />
                      <span className="text-lg font-bold">{size}</span>
                      <span className="text-xs text-muted-foreground mt-1">{t.customer.plural.toLowerCase()}</span>
                    </button>
                  ))}
                </div>

                <div>
                  <Label htmlFor="custom-size">Of voer een ander aantal in:</Label>
                  <Input
                    id="custom-size"
                    type="number"
                    min="1"
                    max="50"
                    placeholder="Bijv. 10"
                    className="mt-2"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const value = parseInt(e.currentTarget.value);
                        if (value >= 1 && value <= 50) {
                          handlePartySizeSelect(value);
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Date & Time */}
            {step === 2 && (
              <div className="space-y-6">
                {/* Date selection */}
                {!selectedDate ? (
                  <div className="space-y-3">
                    <Label>Kies een datum:</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {Array.from({ length: 7 }).map((_, i) => {
                        const date = addDays(new Date(), i);
                        const dateStr = format(date, 'yyyy-MM-dd');
                        const displayDate = format(date, 'EEE d MMM', { locale: nl });

                        return (
                          <button
                            key={i}
                            onClick={() => handleDateSelect(dateStr)}
                            className={cn(
                              'flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all',
                              'hover:border-primary hover:bg-primary/5',
                              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                              'border-border bg-card'
                            )}
                          >
                            <span className="text-xs text-muted-foreground capitalize font-medium">
                              {displayDate.split(' ')[0]}
                            </span>
                            <span className="text-lg font-bold mt-1 text-foreground">
                              {displayDate.split(' ')[1]}
                            </span>
                            <span className="text-xs text-muted-foreground mt-1">
                              {displayDate.split(' ')[2]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted border border-border">
                      <div>
                        <Label className="text-xs text-muted-foreground font-semibold">Gekozen datum</Label>
                        <p className="text-base font-bold mt-1 text-foreground">
                          {format(new Date(selectedDate), 'EEEE d MMMM yyyy', { locale: nl })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => setSelectedDate('')}
                      >
                        Wijzig
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <Label>Kies een tijd:</Label>

                      {loadingTimeSlots ? (
                        <div className="grid grid-cols-3 gap-2">
                          {Array.from({ length: 9 }).map((_, i) => (
                            <Skeleton key={i} className="h-12" />
                          ))}
                        </div>
                      ) : availableTimeSlots.filter(s => s.available).length === 0 ? (
                        <div className="text-center py-12 px-4 rounded-lg bg-muted border border-border">
                          <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="font-semibold text-foreground mb-2">Geen beschikbaarheid</p>
                          <p className="text-sm text-muted-foreground mb-4">
                            Op deze datum zijn er geen tafels beschikbaar
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg"
                            onClick={() => setSelectedDate('')}
                          >
                            Kies een andere datum
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
                          {availableTimeSlots
                            .filter(slot => slot.available)
                            .map((slot) => (
                            <button
                              key={slot.time}
                              onClick={() => handleTimeSelect(slot.time)}
                              className={cn(
                                'px-4 py-3 rounded-lg border-2 transition-all font-semibold',
                                'hover:border-primary hover:bg-primary/5',
                                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                                'border-border bg-card'
                              )}
                            >
                              <div className="text-base">{slot.time}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 3: Guest Details */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-semibold">
                    Naam <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Je volledige naam"
                      className="pl-10 h-11 rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="font-semibold">
                    E-mailadres <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jouw@email.nl"
                      className="pl-10 h-11 rounded-lg"
                      readOnly={!!authUser}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-semibold">
                    Telefoonnummer <span className="text-muted-foreground text-sm">(optioneel)</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+32 6 12345678"
                      className="pl-10 h-11 rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note" className="font-semibold">Speciale verzoeken (optioneel)</Label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <textarea
                      id="note"
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder="Bijv. allergieën, kinderstoel, verjaardag..."
                      className="flex min-h-[100px] w-full rounded-lg border border-input bg-background px-4 py-2 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    />
                  </div>
                </div>

                {/* Summary */}
                <div className="rounded-lg bg-muted border border-border p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    <span className="font-bold text-foreground">Overzicht reservering</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Restaurant</span>
                    <span className="font-semibold text-foreground">{location.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Aantal {t.customer.plural.toLowerCase()}</span>
                    <span className="font-semibold text-foreground">{guests}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Datum & Tijd</span>
                    <span className="font-semibold text-foreground">
                      {selectedDate && format(new Date(selectedDate), 'd MMM', { locale: nl })} om {selectedTime}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </SheetBody>

          <SheetFooter className="flex-row gap-3 px-6 py-4 border-t border-border bg-background">
            {canGoBack && (
              <Button 
                variant="outline" 
                onClick={handleBack} 
                className="flex-1 rounded-lg h-11 font-semibold"
              >
                Terug
              </Button>
            )}

            {step === 3 && (
              <Button
                onClick={handleSubmit}
                disabled={submitting || success}
                className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-lg h-11 font-semibold transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Bezig...
                  </>
                ) : success ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Gelukt!
                  </>
                ) : (
                  'Bevestig reservering'
                )}
              </Button>
            )}
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
