/**
 * Stripe Connect Onboarding API
 * 
 * POST /api/manager/stripe/connect-onboarding
 * 
 * Creëert een Stripe Connect account voor een restaurant en geeft de onboarding link terug.
 * Dit stelt restaurants in staat om betalingen te ontvangen voor reserveringen.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/auth/dal';
import { getLocation, checkTenantRole } from '@/lib/auth/tenant-dal';
import { createServiceClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import { config } from '@/lib/config';

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2025-02-24.acacia'
});

export async function POST(request: NextRequest) {
  try {
    const session = await verifyApiSession();
    const body = await request.json();
    const { locationId } = body;

    if (!locationId) {
      return NextResponse.json(
        { error: 'Location ID is verplicht' },
        { status: 400 }
      );
    }

    // Verify user has access to location
    const location = await getLocation(locationId);
    if (!location) {
      return NextResponse.json(
        { error: 'Locatie niet gevonden' },
        { status: 404 }
      );
    }

    const hasAccess = await checkTenantRole(
      session.userId,
      location.tenant_id,
      ['OWNER', 'MANAGER']
    );
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Geen toegang tot deze locatie' },
        { status: 403 }
      );
    }

    const supabase = await createServiceClient();

    // Check if location already has a Stripe account
    if (location.stripe_account_id) {
      // Get existing account
      const account = await stripe.accounts.retrieve(location.stripe_account_id);

      // If charges and payouts are already enabled, account is ready
      if (account.charges_enabled && account.payouts_enabled) {
        return NextResponse.json({
          accountId: location.stripe_account_id,
          status: 'ENABLED',
          message: 'Stripe account is al volledig geactiveerd'
        });
      }

      // Otherwise, create a new onboarding link
      const accountLink = await stripe.accountLinks.create({
        account: location.stripe_account_id,
        refresh_url: `${config.app.url}/manager/locations/${locationId}/settings?stripe_refresh=true`,
        return_url: `${config.app.url}/manager/locations/${locationId}/settings?stripe_success=true`,
        type: 'account_onboarding',
      });

      return NextResponse.json({
        accountId: location.stripe_account_id,
        onboardingUrl: accountLink.url,
        status: 'PENDING'
      });
    }

    // Create new Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'standard', // Standard account - restaurant heeft volledige controle
      country: 'NL', // Netherlands
      email: location.email || undefined,
      business_type: 'company',
      metadata: {
        location_id: locationId,
        tenant_id: location.tenant_id,
        location_name: location.name
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // Create account onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${config.app.url}/manager/locations/${locationId}/settings?stripe_refresh=true`,
      return_url: `${config.app.url}/manager/locations/${locationId}/settings?stripe_success=true`,
      type: 'account_onboarding',
    });

    // Update location with Stripe account ID
    const { error: updateError } = await supabase
      .from('locations')
      .update({
        stripe_account_id: account.id,
        stripe_account_status: 'PENDING',
        stripe_account_created_at: new Date().toISOString(),
        stripe_charges_enabled: false,
        stripe_payouts_enabled: false,
        stripe_onboarding_completed: false,
      })
      .eq('id', locationId);

    if (updateError) {
      console.error('Error updating location with Stripe account:', updateError);
      throw updateError;
    }

    return NextResponse.json({
      accountId: account.id,
      onboardingUrl: accountLink.url,
      status: 'PENDING'
    });

  } catch (error: any) {
    console.error('Stripe Connect onboarding error:', error);
    return NextResponse.json(
      { error: error.message || 'Er ging iets mis bij het aanmaken van Stripe account' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/manager/stripe/connect-onboarding?locationId=xxx
 * 
 * Controleert de status van een Stripe Connect account
 */
export async function GET(request: NextRequest) {
  try {
    const session = await verifyApiSession();
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');

    if (!locationId) {
      return NextResponse.json(
        { error: 'Location ID is verplicht' },
        { status: 400 }
      );
    }

    // Verify user has access to location
    const location = await getLocation(locationId);
    if (!location) {
      return NextResponse.json(
        { error: 'Locatie niet gevonden' },
        { status: 404 }
      );
    }

    const hasAccess = await checkTenantRole(
      session.userId,
      location.tenant_id,
      ['OWNER', 'MANAGER']
    );
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Geen toegang tot deze locatie' },
        { status: 403 }
      );
    }

    // No Stripe account yet
    if (!location.stripe_account_id) {
      return NextResponse.json({
        status: 'NOT_CONNECTED',
        chargesEnabled: false,
        payoutsEnabled: false
      });
    }

    // Fetch account from Stripe
    const account = await stripe.accounts.retrieve(location.stripe_account_id);

    // Update location with latest status
    const supabase = await createServiceClient();
    await supabase
      .from('locations')
      .update({
        stripe_charges_enabled: account.charges_enabled || false,
        stripe_payouts_enabled: account.payouts_enabled || false,
        stripe_onboarding_completed: account.details_submitted || false,
        stripe_account_status: account.charges_enabled && account.payouts_enabled 
          ? 'ENABLED' 
          : account.details_submitted 
            ? 'RESTRICTED' 
            : 'PENDING'
      })
      .eq('id', locationId);

    return NextResponse.json({
      status: account.charges_enabled && account.payouts_enabled 
        ? 'ENABLED' 
        : account.details_submitted 
          ? 'RESTRICTED' 
          : 'PENDING',
      chargesEnabled: account.charges_enabled || false,
      payoutsEnabled: account.payouts_enabled || false,
      detailsSubmitted: account.details_submitted || false,
      accountId: account.id
    });

  } catch (error: any) {
    console.error('Stripe Connect status check error:', error);
    return NextResponse.json(
      { error: error.message || 'Er ging iets mis bij het ophalen van Stripe account status' },
      { status: 500 }
    );
  }
}

