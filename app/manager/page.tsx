import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/auth/dal';
import { getUserTenants } from '@/lib/auth/tenant-dal';
import { ManagerClient } from './ManagerClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Manager Portal - Reserve4You',
  description: 'Beheer je restaurant(s) met Reserve4You Manager Portal',
};

export default async function ManagerPage() {
  const session = await verifySession();
  const tenants = await getUserTenants(session.userId);

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
