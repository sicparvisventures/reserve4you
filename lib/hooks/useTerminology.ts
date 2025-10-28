/**
 * USE TERMINOLOGY HOOK
 * 
 * Convenient hook to access sector-specific terminology in any component
 * Automatically adapts UI labels based on current business sector
 */

'use client';

import { TerminologySet } from '@/lib/types/terminology';
import { useBusinessSector } from '@/lib/contexts/business-sector-context';

/**
 * Get terminology for the current business sector
 * 
 * This is the PRIMARY hook for accessing dynamic UI labels
 * 
 * @returns Complete terminology set (booking, resource, customer, staff, service, location)
 * 
 * @example Basic Usage
 * ```tsx
 * function BookingList() {
 *   const terms = useTerminology();
 *   
 *   return (
 *     <div>
 *       <h1>{terms.booking.plural}</h1>  {// "Reserveringen" or "Afspraken"}
 *       <Button>{terms.booking.verb}</Button>  {// "Reserveren" or "Boeken"}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example With Shorthand
 * ```tsx
 * function CustomerList() {
 *   const t = useTerminology();
 *   
 *   return <h2>{t.customer.plural}</h2>;  {// "Gasten" or "Klanten" or "Patiënten"}
 * }
 * ```
 * 
 * @example In Forms
 * ```tsx
 * function BookingForm() {
 *   const t = useTerminology();
 *   
 *   return (
 *     <Form>
 *       <Label>{t.customer.singular} Naam</Label>
 *       <Input placeholder={`${t.customer.singular} naam`} />
 *       
 *       <Label>Aantal {t.customer.plural}</Label>
 *       <Input type="number" />
 *       
 *       <Button type="submit">
 *         {t.booking.verb}
 *       </Button>
 *     </Form>
 *   );
 * }
 * ```
 * 
 * @example Dynamic Page Titles
 * ```tsx
 * function DashboardPage() {
 *   const t = useTerminology();
 *   
 *   return (
 *     <>
 *       <title>{t.booking.plural} - Dashboard</title>
 *       <h1>Vandaag's {t.booking.plural}</h1>
 *       <Stats>
 *         <Stat label={t.customer.plural} value={125} />
 *         <Stat label={t.staff.plural} value={8} />
 *       </Stats>
 *     </>
 *   );
 * }
 * ```
 * 
 * @example With Articles (Dutch Grammar)
 * ```tsx
 * function ResourceSelector() {
 *   const t = useTerminology();
 *   
 *   return (
 *     <Select>
 *       <SelectTrigger>
 *         Kies {t.resource.article} {t.resource.singular}
 *         {// "Kies de tafel" or "Kies het kantoor"}
 *       </SelectTrigger>
 *     </Select>
 *   );
 * }
 * ```
 */
export function useTerminology(): TerminologySet {
  const { terminology } = useBusinessSector();
  return terminology;
}

/**
 * Type-safe helper to get a specific term
 * Useful when you only need one specific term
 * 
 * @example
 * ```tsx
 * const bookingVerb = useTerm('booking', 'verb');  // "Reserveren"
 * const customerPlural = useTerm('customer', 'plural');  // "Gasten"
 * ```
 */
export function useTerm<
  K extends keyof TerminologySet,
  T extends keyof TerminologySet[K]
>(
  category: K,
  type: T
): TerminologySet[K][T] {
  const terminology = useTerminology();
  return terminology[category][type];
}

