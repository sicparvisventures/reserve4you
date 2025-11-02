/**
 * Users List API - Get all users for messaging
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Use service client to bypass RLS for consumer lookups
    const serviceSupabase = await createServiceClient();
    
    // Get current user's consumer
    const { data: currentConsumer, error: currentConsumerError } = await serviceSupabase
      .from('consumers')
      .select('id, email')
      .eq('auth_user_id', user.id)
      .single();

    if (currentConsumerError) {
      console.error('Error fetching current consumer:', currentConsumerError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get all consumers with auth (exclude current user)
    // Use service client to bypass RLS - safe because we're only getting basic info (id, email, name) for messaging
    const { data: consumers, error } = await serviceSupabase
      .from('consumers')
      .select('id, email, name')
      .not('auth_user_id', 'is', null)
      .neq('email', currentConsumer?.email || '')
      .order('name');

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      users: consumers || [] 
    });
  } catch (error: any) {
    console.error('Error in users list:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}

