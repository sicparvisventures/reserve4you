import { NextRequest, NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/auth/dal';
import { createServiceClient } from '@/lib/supabase/server';
import { config } from '@/lib/config';

/**
 * POST /api/social/photos/upload
 * Upload a moment photo
 * 
 * Body (multipart/form-data):
 * - file: Image file
 * - location_id: UUID of location
 * - booking_id: UUID of booking (optional)
 * - caption: Text caption (optional)
 * - is_public: boolean (default: true)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await verifyApiSession();
    const serviceSupabase = await createServiceClient();

    // Get consumer
    const { data: consumer, error: consumerError } = await serviceSupabase
      .from('consumers')
      .select('id')
      .eq('auth_user_id', session.userId)
      .single();

    if (consumerError || !consumer) {
      return NextResponse.json(
        { error: 'Consumer not found' },
        { status: 404 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const locationId = formData.get('location_id') as string;
    const bookingId = formData.get('booking_id') as string | null;
    const caption = formData.get('caption') as string | null;
    const isPublic = formData.get('is_public') !== 'false';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!locationId) {
      return NextResponse.json(
        { error: 'Location ID required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Create unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${consumer.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await serviceSupabase.storage
      .from('moment-photos')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload photo', details: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = serviceSupabase.storage
      .from('moment-photos')
      .getPublicUrl(fileName);

    const photoUrl = urlData.publicUrl;

    // Create moment_photo record
    const photoData: any = {
      location_id: locationId,
      consumer_id: consumer.id,
      photo_url: photoUrl,
      is_public: isPublic,
    };

    if (bookingId) {
      photoData.booking_id = bookingId;
    }

    if (caption) {
      photoData.caption = caption;
    }

    const { data: photo, error: photoError } = await serviceSupabase
      .from('moment_photos')
      .insert(photoData)
      .select()
      .single();

    if (photoError) {
      console.error('Database insert error:', photoError);
      // Try to delete uploaded file if database insert fails
      await serviceSupabase.storage
        .from('moment-photos')
        .remove([fileName]);
      
      return NextResponse.json(
        { error: 'Failed to save photo record', details: photoError.message },
        { status: 500 }
      );
    }

    // Create activity feed entry for the photo
    try {
      await serviceSupabase
        .from('activity_feed')
        .insert({
          actor_id: consumer.id,
          activity_type: 'photo',
          target_type: 'location',
          target_id: locationId,
          metadata: {
            photo_id: photo.id,
            booking_id: bookingId,
            caption: caption,
          },
          is_public: isPublic,
        });
    } catch (activityError) {
      console.error('Failed to create activity feed entry:', activityError);
      // Don't fail the whole request if activity feed creation fails
    }

    return NextResponse.json({
      photo: {
        id: photo.id,
        photo_url: photoUrl,
        caption: caption,
        location_id: locationId,
        booking_id: bookingId,
        created_at: photo.created_at,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error in photo upload:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

