import { NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/auth/dal';
import { checkTenantRole } from '@/lib/auth/tenant-dal';
import { getTenantUsage } from '@/lib/billing/quota';

export const dynamic = 'force-dynamic';

/**
 * GET /api/manager/usage?tenantId=xxx
 * 
 * Returns usage statistics and quota limits for a tenant
 */
export async function GET(request: Request) {
  try {
    const session = await verifyApiSession();
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }

    // Verify user has access to tenant
    const hasAccess = await checkTenantRole(session.userId, tenantId, ['OWNER', 'MANAGER', 'STAFF']);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get usage statistics
    const usage = await getTenantUsage(tenantId);

    return NextResponse.json(usage);
  } catch (error: any) {
    console.error('Error fetching usage:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch usage' },
      { status: 500 }
    );
  }
}

