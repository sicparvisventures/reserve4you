import { verifySession } from '@/lib/auth/dal';
import { getTenant } from '@/lib/auth/tenant-dal';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { LocationManagement } from './LocationManagement';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Locatie Beheer - Reserve4You Manager',
  description: 'Beheer tafels, reserveringen en instellingen voor deze locatie',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LocationPage({
  params,
}: {
  params: Promise<{ tenantId: string; locationId: string }>;
}) {
  const session = await verifySession();
  const { tenantId, locationId } = await params;
  const { tenant, role } = await getTenant(tenantId);

  const supabase = await createClient();

  // Get location details
  const { data: location, error: locationError } = await supabase
    .from('locations')
    .select('*')
    .eq('id', locationId)
    .eq('tenant_id', tenantId)
    .single();

  if (locationError || !location) {
    notFound();
  }

  // Get tables for this location
  const { data: tables } = await supabase
    .from('tables')
    .select('*')
    .eq('location_id', locationId)
    .order('table_number', { ascending: true });

  // Get bookings for this location (upcoming only)
  const today = new Date().toISOString().split('T')[0];
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      table:tables(id, table_number, seats)
    `)
    .eq('location_id', locationId)
    .gte('booking_date', today)
    .order('booking_date', { ascending: true })
    .order('booking_time', { ascending: true })
    .limit(50);

  // Calculate stats for this location
  const todayBookings = bookings?.filter(b => b.booking_date === today) || [];
  const confirmedBookings = bookings?.filter(b => b.status === 'confirmed') || [];
  const pendingBookings = bookings?.filter(b => b.status === 'pending') || [];

  const stats = {
    totalBookings: bookings?.length || 0,
    todayBookings: todayBookings.length,
    confirmedBookings: confirmedBookings.length,
    pendingBookings: pendingBookings.length,
    totalGuests: todayBookings.reduce((sum, b) => sum + b.number_of_guests, 0),
    totalTables: tables?.length || 0,
    totalSeats: tables?.reduce((sum, t) => sum + t.seats, 0) || 0,
  };

  return (
    <LocationManagement
      tenant={tenant}
      role={role}
      location={location}
      tables={tables || []}
      bookings={bookings || []}
      stats={stats}
    />
  );
}
