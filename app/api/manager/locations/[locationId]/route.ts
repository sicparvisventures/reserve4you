import { NextRequest, NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/auth/dal';
import { createServiceClient } from '@/lib/supabase/server';
import { checkTenantRole } from '@/lib/auth/tenant-dal';

/**
 * DELETE /api/manager/locations/[locationId]
 * Delete a location and all associated data (cascade)
 * Only OWNER or MANAGER can delete
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { locationId: string } }
) {
  try {
    const session = await verifyApiSession();
    const { locationId } = params;

    // Get location to find tenant_id
    const supabase = await createServiceClient();
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .select('tenant_id, name')
      .eq('id', locationId)
      .single();

    if (locationError || !location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    // Verify user is OWNER or MANAGER of this tenant
    const hasAccess = await checkTenantRole(session.userId, location.tenant_id, ['OWNER', 'MANAGER']);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Only tenant owners and managers can delete locations' },
        { status: 403 }
      );
    }

    // Call the cascade delete function
    const { data, error } = await supabase.rpc('delete_location_cascade', {
      p_location_id: locationId,
      p_requesting_user_id: session.userId,
    });

    if (error) {
      console.error('Error deleting location:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to delete location' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Location deleted successfully' });
  } catch (error: any) {
    console.error('Error in DELETE /api/manager/locations/[locationId]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

