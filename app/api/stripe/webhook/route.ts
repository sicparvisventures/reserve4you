import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createServiceClient } from '@/lib/supabase/server';
import { config } from '@/lib/config';

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2025-02-24.acacia',
});

/**
 * R4Y Stripe Webhook Handler
 * 
 * Handles all Stripe events for the R4Y platform:
 * - Subscription lifecycle (created, updated, deleted)
 * - Invoice payments (succeeded, failed)
 * - Payment intents for deposits
 * - Stripe Connect account updates
 */
export async function POST(request: NextRequest) {
  console.log('🚀 R4Y Webhook Called');

  let event: Stripe.Event;

  try {
    const stripeSignature = (await headers()).get('stripe-signature');
    const body = await request.text();

    event = stripe.webhooks.constructEvent(
      body,
      stripeSignature as string,
      config.stripe.webhookSecret
    );
    console.log(`✅ Webhook verified: ${event.type} (${event.id})`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`❌ Webhook signature verification failed: ${errorMessage}`);
    return NextResponse.json(
      { message: `Webhook Error: ${errorMessage}` },
      { status: 400 }
    );
  }

  try {
    // Route to appropriate handler based on event type
    switch (event.type) {
      // Subscription lifecycle events
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      // Invoice events
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      // Payment intents for deposits and booking payments
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.amount_capturable_updated':
        await handlePaymentIntentAuthorizationCreated(event.data.object as Stripe.PaymentIntent);
        break;

      // Charge events for detailed tracking
      case 'charge.succeeded':
        await handleChargeSucceeded(event.data.object as Stripe.Charge);
        break;

      case 'charge.failed':
        await handleChargeFailed(event.data.object as Stripe.Charge);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      // Stripe Connect events
      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      // Checkout session (legacy support for one-time payments)
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle subscription creation or updates
 * Updates billing_state table with current subscription status
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const tenantId = subscription.metadata.tenantId;
  const plan = subscription.metadata.plan as 'START' | 'PRO' | 'PLUS';

  if (!tenantId || !plan) {
    console.error('Missing tenantId or plan in subscription metadata');
    return;
  }

  const supabase = await createServiceClient();

  // Map Stripe status to our status
  const statusMap: Record<string, string> = {
    'active': 'ACTIVE',
    'trialing': 'TRIALING',
    'past_due': 'PAST_DUE',
    'canceled': 'CANCELLED',
    'unpaid': 'UNPAID',
  };

  const status = statusMap[subscription.status] || 'INACTIVE';

  const { error } = await supabase
    .from('billing_state')
    .upsert({
      tenant_id: tenantId,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      plan: plan,
      status: status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    }, {
      onConflict: 'tenant_id',
    });

  if (error) {
    console.error('Error updating billing state:', error);
    throw error;
  }

  console.log(`✅ Billing state updated for tenant ${tenantId}: ${status} (${plan})`);
}

/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const tenantId = subscription.metadata.tenantId;

  if (!tenantId) {
    console.error('Missing tenantId in subscription metadata');
    return;
  }

  const supabase = await createServiceClient();

  const { error } = await supabase
    .from('billing_state')
    .update({
      status: 'CANCELLED',
      stripe_subscription_id: null,
    })
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('Error updating billing state on deletion:', error);
    throw error;
  }

  // Unpublish all locations for this tenant
  const { error: unpublishError } = await supabase
    .from('locations')
    .update({ is_public: false })
    .eq('tenant_id', tenantId);

  if (unpublishError) {
    console.error('Error unpublishing locations:', unpublishError);
  }

  console.log(`✅ Subscription cancelled for tenant ${tenantId}, locations unpublished`);
}

/**
 * Handle successful invoice payment
 * This confirms subscription is paid and active
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    console.log('Invoice not related to subscription');
    return;
  }

  // Fetch subscription to get metadata
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const tenantId = subscription.metadata.tenantId;

  if (!tenantId) {
    console.error('Missing tenantId in subscription metadata');
    return;
  }

  const supabase = await createServiceClient();

  const { error } = await supabase
    .from('billing_state')
    .update({
      status: 'ACTIVE',
      last_payment_date: new Date().toISOString(),
    })
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('Error updating billing state on payment success:', error);
    throw error;
  }

  console.log(`✅ Invoice payment succeeded for tenant ${tenantId}`);
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    console.log('Invoice not related to subscription');
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const tenantId = subscription.metadata.tenantId;

  if (!tenantId) {
    console.error('Missing tenantId in subscription metadata');
    return;
  }

  const supabase = await createServiceClient();

  const { error } = await supabase
    .from('billing_state')
    .update({
      status: 'PAST_DUE',
    })
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('Error updating billing state on payment failure:', error);
    throw error;
  }

  console.log(`⚠️ Invoice payment failed for tenant ${tenantId}`);
  
  // TODO: Send email notification to tenant owner
}

/**
 * Handle successful payment intent (for booking deposits and payments)
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata.booking_id;

  if (!bookingId) {
    console.log('Payment intent not related to booking');
    return;
  }

  const supabase = await createServiceClient();

  // Get payment method used
  const paymentMethod = paymentIntent.payment_method 
    ? await stripe.paymentMethods.retrieve(paymentIntent.payment_method as string)
    : null;

  const paymentMethodType = paymentMethod?.type?.toUpperCase() || 'CARD';

  // Update booking with payment details
  const { error } = await supabase
    .from('bookings')
    .update({
      payment_status: paymentIntent.capture_method === 'manual' && paymentIntent.status === 'requires_capture'
        ? 'AUTHORIZED'
        : 'PAID',
      status: paymentIntent.capture_method === 'manual' && paymentIntent.status === 'requires_capture'
        ? 'PENDING' // Pre-auth doesn't auto-confirm
        : 'CONFIRMED',
      stripe_payment_intent_id: paymentIntent.id,
      stripe_payment_method_id: paymentIntent.payment_method as string || null,
      payment_method: paymentMethodType,
      payment_captured_amount_cents: paymentIntent.amount_received || 0,
      payment_completed_at: new Date().toISOString(),
    })
    .eq('id', bookingId);

  if (error) {
    console.error('Error updating booking payment status:', error);
    throw error;
  }

  // Update transaction record
  await supabase
    .from('payment_transactions')
    .update({
      status: 'SUCCEEDED',
      completed_at: new Date().toISOString(),
    })
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .eq('transaction_type', 'CHARGE');

  console.log(`✅ Payment succeeded for booking ${bookingId} (${paymentIntent.capture_method})`);
  
  // TODO: Send confirmation email to guest
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata.booking_id;

  if (!bookingId) {
    console.log('Payment intent not related to booking');
    return;
  }

  const supabase = await createServiceClient();

  const failureMessage = paymentIntent.last_payment_error?.message || 'Payment failed';

  const { error } = await supabase
    .from('bookings')
    .update({
      payment_status: 'FAILED',
      payment_failed_reason: failureMessage,
      status: 'CANCELLED',
    })
    .eq('id', bookingId);

  if (error) {
    console.error('Error updating booking payment status:', error);
    throw error;
  }

  // Update transaction record
  await supabase
    .from('payment_transactions')
    .update({
      status: 'FAILED',
      failure_reason: failureMessage,
      completed_at: new Date().toISOString(),
    })
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .eq('transaction_type', 'CHARGE');

  console.log(`❌ Payment failed for booking ${bookingId}: ${failureMessage}`);
  
  // TODO: Send failure notification to guest
}

/**
 * Handle payment authorization created (for pre-auth holds)
 */
async function handlePaymentIntentAuthorizationCreated(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata.booking_id;

  if (!bookingId || paymentIntent.capture_method !== 'manual') {
    return;
  }

  const supabase = await createServiceClient();

  const { error } = await supabase
    .from('bookings')
    .update({
      payment_status: 'AUTHORIZED',
      stripe_payment_intent_id: paymentIntent.id,
      payment_intent_amount_cents: paymentIntent.amount,
    })
    .eq('id', bookingId);

  if (error) {
    console.error('Error updating booking with authorization:', error);
  }

  console.log(`✅ Payment authorized (pre-auth) for booking ${bookingId}`);
}

/**
 * Handle successful charge (detailed tracking)
 */
async function handleChargeSucceeded(charge: Stripe.Charge) {
  const paymentIntent = charge.payment_intent as string;
  
  if (!paymentIntent) {
    return;
  }

  const supabase = await createServiceClient();

  // Update transaction with actual Stripe fees
  await supabase
    .from('payment_transactions')
    .update({
      stripe_charge_id: charge.id,
      stripe_fee_cents: charge.application_fee_amount || 0,
      status: 'SUCCEEDED',
    })
    .eq('stripe_payment_intent_id', paymentIntent);

  console.log(`✅ Charge succeeded: ${charge.id}`);
}

/**
 * Handle failed charge
 */
async function handleChargeFailed(charge: Stripe.Charge) {
  const paymentIntent = charge.payment_intent as string;
  
  if (!paymentIntent) {
    return;
  }

  const supabase = await createServiceClient();

  await supabase
    .from('payment_transactions')
    .update({
      stripe_charge_id: charge.id,
      status: 'FAILED',
      failure_reason: charge.failure_message || 'Charge failed',
    })
    .eq('stripe_payment_intent_id', paymentIntent);

  console.log(`❌ Charge failed: ${charge.id}`);
}

/**
 * Handle charge refunded
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntent = charge.payment_intent as string;
  
  if (!paymentIntent) {
    return;
  }

  const supabase = await createServiceClient();

  // Get booking ID from payment intent metadata
  const { data: transaction } = await supabase
    .from('payment_transactions')
    .select('booking_id')
    .eq('stripe_payment_intent_id', paymentIntent)
    .eq('transaction_type', 'CHARGE')
    .single();

  if (transaction?.booking_id) {
    const refundAmount = charge.amount_refunded || 0;

    // Update booking refund status
    const { data: booking } = await supabase
      .from('bookings')
      .select('refund_amount_cents, payment_captured_amount_cents')
      .eq('id', transaction.booking_id)
      .single();

    if (booking) {
      const totalRefunded = (booking.refund_amount_cents || 0) + refundAmount;
      const totalPaid = booking.payment_captured_amount_cents || 0;
      
      await supabase
        .from('bookings')
        .update({
          payment_status: totalRefunded >= totalPaid ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          refund_amount_cents: totalRefunded,
        })
        .eq('id', transaction.booking_id);
    }
  }

  console.log(`✅ Charge refunded: ${charge.id} (${charge.amount_refunded} cents)`);
}

/**
 * Handle Stripe Connect account updates
 */
async function handleAccountUpdated(account: Stripe.Account) {
  const locationId = account.metadata?.location_id;

  if (!locationId) {
    console.log('Account not related to location');
    return;
  }

  const supabase = await createServiceClient();

  // Update location with Stripe Connect status
  const { error } = await supabase
    .from('locations')
    .update({
      stripe_account_id: account.id,
      stripe_charges_enabled: account.charges_enabled || false,
      stripe_payouts_enabled: account.payouts_enabled || false,
      stripe_onboarding_completed: account.details_submitted || false,
      stripe_account_status: account.charges_enabled && account.payouts_enabled
        ? 'ENABLED'
        : account.details_submitted
          ? 'RESTRICTED'
          : 'PENDING',
    })
    .eq('id', locationId);

  if (error) {
    console.error('Error updating location Stripe status:', error);
  }

  console.log(`✅ Stripe Connect account ${account.id} updated for location ${locationId}`);
  console.log(`   Charges enabled: ${account.charges_enabled}`);
  console.log(`   Payouts enabled: ${account.payouts_enabled}`);
}

/**
 * Handle checkout session completion (legacy support)
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log(`✅ Checkout session completed: ${session.id}`);
  
  // Check if it's a subscription checkout
  if (session.mode === 'subscription' && session.subscription) {
    // Subscription webhook will handle the billing state update
    console.log('Subscription checkout - will be handled by subscription webhook');
    return;
  }

  // Handle one-time payment checkouts (if any)
  console.log('One-time payment checkout completed');
}
