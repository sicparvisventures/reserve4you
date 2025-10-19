import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifySession } from '@/lib/auth/dal';

// POST - Mark all notifications as read
export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    const supabase = await createServiceClient();

    const { error } = await supabase
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', session.userId)
      .eq('read', false)
      .eq('archived', false);

    if (error) {
      console.error('Error marking all as read:', error);
      return NextResponse.json(
        { error: 'Failed to mark all as read' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark all read error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

