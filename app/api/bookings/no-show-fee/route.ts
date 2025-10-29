/**
 * No-Show Fee API
 * 
 * POST /api/bookings/no-show-fee
 * 
 * Rekent een no-show fee aan voor klanten die niet zijn komen opdagen.
 * Gebruikt een pre-authorized payment of creëert een nieuwe charge.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/auth/dal';
import { checkTenantRole } from '@/lib/auth/tenant-dal';
import { createServiceClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import { config } from '@/lib/config';

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2025-02-24.acacia'
});

interface NoShowFeeRequest {
  bookingId: string;
  customAmount?: number; // Optioneel, anders wordt policy gebruikt
}

export async function POST(request: NextRequest) {
  try {
    // Verify manager authentication
    const session = await verifyApiSession();
    const body: NoShowFeeRequest = await request.json();
    const { bookingId, customAmount } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is verplicht' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Haal booking op
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        location:locations!inner(
          id,
          name,
          tenant_id,
          stripe_account_id,
          stripe_charges_enabled
        ),
        policy:policies!location_id(
          no_show_fee_enabled,
          no_show_fee_cents,
          charge_no_show_fee_automatically
        )
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Reservering niet gevonden' },
        { status: 404 }
      );
    }

    // Verify user has permission
    const hasAccess = await checkTenantRole(
      session.userId,
      booking.location.tenant_id,
      ['OWNER', 'MANAGER']
    );
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Geen toegang tot deze locatie' },
        { status: 403 }
      );
    }

    // Check if booking is no-show
    if (booking.status !== 'NO_SHOW') {
      return NextResponse.json(
        { error: 'Alleen no-show reserveringen kunnen een fee krijgen' },
        { status: 400 }
      );
    }

    // Check if location has Stripe enabled
    if (!booking.location.stripe_account_id || !booking.location.stripe_charges_enabled) {
      return NextResponse.json(
        { error: 'Dit restaurant heeft nog geen betalingen geactiveerd' },
        { status: 400 }
      );
    }

    // Get policy
    const policy = Array.isArray(booking.policy) ? booking.policy[0] : booking.policy;

    if (!policy?.no_show_fee_enabled) {
      return NextResponse.json(
        { error: 'No-show fees zijn niet geactiveerd voor dit restaurant' },
        { status: 400 }
      );
    }

    // Determine fee amount
    const feeAmountCents = customAmount !== undefined 
      ? customAmount 
      : (policy.no_show_fee_cents || 0);

    if (feeAmountCents <= 0) {
      return NextResponse.json(
        { error: 'No-show fee bedrag moet groter zijn dan €0' },
        { status: 400 }
      );
    }

    // Minimum €0.50 (Stripe minimum)
    if (feeAmountCents < 50) {
      return NextResponse.json(
        { error: 'Bedrag te laag (minimum €0.50)' },
        { status: 400 }
      );
    }

    let chargeResult;

    // Check if there's a pre-authorized payment we can capture
    if (booking.stripe_payment_intent_id && booking.payment_type === 'PRE_AUTH') {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        booking.stripe_payment_intent_id
      );

      if (paymentIntent.status === 'requires_capture') {
        // Capture the pre-authorized amount
        const captureAmount = Math.min(feeAmountCents, paymentIntent.amount);
        
        chargeResult = await stripe.paymentIntents.capture(
          booking.stripe_payment_intent_id,
          { amount_to_capture: captureAmount }
        );

        // Update booking
        await supabase
          .from('bookings')
          .update({
            payment_status: 'PAID',
            payment_captured_amount_cents: captureAmount,
            payment_completed_at: new Date().toISOString(),
            payment_type: 'NO_SHOW_FEE',
          })
          .eq('id', bookingId);

      } else {
        return NextResponse.json(
          { error: 'Pre-authorized payment kan niet meer gecaptured worden' },
          { status: 400 }
        );
      }

    } else if (booking.stripe_payment_method_id) {
      // Use saved payment method to create new charge
      
      // Bereken platform fee
      const { data: tenantData } = await supabase
        .from('billing_state')
        .select('platform_fee_percentage')
        .eq('tenant_id', booking.location.tenant_id)
        .single();

      const platformFeePercentage = tenantData?.platform_fee_percentage || 2.0;
      const platformFeeCents = Math.round(feeAmountCents * platformFeePercentage / 100);

      chargeResult = await stripe.paymentIntents.create({
        amount: feeAmountCents,
        currency: 'eur',
        payment_method: booking.stripe_payment_method_id,
        confirm: true,
        off_session: true, // Charge without customer being present
        application_fee_amount: platformFeeCents,
        transfer_data: {
          destination: booking.location.stripe_account_id,
        },
        metadata: {
          booking_id: bookingId,
          location_id: booking.location_id,
          charge_type: 'NO_SHOW_FEE',
        },
        description: `No-show fee - ${booking.location.name}`,
        statement_descriptor: `R4Y No-show ${booking.location.name.substring(0, 10)}`,
      });

      // Update booking
      await supabase
        .from('bookings')
        .update({
          stripe_payment_intent_id: chargeResult.id,
          payment_status: 'PAID',
          payment_type: 'NO_SHOW_FEE',
          payment_intent_amount_cents: feeAmountCents,
          payment_captured_amount_cents: feeAmountCents,
          platform_fee_cents: platformFeeCents,
          restaurant_amount_cents: feeAmountCents - platformFeeCents,
          payment_completed_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

    } else {
      return NextResponse.json(
        { error: 'Geen payment method beschikbaar om no-show fee aan te rekenen' },
        { status: 400 }
      );
    }

    // Log transaction
    await supabase.from('payment_transactions').insert({
      booking_id: bookingId,
      location_id: booking.location_id,
      stripe_payment_intent_id: chargeResult.id,
      stripe_charge_id: typeof chargeResult.latest_charge === 'string' 
        ? chargeResult.latest_charge 
        : chargeResult.latest_charge?.id,
      transaction_type: 'CHARGE',
      amount_cents: feeAmountCents,
      currency: 'eur',
      platform_fee_cents: booking.platform_fee_cents || 0,
      stripe_fee_cents: 0,
      net_amount_cents: feeAmountCents - (booking.platform_fee_cents || 0),
      status: 'SUCCEEDED',
      description: `No-show fee voor reservering ${bookingId}`,
      metadata: {
        charge_type: 'NO_SHOW_FEE',
        guest_name: booking.guest_name,
        party_size: booking.party_size,
      }
    });

    return NextResponse.json({
      success: true,
      chargeId: chargeResult.id,
      amount: feeAmountCents,
      currency: 'eur',
      status: chargeResult.status,
      message: `No-show fee van €${(feeAmountCents/100).toFixed(2)} is aangerekend`
    });

  } catch (error: any) {
    console.error('No-show fee error:', error);
    
    // Handle Stripe errors specifically
    if (error.type === 'StripeCardError') {
      return NextResponse.json(
        { error: 'Betaling geweigerd: ' + error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Er ging iets mis bij het aanrekenen van de no-show fee' },
      { status: 500 }
    );
  }
}

