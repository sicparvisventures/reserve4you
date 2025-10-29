/**
 * Messages API Routes
 * GET: List conversations or messages in a conversation
 * POST: Send a new message
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifySession } from '@/lib/auth/dal';

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession();
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const conversationId = searchParams.get('conversation_id');

    // Get consumer ID
    const { data: consumer } = await supabase
      .from('consumers')
      .select('id')
      .eq('auth_user_id', session.userId)
      .single();

    if (!consumer) {
      return NextResponse.json({ error: 'Consumer not found' }, { status: 404 });
    }

    // If conversation_id provided, get messages
    if (conversationId) {
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:consumers!sender_id (
            id,
            email,
            name
          ),
          location:locations (
            id,
            name,
            address,
            city,
            postal_code,
            image_url,
            rating,
            cuisine_type
          ),
          reads:message_reads (
            consumer_id,
            read_at
          )
        `)
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ messages });
    }

    // Otherwise, get conversations list
    const { data: conversations, error } = await supabase
      .from('conversation_list')
      .select('*')
      .eq('consumer_id', consumer.id)
      .eq('is_archived', false)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ conversations });
  } catch (error: any) {
    console.error('Error in messages GET:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    const supabase = await createClient();
    const body = await request.json();
    const { conversation_id, recipient_email, message_content, message_type, location_id } = body;

    console.log('POST /api/messages - Body:', body);

    // Validate input - need either conversation_id or recipient_email
    if (!conversation_id && !recipient_email) {
      return NextResponse.json(
        { error: 'Ontvanger email of gesprek ID is verplicht' },
        { status: 400 }
      );
    }

    if (message_type === 'text' && !message_content) {
      return NextResponse.json(
        { error: 'Bericht tekst is verplicht' },
        { status: 400 }
      );
    }

    if (message_type === 'location' && !location_id) {
      return NextResponse.json(
        { error: 'Locatie ID is verplicht' },
        { status: 400 }
      );
    }

    // Get sender consumer
    const { data: sender, error: senderError } = await supabase
      .from('consumers')
      .select('id, email, name')
      .eq('auth_user_id', session.userId)
      .single();

    console.log('Sender lookup:', { sender, senderError, userId: session.userId });

    if (senderError || !sender) {
      console.error('Sender not found:', senderError);
      return NextResponse.json(
        { 
          error: 'Je account is nog niet compleet. Log opnieuw in om je consumer profiel aan te maken.',
          details: senderError?.message 
        },
        { status: 404 }
      );
    }

    let conversationId = conversation_id;
    let recipient;

    // If conversation_id provided, use it directly
    if (conversationId) {
      console.log('Using existing conversation:', conversationId);
      
      // Verify user is participant in this conversation
      const { data: participant } = await supabase
        .from('conversation_participants')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('consumer_id', sender.id)
        .single();

      if (!participant) {
        return NextResponse.json(
          { error: 'Je bent geen deelnemer van dit gesprek' },
          { status: 403 }
        );
      }
    } else {
      // Need to find/create conversation using recipient_email
      if (!recipient_email) {
        return NextResponse.json(
          { error: 'Ontvanger email is verplicht voor nieuw gesprek' },
          { status: 400 }
        );
      }

      // Check if recipient exists
      const { data: recipientData, error: recipientError } = await supabase
        .from('consumers')
        .select('id, email, name')
        .eq('email', recipient_email)
        .single();

      console.log('Recipient lookup:', { recipient: recipientData, recipientError, recipient_email });

      if (recipientError || !recipientData) {
        console.error('Recipient not found:', recipientError);
        return NextResponse.json(
          { 
            error: `Gebruiker met email ${recipient_email} niet gevonden. Zorg dat deze gebruiker is ingelogd.`,
            details: recipientError?.message 
          },
          { status: 404 }
        );
      }

      recipient = recipientData;

      // Can't message yourself
      if (sender.id === recipient.id) {
        return NextResponse.json(
          { error: 'Je kunt geen bericht naar jezelf sturen' },
          { status: 400 }
        );
      }

      console.log('Creating conversation between:', sender.email, 'and', recipient.email);

      // Get or create conversation
      const { data: conversationIdResult, error: convError } = await supabase.rpc(
        'get_or_create_conversation',
        {
          user1_email: sender.email,
          user2_email: recipient.email,
        }
      );

      console.log('Conversation result:', { conversationIdResult, convError });

      if (convError) {
        console.error('Error getting/creating conversation:', convError);
        return NextResponse.json(
          { 
            error: 'Kon gesprek niet aanmaken',
            details: convError.message,
            hint: convError.hint 
          },
          { status: 500 }
        );
      }

      conversationId = conversationIdResult;
    }

    // Get location data if location message
    let locationData = null;
    if (message_type === 'location' && location_id) {
      const { data: location } = await supabase
        .from('locations')
        .select('id, name, address, city, postal_code, image_url, rating, cuisine_type')
        .eq('id', location_id)
        .single();

      if (location) {
        locationData = location;
      }
    }

    // Create message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: sender.id,
        message_type: message_type || 'text',
        message_content: message_content || null,
        location_id: location_id || null,
        location_data: locationData,
      })
      .select(`
        *,
        sender:consumers!sender_id (
          id,
          email,
          name
        ),
        location:locations (
          id,
          name,
          address,
          city,
          postal_code,
          image_url,
          rating,
          cuisine_type
        )
      `)
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      return NextResponse.json(
        { error: 'Kon bericht niet versturen' },
        { status: 500 }
      );
    }

    // Create notification for recipient (only if we have recipient info)
    if (recipient) {
      await supabase.from('notifications').insert({
        user_id: recipient.id,
        type: 'MESSAGE_RECEIVED',
        priority: 'MEDIUM',
        title: 'Nieuw bericht',
        message: `${sender.name || sender.email} heeft je een bericht gestuurd`,
        action_url: `/notifications?tab=berichten&conversation=${conversationId}`,
        action_label: 'Bekijk bericht',
      });
    } else {
      // Get other participant for notification
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('consumer_id')
        .eq('conversation_id', conversationId)
        .neq('consumer_id', sender.id);

      if (participants && participants.length > 0) {
        await supabase.from('notifications').insert({
          user_id: participants[0].consumer_id,
          type: 'MESSAGE_RECEIVED',
          priority: 'MEDIUM',
          title: 'Nieuw bericht',
          message: `${sender.name || sender.email} heeft je een bericht gestuurd`,
          action_url: `/notifications?tab=berichten&conversation=${conversationId}`,
          action_label: 'Bekijk bericht',
        });
      }
    }

    return NextResponse.json(
      { message, conversation_id: conversationId },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('❌ CRITICAL ERROR in messages POST:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      stack: error.stack
    });
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        details: error.details || error.hint || 'Geen extra details',
        code: error.code
      },
      { status: 500 }
    );
  }
}

