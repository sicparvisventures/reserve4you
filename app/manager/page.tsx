import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/auth/dal';
import { getUserTenants } from '@/lib/auth/tenant-dal';
import { createClient } from '@/lib/supabase/server';
import { ManagerClient } from './ManagerClient';
import type { Metadata } from 'next';

interface Tenant {
  id: string;
  name: string;
  brand_color: string | null;
  role: string;
  location_count: number;
}

export const metadata: Metadata = {
  title: 'Manager Portal - Reserve4You',
  description: 'Beheer je restaurant(s) met Reserve4You Manager Portal',
};

export default async function ManagerPage() {
  const session = await verifySession();
  
  // Check if user is a venue user first
  const supabase = await createClient();
  const { data: venueUser } = await supabase.rpc('get_venue_user_by_auth_id', {
    p_auth_user_id: session.userId
  });

  // If this is a venue user, redirect to their dashboard
  if (venueUser && venueUser.length > 0) {
    const user = venueUser[0];
    
    if (!user.is_active) {
      redirect('/?error=account_disabled');
    }

    // Determine dashboard URL based on access
    if (user.all_locations || !user.location_ids || user.location_ids.length === 0) {
      if (user.can_view_dashboard) {
        redirect(`/manager/${user.tenant_id}/dashboard`);
      } else {
        // Get first location
        const { data: locations } = await supabase
          .from('locations')
          .select('id')
          .eq('tenant_id', user.tenant_id)
          .eq('is_active', true)
          .limit(1);
        
        if (locations && locations.length > 0) {
          redirect(`/manager/${user.tenant_id}/location/${locations[0].id}`);
        }
      }
    } else if (user.location_ids.length === 1) {
      redirect(`/manager/${user.tenant_id}/location/${user.location_ids[0]}`);
    } else {
      if (user.can_view_dashboard) {
        redirect(`/manager/${user.tenant_id}/dashboard`);
      } else {
        redirect(`/manager/${user.tenant_id}/location/${user.location_ids[0]}`);
      }
    }
  }

  // Regular owner/manager flow
  const tenants = await getUserTenants(session.userId) as unknown as Tenant[];

  // If user has no tenants, redirect to onboarding
  if (tenants.length === 0) {
    redirect('/manager/onboarding?step=1');
  }

  // If user has exactly one tenant, redirect to that tenant's dashboard
  if (tenants.length === 1) {
    redirect(`/manager/${tenants[0].id}/dashboard`);
  }

  // If user has multiple tenants, show selection screen with delete option
  return <ManagerClient tenants={tenants} />;
}
