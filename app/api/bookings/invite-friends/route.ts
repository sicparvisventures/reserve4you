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

    // Get current user's consumer record with name
    const { data: currentConsumer, error: consumerError } = await supabase
      .from('consumers')
      .select('id, name')
      .eq('auth_user_id', user.id)
      .single();

    if (consumerError || !currentConsumer) {
      return NextResponse.json(
        { error: 'Consumer profiel niet gevonden' },
        { status: 404 }
      );
    }

    // Verify the booking belongs to the current user and get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        consumer_id,
        booking_date,
        booking_time,
        number_of_guests,
        location:locations(id, name, tenant_id)
      `)
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

    // Send invitation emails to all invited friends
    if (createdCompanions && createdCompanions.length > 0 && booking) {
      try {
        // Get friend details (name and email)
        const { data: friends, error: friendsError } = await supabase
          .from('consumers')
          .select('id, name, email, auth_user_id')
          .in('id', friendIds);

        if (!friendsError && friends) {
          // Get location details
          const location = (booking as any).location;
          const locationName = location?.name || 'Restaurant';
          const tenantId = location?.tenant_id;

          // Format booking date and time
          const bookingDate = booking.booking_date 
            ? new Date(booking.booking_date).toLocaleDateString('nl-NL', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })
            : 'Onbekend';
          
          const bookingTime = booking.booking_time || 'Onbekend';
          const numberOfGuests = booking.number_of_guests || 2;

          // Get base URL from environment
          const baseUrl = process.env.NEXT_PUBLIC_URL 
            || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
            || 'http://localhost:3007';

          // Send emails to each friend
          for (const friend of friends) {
            if (!friend.email) {
              console.warn(`Friend ${friend.id} has no email, skipping email`);
              continue;
            }

            // Create booking URL
            const bookingURL = `${baseUrl}/bookings/${bookingId}`;

            // Replace template variables in email HTML
            const emailHTML = `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Je bent uitgenodigd voor een reservering - Reserve4You</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F9F5F2;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
    <div style="background: linear-gradient(135deg, #FF5A5F 0%, #E84347 100%); padding: 48px 20px; text-align: center;">
      <h1 style="color: #ffffff; font-size: 32px; font-weight: 700; margin: 0;">Reserve4You</h1>
      <p style="color: rgba(255, 255, 255, 0.95); font-size: 14px; margin: 8px 0 0 0;">Stop guessing, Start booking</p>
    </div>
    
    <div style="padding: 48px 40px;">
      <p style="color: #111111; font-size: 18px; font-weight: 600; margin: 0 0 24px 0;">Hallo ${friend.name || 'vriend'}!</p>
      
      <h2 style="color: #111111; font-size: 28px; font-weight: 700; margin: 0 0 24px 0;">Je bent uitgenodigd voor een reservering!</h2>
      
      <p style="color: #52525B; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
        <strong>${currentConsumer.name || 'Een vriend'}</strong> heeft je uitgenodigd voor een reservering bij <strong>${locationName}</strong>. 
        Samen eten maakt het nog leuker!
      </p>

      <div style="background-color: #F9F5F2; border: 1px solid #EAE3DF; border-radius: 12px; padding: 24px; margin: 24px 0;">
        <p style="color: #111111; font-size: 18px; font-weight: 700; margin: 0 0 20px 0;">📅 Reserveringsdetails</p>
        <div style="margin-bottom: 16px;">
          <span style="color: #71717A; font-size: 14px; font-weight: 600; display: inline-block; min-width: 120px;">Restaurant:</span>
          <span style="color: #111111; font-size: 16px; font-weight: 500;">${locationName}</span>
        </div>
        <div style="margin-bottom: 16px;">
          <span style="color: #71717A; font-size: 14px; font-weight: 600; display: inline-block; min-width: 120px;">Datum:</span>
          <span style="color: #111111; font-size: 16px; font-weight: 500;">${bookingDate}</span>
        </div>
        <div style="margin-bottom: 16px;">
          <span style="color: #71717A; font-size: 14px; font-weight: 600; display: inline-block; min-width: 120px;">Tijd:</span>
          <span style="color: #111111; font-size: 16px; font-weight: 500;">${bookingTime}</span>
        </div>
        <div>
          <span style="color: #71717A; font-size: 14px; font-weight: 600; display: inline-block; min-width: 120px;">Aantal personen:</span>
          <span style="color: #111111; font-size: 16px; font-weight: 500;">${numberOfGuests} ${numberOfGuests === 1 ? 'persoon' : 'personen'}</span>
        </div>
      </div>

      <div style="text-align: center; margin: 36px 0;">
        <a href="${bookingURL}" style="display: inline-block; background: linear-gradient(135deg, #FF5A5F 0%, #E84347 100%); color: #ffffff !important; text-decoration: none; padding: 18px 48px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(255, 90, 95, 0.3);">Bekijk Reservering</a>
      </div>

      <p style="color: #52525B; font-size: 16px; line-height: 1.7; margin: 24px 0 0 0;">
        We zien je graag op ${bookingDate} om ${bookingTime} bij ${locationName}!
      </p>
    </div>
    
    <div style="background-color: #F9F5F2; padding: 32px 40px; text-align: center; border-top: 1px solid #EAE3DF;">
      <p style="color: #111111; font-size: 18px; font-weight: 700; margin: 0 0 8px 0;">Reserve4You</p>
      <p style="color: #71717A; font-size: 14px; margin: 0 0 24px 0; font-style: italic;">Stop guessing, Start booking</p>
      <p style="color: #A1A1AA; font-size: 12px; margin: 24px 0 0 0;">
        © 2025 Reserve4You. Alle rechten voorbehouden.
      </p>
    </div>
  </div>
</body>
</html>
            `;

            // Send email via Supabase Edge Function or API
            // For now, we'll use the email service if available, otherwise log
            try {
              // Call internal API to send email
              const emailResponse = await fetch(`${baseUrl}/api/email/send-booking-invitation`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  to: friend.email,
                  toName: friend.name,
                  subject: `${currentConsumer.name || 'Een vriend'} heeft je uitgenodigd voor een reservering bij ${locationName}`,
                  html: emailHTML,
                  bookingId: bookingId,
                  friendId: friend.id,
                  tenantId: tenantId,
                }),
              });

              if (!emailResponse.ok) {
                console.error(`Failed to send email to ${friend.email}:`, await emailResponse.text());
              }
            } catch (emailError) {
              console.error(`Error sending email to ${friend.email}:`, emailError);
              // Don't fail the whole request if email fails
            }
          }
        }
      } catch (emailError) {
        console.error('Error processing invitation emails:', emailError);
        // Don't fail the whole request if email fails
      }
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

