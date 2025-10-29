/**
 * API Route: /api/favorites/alerts
 * Manage availability alerts for favorite locations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/favorites/alerts
 * Get all alerts for the current user
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
      return NextResponse.json({ alerts: [] });
    }

    // Get all alerts with location details
    const { data: alerts, error: alertsError } = await supabase
      .from('favorite_availability_alerts')
      .select(`
        *,
        location:locations (
          id,
          name,
          slug,
          address,
          cuisine_type,
          hero_image_url,
          average_rating
        )
      `)
      .eq('consumer_id', consumer.id)
      .order('created_at', { ascending: false });

    if (alertsError) {
      console.error('Error fetching alerts:', alertsError);
      return NextResponse.json(
        { error: 'Fout bij ophalen van alerts' },
        { status: 500 }
      );
    }

    return NextResponse.json({ alerts: alerts || [] });
  } catch (error) {
    console.error('Error in GET /api/favorites/alerts:', error);
    return NextResponse.json(
      { error: 'Interne serverfout' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/favorites/alerts
 * Create a new availability alert
 * Body: {
 *   locationId: string,
 *   preferredDayOfWeek?: number (0-6),
 *   preferredTimeStart?: string (HH:MM),
 *   preferredTimeEnd?: string (HH:MM),
 *   preferredPartySize?: number,
 *   maxNotifications?: number,
 *   cooldownHours?: number
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
    const {
      locationId,
      preferredDayOfWeek,
      preferredTimeStart,
      preferredTimeEnd,
      preferredPartySize = 2,
      maxNotifications = 5,
      cooldownHours = 24,
    } = body;

    if (!locationId) {
      return NextResponse.json(
        { error: 'locationId is verplicht' },
        { status: 400 }
      );
    }

    // Validate inputs
    if (preferredDayOfWeek !== null && preferredDayOfWeek !== undefined) {
      if (preferredDayOfWeek < 0 || preferredDayOfWeek > 6) {
        return NextResponse.json(
          { error: 'preferredDayOfWeek moet tussen 0 en 6 zijn' },
          { status: 400 }
        );
      }
    }

    if (preferredPartySize < 1 || preferredPartySize > 20) {
      return NextResponse.json(
        { error: 'preferredPartySize moet tussen 1 en 20 zijn' },
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
      // Create consumer
      const { data: newConsumer, error: createError } = await supabase
        .from('consumers')
        .insert({
          auth_user_id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Gast',
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating consumer:', createError);
        return NextResponse.json(
          { error: 'Fout bij aanmaken van consumerprofiel' },
          { status: 500 }
        );
      }

      consumer = newConsumer;
    }

    if (!consumer) {
      return NextResponse.json(
        { error: 'Fout bij ophalen of aanmaken van consumerprofiel' },
        { status: 500 }
      );
    }

    // Check if favorite exists, if not create it (for display purposes)
    let { data: favorite } = await supabase
      .from('favorites')
      .select('id')
      .eq('consumer_id', consumer.id)
      .eq('location_id', locationId)
      .maybeSingle();

    if (!favorite) {
      // Create favorite silently (doesn't matter if it fails)
      await supabase
        .from('favorites')
        .insert({
          consumer_id: consumer.id,
          location_id: locationId,
        });
    }

    // Create alert (GEEN favorite_id meer!)
    const { data: alert, error: insertError } = await supabase
      .from('favorite_availability_alerts')
      .insert({
        consumer_id: consumer.id,
        location_id: locationId,
        preferred_day_of_week: preferredDayOfWeek,
        preferred_time_start: preferredTimeStart,
        preferred_time_end: preferredTimeEnd,
        preferred_party_size: preferredPartySize,
        max_notifications: maxNotifications,
        cooldown_hours: cooldownHours,
        is_active: true,
      })
      .select(`
        *,
        location:locations (
          id,
          name,
          slug,
          address,
          cuisine_type,
          hero_image_url,
          average_rating
        )
      `)
      .single();

    if (insertError) {
      console.error('Error creating alert:', insertError);
      return NextResponse.json(
        { error: 'Fout bij aanmaken van alert', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Alert succesvol aangemaakt',
      alert,
    });
  } catch (error) {
    console.error('Error in POST /api/favorites/alerts:', error);
    return NextResponse.json(
      { error: 'Interne serverfout' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/favorites/alerts
 * Update an existing alert
 * Body: {
 *   alertId: string,
 *   isActive?: boolean,
 *   preferredDayOfWeek?: number,
 *   preferredTimeStart?: string,
 *   preferredTimeEnd?: string,
 *   preferredPartySize?: number,
 *   maxNotifications?: number,
 *   cooldownHours?: number
 * }
 */
export async function PATCH(request: NextRequest) {
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
    const { alertId, ...updates } = body;

    if (!alertId) {
      return NextResponse.json(
        { error: 'alertId is verplicht' },
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

    // Build update object (only include provided fields)
    const updateData: any = {};
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.preferredDayOfWeek !== undefined) updateData.preferred_day_of_week = updates.preferredDayOfWeek;
    if (updates.preferredTimeStart !== undefined) updateData.preferred_time_start = updates.preferredTimeStart;
    if (updates.preferredTimeEnd !== undefined) updateData.preferred_time_end = updates.preferredTimeEnd;
    if (updates.preferredPartySize !== undefined) updateData.preferred_party_size = updates.preferredPartySize;
    if (updates.maxNotifications !== undefined) updateData.max_notifications = updates.maxNotifications;
    if (updates.cooldownHours !== undefined) updateData.cooldown_hours = updates.cooldownHours;

    // Update alert (RLS ensures they can only update their own)
    const { data: alert, error: updateError } = await supabase
      .from('favorite_availability_alerts')
      .update(updateData)
      .eq('id', alertId)
      .eq('consumer_id', consumer.id)
      .select(`
        *,
        location:locations (
          id,
          name,
          slug,
          address,
          cuisine_type,
          hero_image_url,
          average_rating
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating alert:', updateError);
      return NextResponse.json(
        { error: 'Fout bij updaten van alert' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Alert succesvol bijgewerkt',
      alert,
    });
  } catch (error) {
    console.error('Error in PATCH /api/favorites/alerts:', error);
    return NextResponse.json(
      { error: 'Interne serverfout' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/favorites/alerts
 * Delete an alert
 * Body: { alertId: string }
 */
export async function DELETE(request: NextRequest) {
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
    const { alertId } = body;

    if (!alertId) {
      return NextResponse.json(
        { error: 'alertId is verplicht' },
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

    // Delete alert (RLS ensures they can only delete their own)
    const { error: deleteError } = await supabase
      .from('favorite_availability_alerts')
      .delete()
      .eq('id', alertId)
      .eq('consumer_id', consumer.id);

    if (deleteError) {
      console.error('Error deleting alert:', deleteError);
      return NextResponse.json(
        { error: 'Fout bij verwijderen van alert' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Alert succesvol verwijderd',
    });
  } catch (error) {
    console.error('Error in DELETE /api/favorites/alerts:', error);
    return NextResponse.json(
      { error: 'Interne serverfout' },
      { status: 500 }
    );
  }
}

