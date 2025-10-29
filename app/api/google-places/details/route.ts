import { NextRequest, NextResponse } from 'next/server';
import { convertGooglePlaceToLocation } from '@/lib/google-places';

/**
 * Google Places Details API
 * 
 * Fetches detailed information about a place using Google Places Details API
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const placeId = searchParams.get('place_id');

  if (!placeId) {
    return NextResponse.json(
      { error: 'Missing place_id parameter' },
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
    // Call Google Places Details API
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.set('place_id', placeId);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('language', 'nl'); // Dutch language
    url.searchParams.set('fields', [
      'place_id',
      'name',
      'formatted_address',
      'address_components',
      'formatted_phone_number',
      'international_phone_number',
      'website',
      'opening_hours',
      'rating',
      'user_ratings_total',
      'photos',
      'business_status',
      'types',
      'geometry',
      'url',
      'price_level',
    ].join(','));

    console.log('🔍 Fetching Google Place details for:', placeId);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status === 'OK' && data.result) {
      const placeDetails = data.result;
      
      // Convert Google Place data to our location format
      const locationData = convertGooglePlaceToLocation(placeDetails);

      console.log('✅ Google Place details fetched successfully');
      console.log('   Name:', locationData.name);
      console.log('   Address:', locationData.address_line1);
      console.log('   Business Sector:', locationData.business_sector);

      return NextResponse.json({
        place: placeDetails,
        locationData,
      });
    } else {
      console.error('Google Places API error:', data);
      return NextResponse.json(
        { error: data.error_message || 'Place not found' },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error('Error calling Google Places API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch place details' },
      { status: 500 }
    );
  }
}

