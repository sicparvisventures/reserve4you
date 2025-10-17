/**
 * Availability Check API
 * 
 * POST /api/availability/check
 * 
 * Calculates available time slots for a given location, date, and party size.
 * Target performance: < 500ms response time
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateAvailabilityInput, BookingErrorCode } from '@/lib/validation/booking';
import { format, parse, addMinutes, isBefore, isAfter, startOfDay, parseISO } from 'date-fns';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. Parse and validate input
    const body = await request.json();
    const input = validateAvailabilityInput(body);
    
    // 2. Get location and verify it's public
    const supabase = await createClient();
    
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .select('id, name, is_public, is_active')
      .eq('id', input.location_id)
      .eq('is_public', true)
      .eq('is_active', true)
      .single();
    
    if (locationError || !location) {
      return NextResponse.json(
        { error: 'Location not found or not available', code: BookingErrorCode.LOCATION_NOT_FOUND },
        { status: 404 }
      );
    }
    
    // 3. Get day of week (0 = Sunday, 1 = Monday, etc.)
    const requestedDate = parseISO(input.date);
    const dayOfWeek = requestedDate.getDay();
    
    // 4. Get shifts for this day
    let shiftsQuery = supabase
      .from('shifts')
      .select('*')
      .eq('location_id', input.location_id)
      .eq('is_active', true)
      .contains('days_of_week', [dayOfWeek]); // days_of_week is an array in DB
    
    if (input.shift_id) {
      shiftsQuery = shiftsQuery.eq('id', input.shift_id);
    }
    
    const { data: shifts, error: shiftsError } = await shiftsQuery;
    
    if (shiftsError || !shifts || shifts.length === 0) {
      return NextResponse.json({
        location_id: input.location_id,
        date: input.date,
        party_size: input.party_size,
        slots: [],
        top_suggestions: [],
      });
    }
    
    // 5. Get tables that can accommodate party size
    const { data: tables, error: tablesError } = await supabase
      .from('tables')
      .select('id, name, seats, is_combinable, group_id')
      .eq('location_id', input.location_id)
      .eq('is_active', true)
      .gte('seats', input.party_size);
    
    if (tablesError || !tables || tables.length === 0) {
      // Check if we have combinable tables
      const { data: combinableTables } = await supabase
        .from('tables')
        .select('id, name, seats, is_combinable, group_id')
        .eq('location_id', input.location_id)
        .eq('is_active', true)
        .eq('is_combinable', true);
      
      if (!combinableTables || combinableTables.length === 0) {
        return NextResponse.json({
          location_id: input.location_id,
          date: input.date,
          party_size: input.party_size,
          slots: [],
          top_suggestions: [],
          message: 'No tables available for this party size',
        });
      }
      
      // For MVP, skip combinable logic - just return no availability
      return NextResponse.json({
        location_id: input.location_id,
        date: input.date,
        party_size: input.party_size,
        slots: [],
        top_suggestions: [],
        message: 'Party size requires table combination (not implemented in MVP)',
      });
    }
    
    // 6. Get all bookings for this date
    const startOfDayDate = startOfDay(requestedDate);
    const endOfDayDate = addMinutes(startOfDayDate, 24 * 60);
    
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, table_id, start_time, end_time, status')
      .eq('location_id', input.location_id)
      .in('status', ['CONFIRMED', 'PENDING'])
      .gte('start_time', startOfDayDate.toISOString())
      .lt('start_time', endOfDayDate.toISOString());
    
    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
    }
    
    const existingBookings = bookings || [];
    
    // 7. Calculate available slots for each shift
    const allSlots: Array<{
      time: string;
      available: boolean;
      tables: string[];
      shift_id: string;
      shift_name: string;
    }> = [];
    
    for (const shift of shifts) {
      const slots = calculateSlotsForShift(
        shift,
        tables,
        existingBookings,
        input.date,
        input.party_size
      );
      allSlots.push(...slots);
    }
    
    // 8. Get top 6 available suggestions
    const availableSlots = allSlots.filter(slot => slot.available);
    const top_suggestions = availableSlots.slice(0, 6).map(slot => slot.time);
    
    const elapsed = Date.now() - startTime;
    console.log(`[Availability Check] Completed in ${elapsed}ms`);
    
    return NextResponse.json({
      location_id: input.location_id,
      date: input.date,
      party_size: input.party_size,
      slots: allSlots,
      top_suggestions,
    });
    
  } catch (error) {
    console.error('[Availability Check] Error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate available slots for a single shift
 */
function calculateSlotsForShift(
  shift: any,
  tables: any[],
  bookings: any[],
  dateStr: string,
  partySize: number
) {
  const slots: Array<{
    time: string;
    available: boolean;
    tables: string[];
    shift_id: string;
    shift_name: string;
  }> = [];
  
  // Parse shift times
  const shiftStart = parse(shift.start_time, 'HH:mm:ss', new Date());
  const shiftEnd = parse(shift.end_time, 'HH:mm:ss', new Date());
  const slotDuration = shift.slot_duration_minutes || 90;
  const bufferMinutes = shift.buffer_minutes || 15;
  
  // Generate time slots
  let currentTime = shiftStart;
  const requestedDate = parseISO(dateStr);
  
  while (isBefore(currentTime, shiftEnd)) {
    const timeStr = format(currentTime, 'HH:mm');
    
    // Create datetime for this slot
    const slotStart = new Date(requestedDate);
    slotStart.setHours(currentTime.getHours(), currentTime.getMinutes(), 0, 0);
    
    const slotEnd = addMinutes(slotStart, slotDuration);
    
    // Check which tables are available for this slot
    const availableTables = tables.filter(table => {
      return isTableAvailable(table, slotStart, slotEnd, bookings, bufferMinutes);
    });
    
    slots.push({
      time: timeStr,
      available: availableTables.length > 0,
      tables: availableTables.map(t => t.id),
      shift_id: shift.id,
      shift_name: shift.name,
    });
    
    // Move to next slot (every 15 or 30 minutes typically)
    currentTime = addMinutes(currentTime, 15);
  }
  
  return slots;
}

/**
 * Check if a table is available for a given time slot
 */
function isTableAvailable(
  table: any,
  slotStart: Date,
  slotEnd: Date,
  bookings: any[],
  bufferMinutes: number
): boolean {
  // Check if any booking conflicts with this slot (including buffer)
  const slotStartWithBuffer = addMinutes(slotStart, -bufferMinutes);
  const slotEndWithBuffer = addMinutes(slotEnd, bufferMinutes);
  
  for (const booking of bookings) {
    if (booking.table_id !== table.id) continue;
    
    const bookingStart = new Date(booking.start_time);
    const bookingEnd = new Date(booking.end_time);
    
    // Check for overlap (with buffer)
    if (
      (isAfter(slotStart, bookingStart) || slotStart.getTime() === bookingStart.getTime()) &&
      isBefore(slotStart, bookingEnd)
    ) {
      return false; // Slot starts during existing booking
    }
    
    if (
      isAfter(bookingStart, slotStart) &&
      isBefore(bookingStart, slotEnd)
    ) {
      return false; // Existing booking starts during this slot
    }
    
    // Check buffer overlap
    if (
      (isAfter(slotStartWithBuffer, bookingStart) || slotStartWithBuffer.getTime() === bookingStart.getTime()) &&
      isBefore(slotStartWithBuffer, bookingEnd)
    ) {
      return false;
    }
  }
  
  return true;
}

