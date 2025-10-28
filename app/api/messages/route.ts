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
          sender:consumers!sender_id(id, email, name),
          location:locations(id, name, slug, hero_image_url, address_json, cuisine, price_range)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true});

      return NextResponse.json({ messages: messages || [] });
    }

    // Otherwise get conversations with participant data
    const { data: conversationData } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        conversations:conversation_id (
          id,
          updated_at,
          created_at
        )
      `)
      .eq('consumer_id', consumer.id);

    if (!conversationData || conversationData.length === 0) {
      return NextResponse.json({ conversations: [] });
    }

    // For each conversation, get the other participant and last message
    const conversations = await Promise.all(
      conversationData.map(async (item: any) => {
        const conv = item.conversations;
        
        // Get other participant
        const { data: otherParticipants } = await supabase
          .from('conversation_participants')
          .select('consumer_id, consumers:consumer_id(id, email, name)')
          .eq('conversation_id', conv.id)
          .neq('consumer_id', consumer.id)
          .limit(1);

        // Get last message
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('message_content, message_type, created_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get unread count
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .neq('sender_id', consumer.id)
          .not('id', 'in', `(
            SELECT message_id FROM message_reads WHERE consumer_id = '${consumer.id}'
          )`);

        return {
          id: conv.id,
          updated_at: conv.updated_at,
          created_at: conv.created_at,
          other_participants: otherParticipants?.map((p: any) => p.consumers) || [],
          last_message_preview: lastMessage?.message_content || '',
          last_message_type: lastMessage?.message_type || 'text',
          last_message_at: lastMessage?.created_at || conv.created_at,
          unread_count: unreadCount || 0,
        };
      })
    );

    // Sort by last message time
    conversations.sort((a, b) => 
      new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
    );

    return NextResponse.json({ conversations });
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

    // Get recipient to create notification
    const { data: recipient } = await supabase
      .from('consumers')
      .select('id, email, auth_user_id')
      .eq('email', recipient_email)
      .single();

    if (recipient && recipient.id !== sender.id && recipient.auth_user_id) {
      // Create notification for recipient
      const notificationContent = message_type === 'location' 
        ? `Nieuwe locatie gedeeld` 
        : message_content?.substring(0, 50) || 'Nieuw bericht';
      
      await supabase
        .from('notifications')
        .insert({
          user_id: recipient.auth_user_id,
          type: 'GENERAL',
          title: 'Nieuw bericht',
          message: notificationContent,
          action_url: '/notifications',
          metadata: {
            conversation_id: conversationId,
            sender_email: sender.email,
            message_type: message_type
          }
        });
      
      console.log('✓ Notification created for recipient');
    }

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

