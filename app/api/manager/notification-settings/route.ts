import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifySession } from '@/lib/auth/dal';

// GET - Fetch notification settings for a tenant/location
export async function GET(request: NextRequest) {
  try {
    const session = await verifySession();
    const supabase = await createServiceClient();

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');
    const locationId = searchParams.get('location_id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenant_id is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this tenant
    const { data: membership } = await supabase
      .from('memberships')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', session.userId)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Fetch settings
    let query = supabase
      .from('notification_settings')
      .select('*')
      .eq('tenant_id', tenantId);

    if (locationId) {
      query = query.eq('location_id', locationId);
    } else {
      query = query.is('location_id', null);
    }

    const { data: settings, error } = await query.single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching notification settings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({ settings: settings || null });
  } catch (error) {
    console.error('Notification settings GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create or update notification settings
export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    const supabase = await createServiceClient();

    const body = await request.json();
    const {
      tenant_id,
      location_id,
      notify_on_new_booking,
      notify_on_booking_confirmed,
      notify_on_booking_cancelled,
      notify_on_booking_modified,
      send_booking_reminders,
      reminder_hours_before,
      notify_tenant_owner,
      notify_location_managers,
      send_customer_confirmation,
      send_customer_reminder,
      customer_reminder_hours_before,
    } = body;

    if (!tenant_id) {
      return NextResponse.json(
        { error: 'tenant_id is required' },
        { status: 400 }
      );
    }

    // Verify user is tenant owner or has permission
    const { data: membership } = await supabase
      .from('memberships')
      .select('role')
      .eq('tenant_id', tenant_id)
      .eq('user_id', session.userId)
      .single();

    if (!membership || membership.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only tenant owners can modify notification settings' },
        { status: 403 }
      );
    }

    // Prepare settings data
    const settingsData = {
      tenant_id,
      location_id: location_id || null,
      notify_on_new_booking: notify_on_new_booking ?? true,
      notify_on_booking_confirmed: notify_on_booking_confirmed ?? true,
      notify_on_booking_cancelled: notify_on_booking_cancelled ?? true,
      notify_on_booking_modified: notify_on_booking_modified ?? true,
      send_booking_reminders: send_booking_reminders ?? true,
      reminder_hours_before: reminder_hours_before ?? 24,
      notify_tenant_owner: notify_tenant_owner ?? true,
      notify_location_managers: notify_location_managers ?? true,
      send_customer_confirmation: send_customer_confirmation ?? true,
      send_customer_reminder: send_customer_reminder ?? true,
      customer_reminder_hours_before: customer_reminder_hours_before ?? 2,
    };

    // Upsert settings
    const { data: settings, error } = await supabase
      .from('notification_settings')
      .upsert(settingsData, {
        onConflict: 'tenant_id,location_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting notification settings:', error);
      return NextResponse.json(
        { error: 'Failed to save settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Notification settings POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

