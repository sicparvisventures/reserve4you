import { NextRequest, NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/auth/dal';
import { createServiceClient } from '@/lib/supabase/server';
import { checkTenantRole } from '@/lib/auth/tenant-dal';

/**
 * DELETE /api/manager/tenants/[tenantId]
 * Delete a tenant and all associated data (cascade)
 * Only OWNER can delete
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const session = await verifyApiSession();
    const { tenantId } = await params;

    // Verify user is OWNER of this tenant
    const hasAccess = await checkTenantRole(session.userId, tenantId, ['OWNER']);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Only tenant owners can delete tenants' },
        { status: 403 }
      );
    }

    // Use service client to bypass RLS for cascade delete
    const supabase = await createServiceClient();

    // Call the cascade delete function
    const { data, error } = await supabase.rpc('delete_tenant_cascade', {
      p_tenant_id: tenantId,
      p_requesting_user_id: session.userId,
    });

    if (error) {
      console.error('Error deleting tenant:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to delete tenant' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Tenant deleted successfully' });
  } catch (error: any) {
    console.error('Error in DELETE /api/manager/tenants/[tenantId]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

