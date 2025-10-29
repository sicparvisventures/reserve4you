/**
 * SUPER SIMPLE Messages API - JUST WORKS
 * Vervang app/api/messages/route.ts met deze file
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: List conversations or messages
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const conversationId = request.nextUrl.searchParams.get('conversation_id');

    // Get consumer
    const { data: consumer } = await supabase
      .from('consumers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!consumer) {
      return NextResponse.json({ error: 'Consumer not found' }, { status: 404 });
    }

    // If conversation_id, get messages
    if (conversationId) {
      const { data: messages } = await supabase
        .from('messages')
        .select(`
          *,
          sender:consumers!sender_id(id, email, name)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      return NextResponse.json({ messages: messages || [] });
    }

    // Otherwise get conversations
    const { data: participations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('consumer_id', consumer.id);

    if (!participations || participations.length === 0) {
      return NextResponse.json({ conversations: [] });
    }

    const convIds = participations.map(p => p.conversation_id);
    
    const { data: conversations } = await supabase
      .from('conversations')
      .select('*')
      .in('id', convIds)
      .order('updated_at', { ascending: false });

    return NextResponse.json({ conversations: conversations || [] });
  } catch (error: any) {
    console.error('GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Send message
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📨 POST /api/messages:', body);

    const { recipient_email, message_content, message_type, location_id } = body;

    // Get sender
    const { data: sender } = await supabase
      .from('consumers')
      .select('id, email')
      .eq('auth_user_id', user.id)
      .single();

    if (!sender) {
      console.error('❌ Sender not found for user:', user.id);
      return NextResponse.json({ error: 'Sender not found' }, { status: 404 });
    }

    console.log('✓ Sender:', sender.email);

    if (!recipient_email) {
      return NextResponse.json({ error: 'Recipient email required' }, { status: 400 });
    }

    // Get or create conversation
    console.log('🔄 Getting conversation between:', sender.email, 'and', recipient_email);
    
    const { data: conversationId, error: convError } = await supabase
      .rpc('get_or_create_conversation', {
        email1: sender.email,
        email2: recipient_email
      });

    if (convError) {
      console.error('❌ Conversation error:', convError);
      return NextResponse.json({ 
        error: 'Could not create conversation',
        details: convError.message 
      }, { status: 500 });
    }

    console.log('✓ Conversation ID:', conversationId);

    // Create message
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: sender.id,
        message_type: message_type || 'text',
        message_content: message_content,
        location_id: location_id
      })
      .select(`
        *,
        sender:consumers!sender_id(id, email, name)
      `)
      .single();

    if (msgError) {
      console.error('❌ Message error:', msgError);
      return NextResponse.json({ 
        error: 'Could not send message',
        details: msgError.message 
      }, { status: 500 });
    }

    console.log('✓✓✓ Message sent successfully!');

    return NextResponse.json({ 
      message, 
      conversation_id: conversationId 
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌❌❌ CRITICAL ERROR:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

