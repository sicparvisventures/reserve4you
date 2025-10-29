import { NextRequest, NextResponse } from 'next/server';

/**
 * Google Places Autocomplete API
 * 
 * Searches for places using Google Places Autocomplete API
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const input = searchParams.get('input');

  if (!input) {
    return NextResponse.json(
      { error: 'Missing input parameter' },
      { status: 400 }
    );
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    console.error('❌ GOOGLE_PLACES_API_KEY not configured');
    console.error('📝 Fix: Add GOOGLE_PLACES_API_KEY to your .env.local (local) or Vercel Environment Variables (production)');
    console.error('📚 See: VERCEL_ENV_SETUP.md for detailed instructions');
    return NextResponse.json(
      { 
        error: 'Google Places API not configured',
        details: 'Add GOOGLE_PLACES_API_KEY to environment variables. See VERCEL_ENV_SETUP.md for setup instructions.',
        helpUrl: '/api/debug/env-check'
      },
      { status: 500 }
    );
  }

  try {
    // Call Google Places Autocomplete API
    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    url.searchParams.set('input', input);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('types', 'establishment'); // Only businesses
    url.searchParams.set('language', 'nl'); // Dutch language

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status === 'OK') {
      return NextResponse.json({
        predictions: data.predictions,
      });
    } else if (data.status === 'ZERO_RESULTS') {
      return NextResponse.json({
        predictions: [],
      });
    } else {
      console.error('Google Places API error:', data);
      return NextResponse.json(
        { error: data.error_message || 'Google Places API error' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error calling Google Places API:', error);
    return NextResponse.json(
      { error: 'Failed to search places' },
      { status: 500 }
    );
  }
}

