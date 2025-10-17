import { verifySession } from '@/lib/auth/dal';
import { checkTenantRole, getTenant, getTenantLocations, getTenantBilling } from '@/lib/auth/tenant-dal';
import { redirect } from 'next/navigation';
import { SettingsWizard } from '@/app/manager/[tenantId]/settings/SettingsWizard';
import { createServiceClient } from '@/lib/supabase/server';

interface SettingsPageProps {
  params: {
    tenantId: string;
  };
  searchParams: {
    locationId?: string;
  };
}

export default async function SettingsPage({ params, searchParams }: SettingsPageProps) {
  const session = await verifySession();
  
  // Verify user has access to this tenant
  const hasAccess = await checkTenantRole(session.userId, params.tenantId, ['OWNER', 'MANAGER']);
  if (!hasAccess) {
    redirect('/manager');
  }

  // Load tenant data
  const tenant = await getTenant(params.tenantId);
  if (!tenant) {
    redirect('/manager');
  }

  // Load all locations for this tenant
  const locations = await getTenantLocations(params.tenantId);
  
  // Use specified locationId or first location
  const targetLocationId = searchParams.locationId || locations[0]?.id;
  const location = locations.find(l => l.id === targetLocationId) || locations[0] || null;

  // Load billing info
  const billing = await getTenantBilling(params.tenantId);

  // Load all related data for the location if it exists
  const supabase = await createServiceClient();
  
  let tables = [];
  let shifts = [];
  let policy = null;
  let posIntegration = null;

  if (location) {
    // Load tables
    const { data: tablesData } = await supabase
      .from('tables')
      .select('*')
      .eq('location_id', location.id)
      .order('name');
    tables = tablesData || [];

    // Load shifts
    const { data: shiftsData } = await supabase
      .from('shifts')
      .select('*')
      .eq('location_id', location.id)
      .order('name');
    shifts = shiftsData || [];

    // Load policy
    const { data: policyData } = await supabase
      .from('policies')
      .select('*')
      .eq('location_id', location.id)
      .single();
    policy = policyData || null;

    // Load POS integration
    const { data: posData } = await supabase
      .from('pos_integrations')
      .select('*')
      .eq('location_id', location.id)
      .single();
    posIntegration = posData || null;
  }

  return (
    <div className="min-h-screen bg-background">
      <SettingsWizard 
        tenantId={params.tenantId}
        initialTenant={tenant}
        initialLocation={location}
        initialTables={tables}
        initialShifts={shifts}
        initialPolicy={policy}
        initialBilling={billing}
        initialPosIntegration={posIntegration}
        allLocations={locations}
      />
    </div>
  );
}

