/**
 * Widget API Route
 * 
 * GET /api/widget/[widgetCode] - Fetch widget configuration and locations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ widgetCode: string }> }
) {
  try {
    const { widgetCode } = await params;
    const supabase = await createClient();

    // Fetch widget configuration
    const { data: config, error: configError } = await supabase
      .from('widget_configurations')
      .select('*')
      .eq('widget_code', widgetCode)
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      return NextResponse.json(
        { error: 'Widget niet gevonden' },
        { status: 404 }
      );
    }

    // Fetch locations
    let locationQuery = supabase
      .from('locations')
      .select('*')
      .eq('tenant_id', config.tenant_id)
      .eq('is_public', true)
      .eq('is_active', true);

    // Filter by specific locations if configured
    if (!config.show_all_locations && config.location_ids?.length > 0) {
      locationQuery = locationQuery.in('id', config.location_ids);
    }

    const { data: locations, error: locationsError } = await locationQuery
      .order('created_at', { ascending: false });

    if (locationsError) {
      console.error('Error fetching locations:', locationsError);
      return NextResponse.json(
        { error: 'Fout bij ophalen van locaties' },
        { status: 500 }
      );
    }

    // Fetch promotions for each location
    const locationsWithPromotions = await Promise.all(
      (locations || []).map(async (location) => {
        const { data: promotions } = await supabase
          .from('promotions')
          .select('id, title, description, discount_type, discount_value, image_url, valid_from, valid_until')
          .eq('location_id', location.id)
          .eq('is_active', true)
          .lte('valid_from', new Date().toISOString())
          .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString()}`)
          .order('is_featured', { ascending: false })
          .order('priority', { ascending: false })
          .limit(3);

        return {
          ...location,
          promotions: promotions || [],
        };
      })
    );

    // Return widget data
    return NextResponse.json(
      {
        config,
        locations: locationsWithPromotions,
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error('Widget API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

