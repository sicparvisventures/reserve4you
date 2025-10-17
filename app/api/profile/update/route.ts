import { NextRequest, NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/auth/dal';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * PATCH /api/profile/update
 * Update consumer profile information
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await verifyApiSession();
    const { name, phone } = await request.json();

    // Validate input
    if (!name && !phone) {
      return NextResponse.json(
        { error: 'At least one field (name or phone) is required' },
        { status: 400 }
      );
    }

    // Validate name if provided
    if (name && (name.trim().length < 2 || name.trim().length > 100)) {
      return NextResponse.json(
        { error: 'Name must be between 2 and 100 characters' },
        { status: 400 }
      );
    }

    // Validate phone if provided
    if (phone && phone.trim().length < 10) {
      return NextResponse.json(
        { error: 'Phone number must be at least 10 characters' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Call the update_consumer_profile function
    const { data, error } = await supabase.rpc('update_consumer_profile', {
      p_user_id: session.userId,
      p_name: name?.trim() || null,
      p_phone: phone?.trim() || null,
    });

    if (error) {
      console.error('Error updating profile:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update profile' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully',
      consumer: data[0]
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/profile/update:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

