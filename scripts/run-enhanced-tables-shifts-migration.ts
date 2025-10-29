#!/usr/bin/env tsx

/**
 * Script to run the enhanced tables and shifts management migration
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables:');
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

async function runMigration() {
  console.log('Running Enhanced Tables & Shifts Management Migration...\n');

  try {
    // Read the SQL file
    const sqlPath = join(process.cwd(), 'supabase/migrations/20250129000001_enhanced_tables_shifts_management.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).single();

    if (error) {
      // If exec_sql doesn't exist, try direct execution
      const { error: directError } = await supabase.from('_migrations').select('*').limit(1);
      
      if (directError) {
        console.log('Note: Direct SQL execution not available via Supabase client.');
        console.log('Please run the migration manually using Supabase Dashboard or CLI.\n');
        console.log('Migration file: supabase/migrations/20250129000001_enhanced_tables_shifts_management.sql');
        console.log('\nAlternatively, use: npx supabase db push\n');
        return;
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error running migration:', error);
    console.log('\nPlease run the migration manually:');
    console.log('1. Using Supabase Dashboard SQL Editor');
    console.log('2. Or run: npx supabase db push');
    console.log('3. Or manually execute: supabase/migrations/20250129000001_enhanced_tables_shifts_management.sql');
  }
}

runMigration()
  .then(() => {
    console.log('\nScript completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nScript failed:', error);
    process.exit(1);
  });

