import { NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/auth/dal';
import { createServiceClient } from '@/lib/supabase/server';
import { tenantCreateSchema } from '@/lib/validation/manager';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await verifyApiSession();
    const body = await request.json();
    const validated = tenantCreateSchema.parse(body);

    const supabase = await createServiceClient();

    // Use SECURITY DEFINER function to create tenant + membership atomically
    // This bypasses RLS while maintaining security
    const { data, error } = await supabase
      .rpc('create_tenant_with_membership', {
        p_tenant_name: validated.name,
        p_brand_color: validated.brandColor || '#FF5A5F',
        p_owner_user_id: session.userId,
      })
      .single();

    if (error) {
      console.error('Error calling create_tenant_with_membership:', error);
      throw error;
    }

    // Transform the returned data to match expected format
    const tenant = {
      id: data.tenant_id,
      name: data.tenant_name,
      brand_color: data.tenant_brand_color,
      owner_user_id: data.tenant_owner_user_id,
      created_at: data.tenant_created_at,
    };

    // Create FREE trial billing state for the new tenant
    // This allows them to complete onboarding before subscribing
    const { error: billingError } = await supabase
      .from('billing_state')
      .insert({
        tenant_id: tenant.id,
        plan: 'FREE',
        status: 'TRIALING',
        max_locations: 1,
        max_bookings_per_month: 50,
        bookings_used_this_month: 0,
        trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days trial
      });

    if (billingError) {
      console.error('Error creating trial billing state:', billingError);
      // Don't fail the request, billing can be added later
    }

    return NextResponse.json(tenant);
  } catch (error: any) {
    console.error('Error creating tenant:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create tenant' },
      { status: 500 }
    );
  }
}

