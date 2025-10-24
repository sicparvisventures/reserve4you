/**
 * API Route: Delete Venue User
 * Deletes auth user (cascades to venue_users via FK)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const tenantId = searchParams.get('tenantId');

    if (!id || !tenantId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
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

    // Get venue user to find auth_user_id
    const { data: venueUser, error: fetchError } = await supabase
      .from('venue_users')
      .select('auth_user_id, tenant_id')
      .eq('id', id)
      .single();

    if (fetchError || !venueUser) {
      console.error('Venue user fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Venue user not found or no access' },
        { status: 404 }
      );
    }

    // Verify tenant matches
    if (venueUser.tenant_id !== tenantId) {
      return NextResponse.json(
        { error: 'Venue user does not belong to this tenant' },
        { status: 403 }
      );
    }

    // Delete auth user if exists (will cascade to venue_users via FK)
    if (venueUser.auth_user_id) {
      const { error: authError } = await supabase.auth.admin.deleteUser(
        venueUser.auth_user_id
      );

      if (authError) {
        console.error('Auth delete error:', authError);
        // Continue anyway - try to delete venue_user directly
        console.log('Auth delete failed, attempting direct venue_user delete...');
      }
    }
    
    // Always try direct delete (for old users without auth or if auth delete failed)
    const { error: venueError } = await supabase
      .from('venue_users')
      .delete()
      .eq('id', id);

    if (venueError) {
      console.error('Venue user delete error:', venueError);
      return NextResponse.json(
        { error: `Failed to delete venue user: ${venueError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true
    });

  } catch (error: any) {
    console.error('Delete venue user error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

