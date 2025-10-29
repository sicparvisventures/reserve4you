#!/usr/bin/env tsx

/**
 * Script to add default shifts to locations that don't have any configured.
 * This is required for the booking system to show availability.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addDefaultShifts() {
  console.log('🔍 Checking locations without shifts...\n');

  // Get all active locations
  const { data: locations, error: locationsError } = await supabase
    .from('locations')
    .select('id, name, slug')
    .eq('is_active', true);

  if (locationsError) {
    console.error('❌ Error fetching locations:', locationsError);
    process.exit(1);
  }

  if (!locations || locations.length === 0) {
    console.log('ℹ️  No active locations found.');
    return;
  }

  console.log(`📍 Found ${locations.length} active location(s):\n`);

  for (const location of locations) {
    // Check if location has shifts
    const { data: existingShifts, error: shiftsError } = await supabase
      .from('shifts')
      .select('id, name')
      .eq('location_id', location.id);

    if (shiftsError) {
      console.error(`❌ Error checking shifts for ${location.name}:`, shiftsError);
      continue;
    }

    if (existingShifts && existingShifts.length > 0) {
      console.log(`✅ ${location.name} - Already has ${existingShifts.length} shift(s)`);
      continue;
    }

    console.log(`➕ ${location.name} - Adding default shifts...`);

    // Add default Lunch shift (Mon-Fri, 11:00-15:00)
    const { error: lunchError } = await supabase
      .from('shifts')
      .insert({
        location_id: location.id,
        name: 'Lunch',
        days_of_week: [1, 2, 3, 4, 5], // Monday through Friday
        start_time: '11:00:00',
        end_time: '15:00:00',
        slot_minutes: 90,
        buffer_minutes: 15,
        is_active: true
      });

    if (lunchError) {
      console.error(`   ❌ Error adding Lunch shift:`, lunchError);
      continue;
    }

    // Add default Dinner shift (Mon-Sat, 17:00-22:00)
    const { error: dinnerError } = await supabase
      .from('shifts')
      .insert({
        location_id: location.id,
        name: 'Dinner',
        days_of_week: [1, 2, 3, 4, 5, 6], // Monday through Saturday
        start_time: '17:00:00',
        end_time: '22:00:00',
        slot_minutes: 90,
        buffer_minutes: 15,
        is_active: true
      });

    if (dinnerError) {
      console.error(`   ❌ Error adding Dinner shift:`, dinnerError);
      continue;
    }

    console.log(`   ✅ Added: Lunch (Mon-Fri 11:00-15:00)`);
    console.log(`   ✅ Added: Dinner (Mon-Sat 17:00-22:00)`);
  }

  console.log('\n✨ Default shifts setup complete!\n');

  // Show summary
  const { data: allShifts } = await supabase
    .from('shifts')
    .select('location_id, name, days_of_week, start_time, end_time');

  if (allShifts) {
    console.log('📊 Summary:');
    console.log(`   Total locations: ${locations.length}`);
    console.log(`   Total shifts: ${allShifts.length}`);
    console.log(`   Locations with shifts: ${new Set(allShifts.map(s => s.location_id)).size}`);
  }
}

addDefaultShifts()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

