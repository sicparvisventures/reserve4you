import { NextRequest, NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/auth/dal';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * POST /api/social/feed/post
 * Create a new post in the activity feed
 * 
 * Body:
 * - text: string (optional, max 2000 chars)
 * - location_id: UUID (optional)
 * - photo_id: UUID (optional, if photo was already uploaded)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await verifyApiSession();
    const serviceSupabase = await createServiceClient();

    const { text, location_id, photo_id } = await request.json();

    // Validation
    if (!text && !location_id && !photo_id) {
      return NextResponse.json(
        { error: 'Post must contain text, location, or photo' },
        { status: 400 }
      );
    }

    if (text && text.length > 2000) {
      return NextResponse.json(
        { error: 'Text must be 2000 characters or less' },
        { status: 400 }
      );
    }

    // Get consumer
    let { data: consumer, error: consumerError } = await serviceSupabase
      .from('consumers')
      .select('id')
      .eq('auth_user_id', session.userId)
      .single();

    if (consumerError || !consumer) {
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

      consumer = newConsumer;
    }

    // Determine activity type and target
    let activityType = 'post';
    let targetType = 'location';
    let targetId = location_id;

    if (photo_id && !location_id) {
      // Photo-only post
      activityType = 'photo';
      targetType = 'location';
      // Get location from photo
      const { data: photo } = await serviceSupabase
        .from('moment_photos')
        .select('location_id')
        .eq('id', photo_id)
        .single();
      
      if (photo) {
        targetId = photo.location_id;
      }
    } else if (location_id) {
      // Location post (with or without photo)
      activityType = photo_id ? 'photo' : 'post';
      targetType = 'location';
      targetId = location_id;
    } else {
      // Text-only post (general post)
      activityType = 'post';
      targetType = 'location';
      // Use a default or null target for general posts
      targetId = null;
    }

    // Create activity feed entry
    const metadata: any = {};
    if (text) metadata.text = text;
    if (photo_id) metadata.photo_id = photo_id;
    if (location_id) metadata.location_id = location_id;

    const { data: activity, error: activityError } = await serviceSupabase
      .from('activity_feed')
      .insert({
        actor_id: consumer.id,
        activity_type: activityType,
        target_type: targetType,
        target_id: targetId || consumer.id, // Fallback to own ID for general posts
        metadata: metadata,
        is_public: true,
      })
      .select()
      .single();

    if (activityError) {
      console.error('Error creating activity:', activityError);
      return NextResponse.json(
        { error: 'Failed to create post' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      activity: activity,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error in POST /api/social/feed/post:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

