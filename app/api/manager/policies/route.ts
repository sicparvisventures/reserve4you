import { NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/auth/dal';
import { getLocation } from '@/lib/auth/tenant-dal';
import { checkTenantRole } from '@/lib/auth/tenant-dal';
import { createServiceClient } from '@/lib/supabase/server';
import { policyCreateSchema } from '@/lib/validation/manager';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await verifyApiSession();
    const body = await request.json();
    const validated = policyCreateSchema.parse(body);

    // Verify user has access to location
    const location = await getLocation(validated.locationId);
    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    const hasAccess = await checkTenantRole(session.userId, location.tenant_id, ['OWNER', 'MANAGER']);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = await createServiceClient();

    // Check if policy already exists
    const { data: existingPolicy } = await supabase
      .from('policies')
      .select('id')
      .eq('location_id', validated.locationId)
      .single();

    let policy;
    if (existingPolicy) {
      // Update existing policy
      const { data, error } = await supabase
        .from('policies')
        .update({
          cancellation_hours: validated.cancellationHours,
          no_show_fee_cents: validated.noShowFeeCents,
          deposit_required: validated.depositRequired,
          deposit_type: validated.depositType,
          deposit_value: validated.depositValue,
        })
        .eq('id', existingPolicy.id)
        .select()
        .single();

      if (error) throw error;
      policy = data;
    } else {
      // Create new policy
      const { data, error } = await supabase
        .from('policies')
        .insert({
          location_id: validated.locationId,
          cancellation_hours: validated.cancellationHours,
          no_show_fee_cents: validated.noShowFeeCents,
          deposit_required: validated.depositRequired,
          deposit_type: validated.depositType,
          deposit_value: validated.depositValue,
        })
        .select()
        .single();

      if (error) throw error;
      policy = data;
    }

    return NextResponse.json(policy);
  } catch (error: any) {
    console.error('Error creating/updating policy:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create policy' },
      { status: 500 }
    );
  }
}

