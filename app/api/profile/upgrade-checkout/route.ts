import { NextRequest, NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/auth/dal';
import { createServiceClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import { config } from '@/lib/config';

const stripe = new Stripe(config.stripe.secretKey!, {
  apiVersion: '2025-02-24.acacia',
});

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await verifyApiSession();
    const body = await request.json();
    const { tenantId, plan } = body;
    
    // Get the origin from the request
    const origin = request.headers.get('origin') || request.headers.get('referer')?.split('/').slice(0, 3).join('/') || config.app.url;

    if (!tenantId || !plan) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Verify user has access to this tenant
    const { data: membership } = await supabase
      .from('memberships')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', session.userId)
      .eq('role', 'OWNER')
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Unauthorized. Only owners can upgrade subscriptions.' },
        { status: 403 }
      );
    }

    // Get or create billing state
    let { data: billingState } = await supabase
      .from('billing_state')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    // Get or create Stripe customer
    let customerId: string;
    
    if (billingState?.stripe_customer_id) {
      customerId = billingState.stripe_customer_id;
    } else {
      // Get user email
      const { data: userData } = await supabase
        .from('users')
        .select('email')
        .eq('supabase_user_id', session.userId)
        .single();

      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: userData?.email || undefined,
        metadata: {
          tenantId: tenantId,
          userId: session.userId,
        },
      });

      customerId = customer.id;

      // Save customer ID
      if (billingState) {
        await supabase
          .from('billing_state')
          .update({ stripe_customer_id: customerId })
          .eq('tenant_id', tenantId);
      } else {
        await supabase
          .from('billing_state')
          .insert({
            tenant_id: tenantId,
            stripe_customer_id: customerId,
            plan: plan,
            status: 'INACTIVE',
          });
      }
    }

    // Get price ID for selected plan
    const priceIds: Record<string, string> = {
      START: config.stripe.priceIds?.START || '',
      PRO: config.stripe.priceIds?.PRO || '',
      PLUS: config.stripe.priceIds?.PLUS || '',
    };

    const priceId = priceIds[plan as keyof typeof priceIds];
    
    // TEST MODE: If using default/placeholder price IDs, activate plan directly (bypass Stripe)
    const isPlaceholderPrice = !priceId || 
      priceId === 'price_starter' || 
      priceId === 'price_growth' || 
      priceId === 'price_premium' ||
      !priceId.startsWith('price_1');
    
    if (isPlaceholderPrice) {
      // Update billing state directly (bypass Stripe)
      await supabase
        .from('billing_state')
        .upsert({
          tenant_id: tenantId,
          plan: plan,
          status: 'ACTIVE',
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        });

      // Redirect back to profile with success
      return NextResponse.json({ 
        url: `${origin}/profile?upgraded=true&plan=${plan}&testmode=true` 
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
      success_url: `${origin}/profile?upgraded=true&plan=${plan}`,
      cancel_url: `${origin}/profile?tab=subscription`,
      metadata: {
        tenantId: tenantId,
        plan: plan,
      },
      subscription_data: {
        metadata: {
          tenantId: tenantId,
          plan: plan,
        },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Error creating upgrade checkout:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

