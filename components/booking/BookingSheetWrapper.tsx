/**
 * BOOKING SHEET WRAPPER - MULTI-SECTOR EXAMPLE
 * 
 * This is a DEMONSTRATION of how to wrap the existing BookingSheet
 * with sector-specific terminology.
 * 
 * IMPLEMENTATION PATTERN:
 * 1. Fetch location data (including business_sector)
 * 2. Wrap BookingSheet with BusinessSectorProvider
 * 3. Update BookingSheet internals to use useTerminology()
 * 
 * This file shows the WRAPPER pattern.
 * To complete implementation, update BookingSheet.tsx itself.
 */

'use client';

import { useState, useEffect } from 'react';
import { BusinessSectorProvider } from '@/lib/contexts/business-sector-context';
import { BusinessSector } from '@/lib/types/terminology';
import { BookingSheet } from './BookingSheet';
import { createClient } from '@/lib/supabase/client';

interface BookingSheetWrapperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationId: string;
  locationName: string;
}

/**
 * Smart wrapper that fetches location sector and provides terminology context
 * 
 * Usage:
 * ```tsx
 * <BookingSheetWrapper
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   locationId={location.id}
 *   locationName={location.name}
 * />
 * ```
 */
export function BookingSheetWrapper({
  open,
  onOpenChange,
  locationId,
  locationName,
}: BookingSheetWrapperProps) {
  const [sector, setSector] = useState<BusinessSector | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && locationId) {
      fetchLocationSector();
    }
  }, [open, locationId]);

  const fetchLocationSector = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('locations')
        .select('business_sector')
        .eq('id', locationId)
        .single();

      if (error) throw error;

      setSector(data.business_sector as BusinessSector);
    } catch (error) {
      console.error('Error fetching location sector:', error);
      setSector('RESTAURANT'); // Fallback to default
    } finally {
      setLoading(false);
    }
  };

  if (loading && open) {
    return null; // Or a loading skeleton
  }

  return (
    <BusinessSectorProvider sector={sector}>
      <BookingSheet
        open={open}
        onOpenChange={onOpenChange}
        locationId={locationId}
        locationName={locationName}
      />
    </BusinessSectorProvider>
  );
}

/**
 * ALTERNATIVE PATTERN: Server-Side Wrapper
 * 
 * If you're rendering in a server component, pass sector directly:
 */

interface ServerBookingSheetWrapperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: {
    id: string;
    name: string;
    business_sector: BusinessSector;
  };
}

export function ServerBookingSheetWrapper({
  open,
  onOpenChange,
  location,
}: ServerBookingSheetWrapperProps) {
  return (
    <BusinessSectorProvider sector={location.business_sector}>
      <BookingSheet
        open={open}
        onOpenChange={onOpenChange}
        locationId={location.id}
        locationName={location.name}
      />
    </BusinessSectorProvider>
  );
}

