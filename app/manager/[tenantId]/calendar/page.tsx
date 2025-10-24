import { verifySession } from '@/lib/auth/dal';
import { getTenant, getTenantLocations } from '@/lib/auth/tenant-dal';
import { redirect } from 'next/navigation';
import { MultiLocationCalendar } from '@/components/calendar/MultiLocationCalendar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kalender Overzicht | Reserve4You',
  description: 'Bekijk alle reserveringen van al je locaties in één kalender overzicht',
};

export default async function CalendarOverviewPage({
  params,
}: {
  params: { tenantId: string };
}) {
  const { tenantId } = params;

  // Verify session and permissions
  const session = await verifySession();
  if (!session) {
    redirect('/auth/login');
  }

  // Get tenant and locations
  const tenant = await getTenant(tenantId);
  if (!tenant) {
    redirect('/manager');
  }

  // Check if user has access to this tenant via memberships
  const { createClient } = await import('@/lib/supabase/server');
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
  const locations = await getTenantLocations(tenantId);

  if (!locations || locations.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6">
            <Link href={`/manager/${tenantId}/dashboard`}>
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Terug naar Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Kalender Overzicht</h1>
                <p className="text-muted-foreground">
                  Alle reserveringen van al je locaties
                </p>
              </div>
            </div>
          </div>

          {/* Empty state */}
          <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg">
            <div className="text-center">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Geen locaties gevonden</h3>
              <p className="text-muted-foreground mb-4">
                Voeg eerst een locatie toe om reserveringen te beheren
              </p>
              <Button asChild>
                <Link href={`/manager/${tenantId}/dashboard`}>
                  Ga naar Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/manager/${tenantId}/dashboard`}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Terug naar Dashboard
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Kalender Overzicht</h1>
                <p className="text-muted-foreground">
                  Bekijk en beheer alle reserveringen van {locations.length} {locations.length === 1 ? 'locatie' : 'locaties'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Location Calendar */}
        <MultiLocationCalendar
          tenantId={tenantId}
          locations={locations.map(loc => ({
            id: loc.id,
            name: loc.name,
            address: loc.address
          }))}
        />
      </div>
    </div>
  );
}

