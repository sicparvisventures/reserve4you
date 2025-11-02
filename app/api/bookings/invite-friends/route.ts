/**
 * Booking Invite Friends API
 * POST: Invite friends to a booking by creating booking_companions records
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    const body = await request.json();
    const { bookingId, friendIds } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: 'bookingId is verplicht' },
        { status: 400 }
      );
    }

    if (!Array.isArray(friendIds) || friendIds.length === 0) {
      return NextResponse.json(
        { error: 'friendIds moet een array zijn met minstens één ID' },
        { status: 400 }
      );
    }

    // Get current user's consumer record
    const { data: currentConsumer, error: consumerError } = await supabase
      .from('consumers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (consumerError || !currentConsumer) {
      return NextResponse.json(
        { error: 'Consumer profiel niet gevonden' },
        { status: 404 }
      );
    }

    // Verify the booking belongs to the current user
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, consumer_id')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Reservering niet gevonden' },
        { status: 404 }
      );
    }

    if (booking.consumer_id !== currentConsumer.id) {
      return NextResponse.json(
        { error: 'Je kunt alleen vrienden uitnodigen voor je eigen reserveringen' },
        { status: 403 }
      );
    }

    // Verify all friend IDs are valid consumers that the user follows
    const { data: following, error: followingError } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', currentConsumer.id)
      .in('following_id', friendIds);

    if (followingError) {
      console.error('Error checking follows:', followingError);
      return NextResponse.json(
        { error: 'Fout bij verifiëren van vrienden' },
        { status: 500 }
      );
    }

    const validFriendIds = (following || []).map(f => f.following_id);
    const invalidFriendIds = friendIds.filter(id => !validFriendIds.includes(id));

    if (invalidFriendIds.length > 0) {
      return NextResponse.json(
        { error: `Sommige gebruikers zijn geen vrienden: ${invalidFriendIds.join(', ')}` },
        { status: 400 }
      );
    }

    // Create booking_companions records
    const companions = friendIds.map((friendId: string) => ({
      booking_id: bookingId,
      consumer_id: friendId,
      invited_by: currentConsumer.id,
      status: 'invited',
    }));

    const { data: createdCompanions, error: insertError } = await supabase
      .from('booking_companions')
      .insert(companions)
      .select();

    if (insertError) {
      console.error('Error creating booking companions:', insertError);
      
      // If it's a duplicate key error, that's okay - just return success
      if (insertError.code === '23505') {
        return NextResponse.json({
          success: true,
          message: 'Uitnodigingen zijn al verstuurd',
          companions: [],
        });
      }

      return NextResponse.json(
        { error: 'Fout bij aanmaken van uitnodigingen' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${friendIds.length} vriend(en) uitgenodigd`,
      companions: createdCompanions || [],
    });
  } catch (error: any) {
    console.error('Error in POST /api/bookings/invite-friends:', error);
    return NextResponse.json(
      { error: error.message || 'Interne serverfout' },
      { status: 500 }
    );
  }
}

