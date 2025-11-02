import { NextRequest, NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/auth/dal';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/social/followers
 * Get list of users following the current user
 * Also supports ?consumerId=xxx to get another user's followers list (if public)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await verifyApiSession();
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const targetConsumerId = searchParams.get('consumerId');

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

    // Use targetConsumerId if provided, otherwise use current user
    const consumerId = targetConsumerId || currentConsumer.id;
    const isOwnList = consumerId === currentConsumer.id;

    // If viewing another user's followers list, check if profile is public
    if (!isOwnList) {
      const { data: targetConsumer } = await supabase
        .from('consumers')
        .select('is_profile_public')
        .eq('id', consumerId)
        .single();

      if (!targetConsumer?.is_profile_public) {
        // Check if current user is following the target
        const { data: follow } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', currentConsumer.id)
          .eq('following_id', consumerId)
          .single();

        if (!follow) {
          return NextResponse.json(
            { error: 'Cannot view this user\'s followers list' },
            { status: 403 }
          );
        }
      }
    }

    // Get list of users following this user
    const { data: follows, error: followsError } = await supabase
      .from('follows')
      .select(`
        follower_id,
        created_at,
        consumer:follower_id (
          id,
          name,
          profile_picture_url,
          is_profile_public
        )
      `)
      .eq('following_id', consumerId)
      .order('created_at', { ascending: false });

    if (followsError) {
      console.error('Error fetching followers:', followsError);
      return NextResponse.json(
        { error: followsError.message || 'Failed to fetch followers' },
        { status: 500 }
      );
    }

    // Transform data to flatten consumer info
    const followers = follows?.map(follow => ({
      id: follow.consumer.id,
      name: follow.consumer.name,
      profile_picture_url: follow.consumer.profile_picture_url,
      is_profile_public: follow.consumer.is_profile_public,
      followed_at: follow.created_at,
    })) || [];

    return NextResponse.json({
      followers: followers,
      count: followers.length,
      is_own_list: isOwnList,
    });
  } catch (error: any) {
    console.error('Error in GET /api/social/followers:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

