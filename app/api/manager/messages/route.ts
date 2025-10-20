import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyApiSession } from '@/lib/auth/dal';

export async function GET(request: NextRequest) {
  try {
    const session = await verifyApiSession();
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');

    if (!locationId) {
      return NextResponse.json(
        { error: 'Location ID required' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Fetch recent messages
    const { data: messages, error } = await supabase
      .from('guest_messages')
      .select('*')
      .eq('location_id', locationId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      messages: messages || [],
    });
  } catch (error: any) {
    console.error('Messages fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

