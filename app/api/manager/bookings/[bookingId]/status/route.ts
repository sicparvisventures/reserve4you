import { NextRequest, NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/auth/dal';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * PATCH /api/manager/bookings/[bookingId]/status
 * Update booking status (confirm, cancel, no-show, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const session = await verifyApiSession();
    const { bookingId } = await params;
    const { status, notes } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const validStatuses = ['CONFIRMED', 'CANCELLED', 'NO_SHOW', 'PENDING'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Call the update_booking_status function
    const { data, error } = await supabase.rpc('update_booking_status', {
      p_booking_id: bookingId,
      p_new_status: status,
      p_user_id: session.userId,
      p_notes: notes || null,
    });

    if (error) {
      console.error('Error updating booking status:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update booking status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: `Booking ${status.toLowerCase()}` 
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/manager/bookings/[bookingId]/status:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

