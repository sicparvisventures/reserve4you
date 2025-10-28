/**
 * Users List API - Get all users for messaging
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get current user's consumer
    const { data: currentConsumer } = await supabase
      .from('consumers')
      .select('id, email')
      .eq('auth_user_id', user.id)
      .single();

    // Get all consumers with auth (exclude current user)
    const { data: consumers, error } = await supabase
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

