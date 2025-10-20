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

    // Get stats using Postgres function
    const { data: stats, error } = await supabase
      .rpc('get_message_stats', {
        p_location_id: locationId,
      });

    if (error) {
      console.error('Error fetching message stats:', error);
      return NextResponse.json(
        { error: 'Failed to fetch stats' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      stats: stats?.[0] || {
        total_messages: 0,
        total_recipients: 0,
        messages_this_month: 0,
        average_recipients: 0,
      },
    });
  } catch (error: any) {
    console.error('Message stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

