import { NextRequest, NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/auth/dal';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/social/feed/[activityId]
 * Get a specific activity feed item with full details, comments, and likes
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ activityId: string }> }
) {
  try {
    const session = await verifyApiSession();
    const supabase = await createClient();

    const { activityId } = await params;

    // Get current user's consumer_id
    const { data: currentConsumer, error: consumerError } = await supabase
      .from('consumers')
      .select('id')
      .eq('auth_user_id', session.userId)
      .single();

    if (consumerError || !currentConsumer) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Get activity
    const { data: activity, error: activityError } = await supabase
      .from('activity_feed')
      .select(`
        id,
        actor_id,
        activity_type,
        target_type,
        target_id,
        metadata,
        is_public,
        created_at,
        actor:consumers!actor_id(
          id,
          name,
          profile_picture_url,
          bio
        )
      `)
      .eq('id', activityId)
      .single();

    if (activityError || !activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }

    // Fetch target data based on target_type
    let targetData = null;
    if (activity.target_type === 'location') {
      const { data: location } = await supabase
        .from('locations')
        .select('id, name, slug, hero_image_url, cuisine, price_range, address_json')
        .eq('id', activity.target_id)
        .single();

      targetData = location;
    } else if (activity.target_type === 'booking') {
      const { data: booking } = await supabase
        .from('bookings')
        .select('id, location_id, party_size, start_ts, guest_name')
        .eq('id', activity.target_id)
        .single();

      if (booking) {
        const { data: location } = await supabase
          .from('locations')
          .select('id, name, slug, hero_image_url')
          .eq('id', booking.location_id)
          .single();

        targetData = {
          ...booking,
          location: location,
        };
      }
    } else if (activity.target_type === 'review') {
      const { data: review } = await supabase
        .from('reviews')
        .select('id, rating, title, comment, location_id')
        .eq('id', activity.target_id)
        .single();

      if (review) {
        const { data: location } = await supabase
          .from('locations')
          .select('id, name, slug, hero_image_url')
          .eq('id', review.location_id)
          .single();

        targetData = {
          ...review,
          location: location,
        };
      }
    } else if (activity.target_type === 'consumer') {
      const { data: consumer } = await supabase
        .from('consumers')
        .select('id, name, profile_picture_url, bio')
        .eq('id', activity.target_id)
        .single();

      targetData = consumer;
    }

    // Get likes with user info
    const { data: likes } = await supabase
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
      .limit(50); // Limit to 50 most recent likes

    // Check if current user liked this
    const { data: userLike } = await supabase
      .from('feed_likes')
      .select('id')
      .eq('activity_id', activityId)
      .eq('consumer_id', currentConsumer.id)
      .single();

    // Get comments with user info
    const { data: comments } = await supabase
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
      .order('created_at', { ascending: true });

    // Get counts
    const { count: likeCount } = await supabase
      .from('feed_likes')
      .select('*', { count: 'exact', head: true })
      .eq('activity_id', activityId);

    const { count: commentCount } = await supabase
      .from('feed_comments')
      .select('*', { count: 'exact', head: true })
      .eq('activity_id', activityId);

    return NextResponse.json({
      activity: {
        ...activity,
        target: targetData,
        stats: {
          likes: likeCount || 0,
          comments: commentCount || 0,
        },
        user_has_liked: !!userLike,
        likes: likes || [],
        comments: comments || [],
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/social/feed/[activityId]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

