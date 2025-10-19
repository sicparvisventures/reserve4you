import { NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/auth/dal';
import { checkTenantRole } from '@/lib/auth/tenant-dal';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{
    tenantId: string;
  }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await verifyApiSession();
    const { tenantId } = await params;
    const body = await request.json();

    // Verify user has OWNER access
    const hasAccess = await checkTenantRole(session.userId, tenantId, ['OWNER']);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = await createServiceClient();

    // Update tenant
    const { data: tenant, error: updateError } = await supabase
      .from('tenants')
      .update({
        name: body.name,
        brand_color: body.brand_color,
        logo_url: body.logo_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenantId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(tenant);
  } catch (error: any) {
    console.error('Error updating tenant:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update tenant' },
      { status: 500 }
    );
  }
}
