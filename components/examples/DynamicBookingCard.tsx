/**
 * DYNAMIC BOOKING CARD - COMPLETE EXAMPLE
 * 
 * This is a COMPLETE working example showing all terminology patterns
 * Use this as a reference when updating existing components
 */

'use client';

import { useTerminology } from '@/lib/hooks/useTerminology';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, MapPin, User } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface BookingData {
  id: string;
  booking_date: string;
  booking_time: string;
  party_size: number;
  customer_name: string;
  resource_name?: string;
  staff_name?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

interface DynamicBookingCardProps {
  booking: BookingData;
  onConfirm?: () => void;
  onCancel?: () => void;
}

/**
 * A booking card that adapts its labels based on business sector
 * 
 * RESTAURANT:
 * - "Reservering" / "Gast" / "Tafel"
 * 
 * HAIR_SALON:
 * - "Afspraak" / "Klant" / "Stoel" / "Kapper"
 * 
 * MEDICAL_PRACTICE:
 * - "Afspraak" / "Patiënt" / "Spreekkamer" / "Arts"
 */
export function DynamicBookingCard({
  booking,
  onConfirm,
  onCancel,
}: DynamicBookingCardProps) {
  // 🔥 Get terminology - this ONE line makes everything dynamic
  const t = useTerminology();

  // Parse date
  const bookingDate = new Date(`${booking.booking_date}T${booking.booking_time}`);

  // Status colors
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const statusLabels = {
    pending: 'In afwachting',
    confirmed: 'Bevestigd',
    cancelled: 'Geannuleerd',
  };

  return (
    <Card className="p-6">
      {/* Header with dynamic booking type label */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">
            {/* DYNAMIC: "Reservering" / "Afspraak" / "Sessie" */}
            {t.booking.singular} #{booking.id.slice(0, 8)}
          </h3>
          <Badge className={statusColors[booking.status]}>
            {statusLabels[booking.status]}
          </Badge>
        </div>
      </div>

      {/* Booking Details */}
      <div className="space-y-3">
        {/* Date & Time */}
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2" />
          <span>
            {format(bookingDate, 'EEEE d MMMM yyyy', { locale: nl })}
          </span>
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <Clock className="w-4 h-4 mr-2" />
          <span>{booking.booking_time}</span>
        </div>

        {/* Customer (dynamic label) */}
        <div className="flex items-center text-sm text-gray-600">
          <User className="w-4 h-4 mr-2" />
          <span>
            {/* DYNAMIC: "Gast" / "Klant" / "Patiënt" / "Lid" */}
            {t.customer.singular}: <strong>{booking.customer_name}</strong>
          </span>
        </div>

        {/* Party Size */}
        {booking.party_size > 1 && (
          <div className="flex items-center text-sm text-gray-600">
            <Users className="w-4 h-4 mr-2" />
            <span>
              {/* DYNAMIC: "2 Gasten" / "2 Klanten" / "2 Patiënten" */}
              {booking.party_size} {t.customer.plural}
            </span>
          </div>
        )}

        {/* Resource (if assigned) */}
        {booking.resource_name && (
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            <span>
              {/* DYNAMIC: "Tafel" / "Behandelkamer" / "Spreekkamer" */}
              {t.resource.singular}: <strong>{booking.resource_name}</strong>
            </span>
          </div>
        )}

        {/* Staff (if assigned) */}
        {booking.staff_name && (
          <div className="flex items-center text-sm text-gray-600">
            <User className="w-4 h-4 mr-2" />
            <span>
              {/* DYNAMIC: "Medewerker" / "Kapper" / "Arts" / "Trainer" */}
              {t.staff.singular}: <strong>{booking.staff_name}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      {booking.status === 'pending' && (
        <div className="flex gap-2 mt-4">
          <Button onClick={onConfirm} size="sm" className="flex-1">
            Bevestigen
          </Button>
          <Button onClick={onCancel} size="sm" variant="outline" className="flex-1">
            Annuleren
          </Button>
        </div>
      )}
    </Card>
  );
}

/**
 * EXAMPLE USAGE IN DIFFERENT SECTORS:
 * 
 * 1. RESTAURANT:
 * ```tsx
 * <BusinessSectorProvider sector="RESTAURANT">
 *   <DynamicBookingCard booking={booking} />
 * </BusinessSectorProvider>
 * ```
 * Result: "Reservering #abc12345" / "Gast: Jan de Vries" / "Tafel: Tafel 5"
 * 
 * 2. HAIR_SALON:
 * ```tsx
 * <BusinessSectorProvider sector="HAIR_SALON">
 *   <DynamicBookingCard booking={booking} />
 * </BusinessSectorProvider>
 * ```
 * Result: "Afspraak #abc12345" / "Klant: Jan de Vries" / "Stoel: Stoel 3" / "Kapper: Marie"
 * 
 * 3. MEDICAL_PRACTICE:
 * ```tsx
 * <BusinessSectorProvider sector="MEDICAL_PRACTICE">
 *   <DynamicBookingCard booking={booking} />
 * </BusinessSectorProvider>
 * ```
 * Result: "Afspraak #abc12345" / "Patiënt: Jan de Vries" / "Spreekkamer: Kamer 2" / "Arts: Dr. Jansen"
 * 
 * 4. GYM:
 * ```tsx
 * <BusinessSectorProvider sector="GYM">
 *   <DynamicBookingCard booking={booking} />
 * </BusinessSectorProvider>
 * ```
 * Result: "Sessie #abc12345" / "Lid: Jan de Vries" / "Trainer: Coach Mike"
 */

/**
 * PATTERN SUMMARY:
 * 
 * 1. Import the hook:
 *    import { useTerminology } from '@/lib/hooks/useTerminology';
 * 
 * 2. Call it at component top:
 *    const t = useTerminology();
 * 
 * 3. Replace hardcoded labels:
 *    "Reservering" → {t.booking.singular}
 *    "Reserveringen" → {t.booking.plural}
 *    "Reserveren" → {t.booking.verb}
 *    "Gast" → {t.customer.singular}
 *    "Gasten" → {t.customer.plural}
 *    "Tafel" → {t.resource.singular}
 *    "Tafels" → {t.resource.plural}
 * 
 * 4. Done! Component now works for all 43 sectors.
 */

