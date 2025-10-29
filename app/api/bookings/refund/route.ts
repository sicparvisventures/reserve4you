/**
 * Booking Refund API
 * 
 * POST /api/bookings/refund
 * 
 * Verwerkt refunds voor geannuleerde reserveringen.
 * Ondersteunt:
 * - Volledige refunds
 * - Gedeeltelijke refunds (gebaseerd op cancellation policy)
 * - Automatische refund berekening
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

interface RefundRequest {
  bookingId: string;
  amount?: number; // Optioneel, als niet opgegeven wordt policy gebruikt
  reason?: string;
  manualOverride?: boolean; // Manager kan policy override doen
}

export async function POST(request: NextRequest) {
  try {
    const body: RefundRequest = await request.json();
    const { bookingId, amount, reason, manualOverride } = body;

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
          stripe_account_id
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

    // Check if user is authenticated and has permission (for manual override)
    let isManager = false;
    try {
      const session = await verifyApiSession();
      isManager = await checkTenantRole(
        session.userId,
        booking.location.tenant_id,
        ['OWNER', 'MANAGER']
      );
    } catch (e) {
      // Not authenticated or no permission - only auto refunds allowed
      if (manualOverride) {
        return NextResponse.json(
          { error: 'Alleen managers kunnen manual overrides doen' },
          { status: 403 }
        );
      }
    }

    // Check if booking has payment
    if (!booking.stripe_payment_intent_id) {
      return NextResponse.json(
        { error: 'Deze reservering heeft geen betaling die teruggestort kan worden' },
        { status: 400 }
      );
    }

    // Check if already refunded
    if (booking.payment_status === 'REFUNDED') {
      return NextResponse.json(
        { error: 'Deze reservering is al volledig terugbetaald' },
        { status: 400 }
      );
    }

    // Bereken refund bedrag
    let refundAmountCents = 0;

    if (manualOverride && amount !== undefined && isManager) {
      // Manager specifies exact amount
      refundAmountCents = amount;
    } else if (amount !== undefined) {
      // Specified amount (must be <= paid amount)
      refundAmountCents = amount;
    } else {
      // Automatic calculation based on policy
      const { data: refundPercentage } = await supabase.rpc('calculate_refund_percentage', {
        p_location_id: booking.location_id,
        p_booking_start_time: booking.start_time
      });

      const paidAmount = booking.payment_captured_amount_cents || booking.payment_intent_amount_cents || 0;
      refundAmountCents = Math.round(paidAmount * (refundPercentage || 0) / 100);
    }

    // Validate refund amount
    const maxRefundAmount = (booking.payment_captured_amount_cents || booking.payment_intent_amount_cents || 0) 
      - (booking.refund_amount_cents || 0);

    if (refundAmountCents > maxRefundAmount) {
      return NextResponse.json(
        { error: `Refund bedrag (€${refundAmountCents/100}) is hoger dan beschikbaar bedrag (€${maxRefundAmount/100})` },
        { status: 400 }
      );
    }

    if (refundAmountCents <= 0) {
      return NextResponse.json(
        { error: 'Refund bedrag moet groter zijn dan €0' },
        { status: 400 }
      );
    }

    // Haal Payment Intent op
    const paymentIntent = await stripe.paymentIntents.retrieve(
      booking.stripe_payment_intent_id
    );

    // Get the charge ID
    const chargeId = typeof paymentIntent.latest_charge === 'string' 
      ? paymentIntent.latest_charge 
      : paymentIntent.latest_charge?.id;

    if (!chargeId) {
      return NextResponse.json(
        { error: 'Geen charge gevonden om terug te betalen' },
        { status: 400 }
      );
    }

    // Creëer refund
    // Stripe accepteert alleen specifieke reason waarden
    const stripeReason: 'duplicate' | 'fraudulent' | 'requested_by_customer' = 
      reason === 'duplicate' || reason === 'fraudulent' 
        ? reason 
        : 'requested_by_customer';

    const refund = await stripe.refunds.create({
      charge: chargeId,
      amount: refundAmountCents,
      reason: stripeReason,
      metadata: {
        booking_id: bookingId,
        location_id: booking.location_id,
        refund_type: manualOverride ? 'manual' : 'automatic',
        custom_reason: reason || 'requested_by_customer', // Sla originele reason op in metadata
      },
      reverse_transfer: true, // Reverse de transfer naar restaurant
      refund_application_fee: false, // Platform fee blijft bij R4Y
    });

    // Update booking
    const newRefundTotal = (booking.refund_amount_cents || 0) + refundAmountCents;
    const totalPaid = booking.payment_captured_amount_cents || booking.payment_intent_amount_cents || 0;
    const newPaymentStatus = newRefundTotal >= totalPaid ? 'REFUNDED' : 'PARTIALLY_REFUNDED';

    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        payment_status: newPaymentStatus,
        refund_amount_cents: newRefundTotal,
        refund_reason: reason || 'Annulering door klant',
        refunded_at: new Date().toISOString(),
        status: 'CANCELLED', // Mark booking as cancelled
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking after refund:', updateError);
    }

    // Log transaction
    await supabase.from('payment_transactions').insert({
      booking_id: bookingId,
      location_id: booking.location_id,
      stripe_payment_intent_id: booking.stripe_payment_intent_id,
      stripe_charge_id: chargeId,
      stripe_refund_id: refund.id,
      transaction_type: 'REFUND',
      amount_cents: refundAmountCents,
      currency: 'eur',
      platform_fee_cents: 0, // Geen fee op refunds
      stripe_fee_cents: 0,
      net_amount_cents: refundAmountCents,
      status: refund.status === 'succeeded' ? 'SUCCEEDED' : 'PENDING',
      description: `Refund voor reservering ${bookingId}`,
      metadata: {
        refund_type: manualOverride ? 'manual' : 'automatic',
        reason: reason || 'requested_by_customer',
        original_amount: totalPaid,
        total_refunded: newRefundTotal,
      }
    });

    return NextResponse.json({
      success: true,
      refundId: refund.id,
      refundAmount: refundAmountCents,
      currency: 'eur',
      status: refund.status,
      totalRefunded: newRefundTotal,
      paymentStatus: newPaymentStatus,
      message: `€${(refundAmountCents/100).toFixed(2)} wordt teruggestort naar de klant`
    });

  } catch (error: any) {
    console.error('Refund error:', error);
    return NextResponse.json(
      { error: error.message || 'Er ging iets mis bij het terugbetalen' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bookings/refund?bookingId=xxx
 * 
 * Berekent het refund bedrag voor een booking (preview)
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
      .select('location_id, start_time, payment_captured_amount_cents, payment_intent_amount_cents, refund_amount_cents, payment_status')
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json(
        { error: 'Reservering niet gevonden' },
        { status: 404 }
      );
    }

    if (booking.payment_status === 'REFUNDED') {
      return NextResponse.json({
        refundEligible: false,
        message: 'Deze reservering is al volledig terugbetaald'
      });
    }

    // Bereken refund percentage
    const { data: refundPercentage } = await supabase.rpc('calculate_refund_percentage', {
      p_location_id: booking.location_id,
      p_booking_start_time: booking.start_time
    });

    const paidAmount = booking.payment_captured_amount_cents || booking.payment_intent_amount_cents || 0;
    const alreadyRefunded = booking.refund_amount_cents || 0;
    const refundableAmount = paidAmount - alreadyRefunded;
    const calculatedRefund = Math.round(refundableAmount * (refundPercentage || 0) / 100);

    return NextResponse.json({
      refundEligible: refundableAmount > 0,
      paidAmount: paidAmount,
      alreadyRefunded: alreadyRefunded,
      refundableAmount: refundableAmount,
      refundPercentage: refundPercentage || 0,
      calculatedRefund: calculatedRefund,
      currency: 'eur',
      message: refundPercentage === 100 
        ? 'Volledige refund mogelijk'
        : refundPercentage === 0
          ? 'Geen refund mogelijk (te laat geannuleerd)'
          : `${refundPercentage}% refund mogelijk`
    });

  } catch (error: any) {
    console.error('Refund calculation error:', error);
    return NextResponse.json(
      { error: error.message || 'Er ging iets mis bij het berekenen van de refund' },
      { status: 500 }
    );
  }
}

