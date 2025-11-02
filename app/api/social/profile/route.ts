import { NextRequest, NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/auth/dal';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/social/profile
 * Get current user's own profile with social data
 */
export async function GET(request: NextRequest) {
  try {
    const session = await verifyApiSession();
    const supabase = await createClient();

    // Get consumer with all social fields
    const { data: consumer, error } = await supabase
      .from('consumers')
      .select(`
        id,
        name,
        email,
        phone,
        profile_picture_url,
        bio,
        favorite_cuisines,
        top_3_restaurants,
        is_profile_public,
        show_in_discover,
        created_at,
        updated_at
      `)
      .eq('auth_user_id', session.userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    if (!consumer) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Get social preferences
    const { data: preferences } = await supabase
      .from('consumer_social_preferences')
      .select('*')
      .eq('consumer_id', consumer.id)
      .single();

    // Get badges
    const { data: badges } = await supabase
      .from('user_badges')
      .select('badge_type, earned_at, metadata')
      .eq('consumer_id', consumer.id)
      .order('earned_at', { ascending: false });

    // Get flow credits balance (only active credits)
    const now = new Date().toISOString();
    const { data: creditsData } = await supabase
      .from('flow_credits')
      .select('amount, expires_at')
      .eq('consumer_id', consumer.id);

    const activeCredits = creditsData?.filter(
      (credit) => !credit.expires_at || credit.expires_at > now
    ) || [];
    const totalCredits = activeCredits.reduce((sum, credit) => sum + credit.amount, 0);

    // Get stats
    const { count: followersCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', consumer.id);

    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', consumer.id);

    const { count: reviewsCount } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('consumer_id', consumer.id)
      .eq('is_published', true);

    return NextResponse.json({
      profile: {
        ...consumer,
        social_preferences: preferences || null,
        badges: badges || [],
        credits: totalCredits,
        stats: {
          followers: followersCount || 0,
          following: followingCount || 0,
          reviews: reviewsCount || 0,
        },
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/social/profile:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/social/profile
 * Update current user's social profile
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await verifyApiSession();
    const supabase = await createClient();

    const body = await request.json();
    const {
      bio,
      profile_picture_url,
      favorite_cuisines,
      top_3_restaurants,
      is_profile_public,
      show_in_discover,
    } = body;

    // Get consumer_id
    const { data: consumer, error: consumerError } = await supabase
      .from('consumers')
      .select('id')
      .eq('auth_user_id', session.userId)
      .single();

    if (consumerError || !consumer) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Validate bio length
    if (bio !== undefined && bio !== null && bio.length > 500) {
      return NextResponse.json(
        { error: 'Bio must be 500 characters or less' },
        { status: 400 }
      );
    }

    // Validate favorite_cuisines array
    if (favorite_cuisines !== undefined && !Array.isArray(favorite_cuisines)) {
      return NextResponse.json(
        { error: 'favorite_cuisines must be an array' },
        { status: 400 }
      );
    }

    // Validate top_3_restaurants array (must be UUIDs)
    if (top_3_restaurants !== undefined) {
      if (!Array.isArray(top_3_restaurants) || top_3_restaurants.length > 3) {
        return NextResponse.json(
          { error: 'top_3_restaurants must be an array with max 3 items' },
          { status: 400 }
        );
      }
    }

    // Build update object (only include fields that are provided)
    const updateData: any = {};
    if (bio !== undefined) updateData.bio = bio || null;
    if (profile_picture_url !== undefined) updateData.profile_picture_url = profile_picture_url || null;
    if (favorite_cuisines !== undefined) updateData.favorite_cuisines = favorite_cuisines || null;
    if (top_3_restaurants !== undefined) updateData.top_3_restaurants = top_3_restaurants || null;
    if (is_profile_public !== undefined) updateData.is_profile_public = is_profile_public;
    if (show_in_discover !== undefined) updateData.show_in_discover = show_in_discover;

    // Update consumer
    const { data: updatedConsumer, error: updateError } = await supabase
      .from('consumers')
      .update(updateData)
      .eq('id', consumer.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json(
        { error: updateError.message || 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: updatedConsumer,
    });
  } catch (error: any) {
    console.error('Error in PUT /api/social/profile:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

