import { redirect } from 'next/navigation';
import { verifySession, getTenantMembership } from '@/lib/auth/dal';
import { createClient } from '@/lib/supabase/server';
import { NotificationSettings } from '@/components/manager/NotificationSettings';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface NotificationSettingsPageProps {
  params: {
    tenantId: string;
  };
}

export default async function NotificationSettingsPage({ params }: NotificationSettingsPageProps) {
  const session = await verifySession();
  
  if (!session) {
    redirect('/login');
  }

  const membership = await getTenantMembership(params.tenantId);

  if (!membership) {
    redirect('/manager');
  }

  // Fetch tenant details
  const supabase = await createClient();
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', params.tenantId)
    .single();

  if (!tenant) {
    redirect('/manager');
  }

  // Fetch existing notification settings
  const { data: settings } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('tenant_id', params.tenantId)
    .is('location_id', null)
    .single();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="gap-2"
            >
              <Link href={`/manager/${params.tenantId}/dashboard`}>
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Terug naar Dashboard</span>
              </Link>
            </Button>
            <div className="h-8 w-px bg-border" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Notificatie-instellingen</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">{tenant.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <NotificationSettings
          tenantId={params.tenantId}
          initialSettings={settings}
        />
      </div>
    </div>
  );
}

