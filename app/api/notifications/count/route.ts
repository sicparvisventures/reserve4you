import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifySession } from '@/lib/auth/dal';

// GET - Get unread notification count
export async function GET(request: NextRequest) {
  try {
    const session = await verifySession();
    const supabase = await createServiceClient();

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.userId)
      .eq('read', false)
      .eq('archived', false);

    if (error) {
      console.error('Error counting notifications:', error);
      return NextResponse.json(
        { error: 'Failed to count notifications' },
        { status: 500 }
      );
    }

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    console.error('Notification count error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

