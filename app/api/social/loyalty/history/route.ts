import { NextRequest, NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/auth/dal';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/social/loyalty/history
 * Get FlowCredits transaction history
 * Query params:
 * - limit: number of items (default: 20, max: 50)
 * - cursor: timestamp for pagination
 * - source: filter by source type
 */
export async function GET(request: NextRequest) {
  try {
    const session = await verifyApiSession();
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const cursor = searchParams.get('cursor');
    const source = searchParams.get('source');

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

    // Build query
    let query = supabase
      .from('flow_credits')
      .select('id, amount, source, source_id, expires_at, created_at')
      .eq('consumer_id', consumer.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply cursor pagination
    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    // Filter by source if provided
    if (source) {
      query = query.eq('source', source);
    }

    const { data: credits, error } = await query;

    if (error) {
      console.error('Error fetching credits history:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch credits history' },
        { status: 500 }
      );
    }

    // Enrich with source details
    const enrichedCredits = await Promise.all(
      (credits || []).map(async (credit) => {
        let sourceDetails = null;

        if (credit.source === 'review' && credit.source_id) {
          const { data: review } = await supabase
            .from('reviews')
            .select('id, location_id, rating, title')
            .eq('id', credit.source_id)
            .single();

          if (review) {
            const { data: location } = await supabase
              .from('locations')
              .select('id, name, slug')
              .eq('id', review.location_id)
              .single();

            sourceDetails = {
              type: 'review',
              location: location,
              rating: review.rating,
              title: review.title,
            };
          }
        } else if (credit.source === 'booking' && credit.source_id) {
          const { data: booking } = await supabase
            .from('bookings')
            .select('id, location_id, party_size')
            .eq('id', credit.source_id)
            .single();

          if (booking) {
            const { data: location } = await supabase
              .from('locations')
              .select('id, name, slug')
              .eq('id', booking.location_id)
              .single();

            sourceDetails = {
              type: 'booking',
              location: location,
              party_size: booking.party_size,
            };
          }
        }

        const now = new Date().toISOString();
        const isExpired = credit.expires_at && credit.expires_at < now;
        const isExpiringSoon = credit.expires_at && credit.expires_at > now && 
          new Date(credit.expires_at) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        return {
          ...credit,
          source_details: sourceDetails,
          is_expired: isExpired,
          is_expiring_soon: isExpiringSoon,
        };
      })
    );

    // Determine if there are more items
    const hasMore = (credits?.length || 0) === limit;
    const nextCursor = hasMore && credits && credits.length > 0
      ? credits[credits.length - 1].created_at
      : null;

    return NextResponse.json({
      credits: enrichedCredits,
      pagination: {
        has_more: hasMore,
        cursor: nextCursor,
        limit: limit,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/social/loyalty/history:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

