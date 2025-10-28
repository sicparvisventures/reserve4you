/**
 * Mark Messages as Read API
 * POST: Mark all messages in a conversation as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifySession } from '@/lib/auth/dal';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await verifySession();
    const supabase = await createClient();
    const { conversationId } = await params;

    // Get consumer ID
    const { data: consumer } = await supabase
      .from('consumers')
      .select('id')
      .eq('auth_user_id', session.userId)
      .single();

    if (!consumer) {
      return NextResponse.json({ error: 'Consumer not found' }, { status: 404 });
    }

    // Verify user is part of conversation
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('consumer_id', consumer.id)
      .single();

    if (!participant) {
      return NextResponse.json(
        { error: 'Not authorized for this conversation' },
        { status: 403 }
      );
    }

    // Get unread messages in this conversation
    const { data: unreadMessages } = await supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .neq('sender_id', consumer.id)
      .is('deleted_at', null)
      .not(
        'id',
        'in',
        `(SELECT message_id FROM message_reads WHERE consumer_id = '${consumer.id}')`
      );

    if (unreadMessages && unreadMessages.length > 0) {
      // Mark all as read
      const reads = unreadMessages.map((msg) => ({
        message_id: msg.id,
        consumer_id: consumer.id,
      }));

      const { error } = await supabase.from('message_reads').insert(reads);

      if (error) {
        console.error('Error marking messages as read:', error);
        return NextResponse.json(
          { error: 'Failed to mark messages as read' },
          { status: 500 }
        );
      }
    }

    // Update last_read_at
    await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('consumer_id', consumer.id);

    return NextResponse.json({ success: true, marked: unreadMessages?.length || 0 });
  } catch (error: any) {
    console.error('Error in mark read:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

