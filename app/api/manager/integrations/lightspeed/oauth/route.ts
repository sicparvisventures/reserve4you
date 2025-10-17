import { NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/auth/dal';
import { getLocation } from '@/lib/auth/tenant-dal';
import { checkTenantRole } from '@/lib/auth/tenant-dal';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await verifyApiSession();
    const body = await request.json();
    const { locationId, returnUrl } = body;

    // Verify user has access to location
    const location = await getLocation(locationId);
    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    const hasAccess = await checkTenantRole(session.userId, location.tenant_id, ['OWNER', 'MANAGER']);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // For MVP, Lightspeed integration is stubbed out
    // In production, this would create OAuth URL for Lightspeed
    const clientId = process.env.LIGHTSPEED_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/manager/integrations/lightspeed/callback`;
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Lightspeed integration is not configured' },
        { status: 501 }
      );
    }

    const oauthUrl = `https://cloud.lightspeedapp.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${locationId}`;

    return NextResponse.json({ url: oauthUrl });
  } catch (error: any) {
    console.error('Error creating Lightspeed OAuth link:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create OAuth link' },
      { status: 500 }
    );
  }
}

