/**
 * API Route: Create Venue User
 * Creates Supabase auth user + venue_users record
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      pinCode,
      role,
      tenantId,
      allLocations,
      locationIds,
      permissions
    } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !pinCode || !tenantId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Verify requester has permission
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if requester is owner/manager of tenant
    const { data: membership } = await supabase
      .from('memberships')
      .select('role')
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)
      .single();

    if (!membership || !['OWNER', 'MANAGER'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: 'venue_user'
      }
    });

    if (authError || !authData.user) {
      console.error('Auth creation error:', authError);
      return NextResponse.json(
        { error: `Failed to create auth user: ${authError?.message}` },
        { status: 500 }
      );
    }

    // Create venue_users record
    const { data: venueUser, error: venueError } = await supabase
      .from('venue_users')
      .insert({
        auth_user_id: authData.user.id,
        tenant_id: tenantId,
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || null,
        pin_code: pinCode,
        role,
        all_locations: allLocations || false,
        location_ids: locationIds || [],
        can_view_dashboard: permissions?.can_view_dashboard || false,
        can_manage_bookings: permissions?.can_manage_bookings || false,
        can_manage_customers: permissions?.can_manage_customers || false,
        can_manage_tables: permissions?.can_manage_tables || false,
        can_manage_menu: permissions?.can_manage_menu || false,
        can_manage_promotions: permissions?.can_manage_promotions || false,
        can_view_analytics: permissions?.can_view_analytics || false,
        can_manage_settings: permissions?.can_manage_settings || false,
        can_manage_users: permissions?.can_manage_users || false,
        can_manage_billing: permissions?.can_manage_billing || false,
        is_active: true
      })
      .select()
      .single();

    if (venueError) {
      console.error('Venue user creation error:', venueError);
      
      // Cleanup: delete auth user if venue_user creation failed
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return NextResponse.json(
        { error: `Failed to create venue user: ${venueError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: venueUser
    });

  } catch (error: any) {
    console.error('Create venue user error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

