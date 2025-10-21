import { NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/auth/dal';
import { getTenant } from '@/lib/auth/tenant-dal';
import { checkTenantRole } from '@/lib/auth/tenant-dal';
import { createServiceClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import { config } from '@/lib/config';
import { subscriptionCreateSchema } from '@/lib/validation/manager';

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2025-02-24.acacia',
});

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await verifyApiSession();
    const body = await request.json();
    const validated = subscriptionCreateSchema.parse(body);
    
    // Get the origin from the request
    const origin = request.headers.get('origin') || request.headers.get('referer')?.split('/').slice(0, 3).join('/') || config.app.url;

    // Verify user has access to tenant
    const hasAccess = await checkTenantRole(session.userId, validated.tenantId, ['OWNER']);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const tenant = await getTenant(validated.tenantId);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const supabase = await createServiceClient();

    // Get or create customer
    let customerId: string;
    const { data: billingState } = await supabase
      .from('billing_state')
      .select('stripe_customer_id')
      .eq('tenant_id', validated.tenantId)
      .single();

    if (billingState?.stripe_customer_id) {
      customerId = billingState.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', session.userId)
        .single();

      const customer = await stripe.customers.create({
        email: user?.email || undefined,
        metadata: {
          tenantId: validated.tenantId,
          userId: session.userId,
        },
      });

      customerId = customer.id;

      // Save customer ID to billing_state
      await supabase
        .from('billing_state')
        .upsert({
          tenant_id: validated.tenantId,
          stripe_customer_id: customerId,
          plan: validated.plan,
          status: 'INACTIVE',
        });
    }

    // Get price ID for selected plan
    const priceId = config.stripe.priceIds[validated.plan];
    if (!priceId) {
      throw new Error('Invalid plan selected');
    }

    // TEST MODE: If using default/placeholder price IDs, activate plan directly (bypass Stripe)
    const isPlaceholderPrice = 
      priceId === 'price_starter' || 
      priceId === 'price_growth' || 
      priceId === 'price_premium' ||
      priceId === 'free' ||
      priceId === 'contact' ||
      !priceId.startsWith('price_1');
    
    if (isPlaceholderPrice) {
      // Update billing state directly (bypass Stripe)
      // Set plan limits based on plan type
      const planLimits: Record<string, { maxLocations: number; maxBookings: number }> = {
        'FREE': { maxLocations: 1, maxBookings: 50 },
        'START': { maxLocations: 1, maxBookings: 200 },
        'STARTER': { maxLocations: 1, maxBookings: 200 },
        'PRO': { maxLocations: 3, maxBookings: 1000 },
        'GROWTH': { maxLocations: 3, maxBookings: 1000 },
        'BUSINESS': { maxLocations: 5, maxBookings: 3000 },
        'PLUS': { maxLocations: 99, maxBookings: 10000 },
        'PREMIUM': { maxLocations: 99, maxBookings: 10000 },
        'ENTERPRISE': { maxLocations: 99, maxBookings: 50000 },
      };

      const limits = planLimits[validated.plan] || { maxLocations: 1, maxBookings: 50 };

      await supabase
        .from('billing_state')
        .upsert({
          tenant_id: validated.tenantId,
          plan: validated.plan,
          status: 'ACTIVE',
          stripe_customer_id: customerId,
          max_locations: limits.maxLocations,
          max_bookings_per_month: limits.maxBookings,
          trial_end: null, // Clear trial when activating paid plan
          updated_at: new Date().toISOString(),
        });

      // Redirect back with success (test mode)
      return NextResponse.json({ 
        url: `${body.successUrl}&testmode=true` 
      });
    }

    // Create Checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card', 'ideal'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: body.successUrl,
      cancel_url: body.cancelUrl,
      metadata: {
        tenantId: validated.tenantId,
        plan: validated.plan,
      },
      subscription_data: {
        metadata: {
          tenantId: validated.tenantId,
          plan: validated.plan,
        },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Error creating subscription checkout:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

