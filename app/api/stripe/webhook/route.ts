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

      // Payment intents for deposits
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
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
 * Handle successful payment intent (for booking deposits)
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata.bookingId;

  if (!bookingId) {
    console.log('Payment intent not related to booking');
    return;
  }

  const supabase = await createServiceClient();

  const { error } = await supabase
    .from('bookings')
    .update({
      payment_status: 'PAID',
      status: 'CONFIRMED',
      stripe_payment_intent_id: paymentIntent.id,
    })
    .eq('id', bookingId);

  if (error) {
    console.error('Error updating booking payment status:', error);
    throw error;
  }

  console.log(`✅ Deposit payment succeeded for booking ${bookingId}`);
  
  // TODO: Send confirmation email to guest
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata.bookingId;

  if (!bookingId) {
    console.log('Payment intent not related to booking');
    return;
  }

  const supabase = await createServiceClient();

  const { error } = await supabase
    .from('bookings')
    .update({
      payment_status: 'FAILED',
      status: 'CANCELLED',
    })
    .eq('id', bookingId);

  if (error) {
    console.error('Error updating booking payment status:', error);
    throw error;
  }

  console.log(`❌ Deposit payment failed for booking ${bookingId}`);
  
  // TODO: Send failure notification to guest
}

/**
 * Handle Stripe Connect account updates
 */
async function handleAccountUpdated(account: Stripe.Account) {
  const locationId = account.metadata?.locationId;

  if (!locationId) {
    console.log('Account not related to location');
      return;
    }

  const supabase = await createServiceClient();

  // Check if account is fully onboarded
  const isOnboarded = account.charges_enabled && account.payouts_enabled;

  // Store Stripe account info in pos_integrations or separate table
  // For MVP, we'll just log it
  console.log(`✅ Stripe Connect account ${account.id} updated for location ${locationId}`);
  console.log(`   Charges enabled: ${account.charges_enabled}`);
  console.log(`   Payouts enabled: ${account.payouts_enabled}`);
  
  // TODO: Update location with Stripe Connect status
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
