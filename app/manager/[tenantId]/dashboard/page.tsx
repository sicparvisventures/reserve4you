import { verifySession } from '@/lib/auth/dal';
import { getTenant, getTenantLocations, getTenantBilling } from '@/lib/auth/tenant-dal';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProfessionalDashboard } from './ProfessionalDashboard';
import { AIChatbot } from '@/components/ai/AIChatbot';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard - Reserve4You Manager',
  description: 'Beheer je reserveringen, locaties en instellingen',
};

// Force dynamic rendering - no cache for billing data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
  let stats: any = {};
  
  if (locations.length > 0) {
    const supabase = await createClient();
    
    // Get all bookings for tenant's locations
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select(`
        *,
        location:locations(id, name, slug),
        table:tables(id, table_number, seats)
      `)
      .in('location_id', locations.map(l => l.id))
      .gte('booking_date', new Date().toISOString().split('T')[0])
      .order('booking_date', { ascending: true })
      .order('booking_time', { ascending: true })
      .limit(100);
    
    bookings = bookingsData || [];
    
    // Calculate combined stats for all locations
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = bookings.filter(b => b.booking_date === today);
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
    const pendingBookings = bookings.filter(b => b.status === 'pending');
    
    stats = {
      totalBookings: bookings.length,
      todayBookings: todayBookings.length,
      confirmedBookings: confirmedBookings.length,
      pendingBookings: pendingBookings.length,
      totalGuests: todayBookings.reduce((sum, b) => sum + b.number_of_guests, 0),
      totalLocations: locations.length,
      activeLocations: locations.filter(l => l.is_published).length,
    };
  }

  return (
    <>
      <ProfessionalDashboard
        tenant={tenant}
        role={role}
        locations={locations}
        bookings={bookings}
        billing={billing}
        stats={stats}
      />
      
      {/* AI Chatbot Assistant */}
      <AIChatbot tenantId={tenantId} />
    </>
  );
}

