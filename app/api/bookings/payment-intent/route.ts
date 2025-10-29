/**
 * Booking Payment Intent API
 * 
 * POST /api/bookings/payment-intent
 * 
 * Creëert een Stripe Payment Intent voor een reservering.
 * Ondersteunt:
 * - Deposit betalingen
 * - Volledige vooruitbetalingen
 * - Pre-authorization (hold bedrag zonder direct af te schrijven)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import { config } from '@/lib/config';

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2025-02-24.acacia'
});

interface PaymentIntentRequest {
  bookingId: string;
  paymentType: 'DEPOSIT' | 'FULL_PAYMENT' | 'PRE_AUTH';
  returnUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PaymentIntentRequest = await request.json();
    const { bookingId, paymentType, returnUrl } = body;

    if (!bookingId || !paymentType) {
      return NextResponse.json(
        { error: 'Booking ID en payment type zijn verplicht' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Haal booking op met location en policy info
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
          deposit_required,
          deposit_type,
          deposit_value,
          deposit_applies_to_party_size,
          no_show_fee_cents
        )
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Booking fetch error:', bookingError);
      return NextResponse.json(
        { error: 'Reservering niet gevonden' },
        { status: 404 }
      );
    }

    // Check if location has Stripe enabled
    if (!booking.location.stripe_account_id || !booking.location.stripe_charges_enabled) {
      return NextResponse.json(
        { error: 'Dit restaurant heeft nog geen betalingen geactiveerd' },
        { status: 400 }
      );
    }

    // Bereken bedrag
    let amountCents = 0;
    const policy = Array.isArray(booking.policy) ? booking.policy[0] : booking.policy;

    if (paymentType === 'DEPOSIT') {
      // Bereken deposit via database functie
      const { data: depositData } = await supabase.rpc('calculate_deposit_amount', {
        p_location_id: booking.location_id,
        p_party_size: booking.party_size
      });
      amountCents = depositData || 0;
    } else if (paymentType === 'FULL_PAYMENT') {
      // Voor volledige betaling: €50 per persoon (voorbeeld, kan geconfigureerd worden)
      amountCents = booking.party_size * 5000; // €50 per persoon
    } else if (paymentType === 'PRE_AUTH') {
      // Voor pre-auth: zelfde als deposit maar wordt later gecaptured
      const { data: depositData } = await supabase.rpc('calculate_deposit_amount', {
        p_location_id: booking.location_id,
        p_party_size: booking.party_size
      });
      amountCents = depositData || 0;
    }

    // Minimum bedrag van €0.50 (Stripe minimum)
    if (amountCents < 50) {
      return NextResponse.json(
        { error: 'Bedrag te laag voor betaling' },
        { status: 400 }
      );
    }

    // Bereken platform fee
    const { data: tenantData } = await supabase
      .from('billing_state')
      .select('platform_fee_percentage')
      .eq('tenant_id', booking.location.tenant_id)
      .single();

    const platformFeePercentage = tenantData?.platform_fee_percentage || 2.0;
    const platformFeeCents = Math.round(amountCents * platformFeePercentage / 100);
    const restaurantAmountCents = amountCents - platformFeeCents;

    // Creëer Stripe Payment Intent
    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: amountCents,
      currency: 'eur',
      payment_method_types: ['card', 'ideal', 'bancontact'],
      capture_method: paymentType === 'PRE_AUTH' ? 'manual' : 'automatic',
      application_fee_amount: platformFeeCents,
      transfer_data: {
        destination: booking.location.stripe_account_id,
      },
      metadata: {
        booking_id: bookingId,
        location_id: booking.location_id,
        tenant_id: booking.location.tenant_id,
        payment_type: paymentType,
        party_size: booking.party_size.toString(),
        booking_date: booking.start_time,
      },
      description: `Reservering bij ${booking.location.name} - ${booking.party_size} personen`,
      statement_descriptor: `R4Y ${booking.location.name.substring(0, 15)}`,
      receipt_email: booking.guest_email || undefined,
    };

    // Voeg return URL toe voor redirect flows (iDEAL, Bancontact)
    if (returnUrl) {
      paymentIntentParams.return_url = returnUrl;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    // Update booking met payment intent info
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        payment_status: 'REQUIRES_PAYMENT',
        payment_type: paymentType,
        payment_intent_amount_cents: amountCents,
        payment_intent_currency: 'eur',
        platform_fee_cents: platformFeeCents,
        restaurant_amount_cents: restaurantAmountCents,
        deposit_amount_cents: paymentType === 'DEPOSIT' ? amountCents : 0,
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking with payment intent:', updateError);
    }

    // Log transaction
    await supabase.from('payment_transactions').insert({
      booking_id: bookingId,
      location_id: booking.location_id,
      stripe_payment_intent_id: paymentIntent.id,
      transaction_type: 'CHARGE',
      amount_cents: amountCents,
      currency: 'eur',
      platform_fee_cents: platformFeeCents,
      stripe_fee_cents: 0, // Wordt later bijgewerkt via webhook
      net_amount_cents: restaurantAmountCents,
      status: 'PENDING',
      description: `${paymentType} voor reservering ${bookingId}`,
      metadata: {
        payment_type: paymentType,
        party_size: booking.party_size,
        booking_date: booking.start_time,
      }
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amountCents,
      currency: 'eur',
      platformFee: platformFeeCents,
      restaurantAmount: restaurantAmountCents,
      status: paymentIntent.status,
    });

  } catch (error: any) {
    console.error('Payment Intent creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Er ging iets mis bij het aanmaken van de betaling' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bookings/payment-intent?bookingId=xxx
 * 
 * Haalt status op van een bestaande Payment Intent
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is verplicht' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('stripe_payment_intent_id, payment_status, payment_intent_amount_cents')
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json(
        { error: 'Reservering niet gevonden' },
        { status: 404 }
      );
    }

    if (!booking.stripe_payment_intent_id) {
      return NextResponse.json({
        status: 'NO_PAYMENT_REQUIRED',
        paymentStatus: booking.payment_status
      });
    }

    // Haal Payment Intent op van Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(
      booking.stripe_payment_intent_id
    );

    return NextResponse.json({
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      paymentStatus: booking.payment_status,
      clientSecret: paymentIntent.client_secret,
    });

  } catch (error: any) {
    console.error('Payment Intent fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Er ging iets mis bij het ophalen van de betaling' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/bookings/payment-intent
 * 
 * Captured een pre-authorized payment (voor PRE_AUTH)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, action } = body;

    if (!bookingId || !action) {
      return NextResponse.json(
        { error: 'Booking ID en action zijn verplicht' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('stripe_payment_intent_id, payment_type, payment_status')
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json(
        { error: 'Reservering niet gevonden' },
        { status: 404 }
      );
    }

    if (!booking.stripe_payment_intent_id) {
      return NextResponse.json(
        { error: 'Geen payment intent gevonden voor deze reservering' },
        { status: 400 }
      );
    }

    if (action === 'capture') {
      // Capture pre-authorized payment
      const paymentIntent = await stripe.paymentIntents.capture(
        booking.stripe_payment_intent_id
      );

      // Update booking
      await supabase
        .from('bookings')
        .update({
          payment_status: 'PAID',
          payment_captured_amount_cents: paymentIntent.amount,
          payment_completed_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      return NextResponse.json({
        status: 'captured',
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
      });

    } else if (action === 'cancel') {
      // Cancel pre-authorized payment
      const paymentIntent = await stripe.paymentIntents.cancel(
        booking.stripe_payment_intent_id
      );

      // Update booking
      await supabase
        .from('bookings')
        .update({
          payment_status: 'FAILED',
          payment_failed_reason: 'Cancelled by restaurant',
        })
        .eq('id', bookingId);

      return NextResponse.json({
        status: 'cancelled',
        paymentIntentId: paymentIntent.id,
      });
    }

    return NextResponse.json(
      { error: 'Ongeldige actie' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Payment Intent action error:', error);
    return NextResponse.json(
      { error: error.message || 'Er ging iets mis bij het uitvoeren van de actie' },
      { status: 500 }
    );
  }
}

