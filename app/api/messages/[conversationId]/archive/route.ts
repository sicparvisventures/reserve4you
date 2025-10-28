/**
 * Archive Conversation API
 * POST: Archive (delete) a conversation for the current user
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

    // Archive the conversation for this user
    const { error } = await supabase
      .from('conversation_participants')
      .update({ 
        is_archived: true
      })
      .eq('conversation_id', conversationId)
      .eq('consumer_id', consumer.id);

    if (error) {
      console.error('Error archiving conversation:', error);
      return NextResponse.json(
        { error: 'Failed to archive conversation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Error in archive conversation:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details
    });
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        details: error.details || 'Geen details'
      },
      { status: 500 }
    );
  }
}

