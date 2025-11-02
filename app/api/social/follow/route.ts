import { NextRequest, NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/auth/dal';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/social/follow
 * Follow a user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await verifyApiSession();
    const supabase = await createClient();

    const { consumerId } = await request.json();

    if (!consumerId) {
      return NextResponse.json(
        { error: 'consumerId is required' },
        { status: 400 }
      );
    }

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

    // Check if trying to follow self
    if (currentConsumer.id === consumerId) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    // Check if target consumer exists
    const { data: targetConsumer, error: targetError } = await supabase
      .from('consumers')
      .select('id, is_profile_public')
      .eq('id', consumerId)
      .single();

    if (targetError || !targetConsumer) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', currentConsumer.id)
      .eq('following_id', consumerId)
      .single();

    if (existingFollow) {
      return NextResponse.json(
        { error: 'Already following this user' },
        { status: 400 }
      );
    }

    // Create follow relationship
    const { data: follow, error: followError } = await supabase
      .from('follows')
      .insert({
        follower_id: currentConsumer.id,
        following_id: consumerId,
      })
      .select()
      .single();

    if (followError) {
      console.error('Error creating follow:', followError);
      return NextResponse.json(
        { error: followError.message || 'Failed to follow user' },
        { status: 500 }
      );
    }

    // Get updated follower count
    const { count: followersCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', consumerId);

    return NextResponse.json({
      success: true,
      message: 'Successfully followed user',
      follow: follow,
      followers_count: followersCount || 0,
    });
  } catch (error: any) {
    console.error('Error in POST /api/social/follow:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/social/follow
 * Unfollow a user
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await verifyApiSession();
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const consumerId = searchParams.get('consumerId');

    if (!consumerId) {
      return NextResponse.json(
        { error: 'consumerId is required' },
        { status: 400 }
      );
    }

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

    // Delete follow relationship
    const { error: deleteError } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', currentConsumer.id)
      .eq('following_id', consumerId);

    if (deleteError) {
      console.error('Error deleting follow:', deleteError);
      return NextResponse.json(
        { error: deleteError.message || 'Failed to unfollow user' },
        { status: 500 }
      );
    }

    // Get updated follower count
    const { count: followersCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', consumerId);

    return NextResponse.json({
      success: true,
      message: 'Successfully unfollowed user',
      followers_count: followersCount || 0,
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/social/follow:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/social/follow?consumerId=xxx
 * Check if current user is following a user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await verifyApiSession();
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const consumerId = searchParams.get('consumerId');

    if (!consumerId) {
      return NextResponse.json(
        { error: 'consumerId is required' },
        { status: 400 }
      );
    }

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

    // Check if following
    const { data: follow } = await supabase
      .from('follows')
      .select('id, created_at')
      .eq('follower_id', currentConsumer.id)
      .eq('following_id', consumerId)
      .single();

    return NextResponse.json({
      is_following: !!follow,
      follow: follow || null,
    });
  } catch (error: any) {
    console.error('Error in GET /api/social/follow:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

