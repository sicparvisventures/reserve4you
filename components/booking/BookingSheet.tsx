/**
 * BookingSheet Component
 * 
 * 3-step booking flow:
 * 1. Party size selection
 * 2. Date & time slot selection
 * 3. Guest details form
 */

'use client';

import * as React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { guestFormSchema, type GuestFormInput } from '@/lib/validation/booking';
import { format, addDays, parse } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Users, Calendar, User, Phone, Mail, MessageSquare, Check, AlertCircle, Loader2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTerminology } from '@/lib/hooks/useTerminology';

interface BookingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationId: string;
  locationName: string;
}

type BookingStep = 1 | 2 | 3;

interface BookingData {
  partySize: number;
  date: string;
  time: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  guestNote?: string;
}

export function BookingSheet({
  open,
  onOpenChange,
  locationId,
  locationName,
}: BookingSheetProps) {
  // 🔥 Get dynamic terminology
  const t = useTerminology();
  
  const [step, setStep] = useState<BookingStep>(1);
  const [bookingData, setBookingData] = useState<Partial<BookingData>>({});
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [authUser, setAuthUser] = useState<any | null>(null);
  const [consumer, setConsumer] = useState<any | null>(null);

  // Guest form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<GuestFormInput>({
    resolver: zodResolver(guestFormSchema),
  });

  // Load auth user data when modal opens
  React.useEffect(() => {
    if (open) {
      loadUserData();
    }
  }, [open]);

  const loadUserData = async () => {
    try {
      const supabase = await import('@/lib/supabase/client').then(m => m.createClient());
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
          setValue('name', consumerData.name || user.user_metadata?.full_name || user.email?.split('@')[0] || '');
          setValue('email', consumerData.email || user.email || '');
          setValue('phone', consumerData.phone || user.phone || '');
        } else {
          // User has no consumer record yet, use auth data
          setValue('name', user.user_metadata?.full_name || user.email?.split('@')[0] || '');
          setValue('email', user.email || '');
          setValue('phone', user.phone || '');
        }
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      // Silent fail - user can still manually enter data
    }
  };

  // Reset when sheet closes
  React.useEffect(() => {
    if (!open) {
      setStep(1);
      setBookingData({});
      setAvailableSlots([]);
      setError(null);
      setSuccess(false);
      reset();
    }
  }, [open, reset]);

  // Step 1: Party size selection
  const handlePartySizeSelect = (size: number) => {
    setBookingData({ ...bookingData, partySize: size });
    setStep(2);
  };

  // Step 2: Date selection
  const handleDateSelect = async (dateStr: string) => {
    setBookingData({ ...bookingData, date: dateStr });
    setLoadingSlots(true);
    setError(null);

    try {
      // Use new availability API endpoint
      const params = new URLSearchParams({
        locationId: locationId,
        date: dateStr,
        partySize: bookingData.partySize?.toString() || '2',
      });

      const response = await fetch(`/api/bookings/availability?${params}`, {
        method: 'GET',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check availability');
      }

      // Filter to only available slots and format for UI
      const availableTimeSlots = (data.timeSlots || [])
        .filter((slot: any) => slot.available)
        .map((slot: any) => ({
          time: slot.time.substring(0, 5), // Convert "HH:MM:SS" to "HH:MM"
          available: true,
          availableTables: slot.availableTables,
        }));

      setAvailableSlots(availableTimeSlots);

      if (availableTimeSlots.length === 0) {
        setError('Geen beschikbare tijden voor deze datum. Probeer een andere datum.');
      }
    } catch (err) {
      console.error('Error loading availability:', err);
      setError(err instanceof Error ? err.message : 'Error loading availability');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Step 2: Time selection
  const handleTimeSelect = (time: string) => {
    setBookingData({ ...bookingData, time });
    setStep(3);
  };

  // Step 3: Form submission
  const onSubmit = async (formData: GuestFormInput) => {
    setSubmitting(true);
    setError(null);

    try {
      // Generate idempotency key
      const idempotencyKey = crypto.randomUUID();

      // Calculate start and end times
      const [hours, minutes] = bookingData.time!.split(':');
      const startTime = new Date(bookingData.date!);
      startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 2); // Default 2-hour booking

      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotency_key: idempotencyKey,
          location_id: locationId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          party_size: bookingData.partySize,
          guest_name: formData.name,
          guest_email: formData.email,
          guest_phone: formData.phone || '',
          guest_note: formData.note || '',
          source: 'WEB',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create booking');
      }

      // Check if payment required
      if (data.payment_required && data.payment_client_secret) {
        // TODO: Redirect to Stripe payment
        alert('Payment required! Redirect to Stripe (not implemented in this demo)');
      }

      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating booking');
    } finally {
      setSubmitting(false);
    }
  };

  const canGoBack = step > 1 && !submitting;
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
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <SheetTitle className="text-2xl font-bold text-foreground">
                    Reserveren
                  </SheetTitle>
                  <p className="text-sm text-muted-foreground font-medium mt-0.5">
                    {locationName}
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
              {step === 1 && 'Selecteer het aantal gasten'}
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
              <div className="mb-4 rounded-lg bg-success/10 border border-success/20 p-4 text-sm text-success flex items-start gap-3">
                <Check className="h-5 w-5 shrink-0 mt-0.5" />
                <span className="font-medium">{t.booking.singular} gelukt! Je ontvangt een bevestiging per email.</span>
              </div>
            )}

          {/* Step 1: Party Size */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                {[2, 4, 6, 8].map((size) => (
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
                    <span className="text-xs text-muted-foreground mt-1">gasten</span>
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
              {/* Date selection - Simple version for MVP */}
              {!bookingData.date ? (
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
                        {format(new Date(bookingData.date), 'EEEE d MMMM yyyy', { locale: nl })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => setBookingData({ ...bookingData, date: undefined })}
                    >
                      Wijzig
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <Label>Kies een tijd:</Label>

                    {loadingSlots ? (
                      <div className="grid grid-cols-3 gap-2">
                        {Array.from({ length: 9 }).map((_, i) => (
                          <Skeleton key={i} className="h-12" />
                        ))}
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="text-center py-12 px-4 rounded-lg bg-muted border border-border">
                        <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="font-semibold text-foreground mb-2">Geen beschikbaarheid</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Op deze datum zijn er geen tafels beschikbaar
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg"
                          onClick={() => setBookingData({ ...bookingData, date: undefined })}
                        >
                          Kies een andere datum
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
                        {availableSlots.map((slot) => (
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-semibold">
                  Naam <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Je volledige naam"
                    className="pl-10 h-11 rounded-lg"
                  />
                </div>
                {errors.name && (
                  <p className="text-sm text-destructive font-medium flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.name.message}
                  </p>
                )}
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
                    {...register('email')}
                    placeholder="jouw@email.nl"
                    className="pl-10 h-11 rounded-lg"
                    readOnly={!!authUser}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive font-medium flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="font-semibold">
                  Telefoonnummer <span className="text-muted-foreground text-sm">(optioneel)</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    {...register('phone')}
                    placeholder="+31 6 12345678"
                    className="pl-10 h-11 rounded-lg"
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-destructive font-medium flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.phone.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="note" className="font-semibold">Speciale verzoeken (optioneel)</Label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <textarea
                    id="note"
                    {...register('note')}
                    placeholder="Bijv. allergieën, kinderstoel, verjaardag..."
                    className="flex min-h-[100px] w-full rounded-lg border border-input bg-background px-4 py-2 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  />
                </div>
                {errors.note && (
                  <p className="text-sm text-destructive font-medium flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.note.message}
                  </p>
                )}
              </div>

              {/* Summary */}
              <div className="rounded-lg bg-muted border border-border p-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span className="font-bold text-foreground">Overzicht reservering</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Restaurant</span>
                  <span className="font-semibold text-foreground">{locationName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Aantal gasten</span>
                  <span className="font-semibold text-foreground">{bookingData.partySize}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Datum & Tijd</span>
                  <span className="font-semibold text-foreground">
                    {format(new Date(bookingData.date!), 'd MMM', { locale: nl })} om {bookingData.time}
                  </span>
                </div>
              </div>
            </form>
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
                onClick={handleSubmit(onSubmit)}
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

