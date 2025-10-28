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
    const tablesToInsert = validated.tables.map((table, index) => ({
      location_id: validated.locationId,
      name: table.name,
      seats: table.seats,
      is_combinable: table.combinable, // Map 'combinable' from frontend to 'is_combinable' in DB
      group_id: table.groupId || null,
      table_number: index + 1, // 🔥 FIX: Add table_number (auto-incrementing)
    }));

    console.log('📝 Inserting tables:', tablesToInsert);

    const { data: tables, error: tablesError } = await supabase
      .from('tables')
      .insert(tablesToInsert)
      .select();

    if (tablesError) {
      console.error('❌ Error inserting tables:', tablesError);
      console.error('   Full error:', JSON.stringify(tablesError, null, 2));
      console.error('   Attempted to insert:', tablesToInsert);
      throw tablesError;
    }

    console.log('✅ Tables created successfully:', tables);

    return NextResponse.json(tables);
  } catch (error: any) {
    console.error('💥 Error creating tables:', error);
    
    // Better error message
    let errorMessage = error.message || 'Failed to create tables';
    
    // Check for schema cache issues
    if (errorMessage.includes('schema cache') || errorMessage.includes('column')) {
      errorMessage = `Database schema issue: ${errorMessage}. Please refresh the schema cache in Supabase dashboard or run FIX_TABLES_SCHEMA.sql`;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.details || error.hint || null,
        code: error.code || null,
      },
      { status: 500 }
    );
  }
}

