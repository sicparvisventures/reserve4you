/**
 * API Route: Update Venue User
 * Updates venue_users record and optionally auth email
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      email,
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
    if (!id || !tenantId) {
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

    // Get current venue user
    const { data: currentUser } = await supabase
      .from('venue_users')
      .select('auth_user_id, email')
      .eq('id', id)
      .single();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Venue user not found' },
        { status: 404 }
      );
    }

    // Update auth user email if changed and auth_user_id exists
    if (email && currentUser.auth_user_id && email !== currentUser.email) {
      const { error: authError } = await supabase.auth.admin.updateUserById(
        currentUser.auth_user_id,
        { email }
      );

      if (authError) {
        console.error('Auth email update error:', authError);
        return NextResponse.json(
          { error: `Failed to update email: ${authError.message}` },
          { status: 500 }
        );
      }
    }

    // Update venue_users record
    const updateData: any = {
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      role,
      all_locations: allLocations || false,
      location_ids: locationIds || [],
    };

    if (email) updateData.email = email;
    if (pinCode) updateData.pin_code = pinCode;

    if (permissions) {
      updateData.can_view_dashboard = permissions.can_view_dashboard || false;
      updateData.can_manage_bookings = permissions.can_manage_bookings || false;
      updateData.can_manage_customers = permissions.can_manage_customers || false;
      updateData.can_manage_tables = permissions.can_manage_tables || false;
      updateData.can_manage_menu = permissions.can_manage_menu || false;
      updateData.can_manage_promotions = permissions.can_manage_promotions || false;
      updateData.can_view_analytics = permissions.can_view_analytics || false;
      updateData.can_manage_settings = permissions.can_manage_settings || false;
      updateData.can_manage_users = permissions.can_manage_users || false;
      updateData.can_manage_billing = permissions.can_manage_billing || false;
    }

    const { data: venueUser, error: venueError } = await supabase
      .from('venue_users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (venueError) {
      console.error('Venue user update error:', venueError);
      return NextResponse.json(
        { error: `Failed to update venue user: ${venueError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: venueUser
    });

  } catch (error: any) {
    console.error('Update venue user error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

