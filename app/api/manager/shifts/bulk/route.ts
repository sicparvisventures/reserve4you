import { NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/auth/dal';
import { getLocation } from '@/lib/auth/tenant-dal';
import { checkTenantRole } from '@/lib/auth/tenant-dal';
import { createServiceClient } from '@/lib/supabase/server';
import { shiftsBulkCreateSchema } from '@/lib/validation/manager';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await verifyApiSession();
    const body = await request.json();
    const validated = shiftsBulkCreateSchema.parse(body);

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

    // Delete existing shifts for this location
    await supabase
      .from('shifts')
      .delete()
      .eq('location_id', validated.locationId);

    // Insert new shifts (one shift with array of days)
    const shiftsToInsert = validated.shifts.map(shift => ({
      location_id: validated.locationId,
      name: shift.name,
      start_time: shift.startTime,
      end_time: shift.endTime,
      days_of_week: shift.daysOfWeek, // Array of days for this shift
      slot_minutes: location.slot_minutes || 90,
      buffer_minutes: location.buffer_minutes || 15,
      max_parallel: shift.maxParallel || null,
    }));

    const { data: shifts, error: shiftsError } = await supabase
      .from('shifts')
      .insert(shiftsToInsert)
      .select();

    if (shiftsError) throw shiftsError;

    return NextResponse.json(shifts);
  } catch (error: any) {
    console.error('Error creating shifts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create shifts' },
      { status: 500 }
    );
  }
}

