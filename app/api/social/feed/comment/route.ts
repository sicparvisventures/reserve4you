import { NextRequest, NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/auth/dal';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * POST /api/social/feed/comment
 * Comment on an activity feed item
 */
export async function POST(request: NextRequest) {
  try {
    const session = await verifyApiSession();
    const serviceSupabase = await createServiceClient();

    const { activityId, commentText } = await request.json();

    if (!activityId || !commentText) {
      return NextResponse.json(
        { error: 'activityId and commentText are required' },
        { status: 400 }
      );
    }

    // Validate comment length
    if (commentText.trim().length === 0 || commentText.length > 1000) {
      return NextResponse.json(
        { error: 'Comment must be between 1 and 1000 characters' },
        { status: 400 }
      );
    }

    // Get current user's consumer_id
    let { data: currentConsumer, error: consumerError } = await serviceSupabase
      .from('consumers')
      .select('id')
      .eq('auth_user_id', session.userId)
      .single();

    if (consumerError || !currentConsumer) {
      // Auto-create consumer if not exists
      const { data: newConsumer, error: createError } = await serviceSupabase
        .from('consumers')
        .insert({
          auth_user_id: session.userId,
          name: session.email?.split('@')[0] || 'Gebruiker',
        })
        .select('id')
        .single();

      if (createError || !newConsumer) {
        return NextResponse.json(
          { error: 'Failed to create consumer profile' },
          { status: 500 }
        );
      }

      currentConsumer = newConsumer;
    }

    // Check if activity exists
    const { data: activity, error: activityError } = await serviceSupabase
      .from('activity_feed')
      .select('id')
      .eq('id', activityId)
      .single();

    if (activityError || !activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }

    // Create comment
    const { data: comment, error: commentError } = await serviceSupabase
      .from('feed_comments')
      .insert({
        activity_id: activityId,
        consumer_id: currentConsumer.id,
        comment_text: commentText.trim(),
      })
      .select(`
        *,
        consumer:consumers!consumer_id(
          id,
          name,
          profile_picture_url
        )
      `)
      .single();

    if (commentError) {
      console.error('Error creating comment:', commentError);
      return NextResponse.json(
        { error: commentError.message || 'Failed to post comment' },
        { status: 500 }
      );
    }

    // Get updated comment count
    const { count: commentCount } = await serviceSupabase
      .from('feed_comments')
      .select('*', { count: 'exact', head: true })
      .eq('activity_id', activityId);

    return NextResponse.json({
      success: true,
      message: 'Comment posted',
      comment: comment,
      comment_count: commentCount || 0,
    });
  } catch (error: any) {
    console.error('Error in POST /api/social/feed/comment:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

