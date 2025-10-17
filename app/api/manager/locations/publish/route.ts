import { NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/auth/dal';
import { getLocation, getTenantBilling, canPublishLocation } from '@/lib/auth/tenant-dal';
import { checkTenantRole } from '@/lib/auth/tenant-dal';
import { createServiceClient } from '@/lib/supabase/server';
import { publishLocationSchema } from '@/lib/validation/manager';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await verifyApiSession();
    const body = await request.json();
    const validated = publishLocationSchema.parse(body);

    // Verify user has access to location
    const location = await getLocation(validated.locationId);
    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    const hasAccess = await checkTenantRole(session.userId, location.tenant_id, ['OWNER', 'MANAGER']);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if location can be published
    const canPublish = await canPublishLocation(validated.locationId);
    if (!canPublish.allowed) {
      return NextResponse.json(
        { error: canPublish.reason || 'Cannot publish location' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Publish location
    const { data, error } = await supabase
      .from('locations')
      .update({ is_public: true })
      .eq('id', validated.locationId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, location: data });
  } catch (error: any) {
    console.error('Error publishing location:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to publish location' },
      { status: 500 }
    );
  }
}

