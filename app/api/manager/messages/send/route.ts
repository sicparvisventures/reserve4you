import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyApiSession } from '@/lib/auth/dal';
import { checkTenantRole } from '@/lib/auth/tenant-dal';

export async function POST(request: NextRequest) {
  try {
    const session = await verifyApiSession();
    const body = await request.json();
    
    const {
      locationId,
      tenantId,
      messageType,
      subject,
      message,
      targetOption,
      specificDate,
    } = body;

    // Validate required fields
    if (!locationId || !tenantId || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user has permission
    const hasAccess = await checkTenantRole(session.userId, tenantId, ['OWNER', 'MANAGER']);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const supabase = await createServiceClient();

    // Create message record
    const { data: messageRecord, error: messageError } = await supabase
      .from('guest_messages')
      .insert({
        tenant_id: tenantId,
        location_id: locationId,
        sender_user_id: session.userId,
        message_type: messageType,
        subject: subject.trim(),
        message: message.trim(),
        target_all_guests: targetOption === 'all',
        target_upcoming_bookings: targetOption === 'upcoming',
        target_specific_date: targetOption === 'specific' ? specificDate : null,
      })
      .select()
      .single();

    if (messageError || !messageRecord) {
      console.error('Error creating message:', messageError);
      return NextResponse.json(
        { error: 'Failed to create message' },
        { status: 500 }
      );
    }

    // Send message to guests using Postgres function
    const { data: sendResult, error: sendError } = await supabase
      .rpc('send_message_to_guests', {
        p_message_id: messageRecord.id,
        p_tenant_id: tenantId,
        p_location_id: locationId,
        p_subject: subject.trim(),
        p_message: message.trim(),
        p_message_type: messageType,
        p_target_all_guests: targetOption === 'all',
        p_target_upcoming_bookings: targetOption === 'upcoming',
        p_target_specific_date: targetOption === 'specific' ? specificDate : null,
      });

    if (sendError) {
      console.error('Error sending message:', sendError);
      return NextResponse.json(
        { error: 'Failed to send message to guests' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: messageRecord.id,
      sentCount: sendResult?.[0]?.sent_count || 0,
      recipientIds: sendResult?.[0]?.recipient_ids || [],
    });
  } catch (error: any) {
    console.error('Message send error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

