import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/auth/dal';
import { getTenant } from '@/lib/auth/tenant-dal';
import { createClient } from '@/lib/supabase/server';
import { MultiLocationCRM } from '@/components/crm/MultiLocationCRM';

export const dynamic = 'force-dynamic';

export default async function CRMOverviewPage({
  params,
}: {
  params: { tenantId: string };
}) {
  const { tenantId } = params;
  
  const session = await verifySession();
  if (!session) {
    redirect('/auth/login');
  }

  const tenant = await getTenant(tenantId);
  if (!tenant) {
    redirect('/manager');
  }

  // Check if user has access to this tenant via memberships
  const supabase = await createClient();
  
  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('tenant_id', tenantId)
    .eq('user_id', session.userId)
    .single();

  if (!membership) {
    redirect('/manager');
  }

  // Get all locations for this tenant
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name, address, city')
    .eq('tenant_id', tenantId)
    .eq('is_published', true)
    .order('name');

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">CRM Overzicht</h1>
          <p className="text-muted-foreground">
            Alle gasten en relaties voor {tenant.name}
          </p>
        </div>

        {/* Multi-location CRM Component */}
        <MultiLocationCRM 
          tenantId={tenantId} 
          locations={locations || []} 
        />
      </div>
    </div>
  );
}

