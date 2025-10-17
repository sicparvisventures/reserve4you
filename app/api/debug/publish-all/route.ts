import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * DEBUG ROUTE: Manually publish all locations that meet requirements
 * WARNING: Only use this for testing! Remove in production.
 */
export async function POST() {
  const supabase = await createServiceClient();
  
  // Get all unpublished locations
  const { data: locations, error: fetchError } = await supabase
    .from('locations')
    .select(`
      id,
      name,
      slug,
      is_public,
      tenant_id
    `)
    .eq('is_public', false)
    .eq('is_active', true);
  
  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  
  if (!locations || locations.length === 0) {
    return NextResponse.json({ message: 'No unpublished locations found' });
  }
  
  const results = [];
  
  for (const location of locations) {
    // Check if location has required data
    const { data: tables } = await supabase
      .from('tables')
      .select('id')
      .eq('location_id', location.id)
      .limit(1);
    
    const { data: shifts } = await supabase
      .from('shifts')
      .select('id')
      .eq('location_id', location.id)
      .limit(1);
    
    const { data: policy } = await supabase
      .from('policies')
      .select('id')
      .eq('location_id', location.id)
      .single();
    
    const { data: billing } = await supabase
      .from('billing_state')
      .select('status')
      .eq('tenant_id', location.tenant_id)
      .single();
    
    const hasRequirements = 
      tables && tables.length > 0 &&
      shifts && shifts.length > 0 &&
      policy &&
      billing && ['ACTIVE', 'TRIALING'].includes(billing.status);
    
    if (hasRequirements) {
      // Publish the location
      const { error: updateError } = await supabase
        .from('locations')
        .update({ is_public: true })
        .eq('id', location.id);
      
      if (updateError) {
        results.push({
          location: location.name,
          status: 'failed',
          error: updateError.message
        });
      } else {
        results.push({
          location: location.name,
          status: 'published',
          url: `/p/${location.slug}`
        });
      }
    } else {
      results.push({
        location: location.name,
        status: 'requirements_not_met',
        missing: {
          tables: !tables || tables.length === 0,
          shifts: !shifts || shifts.length === 0,
          policy: !policy,
          billing: !billing || !['ACTIVE', 'TRIALING'].includes(billing.status)
        }
      });
    }
  }
  
  return NextResponse.json({ 
    message: 'Processed all unpublished locations',
    results 
  });
}

