import { NextRequest, NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/auth/dal';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/social/preferences
 * Get current user's social preferences
 */
export async function GET(request: NextRequest) {
  try {
    const session = await verifyApiSession();
    const supabase = await createClient();

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

    // Get or create preferences
    let { data: preferences, error: prefsError } = await supabase
      .from('consumer_social_preferences')
      .select('*')
      .eq('consumer_id', consumer.id)
      .single();

    // If preferences don't exist, create default ones
    if (prefsError && prefsError.code === 'PGRST116') {
      const { data: newPrefs, error: createError } = await supabase
        .from('consumer_social_preferences')
        .insert({
          consumer_id: consumer.id,
          auto_share_bookings: false,
          auto_share_reviews: false,
          show_location_to_friends: true,
          allow_friend_requests: true,
          notification_new_follower: true,
          notification_activity_feed: true,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating preferences:', createError);
        return NextResponse.json(
          { error: 'Failed to create preferences' },
          { status: 500 }
        );
      }

      preferences = newPrefs;
    } else if (prefsError) {
      console.error('Error fetching preferences:', prefsError);
      return NextResponse.json(
        { error: prefsError.message || 'Failed to fetch preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      preferences: preferences,
    });
  } catch (error: any) {
    console.error('Error in GET /api/social/preferences:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/social/preferences
 * Update current user's social preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await verifyApiSession();
    const supabase = await createClient();

    const body = await request.json();
    const {
      auto_share_bookings,
      auto_share_reviews,
      show_location_to_friends,
      allow_friend_requests,
      notification_new_follower,
      notification_activity_feed,
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

    // Build update object (only include fields that are provided)
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    if (auto_share_bookings !== undefined) updateData.auto_share_bookings = auto_share_bookings;
    if (auto_share_reviews !== undefined) updateData.auto_share_reviews = auto_share_reviews;
    if (show_location_to_friends !== undefined) updateData.show_location_to_friends = show_location_to_friends;
    if (allow_friend_requests !== undefined) updateData.allow_friend_requests = allow_friend_requests;
    if (notification_new_follower !== undefined) updateData.notification_new_follower = notification_new_follower;
    if (notification_activity_feed !== undefined) updateData.notification_activity_feed = notification_activity_feed;

    // Check if preferences exist
    const { data: existingPrefs } = await supabase
      .from('consumer_social_preferences')
      .select('consumer_id')
      .eq('consumer_id', consumer.id)
      .single();

    let updatedPreferences;

    if (!existingPrefs) {
      // Create new preferences
      const { data: newPrefs, error: createError } = await supabase
        .from('consumer_social_preferences')
        .insert({
          consumer_id: consumer.id,
          ...updateData,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating preferences:', createError);
        return NextResponse.json(
          { error: 'Failed to update preferences' },
          { status: 500 }
        );
      }

      updatedPreferences = newPrefs;
    } else {
      // Update existing preferences
      const { data: updatedPrefs, error: updateError } = await supabase
        .from('consumer_social_preferences')
        .update(updateData)
        .eq('consumer_id', consumer.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating preferences:', updateError);
        return NextResponse.json(
          { error: updateError.message || 'Failed to update preferences' },
          { status: 500 }
        );
      }

      updatedPreferences = updatedPrefs;
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: updatedPreferences,
    });
  } catch (error: any) {
    console.error('Error in PUT /api/social/preferences:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

