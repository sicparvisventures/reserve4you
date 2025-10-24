/**
 * Reviews API Endpoints
 * 
 * GET: Fetch reviews for a location
 * POST: Create a new review
 */

import { createClient } from '@/lib/supabase/server';
import { getOptionalUser } from '@/lib/auth/dal';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/reviews - Fetch reviews for a location
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const locationId = searchParams.get('locationId');
    const rating = searchParams.get('rating');

    if (!locationId) {
      return NextResponse.json(
        { error: 'locationId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Build query
    let query = supabase
      .from('reviews')
      .select(`
        id,
        rating,
        title,
        comment,
        is_verified,
        created_at,
        consumer:consumers(
          name
        ),
        reply:review_replies(
          id,
          comment,
          created_at,
          user:auth.users(
            raw_user_meta_data
          )
        ),
        helpful_votes:review_helpful_votes(count)
      `)
      .eq('location_id', locationId)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    // Filter by rating if provided
    if (rating) {
      query = query.eq('rating', parseInt(rating));
    }

    const { data: reviews, error } = await query;

    if (error) {
      console.error('❌ Error fetching reviews:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reviews', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Reviews fetched:', {
      locationId,
      count: reviews?.length || 0,
      reviews: reviews?.map(r => ({ id: r.id, rating: r.rating, consumer: r.consumer }))
    });

    // Transform the data
    const transformedReviews = (reviews || []).map((review: any) => ({
      ...review,
      consumer: review.consumer || { name: 'Anoniem' },
      reply: review.reply?.[0] || null,
      helpful_votes_count: review.helpful_votes?.[0]?.count || 0,
    }));

    console.log('✅ Transformed reviews:', transformedReviews.length);

    return NextResponse.json({
      reviews: transformedReviews,
    });
  } catch (error) {
    console.error('Error in GET /api/reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/reviews - Create a new review
export async function POST(request: NextRequest) {
  try {
    const userData = await getOptionalUser();
    
    if (!userData?.authUser) {
      return NextResponse.json(
        { error: 'Je moet ingelogd zijn om een review te plaatsen' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { locationId, rating, title, comment } = body;

    // Validate input
    if (!locationId || !rating || !comment) {
      return NextResponse.json(
        { error: 'locationId, rating en comment zijn verplicht' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating moet tussen 1 en 5 zijn' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get or create consumer
    let { data: consumer, error: consumerError } = await supabase
      .from('consumers')
      .select('*')
      .eq('auth_user_id', userData.authUser.id)
      .single();

    if (consumerError || !consumer) {
      // Create consumer
      const { data: newConsumer, error: createError } = await supabase
        .from('consumers')
        .insert({
          auth_user_id: userData.authUser.id,
          name: userData.authUser.user_metadata?.name || userData.authUser.email?.split('@')[0] || 'Gast',
          email: userData.authUser.email,
        })
        .select()
        .single();

      if (createError || !newConsumer) {
        console.error('Error creating consumer:', createError);
        return NextResponse.json(
          { error: 'Failed to create user profile' },
          { status: 500 }
        );
      }

      consumer = newConsumer;
    }

    // Check if user has a completed booking at this location
    const { data: completedBooking } = await supabase
      .from('bookings')
      .select('id, start_ts')
      .eq('consumer_id', consumer.id)
      .eq('location_id', locationId)
      .eq('status', 'COMPLETED')
      .order('start_ts', { ascending: false })
      .limit(1)
      .single();

    const isVerified = !!completedBooking;
    const visitDate = completedBooking ? new Date(completedBooking.start_ts).toISOString().split('T')[0] : null;

    // Create review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        location_id: locationId,
        consumer_id: consumer.id,
        booking_id: completedBooking?.id || null,
        rating,
        title: title || null,
        comment,
        is_verified: isVerified,
        visit_date: visitDate,
        is_published: true,
      })
      .select()
      .single();

    if (reviewError) {
      console.error('Error creating review:', reviewError);
      
      // Check for unique constraint violation
      if (reviewError.code === '23505') {
        return NextResponse.json(
          { error: 'Je hebt al een review geplaatst voor dit restaurant' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create review' },
        { status: 500 }
      );
    }

    // Create notification for location owner
    try {
      // Get tenant_id for the location
      const { data: location } = await supabase
        .from('locations')
        .select('tenant_id, name')
        .eq('id', locationId)
        .single();

      if (location) {
        // Get owner/manager user IDs
        const { data: memberships } = await supabase
          .from('memberships')
          .select('user_id')
          .eq('tenant_id', location.tenant_id)
          .in('role', ['OWNER', 'MANAGER']);

        // Create notifications for each owner/manager
        if (memberships && memberships.length > 0) {
          const notifications = memberships.map(m => ({
            user_id: m.user_id,
            type: 'NEW_REVIEW',
            title: 'Nieuwe review ontvangen',
            message: `${consumer.name} heeft een ${rating}-sterren review achtergelaten voor ${location.name}`,
            action_url: `/manager/${location.tenant_id}/reviews`, // TODO: Create this page
            metadata: {
              review_id: review.id,
              location_id: locationId,
              rating,
            },
          }));

          await supabase.from('notifications').insert(notifications);
        }
      }
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
      // Don't fail the review creation if notification fails
    }

    return NextResponse.json({
      success: true,
      review,
    });
  } catch (error) {
    console.error('Error in POST /api/reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

