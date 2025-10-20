'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  Users,
  MapPin,
  FileText,
  MessageSquare,
  X,
  Check,
  Ban,
  Edit,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookingDetailModalProps {
  booking: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdate?: (bookingId: string, status: string) => Promise<void>;
  isUpdating?: boolean;
}

export function BookingDetailModal({
  booking,
  open,
  onOpenChange,
  onStatusUpdate,
  isUpdating = false,
}: BookingDetailModalProps) {
  if (!booking) return null;

  // Handle different field names from different queries
  const guestName = booking.guest_name || booking.customer_name || 'Gast';
  const guestEmail = booking.guest_email || booking.customer_email || null;
  const guestPhone = booking.guest_phone || booking.customer_phone || null;
  const specialRequests = booking.guest_note || booking.special_requests || booking.notes || null;
  const internalNote = booking.internal_note || null;
  const partySize = booking.party_size || booking.number_of_guests || 0;
  const status = booking.status || 'PENDING';
  
  // Handle date/time - support both formats
  let startTime: Date;
  if (booking.start_ts || booking.start_time) {
    startTime = new Date(booking.start_ts || booking.start_time);
  } else if (booking.booking_date && booking.booking_time) {
    startTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
  } else {
    startTime = new Date();
  }

  const endTime = booking.end_ts || booking.end_time 
    ? new Date(booking.end_ts || booking.end_time) 
    : null;

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
        return 'bg-success/10 text-success border-success/20';
      case 'PENDING':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'CANCELLED':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'COMPLETED':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'NO_SHOW':
        return 'bg-muted text-muted-foreground border-muted';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
        return <Check className="h-3 w-3" />;
      case 'PENDING':
        return <Clock className="h-3 w-3" />;
      case 'CANCELLED':
        return <X className="h-3 w-3" />;
      case 'COMPLETED':
        return <Check className="h-3 w-3" />;
      case 'NO_SHOW':
        return <Ban className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    // TODO: Add toast notification
    console.log(`${label} gekopieerd naar klembord`);
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (onStatusUpdate) {
      await onStatusUpdate(booking.id, newStatus);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">Reservering Details</DialogTitle>
              <DialogDescription>
                Reservering ID: {booking.id?.slice(0, 8)}...
              </DialogDescription>
            </div>
            <Badge className={cn('gap-1.5', getStatusColor(status))}>
              {getStatusIcon(status)}
              {status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Klant Informatie */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Klantinformatie
            </h3>
            <div className="space-y-3 bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-background rounded-md">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Naam</p>
                    <p className="font-semibold">{guestName}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(guestName, 'Naam')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              {guestEmail && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-background rounded-md">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-mono text-sm">{guestEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(guestEmail, 'Email')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a href={`mailto:${guestEmail}`}>
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {guestPhone && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-background rounded-md">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Telefoon</p>
                        <p className="font-mono text-sm">{guestPhone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(guestPhone, 'Telefoon')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a href={`tel:${guestPhone}`}>
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {!guestEmail && !guestPhone && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Geen contactgegevens beschikbaar
                </p>
              )}
            </div>
          </div>

          {/* Reservering Details */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Reservering Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Calendar className="h-4 w-4" />
                  <p className="text-sm">Datum</p>
                </div>
                <p className="font-semibold">
                  {startTime.toLocaleDateString('nl-NL', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <div className="space-y-1 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Clock className="h-4 w-4" />
                  <p className="text-sm">Tijd</p>
                </div>
                <p className="font-semibold">
                  {startTime.toLocaleTimeString('nl-NL', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {endTime && (
                    <>
                      {' - '}
                      {endTime.toLocaleTimeString('nl-NL', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </>
                  )}
                </p>
              </div>

              <div className="space-y-1 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Users className="h-4 w-4" />
                  <p className="text-sm">Aantal gasten</p>
                </div>
                <p className="font-semibold">{partySize} {partySize === 1 ? 'persoon' : 'personen'}</p>
              </div>

              {booking.table && (
                <div className="space-y-1 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <MapPin className="h-4 w-4" />
                    <p className="text-sm">Tafel</p>
                  </div>
                  <p className="font-semibold">
                    {booking.table.name || `Tafel ${booking.table.table_number}`}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Speciale Verzoeken */}
          {specialRequests && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Speciale Verzoeken
              </h3>
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                <p className="text-sm text-foreground whitespace-pre-wrap">{specialRequests}</p>
              </div>
            </div>
          )}

          {/* Interne Notities */}
          {internalNote && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Interne Notities
              </h3>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap">{internalNote}</p>
              </div>
            </div>
          )}

          {/* Locatie Info */}
          {booking.location && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Locatie
              </h3>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="font-semibold">{booking.location.name}</p>
                {booking.location.slug && (
                  <Button
                    variant="link"
                    size="sm"
                    className="px-0 h-auto mt-1"
                    asChild
                  >
                    <a href={`/p/${booking.location.slug}`} target="_blank">
                      Bekijk publieke pagina
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Status Acties */}
          {onStatusUpdate && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4">Acties</h3>
                <div className="flex flex-wrap gap-2">
                  {status === 'PENDING' && (
                    <>
                      <Button
                        onClick={() => handleStatusUpdate('CONFIRMED')}
                        disabled={isUpdating}
                        className="bg-success hover:bg-success/90"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Bevestigen
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleStatusUpdate('CANCELLED')}
                        disabled={isUpdating}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Annuleren
                      </Button>
                    </>
                  )}

                  {status === 'CONFIRMED' && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleStatusUpdate('COMPLETED')}
                        disabled={isUpdating}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Markeer als voltooid
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleStatusUpdate('NO_SHOW')}
                        disabled={isUpdating}
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        No-show
                      </Button>
                    </>
                  )}

                  {(status === 'CANCELLED' || status === 'NO_SHOW') && (
                    <Button
                      variant="outline"
                      onClick={() => handleStatusUpdate('CONFIRMED')}
                      disabled={isUpdating}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Heractiveren
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Meta Info */}
          <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
            <p>Aangemaakt: {new Date(booking.created_at).toLocaleString('nl-NL')}</p>
            {booking.source && <p>Bron: {booking.source}</p>}
            {booking.payment_status && booking.payment_status !== 'NONE' && (
              <p>Betaling status: {booking.payment_status}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

