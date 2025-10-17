import { NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/auth/dal';
import { getLocation } from '@/lib/auth/tenant-dal';
import { checkTenantRole } from '@/lib/auth/tenant-dal';
import Stripe from 'stripe';
import { config } from '@/lib/config';

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2025-02-24.acacia',
});

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await verifyApiSession();
    const body = await request.json();
    const { locationId, returnUrl, refreshUrl } = body;

    // Verify user has access to location
    const location = await getLocation(locationId);
    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    const hasAccess = await checkTenantRole(session.userId, location.tenant_id, ['OWNER', 'MANAGER']);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Create or retrieve Stripe Connect account
    // For MVP, we'll create an account link for Express accounts
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'NL',
      email: location.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: {
        locationId: locationId,
        tenantId: location.tenant_id,
      },
    });

    // Create account link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    // TODO: Save Stripe account ID to database (will be done via webhook)

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    console.error('Error creating Stripe Connect link:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create Stripe Connect link' },
      { status: 500 }
    );
  }
}

