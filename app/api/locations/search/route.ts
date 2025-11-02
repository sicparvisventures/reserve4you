import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * GET /api/locations/search
 * Search for public locations by name
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20);

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ locations: [] });
    }

    const serviceSupabase = await createServiceClient();

    const { data: locations, error } = await serviceSupabase
      .from('locations')
      .select('id, name, slug, address_json, hero_image_url')
      .eq('is_public', true)
      .eq('is_active', true)
      .ilike('name', `%${query.trim()}%`)
      .limit(limit);

    if (error) {
      console.error('Error searching locations:', error);
      return NextResponse.json(
        { error: 'Failed to search locations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      locations: locations || [],
    });
  } catch (error: any) {
    console.error('Error in location search:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

