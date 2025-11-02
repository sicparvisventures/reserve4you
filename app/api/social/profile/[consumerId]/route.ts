import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/social/profile/[consumerId]
 * Get public profile by consumer ID
 * - Public profiles: anyone can view
 * - Private profiles: only if authenticated and following or own profile
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { consumerId: string } }
) {
  try {
    const { consumerId } = params;
    const supabase = await createClient();

    // Try to get authenticated user (optional)
    const { data: { user } } = await supabase.auth.getUser();
    let currentConsumerId: string | null = null;

    if (user) {
      const { data: currentConsumer } = await supabase
        .from('consumers')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      currentConsumerId = currentConsumer?.id || null;
    }

    // Get profile
    const { data: consumer, error: consumerError } = await supabase
      .from('consumers')
      .select(`
        id,
        name,
        profile_picture_url,
        bio,
        favorite_cuisines,
        top_3_restaurants,
        is_profile_public,
        created_at
      `)
      .eq('id', consumerId)
      .single();

    if (consumerError || !consumer) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Check if viewing own profile
    const isOwnProfile = currentConsumerId === consumer.id;

    // Check if profile is private and user doesn't have access
    if (!consumer.is_profile_public && !isOwnProfile) {
      // Check if current user is following this user
      if (!currentConsumerId) {
        return NextResponse.json(
          { error: 'This profile is private' },
          { status: 403 }
        );
      }

      const { data: follow } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentConsumerId)
        .eq('following_id', consumerId)
        .single();

      if (!follow) {
        return NextResponse.json(
          { error: 'This profile is private. Follow to view.' },
          { status: 403 }
        );
      }
    }

    // Get badges (always public)
    const { data: badges } = await supabase
      .from('user_badges')
      .select('badge_type, earned_at, metadata')
      .eq('consumer_id', consumerId)
      .order('earned_at', { ascending: false });

    // Get stats
    const { count: followersCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', consumerId);

    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', consumerId);

    const { count: reviewsCount } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('consumer_id', consumerId)
      .eq('is_published', true);

    // Check if current user is following
    let isFollowing = false;
    if (currentConsumerId && !isOwnProfile) {
      const { data: follow } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentConsumerId)
        .eq('following_id', consumerId)
        .single();

      isFollowing = !!follow;
    }

    return NextResponse.json({
      profile: {
        ...consumer,
        badges: badges || [],
        stats: {
          followers: followersCount || 0,
          following: followingCount || 0,
          reviews: reviewsCount || 0,
        },
        is_own_profile: isOwnProfile,
        is_following: isFollowing,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/social/profile/[consumerId]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

