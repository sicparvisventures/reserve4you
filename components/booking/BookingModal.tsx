'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, Users, Mail, Phone, User, CheckCircle2, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: {
    id: string;
    name: string;
    address_line1?: string;
    city?: string;
  };
}

type BookingStep = 'details' | 'loading' | 'success' | 'error';

export function BookingModal({ open, onOpenChange, location }: BookingModalProps) {
  const [step, setStep] = useState<BookingStep>('details');
  const [error, setError] = useState<string>('');
  
  // Form state
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [guests, setGuests] = useState('2');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  // Available time slots
  const timeSlots = [
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
    '20:00', '20:30', '21:00', '21:30', '22:00'
  ];

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get maximum date (3 months from now)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    return maxDate.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStep('loading');

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
          .single();
        consumerId = consumer?.id;
      }

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          location_id: location.id,
          consumer_id: consumerId,
          booking_date: date,
          booking_time: time,
          number_of_guests: parseInt(guests),
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
          special_requests: specialRequests || null,
          status: 'pending',
          duration_minutes: 120,
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Try to assign a table automatically
      const { data: assignedTable } = await supabase
        .rpc('assign_best_table', {
          p_location_id: location.id,
          p_booking_date: date,
          p_booking_time: time,
          p_number_of_guests: parseInt(guests),
          p_duration_minutes: 120,
        });

      // Update booking with assigned table if found
      if (assignedTable && booking) {
        await supabase
          .from('bookings')
          .update({ table_id: assignedTable })
          .eq('id', booking.id);
      }

      setStep('success');
    } catch (err: any) {
      console.error('Booking error:', err);
      setError(err.message || 'Er ging iets mis bij het maken van de reservering.');
      setStep('error');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form after closing
    setTimeout(() => {
      setStep('details');
      setError('');
      setDate('');
      setTime('');
      setGuests('2');
      setName('');
      setEmail('');
      setPhone('');
      setSpecialRequests('');
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        {step === 'details' && (
          <>
            <DialogHeader>
              <DialogTitle>Reservering maken</DialogTitle>
              <DialogDescription>
                bij {location.name}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">
                  <Calendar className="inline h-4 w-4 mr-2" />
                  Datum
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={getMinDate()}
                  max={getMaxDate()}
                  required
                />
              </div>

              {/* Time */}
              <div className="space-y-2">
                <Label htmlFor="time">
                  <Clock className="inline h-4 w-4 mr-2" />
                  Tijdstip
                </Label>
                <select
                  id="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="">Selecteer een tijdstip</option>
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              {/* Number of guests */}
              <div className="space-y-2">
                <Label htmlFor="guests">
                  <Users className="inline h-4 w-4 mr-2" />
                  Aantal personen
                </Label>
                <select
                  id="guests"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'persoon' : 'personen'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  <User className="inline h-4 w-4 mr-2" />
                  Naam
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Volledige naam"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="inline h-4 w-4 mr-2" />
                  Email
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

              {/* Phone */}
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

              {/* Special requests */}
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

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Annuleren
                </Button>
                <Button type="submit" className="flex-1">
                  Reserveren
                </Button>
              </div>
            </form>
          </>
        )}

        {step === 'loading' && (
          <div className="py-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Reservering wordt gemaakt...
            </h3>
            <p className="text-sm text-muted-foreground">
              Even geduld alstublieft
            </p>
          </div>
        )}

        {step === 'success' && (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Reservering gelukt!
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Je ontvangt binnen enkele minuten een bevestiging per email.
            </p>
            <div className="bg-muted p-4 rounded-lg text-left space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Restaurant:</span>
                <span className="font-medium">{location.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Datum:</span>
                <span className="font-medium">{new Date(date).toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tijd:</span>
                <span className="font-medium">{time}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Personen:</span>
                <span className="font-medium">{guests}</span>
              </div>
            </div>
            <Button onClick={handleClose} className="w-full">
              Sluiten
            </Button>
          </div>
        )}

        {step === 'error' && (
          <div className="py-8 text-center">
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
                onClick={handleClose}
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

