import { verifySession } from '@/lib/auth/dal';
import { getTenant, getTenantLocations, getTenantBilling } from '@/lib/auth/tenant-dal';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProfessionalDashboard } from './ProfessionalDashboard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard - Reserve4You Manager',
  description: 'Beheer je reserveringen, locaties en instellingen',
};

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const session = await verifySession();
  const { tenantId } = await params;
  const { tenant, role } = await getTenant(tenantId);
  const locations = await getTenantLocations(tenantId);
  const billing = await getTenantBilling(tenantId);

  // Get bookings for all locations (if any exist)
  let bookings = [];
  if (locations.length > 0) {
    const supabase = await createClient();
    const { data } = await supabase
      .from('bookings')
      .select(`
        *,
        location:locations(name, slug),
        table:tables(name)
      `)
      .in('location_id', locations.map(l => l.id))
      .gte('start_ts', new Date().toISOString())
      .order('start_ts', { ascending: true })
      .limit(100);
    bookings = data || [];
  }

  return (
    <ProfessionalDashboard
      tenant={tenant}
      role={role}
      locations={locations}
      bookings={bookings}
      billing={billing}
    />
  );
}

