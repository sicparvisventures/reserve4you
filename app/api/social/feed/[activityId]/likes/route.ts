import { NextRequest, NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/auth/dal';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * GET /api/social/feed/[activityId]/likes
 * Get list of users who liked an activity
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { activityId: string } }
) {
  try {
    const session = await verifyApiSession();
    const serviceSupabase = await createServiceClient();
    const { activityId } = params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    // Get likes with user info using service client
    const { data: likes, error } = await serviceSupabase
      .from('feed_likes')
      .select(`
        id,
        created_at,
        consumer:consumers!consumer_id(
          id,
          name,
          profile_picture_url
        )
      `)
      .eq('activity_id', activityId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching likes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch likes' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      likes: likes || [],
      count: likes?.length || 0,
    });
  } catch (error: any) {
    console.error('Error in GET /api/social/feed/[activityId]/likes:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

