/**
 * BUSINESS SECTOR CONTEXT PROVIDER
 * 
 * Provides current location's business sector to all child components
 * This enables dynamic terminology throughout the app without prop drilling
 */

'use client';

import { createContext, useContext, ReactNode } from 'react';
import { BusinessSector, TerminologySet } from '@/lib/types/terminology';
import { getTerminology } from '@/lib/terminology';

interface BusinessSectorContextValue {
  sector: BusinessSector | null;
  terminology: TerminologySet;
}

const BusinessSectorContext = createContext<BusinessSectorContextValue>({
  sector: null,
  terminology: getTerminology(null) // Defaults to RESTAURANT
});

interface BusinessSectorProviderProps {
  sector?: BusinessSector | null;
  children: ReactNode;
}

/**
 * Provider component to wrap around app sections that need sector-specific terminology
 * 
 * Usage in manager portal (per location):
 * ```tsx
 * <BusinessSectorProvider sector={location.business_sector}>
 *   <DashboardContent />
 * </BusinessSectorProvider>
 * ```
 * 
 * Usage in consumer app (viewing specific location):
 * ```tsx
 * <BusinessSectorProvider sector={location.business_sector}>
 *   <LocationDetails />
 *   <BookingForm />
 * </BusinessSectorProvider>
 * ```
 */
export function BusinessSectorProvider({ sector, children }: BusinessSectorProviderProps) {
  const terminology = getTerminology(sector);
  
  return (
    <BusinessSectorContext.Provider value={{ sector: sector || null, terminology }}>
      {children}
    </BusinessSectorContext.Provider>
  );
}

/**
 * Hook to access current business sector and terminology
 * Must be used within a BusinessSectorProvider
 * 
 * @returns Current sector and complete terminology set
 * 
 * @example
 * ```tsx
 * function BookingButton() {
 *   const { sector, terminology: t } = useBusinessSector();
 *   
 *   return (
 *     <Button>
 *       {t.booking.verb} {// "Reserveren", "Boeken", or "Plannen"}
 *     </Button>
 *   );
 * }
 * ```
 */
export function useBusinessSector(): BusinessSectorContextValue {
  const context = useContext(BusinessSectorContext);
  
  if (!context) {
    throw new Error('useBusinessSector must be used within BusinessSectorProvider');
  }
  
  return context;
}

