/**
 * TEST ENDPOINT: Direct database check voor reviews
 * /api/reviews/test
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  
  console.log('🧪 TEST: Starting review diagnostics...');
  
  // Test 1: Get location
  const { data: location, error: locError } = await supabase
    .from('locations')
    .select('id, slug, name')
    .eq('slug', 'chickx')
    .single();
    
  console.log('📍 Location:', { location, error: locError });
  
  if (!location) {
    return NextResponse.json({
      error: 'Location not found',
      details: locError
    });
  }
  
  // Test 2: Count reviews in database
  const { count, error: countError } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('location_id', location.id)
    .eq('is_published', true);
    
  console.log('📊 Review count:', { count, error: countError });
  
  // Test 3: Try to fetch reviews with minimal fields
  const { data: minimalReviews, error: minError } = await supabase
    .from('reviews')
    .select('id, rating, comment, is_published')
    .eq('location_id', location.id)
    .eq('is_published', true);
    
  console.log('📝 Minimal reviews:', { 
    count: minimalReviews?.length, 
    reviews: minimalReviews,
    error: minError 
  });
  
  // Test 4: Try with consumer join
  const { data: reviewsWithConsumer, error: joinError } = await supabase
    .from('reviews')
    .select(`
      id,
      rating,
      comment,
      consumer:consumers(name)
    `)
    .eq('location_id', location.id)
    .eq('is_published', true);
    
  console.log('👤 Reviews with consumer:', { 
    count: reviewsWithConsumer?.length,
    reviews: reviewsWithConsumer,
    error: joinError 
  });
  
  // Test 5: Check RLS
  const { data: rlsCheck } = await supabase
    .rpc('pg_has_role', { 
      role: 'anon',
      membership: 'MEMBER' 
    })
    .single();
    
  console.log('🔒 RLS Check:', rlsCheck);
  
  return NextResponse.json({
    location,
    tests: {
      count: {
        result: count,
        error: countError?.message
      },
      minimal: {
        count: minimalReviews?.length || 0,
        reviews: minimalReviews,
        error: minError?.message
      },
      withConsumer: {
        count: reviewsWithConsumer?.length || 0,
        reviews: reviewsWithConsumer,
        error: joinError?.message
      }
    },
    timestamp: new Date().toISOString()
  });
}

