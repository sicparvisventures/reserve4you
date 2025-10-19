import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  
  // Get all locations (bypassing RLS via service role if needed)
  const { data: locations, error } = await supabase
    .from('locations')
    .select('id, name, slug, is_public, is_active, tenant_id, created_at')
    .order('created_at', { ascending: false });
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ 
    count: locations?.length || 0,
    locations: locations || [] 
  });
}



