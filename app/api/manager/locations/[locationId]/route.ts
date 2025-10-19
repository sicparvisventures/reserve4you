import { NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/auth/dal';
import { checkTenantRole } from '@/lib/auth/tenant-dal';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{
    locationId: string;
  }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await verifyApiSession();
    const { locationId } = await params;
    const body = await request.json();

    const supabase = await createServiceClient();

    // Get location to verify tenant access
    const { data: location } = await supabase
      .from('locations')
      .select('tenant_id')
      .eq('id', locationId)
      .single();

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    // Verify user has access to tenant
    const hasAccess = await checkTenantRole(session.userId, location.tenant_id, ['OWNER', 'MANAGER']);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update location
    const { data: updatedLocation, error: updateError } = await supabase
      .from('locations')
      .update({
        name: body.name,
        slug: body.slug,
        description: body.description,
        cuisine: body.cuisine,
        price_range: body.price_range,
        address_json: body.address_json,
        phone: body.phone,
        email: body.email,
        website: body.website,
        opening_hours_json: body.opening_hours_json,
        slot_minutes: body.slot_minutes,
        buffer_minutes: body.buffer_minutes,
        is_public: body.is_public,
        is_active: body.is_active,
        image_url: body.image_url,
        image_public_id: body.image_public_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', locationId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(updatedLocation);
  } catch (error: any) {
    console.error('Error updating location:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update location' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await verifyApiSession();
    const { locationId } = await params;

    const supabase = await createServiceClient();

    // Get location
    const { data: location, error } = await supabase
      .from('locations')
      .select('*')
      .eq('id', locationId)
      .single();

    if (error) throw error;
    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    // Verify user has access
    const hasAccess = await checkTenantRole(session.userId, location.tenant_id, ['OWNER', 'MANAGER', 'STAFF']);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(location);
  } catch (error: any) {
    console.error('Error fetching location:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch location' },
      { status: 500 }
    );
  }
}
