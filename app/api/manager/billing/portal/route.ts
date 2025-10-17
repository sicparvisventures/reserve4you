import { NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/auth/dal';
import { checkTenantRole, getTenantBilling } from '@/lib/auth/tenant-dal';
import Stripe from 'stripe';
import { config } from '@/lib/config';

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2025-02-24.acacia',
});

export const dynamic = 'force-dynamic';

/**
 * POST /api/manager/billing/portal
 * 
 * Creates a Stripe Customer Portal session for subscription management
 */
export async function POST(request: Request) {
  try {
    const session = await verifyApiSession();
    const body = await request.json();
    const { tenantId, returnUrl } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }

    // Verify user is owner
    const hasAccess = await checkTenantRole(session.userId, tenantId, ['OWNER']);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Only owners can access billing' }, { status: 403 });
    }

    // Get billing state
    const billing = await getTenantBilling(tenantId);
    if (!billing?.stripe_customer_id) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 404 });
    }

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: billing.stripe_customer_id,
      return_url: returnUrl || `${config.app.url}/manager/${tenantId}/dashboard`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create portal session' },
      { status: 500 }
    );
  }
}

