import { NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/auth/dal';
import { checkTenantRole } from '@/lib/auth/tenant-dal';
import { createServiceClient } from '@/lib/supabase/server';
import { locationCreateSchema } from '@/lib/validation/manager';
import { canCreateLocation } from '@/lib/billing/quota';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await verifyApiSession();
    const body = await request.json();
    const validated = locationCreateSchema.parse(body);

    // Verify user has access to tenant
    const hasAccess = await checkTenantRole(session.userId, validated.tenantId, ['OWNER', 'MANAGER']);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check quota
    const quotaCheck = await canCreateLocation(validated.tenantId);
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        { 
          error: quotaCheck.reason,
          currentCount: quotaCheck.currentCount,
          limit: quotaCheck.limit,
        },
        { status: 403 }
      );
    }

    const supabase = await createServiceClient();

    // Check if slug is unique
    const { data: existingLocation } = await supabase
      .from('locations')
      .select('id')
      .eq('slug', validated.slug)
      .single();

    if (existingLocation) {
      return NextResponse.json(
        { error: 'Slug is already in use. Please choose a different one.' },
        { status: 400 }
      );
    }

    // Convert price range from € symbols to integer (1-4)
    const priceRangeMap: Record<string, number> = {
      '€': 1,
      '€€': 2,
      '€€€': 3,
      '€€€€': 4,
    };
    const priceRangeInt = validated.priceRange ? priceRangeMap[validated.priceRange] : undefined;

    // Create location
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .insert({
        tenant_id: validated.tenantId,
        name: validated.name,
        slug: validated.slug,
        address_json: validated.address,
        phone: validated.phone,
        email: validated.email,
        opening_hours_json: validated.openingHours,
        cuisine: validated.cuisine,
        price_range: priceRangeInt,
        description: validated.description,
        slot_minutes: validated.slotMinutes,
        buffer_minutes: validated.bufferMinutes,
        is_public: false, // Not public until onboarding is complete
      })
      .select()
      .single();

    if (locationError) throw locationError;

    // Convert price_range back to € symbols for frontend
    const reversePriceRangeMap: Record<number, string> = {
      1: '€',
      2: '€€',
      3: '€€€',
      4: '€€€€',
    };
    
    const locationResponse = {
      ...location,
      priceRange: location.price_range ? reversePriceRangeMap[location.price_range] : undefined,
    };

    return NextResponse.json(locationResponse);
  } catch (error: any) {
    console.error('Error creating location:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create location' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await verifyApiSession();
    const body = await request.json();
    const { id, image_url, image_public_id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Location ID is required' }, { status: 400 });
    }

    const supabase = await createServiceClient();

    // Get location to verify tenant access
    const { data: location } = await supabase
      .from('locations')
      .select('tenant_id')
      .eq('id', id)
      .single();

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    // Verify user has access to tenant
    const hasAccess = await checkTenantRole(session.userId, location.tenant_id, ['OWNER', 'MANAGER']);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update location with image
    const { data: updatedLocation, error: updateError } = await supabase
      .from('locations')
      .update({
        image_url,
        image_public_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(updatedLocation);
  } catch (error: any) {
    console.error('Error updating location:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update location' },
      { status: 500 }
    );
  }
}

