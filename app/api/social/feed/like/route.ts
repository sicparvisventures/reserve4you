import { NextRequest, NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/auth/dal';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * POST /api/social/feed/like
 * Like an activity feed item
 */
export async function POST(request: NextRequest) {
  try {
    const session = await verifyApiSession();
    const serviceSupabase = await createServiceClient();

    const { activityId } = await request.json();

    if (!activityId) {
      return NextResponse.json(
        { error: 'activityId is required' },
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

    // Check if already liked
    const { data: existingLike } = await serviceSupabase
      .from('feed_likes')
      .select('id')
      .eq('activity_id', activityId)
      .eq('consumer_id', currentConsumer.id)
      .single();

    if (existingLike) {
      return NextResponse.json(
        { error: 'Already liked this activity' },
        { status: 400 }
      );
    }

    // Create like
    const { data: like, error: likeError } = await serviceSupabase
      .from('feed_likes')
      .insert({
        activity_id: activityId,
        consumer_id: currentConsumer.id,
      })
      .select()
      .single();

    if (likeError) {
      console.error('Error creating like:', likeError);
      return NextResponse.json(
        { error: likeError.message || 'Failed to like activity' },
        { status: 500 }
      );
    }

    // Get updated like count
    const { count: likeCount } = await serviceSupabase
      .from('feed_likes')
      .select('*', { count: 'exact', head: true })
      .eq('activity_id', activityId);

    return NextResponse.json({
      success: true,
      message: 'Activity liked',
      like: like,
      like_count: likeCount || 0,
    });
  } catch (error: any) {
    console.error('Error in POST /api/social/feed/like:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/social/feed/like?activityId=xxx
 * Unlike an activity feed item
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await verifyApiSession();
    const serviceSupabase = await createServiceClient();

    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get('activityId');

    if (!activityId) {
      return NextResponse.json(
        { error: 'activityId is required' },
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

    // Delete like
    const { error: deleteError } = await serviceSupabase
      .from('feed_likes')
      .delete()
      .eq('activity_id', activityId)
      .eq('consumer_id', currentConsumer.id);

    if (deleteError) {
      console.error('Error deleting like:', deleteError);
      return NextResponse.json(
        { error: deleteError.message || 'Failed to unlike activity' },
        { status: 500 }
      );
    }

    // Get updated like count
    const { count: likeCount } = await serviceSupabase
      .from('feed_likes')
      .select('*', { count: 'exact', head: true })
      .eq('activity_id', activityId);

    return NextResponse.json({
      success: true,
      message: 'Activity unliked',
      like_count: likeCount || 0,
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/social/feed/like:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

