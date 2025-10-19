import { Suspense } from 'react';
import { verifySession, getUser } from '@/lib/auth/dal';
import { getConsumer, getConsumerBookings, getConsumerFavorites, getUserTenants } from '@/lib/auth/tenant-dal';
import { ProfileClient } from './ProfileClient';
import { createServiceClient } from '@/lib/supabase/server';

export default async function ProfilePage() {
  const session = await verifySession();
  const user = await getUser();
  const consumer = await getConsumer();
  const bookings = await getConsumerBookings();
  const favorites = await getConsumerFavorites();
  
  // Get user's tenants (for subscription management)
  const tenants = await getUserTenants(session.userId) as any[];
  
  // Get billing state for each tenant
  const supabase = await createServiceClient();
  const tenantsWithBilling = await Promise.all(
    tenants.map(async (tenant) => {
      const { data: billingState } = await supabase
        .from('billing_state')
        .select('*')
        .eq('tenant_id', tenant.id)
        .single();
      
      return {
        ...tenant,
        billingState: billingState || null,
      };
    })
  );

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ProfileClient
        user={user}
        consumer={consumer}
        bookings={bookings}
        favorites={favorites}
        tenants={tenantsWithBilling}
      />
    </Suspense>
  );
}

