import { NextRequest, NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/auth/dal';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * GET /api/social/feed
 * Get activity feed for current user
 * Shows activities from:
 * - Users the current user follows
 * - Public activities
 * - Own activities
 * 
 * Query params:
 * - limit: number of items (default: 20, max: 50)
 * - cursor: timestamp for pagination
 * - type: filter by activity_type
 */
export async function GET(request: NextRequest) {
  try {
    let session;
    try {
      session = await verifyApiSession();
    } catch (authError: any) {
      console.error('❌ Auth error in feed API:', authError);
      return NextResponse.json(
        { error: 'Authentication required', details: authError.message },
        { status: 401 }
      );
    }
    
    const supabase = await createClient();
    const serviceSupabase = await createServiceClient();
    
    console.log('📰 Feed API called for user:', session.userId);

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const cursor = searchParams.get('cursor');
    const activityType = searchParams.get('type');

    // Get current user's consumer_id - use service client to bypass RLS
    let { data: currentConsumer, error: consumerError } = await serviceSupabase
      .from('consumers')
      .select('id, email, name')
      .eq('auth_user_id', session.userId)
      .single();

    // If consumer doesn't exist, create one
    if (consumerError || !currentConsumer) {
      console.log('⚠️ Consumer not found, creating one for user:', session.userId);
      
      // Create consumer record
      const { data: newConsumer, error: createError } = await serviceSupabase
        .from('consumers')
        .insert({
          auth_user_id: session.userId,
          email: session.email || '',
          name: session.email?.split('@')[0] || 'Gebruiker',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id, email, name')
        .single();
      
      if (createError || !newConsumer) {
        console.error('❌ Error creating consumer:', createError);
        console.error('❌ Error code:', createError?.code);
        console.error('❌ Error details:', createError?.details);
        console.error('❌ Error hint:', createError?.hint);
        console.error('❌ Attempted data:', {
          auth_user_id: session.userId,
          email: session.email || '',
          name: session.email?.split('@')[0] || 'Gebruiker',
        });
        return NextResponse.json(
          { 
            error: 'Failed to create consumer profile',
            details: createError?.message,
            code: createError?.code,
            hint: createError?.hint
          },
          { status: 500 }
        );
      }
      
      currentConsumer = newConsumer;
      console.log('✓ Consumer created:', currentConsumer.id);
    } else {
      console.log('✓ Consumer found:', currentConsumer.id);
    }

    // Get list of users current user follows - use service client to bypass RLS
    const { data: follows } = await serviceSupabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', currentConsumer.id);

    const followingIds = follows?.map(f => f.following_id) || [];
    // Include own ID to show own activities
    followingIds.push(currentConsumer.id);

    // Build query - use service client to bypass RLS (we'll filter manually)
    let query = serviceSupabase
      .from('activity_feed')
      .select(`
        id,
        actor_id,
        activity_type,
        target_type,
        target_id,
        metadata,
        is_public,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(limit * 2); // Get more to filter manually

    // Apply cursor pagination
    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    // Filter by activity type if provided (include 'post' in photo filter for backward compatibility)
    if (activityType && activityType !== 'all') {
      if (activityType === 'photo') {
        // Photo filter shows both photo and post types
        query = query.in('activity_type', ['photo', 'post']);
      } else {
        query = query.eq('activity_type', activityType);
      }
    }

    const { data: allActivities, error } = await query;

    if (error) {
      console.error('❌ Error fetching feed:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error details:', error.details);
      console.error('❌ Error hint:', error.hint);
      return NextResponse.json(
        { 
          error: error.message || 'Failed to fetch feed',
          code: error.code,
          details: error.details,
          hint: error.hint
        },
        { status: 500 }
      );
    }
    
    console.log('✓ Activities fetched:', allActivities?.length || 0);

    // Filter activities: only show public or from followed users or own
    // Also filter by activity type if provided
    let filteredActivities = (allActivities || []).filter((activity) => {
      const matchesVisibility = (
        activity.is_public === true ||
        followingIds.includes(activity.actor_id)
      );
      
      const matchesType = !activityType || activity.activity_type === activityType;
      
      return matchesVisibility && matchesType;
    }).slice(0, limit); // Limit after filtering

    // For each activity, fetch additional details based on type
    const enrichedActivities = await Promise.all(
      filteredActivities.map(async (activity) => {
        // Fetch actor info using service client
        const { data: actor } = await serviceSupabase
          .from('consumers')
          .select('id, name, profile_picture_url')
          .eq('id', activity.actor_id)
          .single();
        let targetData = null;

        // Fetch photo if activity is photo/post type and has photo_id in metadata
        let photoData = null;
        if ((activity.activity_type === 'photo' || activity.activity_type === 'post') && activity.metadata?.photo_id) {
          const { data: photo } = await serviceSupabase
            .from('moment_photos')
            .select('id, photo_url, caption')
            .eq('id', activity.metadata.photo_id)
            .single();
          
          if (photo) {
            photoData = photo;
          }
        }

        // Fetch target data based on target_type using service client
        if (activity.target_type === 'location') {
          // For post activities, target_id might be the actor's own ID
          if (activity.activity_type === 'post' && !activity.metadata?.location_id) {
            // General post without location
            targetData = null;
          } else {
            const locationId = activity.metadata?.location_id || activity.target_id;
            const { data: location } = await serviceSupabase
              .from('locations')
              .select('id, name, slug, hero_image_url, cuisine')
              .eq('id', locationId)
              .single();

            targetData = location;
          }
        } else if (activity.target_type === 'booking') {
          const { data: booking } = await serviceSupabase
            .from('bookings')
            .select('id, location_id, party_size, start_ts, guest_name')
            .eq('id', activity.target_id)
            .single();

          if (booking) {
            const { data: location } = await serviceSupabase
              .from('locations')
              .select('id, name, slug')
              .eq('id', booking.location_id)
              .single();

            targetData = {
              ...booking,
              location: location,
            };
          }
        } else if (activity.target_type === 'review') {
          const { data: review } = await serviceSupabase
            .from('reviews')
            .select('id, rating, title, comment, location_id')
            .eq('id', activity.target_id)
            .single();

          if (review) {
            const { data: location } = await serviceSupabase
              .from('locations')
              .select('id, name, slug')
              .eq('id', review.location_id)
              .single();

            targetData = {
              ...review,
              location: location,
            };
          }
        } else if (activity.target_type === 'consumer') {
          const { data: consumer } = await serviceSupabase
            .from('consumers')
            .select('id, name, profile_picture_url')
            .eq('id', activity.target_id)
            .single();

          targetData = consumer;
        }

        // Get like count using service client
        const { count: likeCount } = await serviceSupabase
          .from('feed_likes')
          .select('*', { count: 'exact', head: true })
          .eq('activity_id', activity.id);

        // Check if current user liked this using service client
        const { data: userLike } = await serviceSupabase
          .from('feed_likes')
          .select('id')
          .eq('activity_id', activity.id)
          .eq('consumer_id', currentConsumer.id)
          .single();

        // Get comment count using service client
        const { count: commentCount } = await serviceSupabase
          .from('feed_comments')
          .select('*', { count: 'exact', head: true })
          .eq('activity_id', activity.id);

        return {
          ...activity,
          actor: actor || { id: activity.actor_id, name: 'Onbekend', profile_picture_url: null },
          target: targetData,
          photo: photoData,
          stats: {
            likes: likeCount || 0,
            comments: commentCount || 0,
          },
          user_has_liked: !!userLike,
        };
      })
    );

    // Determine if there are more items
    const hasMore = filteredActivities.length === limit && (allActivities?.length || 0) > limit;
    const nextCursor = hasMore && enrichedActivities && enrichedActivities.length > 0
      ? enrichedActivities[enrichedActivities.length - 1].created_at
      : null;

    return NextResponse.json({
      feed: enrichedActivities,
      pagination: {
        has_more: hasMore,
        cursor: nextCursor,
        limit: limit,
      },
    });
  } catch (error: any) {
    console.error('❌❌❌ CRITICAL ERROR in GET /api/social/feed:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        type: error.constructor.name
      },
      { status: error.status || 500 }
    );
  }
}

