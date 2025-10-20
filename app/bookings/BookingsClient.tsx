'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Phone,
  Calendar,
  ArrowLeft,
  MapPin,
  Users,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface BookingsClientProps {
  user: any;
  consumer: any;
  bookings: any[];
}

export function BookingsClient({ user, consumer, bookings }: BookingsClientProps) {
  const router = useRouter();
  const [cancellingBooking, setCancellingBooking] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const upcomingBookings = bookings
    .filter((booking) => {
      const bookingDate = new Date(booking.start_ts || `${booking.booking_date}T${booking.booking_time}`);
      return bookingDate >= new Date() && booking.status !== 'cancelled';
    })
    .sort((a, b) => {
      const dateA = new Date(a.start_ts || `${a.booking_date}T${a.booking_time}`);
      const dateB = new Date(b.start_ts || `${b.booking_date}T${b.booking_time}`);
      return dateA.getTime() - dateB.getTime();
    });

  const pastBookings = bookings
    .filter((booking) => {
      const bookingDate = new Date(booking.start_ts || `${booking.booking_date}T${booking.booking_time}`);
      return bookingDate < new Date() || booking.status === 'cancelled';
    })
    .sort((a, b) => {
      const dateA = new Date(a.start_ts || `${a.booking_date}T${a.booking_time}`);
      const dateB = new Date(b.start_ts || `${b.booking_date}T${b.booking_time}`);
      return dateB.getTime() - dateA.getTime();
    });

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Weet je zeker dat je deze reservering wilt annuleren?')) {
      return;
    }

    setCancellingBooking(bookingId);
    setMessage(null);

    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Reservering succesvol geannuleerd' });
        router.refresh();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Er ging iets mis bij het annuleren' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Er ging iets mis bij het annuleren' });
    } finally {
      setCancellingBooking(null);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Terug</span>
            </Button>
            <div className="text-center flex-1">
              <h1 className="text-lg sm:text-xl font-bold">Mijn Reserveringen</h1>
            </div>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className="sticky top-[65px] z-10">
          <div className={`px-4 sm:px-6 lg:px-8 py-3 ${
            message.type === 'success' 
              ? 'bg-green-50 border-b border-green-200' 
              : 'bg-red-50 border-b border-red-200'
          }`}>
            <div className="max-w-[1800px] mx-auto flex items-center justify-center gap-2">
              <span className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.text}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Page Title */}
          <div>
            <h2 className="text-xl font-semibold mb-1">Reserveringen</h2>
            <p className="text-sm text-muted-foreground">Bekijk en beheer je boekingen</p>
          </div>

          {/* Upcoming Bookings */}
          {upcomingBookings.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Aankomende reserveringen</h3>
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <Card key={booking.id} className="p-6 hover:shadow-lg transition-all border-2 hover:border-primary">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                              <MapPin className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-bold text-xl">{booking.location?.name}</h3>
                              <Badge 
                                variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                                className="mt-1"
                              >
                                {booking.status === 'confirmed' && 'Bevestigd'}
                                {booking.status === 'pending' && 'In afwachting'}
                                {booking.status === 'cancelled' && 'Geannuleerd'}
                                {booking.status === 'seated' && 'Zit aan tafel'}
                                {booking.status === 'completed' && 'Voltooid'}
                                {booking.status === 'no_show' && 'Niet verschenen'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild className="rounded-xl">
                          <Link href={`/p/${booking.location?.slug}`}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Bekijk vestiging
                          </Link>
                        </Button>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-xl">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Calendar className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Datum & Tijd</p>
                            <p className="font-semibold text-foreground">
                              {new Date(booking.start_ts || `${booking.booking_date}T${booking.booking_time}`).toLocaleString('nl-NL', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                            <p className="text-sm text-foreground font-medium">
                              om {booking.booking_time || new Date(booking.start_ts).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Aantal Personen</p>
                            <p className="font-semibold text-lg text-foreground">
                              {booking.number_of_guests || booking.party_size} {(booking.number_of_guests || booking.party_size) === 1 ? 'persoon' : 'personen'}
                            </p>
                          </div>
                        </div>

                        {booking.customer_name && (
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">Op Naam Van</p>
                              <p className="font-semibold text-foreground">{booking.customer_name}</p>
                            </div>
                          </div>
                        )}

                        {booking.customer_phone && (
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Phone className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">Telefoonnummer</p>
                              <p className="font-semibold text-foreground">{booking.customer_phone}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Location Address */}
                      {booking.location?.address_json && (
                        <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
                          <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {booking.location.address_json.street} {booking.location.address_json.number}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {booking.location.address_json.city}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Special Requests */}
                      {booking.special_requests && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                          <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1">
                            Speciale Verzoeken
                          </p>
                          <p className="text-sm text-foreground">
                            {booking.special_requests}
                          </p>
                        </div>
                      )}

                      {/* Booking ID & Created At */}
                      <div className="flex items-center justify-between pt-3 border-t border-border text-xs text-muted-foreground">
                        <span>Reserveringsnummer: {booking.id.split('-')[0]}</span>
                        <span>
                          Gemaakt op {new Date(booking.created_at).toLocaleDateString('nl-NL', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                        <div className="flex gap-2 pt-4">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={cancellingBooking === booking.id}
                            className="flex-1"
                          >
                            {cancellingBooking === booking.id ? 'Annuleren...' : 'Reservering Annuleren'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Past Bookings */}
          {pastBookings.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Eerdere reserveringen</h3>
              <div className="space-y-3">
                {pastBookings.map((booking) => (
                  <Card key={booking.id} className="p-5 opacity-75 hover:opacity-100 transition-opacity">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-base">{booking.location?.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(booking.start_ts || `${booking.booking_date}T${booking.booking_time}`).toLocaleDateString('nl-NL', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })} om {booking.booking_time || new Date(booking.start_ts).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {booking.number_of_guests || booking.party_size} pers.
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {booking.status === 'completed' && 'Voltooid'}
                              {booking.status === 'cancelled' && 'Geannuleerd'}
                              {booking.status === 'no_show' && 'Niet verschenen'}
                              {!['completed', 'cancelled', 'no_show'].includes(booking.status) && booking.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {bookings.length === 0 && (
            <Card className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-6">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Nog geen reserveringen</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Begin met het verkennen van restaurants en maak je eerste reservering
              </p>
              <Button asChild size="lg" className="rounded-xl">
                <Link href="/discover">
                  Ontdek restaurants
                </Link>
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

