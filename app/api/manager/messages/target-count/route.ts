import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyApiSession } from '@/lib/auth/dal';

export async function GET(request: NextRequest) {
  try {
    const session = await verifyApiSession();
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const targetUpcoming = searchParams.get('targetUpcoming') === 'true';
    const specificDate = searchParams.get('specificDate');

    if (!locationId) {
      return NextResponse.json(
        { error: 'Location ID required' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Get count using Postgres function
    const { data: count, error } = await supabase
      .rpc('get_targetable_guests_count', {
        p_location_id: locationId,
        p_target_upcoming: targetUpcoming,
        p_specific_date: specificDate || null,
      });

    if (error) {
      console.error('Error fetching target count:', error);
      return NextResponse.json(
        { error: 'Failed to fetch count' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      count: count || 0,
    });
  } catch (error: any) {
    console.error('Target count error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

