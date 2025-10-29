/**
 * API Route: /api/favorites/insights
 * Get insights and analytics for favorite locations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/favorites/insights
 * Get insights for all favorites or a specific location
 * Query params: ?locationId=xxx (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Niet geauthenticeerd' },
        { status: 401 }
      );
    }

    // Get consumer record
    const { data: consumer, error: consumerError } = await supabase
      .from('consumers')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (!consumer) {
      return NextResponse.json({ insights: [] });
    }

    // Check if specific location requested
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');

    let query = supabase
      .from('favorite_insights')
      .select(`
        *,
        location:locations (
          id,
          name,
          slug,
          cuisine_type,
          hero_image_url
        )
      `)
      .eq('consumer_id', consumer.id);

    if (locationId) {
      query = query.eq('location_id', locationId);
    }

    const { data: insights, error: insightsError } = await query.order('booking_count', { ascending: false });

    if (insightsError) {
      console.error('Error fetching insights:', insightsError);
      return NextResponse.json(
        { error: 'Fout bij ophalen van insights' },
        { status: 500 }
      );
    }

    return NextResponse.json({ insights: insights || [] });
  } catch (error) {
    console.error('Error in GET /api/favorites/insights:', error);
    return NextResponse.json(
      { error: 'Interne serverfout' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/favorites/insights/track
 * Track a view or action on a favorite
 * Body: {
 *   locationId: string,
 *   action: 'view' | 'book' | 'alert_click'
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Niet geauthenticeerd' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { locationId, action } = body;

    if (!locationId || !action) {
      return NextResponse.json(
        { error: 'locationId en action zijn verplicht' },
        { status: 400 }
      );
    }

    if (!['view', 'book', 'alert_click'].includes(action)) {
      return NextResponse.json(
        { error: 'action moet "view", "book" of "alert_click" zijn' },
        { status: 400 }
      );
    }

    // Get consumer record
    const { data: consumer, error: consumerError } = await supabase
      .from('consumers')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (!consumer) {
      return NextResponse.json(
        { error: 'Consumer niet gevonden' },
        { status: 404 }
      );
    }

    // Call appropriate function based on action
    if (action === 'view') {
      const { error } = await supabase.rpc('increment_favorite_view', {
        p_consumer_id: consumer.id,
        p_location_id: locationId,
      });

      if (error) {
        console.error('Error tracking view:', error);
        return NextResponse.json(
          { error: 'Fout bij tracken van view' },
          { status: 500 }
        );
      }
    } else if (action === 'book') {
      const { error } = await supabase.rpc('increment_favorite_booking', {
        p_consumer_id: consumer.id,
        p_location_id: locationId,
      });

      if (error) {
        console.error('Error tracking booking:', error);
        return NextResponse.json(
          { error: 'Fout bij tracken van booking' },
          { status: 500 }
        );
      }
    } else if (action === 'alert_click') {
      // Update alert_click_count
      const { error } = await supabase
        .from('favorite_insights')
        .upsert({
          consumer_id: consumer.id,
          location_id: locationId,
          alert_click_count: 1,
        }, {
          onConflict: 'consumer_id,location_id',
          ignoreDuplicates: false,
        });

      if (error) {
        // If upsert doesn't work, try update
        const { error: updateError } = await supabase
          .from('favorite_insights')
          .update({
            alert_click_count: supabase.raw('alert_click_count + 1'),
            updated_at: new Date().toISOString(),
          })
          .eq('consumer_id', consumer.id)
          .eq('location_id', locationId);

        if (updateError) {
          console.error('Error tracking alert click:', updateError);
          return NextResponse.json(
            { error: 'Fout bij tracken van alert click' },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Actie succesvol getrackt',
    });
  } catch (error) {
    console.error('Error in POST /api/favorites/insights/track:', error);
    return NextResponse.json(
      { error: 'Interne serverfout' },
      { status: 500 }
    );
  }
}

