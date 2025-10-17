import { NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/auth/dal';
import { getLocation } from '@/lib/auth/tenant-dal';
import { checkTenantRole } from '@/lib/auth/tenant-dal';
import { createServiceClient } from '@/lib/supabase/server';
import { tablesBulkCreateSchema } from '@/lib/validation/manager';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await verifyApiSession();
    const body = await request.json();
    const validated = tablesBulkCreateSchema.parse(body);

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

    // Delete existing tables for this location
    await supabase
      .from('tables')
      .delete()
      .eq('location_id', validated.locationId);

    // Insert new tables
    const tablesToInsert = validated.tables.map(table => ({
      location_id: validated.locationId,
      name: table.name,
      seats: table.seats,
      is_combinable: table.combinable, // Map 'combinable' from frontend to 'is_combinable' in DB
      group_id: table.groupId || null,
    }));

    const { data: tables, error: tablesError } = await supabase
      .from('tables')
      .insert(tablesToInsert)
      .select();

    if (tablesError) throw tablesError;

    return NextResponse.json(tables);
  } catch (error: any) {
    console.error('Error creating tables:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create tables' },
      { status: 500 }
    );
  }
}

