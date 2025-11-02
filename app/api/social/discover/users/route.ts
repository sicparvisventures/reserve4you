import { NextRequest, NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/auth/dal';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/social/discover/users
 * Discover and search for users to follow
 * Query params:
 * - query: search query (name)
 * - limit: number of results (default: 20, max: 50)
 * - exclude_following: exclude users already following (default: true)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await verifyApiSession();
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const excludeFollowing = searchParams.get('exclude_following') !== 'false';

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

    // Get list of users current user follows (to exclude)
    let followingIds: string[] = [];
    if (excludeFollowing) {
      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentConsumer.id);

      followingIds = follows?.map(f => f.following_id) || [];
      // Also exclude self
      followingIds.push(currentConsumer.id);
    }

    // Build query
    let usersQuery = supabase
      .from('consumers')
      .select(`
        id,
        name,
        profile_picture_url,
        bio,
        is_profile_public,
        show_in_discover,
        created_at
      `)
      .eq('is_profile_public', true)
      .eq('show_in_discover', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by search query if provided
    if (query) {
      usersQuery = usersQuery.ilike('name', `%${query}%`);
    }

    // Exclude following and self
    if (followingIds.length > 0) {
      usersQuery = usersQuery.not('id', 'in', `(${followingIds.join(',')})`);
    }

    const { data: users, error } = await usersQuery;

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Enrich with stats and follow status
    const enrichedUsers = await Promise.all(
      (users || []).map(async (user) => {
        // Get stats
        const { count: followersCount } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', user.id);

        const { count: reviewsCount } = await supabase
          .from('reviews')
          .select('*', { count: 'exact', head: true })
          .eq('consumer_id', user.id)
          .eq('is_published', true);

        // Check if current user follows this user
        const { data: follow } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', currentConsumer.id)
          .eq('following_id', user.id)
          .single();

        return {
          ...user,
          stats: {
            followers: followersCount || 0,
            reviews: reviewsCount || 0,
          },
          is_following: !!follow,
        };
      })
    );

    return NextResponse.json({
      users: enrichedUsers,
      count: enrichedUsers.length,
    });
  } catch (error: any) {
    console.error('Error in GET /api/social/discover/users:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

