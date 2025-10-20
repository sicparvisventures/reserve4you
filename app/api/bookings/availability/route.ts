/**
 * Booking Availability API
 * 
 * GET /api/bookings/availability
 * 
 * Returns available time slots for a location on a specific date
 * based on table availability and party size.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const locationId = searchParams.get('locationId');
    const date = searchParams.get('date');
    const partySize = searchParams.get('partySize');

    // Validate required parameters
    if (!locationId || !date || !partySize) {
      return NextResponse.json(
        { 
          error: 'Missing required parameters: locationId, date, partySize' 
        },
        { status: 400 }
      );
    }

    const partySizeNum = parseInt(partySize, 10);
    if (isNaN(partySizeNum) || partySizeNum < 1) {
      return NextResponse.json(
        { error: 'Invalid party size' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if location exists and is active
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .select('id, name, is_public, is_active')
      .eq('id', locationId)
      .single();

    if (locationError || !location || !location.is_public || !location.is_active) {
      return NextResponse.json(
        { error: 'Location not found or not available' },
        { status: 404 }
      );
    }

    // Call the Postgres function to get available time slots
    const { data: timeSlots, error: slotsError } = await supabase
      .rpc('get_available_time_slots', {
        p_location_id: locationId,
        p_date: date,
        p_party_size: partySizeNum
      });

    if (slotsError) {
      console.error('[Availability API] Error fetching time slots:', slotsError);
      return NextResponse.json(
        { error: 'Failed to fetch availability' },
        { status: 500 }
      );
    }

    // Format the time slots for the frontend
    const formattedSlots = (timeSlots || []).map((slot: any) => ({
      time: slot.time_slot,
      available: slot.available_tables > 0,
      availableTables: slot.available_tables
    }));

    return NextResponse.json({
      locationId,
      date,
      partySize: partySizeNum,
      timeSlots: formattedSlots,
      hasAvailability: formattedSlots.some((s: any) => s.available)
    });

  } catch (error) {
    console.error('[Availability API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Alternative endpoint using simpler logic if Postgres function is not available
 * This is a fallback that calculates availability in the API layer
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { locationId, date, partySize } = body;

    if (!locationId || !date || !partySize) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get all active tables for this location that can fit the party
    const { data: tables, error: tablesError } = await supabase
      .from('tables')
      .select('id, name, seats')
      .eq('location_id', locationId)
      .eq('is_active', true)
      .gte('seats', partySize)
      .order('seats', { ascending: true });

    if (tablesError || !tables || tables.length === 0) {
      return NextResponse.json({
        locationId,
        date,
        partySize,
        timeSlots: [],
        hasAvailability: false,
        message: 'No suitable tables found for this party size'
      });
    }

    // Get all bookings for this date
    const { data: bookings } = await supabase
      .from('bookings')
      .select('table_id, booking_time, duration_minutes')
      .eq('location_id', locationId)
      .eq('booking_date', date)
      .in('status', ['pending', 'confirmed', 'seated']);

    // Generate time slots (11:00 to 22:00, every 30 minutes)
    const timeSlots = [];
    for (let hour = 11; hour <= 22; hour++) {
      for (let minute of [0, 30]) {
        if (hour === 22 && minute === 30) break; // Don't go past 22:00
        
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
        
        // Check if any table is available at this time
        let availableCount = 0;
        
        for (const table of tables) {
          // Check if this table has any conflicting bookings
          const hasConflict = (bookings || []).some((booking: any) => {
            if (booking.table_id !== table.id) return false;
            
            const bookingStart = booking.booking_time;
            const bookingEnd = addMinutesToTime(bookingStart, booking.duration_minutes + 15); // Add buffer
            const slotEnd = addMinutesToTime(timeString, 120); // Assume 2-hour booking
            
            // Check for overlap
            return timeOverlaps(bookingStart, bookingEnd, timeString, slotEnd);
          });
          
          if (!hasConflict) {
            availableCount++;
          }
        }
        
        timeSlots.push({
          time: timeString,
          available: availableCount > 0,
          availableTables: availableCount
        });
      }
    }

    return NextResponse.json({
      locationId,
      date,
      partySize,
      timeSlots,
      hasAvailability: timeSlots.some(s => s.available)
    });

  } catch (error) {
    console.error('[Availability API POST] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions
function addMinutesToTime(timeString: string, minutes: number): string {
  const [hours, mins] = timeString.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}:00`;
}

function timeOverlaps(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  return start1 < end2 && end1 > start2;
}

