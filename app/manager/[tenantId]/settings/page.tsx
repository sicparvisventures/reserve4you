import { verifySession } from '@/lib/auth/dal';
import { checkTenantRole, getTenant, getTenantLocations, getTenantBilling } from '@/lib/auth/tenant-dal';
import { redirect } from 'next/navigation';
import { SettingsClient } from './SettingsClient';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface SettingsPageProps {
  params: Promise<{
    tenantId: string;
  }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const session = await verifySession();
  const { tenantId } = await params;
  
  // Verify user has access to this tenant
  const hasAccess = await checkTenantRole(session.userId, tenantId, ['OWNER', 'MANAGER']);
  if (!hasAccess) {
    redirect('/manager');
  }

  // Load tenant data
  const tenant = await getTenant(tenantId);
  if (!tenant) {
    redirect('/manager');
  }

  // Load all locations for this tenant
  const locations = await getTenantLocations(tenantId);

  // Load billing info
  const billing = await getTenantBilling(tenantId);

  // Load team members
  const supabase = await createServiceClient();
  const { data: memberships } = await supabase
    .from('memberships')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at');

  return (
    <SettingsClient
      tenantId={tenantId}
      tenant={tenant}
      locations={locations}
      billing={billing}
      memberships={memberships || []}
    />
  );
}

