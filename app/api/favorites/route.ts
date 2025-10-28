/**
 * Favorites API Route
 * Handles adding/removing favorites for authenticated users
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/favorites
 * Get all favorites for the authenticated user
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
      .single();

    if (consumerError || !consumer) {
      return NextResponse.json(
        { error: 'Consumer profiel niet gevonden' },
        { status: 404 }
      );
    }

    // Get favorites with location details
    const { data: favorites, error: favoritesError } = await supabase
      .from('favorites')
      .select(`
        id,
        location_id,
        created_at,
        location:locations(
          id,
          name,
          slug,
          description,
          cuisine,
          price_range,
          address_json,
          hero_image_url
        )
      `)
      .eq('consumer_id', consumer.id)
      .order('created_at', { ascending: false });

    if (favoritesError) {
      console.error('Error fetching favorites:', favoritesError);
      return NextResponse.json(
        { error: 'Fout bij ophalen van favorieten' },
        { status: 500 }
      );
    }

    return NextResponse.json({ favorites: favorites || [] });
  } catch (error) {
    console.error('Error in GET /api/favorites:', error);
    return NextResponse.json(
      { error: 'Interne serverfout' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/favorites
 * Add or remove a favorite
 * Body: { locationId: string, action: 'add' | 'remove' }
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

    if (action !== 'add' && action !== 'remove') {
      return NextResponse.json(
        { error: 'action moet "add" of "remove" zijn' },
        { status: 400 }
      );
    }

    // Get or create consumer record
    let { data: consumer, error: consumerError } = await supabase
      .from('consumers')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (!consumer) {
      // Consumer doesn't exist, create one
      console.log('Creating consumer record for user:', user.id);
      const { data: newConsumer, error: createError } = await supabase
        .from('consumers')
        .insert({
          auth_user_id: user.id,
          email: user.email || 'user@reserve4you.com',
          name: user.user_metadata?.full_name || 
                user.user_metadata?.name || 
                user.email?.split('@')[0] || 
                'Guest User',
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating consumer:', createError);
        console.error('Create error details:', {
          code: createError.code,
          message: createError.message,
          details: createError.details,
          hint: createError.hint,
        });
        return NextResponse.json(
          { 
            error: 'Fout bij aanmaken van consumer profiel',
            details: createError.message,
            code: createError.code
          },
          { status: 500 }
        );
      }

      consumer = newConsumer;
      console.log('Consumer created successfully:', consumer.id);
    }

    if (action === 'add') {
      // Add favorite
      const { error: insertError } = await supabase
        .from('favorites')
        .insert({
          consumer_id: consumer.id,
          location_id: locationId,
        });

      if (insertError) {
        // Check if it's a duplicate error
        if (insertError.code === '23505') {
          return NextResponse.json(
            { error: 'Deze locatie staat al in je favorieten' },
            { status: 409 }
          );
        }

        console.error('Error adding favorite:', insertError);
        console.error('Error details:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
        });
        return NextResponse.json(
          { 
            error: 'Fout bij toevoegen van favoriet',
            details: insertError.message,
            code: insertError.code
          },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true,
        message: 'Toegevoegd aan favorieten'
      });
    } else {
      // Remove favorite
      const { error: deleteError } = await supabase
        .from('favorites')
        .delete()
        .eq('consumer_id', consumer.id)
        .eq('location_id', locationId);

      if (deleteError) {
        console.error('Error removing favorite:', deleteError);
        return NextResponse.json(
          { error: 'Fout bij verwijderen van favoriet' },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true,
        message: 'Verwijderd uit favorieten'
      });
    }
  } catch (error) {
    console.error('Error in POST /api/favorites:', error);
    return NextResponse.json(
      { error: 'Interne serverfout' },
      { status: 500 }
    );
  }
}

