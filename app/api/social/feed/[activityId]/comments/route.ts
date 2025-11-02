import { NextRequest, NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/auth/dal';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * GET /api/social/feed/[activityId]/comments
 * Get all comments for an activity (with pagination)
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
    const cursor = searchParams.get('cursor');

    // Get current user's consumer_id (optional, for checking own comments)
    const { data: currentConsumer } = await serviceSupabase
      .from('consumers')
      .select('id')
      .eq('auth_user_id', session.userId)
      .single();

    // Build query using service client
    let query = serviceSupabase
      .from('feed_comments')
      .select(`
        id,
        comment_text,
        created_at,
        updated_at,
        consumer:consumers!consumer_id(
          id,
          name,
          profile_picture_url
        )
      `)
      .eq('activity_id', activityId)
      .order('created_at', { ascending: true })
      .limit(limit);

    // Apply cursor pagination
    if (cursor) {
      query = query.gt('created_at', cursor);
    }

    const { data: comments, error } = await query;

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    // Mark own comments
    const enrichedComments = (comments || []).map(comment => ({
      ...comment,
      is_own_comment: currentConsumer?.id === comment.consumer.id,
    }));

    // Determine if there are more items
    const hasMore = (comments?.length || 0) === limit;
    const nextCursor = hasMore && comments && comments.length > 0
      ? comments[comments.length - 1].created_at
      : null;

    return NextResponse.json({
      comments: enrichedComments,
      pagination: {
        has_more: hasMore,
        cursor: nextCursor,
        limit: limit,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/social/feed/[activityId]/comments:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

