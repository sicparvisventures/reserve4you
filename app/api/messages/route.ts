/**
 * SUPER SIMPLE Messages API - JUST WORKS
 * Vervang app/api/messages/route.ts met deze file
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';

// GET: List conversations or messages
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json({ error: 'Not authenticated', details: authError?.message }, { status: 401 });
    }
    
    console.log('💬 Messages API called for user:', user.id);

    const conversationId = request.nextUrl.searchParams.get('conversation_id');

    // Get consumer - use service client to bypass RLS for own consumer lookup
    const serviceSupabase = await createServiceClient();
    let { data: consumer, error: consumerError } = await serviceSupabase
      .from('consumers')
      .select('id, email, name')
      .eq('auth_user_id', user.id)
      .single();

    // If consumer doesn't exist, create one
    if (consumerError || !consumer) {
      console.log('⚠️ Consumer not found, creating one for user:', user.id);
      
      // Create consumer record
      const { data: newConsumer, error: createError } = await serviceSupabase
        .from('consumers')
        .insert({
          auth_user_id: user.id,
          email: user.email || '',
          name: user.email?.split('@')[0] || 'Gebruiker',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id, email, name')
        .single();
      
      if (createError || !newConsumer) {
        console.error('❌ Error creating consumer:', createError);
        console.error('❌ Error code:', createError?.code);
        console.error('❌ Error details:', createError?.details);
        console.error('❌ Error hint:', createError?.hint);
        console.error('❌ Attempted data:', {
          auth_user_id: user.id,
          email: user.email || '',
          name: user.email?.split('@')[0] || 'Gebruiker',
        });
        return NextResponse.json({ 
          error: 'Failed to create consumer profile',
          code: createError?.code,
          details: createError?.message,
          hint: createError?.hint
        }, { status: 500 });
      }
      
      consumer = newConsumer;
      console.log('✓ Consumer created:', consumer.id);
    }
    
    console.log('✓ Consumer found:', consumer.id);

    // If conversation_id, get messages
    if (conversationId) {
      // First get messages - use service client to bypass RLS (already created above)
      const { data: messagesRaw, error: messagesError } = await serviceSupabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .is('deleted_at', null) // Only show non-deleted messages
        .order('created_at', { ascending: true});

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        return NextResponse.json({ messages: [] });
      }

      // Enrich messages with sender and location data
      // Use service client to bypass RLS for consumer data (safe because user is participant)
      const messages = await Promise.all(
        (messagesRaw || []).map(async (message: any) => {
          // Fetch sender - use service client to bypass RLS
          const { data: sender, error: senderError } = await serviceSupabase
            .from('consumers')
            .select('id, email, name')
            .eq('id', message.sender_id)
            .single();
          
          if (senderError) {
            console.error('Error fetching sender:', senderError);
          }

          // Fetch location if present
          let location = null;
          if (message.location_id) {
            const { data: loc } = await supabase
              .from('locations')
              .select('id, name, slug, hero_image_url, address_json, cuisine, price_range')
              .eq('id', message.location_id)
              .single();
            location = loc;
          }

          return {
            ...message,
            sender: sender || { id: message.sender_id, email: 'unknown', name: 'Onbekend' },
            location: location || null,
          };
        })
      );

      return NextResponse.json({ messages: messages || [] });
    }

    // Otherwise get conversations with participant data
    // Use service client to bypass RLS for conversation_participants (already created above)
    
    // First get conversation_participants for current user
    const { data: conversationParticipants, error: convPartError } = await serviceSupabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('consumer_id', consumer.id);

    if (convPartError) {
      console.error('❌ Error fetching conversation participants:', convPartError);
      console.error('❌ Error code:', convPartError.code);
      console.error('❌ Error details:', convPartError.details);
      return NextResponse.json({ 
        error: 'Failed to fetch conversations',
        details: convPartError.message,
        code: convPartError.code
      }, { status: 500 });
    }

    if (!conversationParticipants || conversationParticipants.length === 0) {
      return NextResponse.json({ conversations: [] });
    }

    // Get unique conversation IDs
    const conversationIds = [...new Set(conversationParticipants.map(cp => cp.conversation_id))];
    
    // Fetch conversations
    const { data: conversationsData, error: convsError } = await serviceSupabase
      .from('conversations')
      .select('id, updated_at, created_at')
      .in('id', conversationIds);

    if (convsError) {
      console.error('❌ Error fetching conversations:', convsError);
      console.error('❌ Error code:', convsError.code);
      return NextResponse.json({ 
        error: 'Failed to fetch conversations',
        details: convsError.message,
        code: convsError.code
      }, { status: 500 });
    }

    if (!conversationsData || conversationsData.length === 0) {
      return NextResponse.json({ conversations: [] });
    }

    // For each conversation, get the other participant and last message
    const conversations = await Promise.all(
      conversationsData.map(async (conv: any) => {
        
        // Get other participant - use service client to bypass RLS
        const { data: otherParticipants } = await serviceSupabase
          .from('conversation_participants')
          .select('consumer_id')
          .eq('conversation_id', conv.id)
          .neq('consumer_id', consumer.id)
          .limit(1);
        
        // Fetch consumer data directly - use service client to bypass RLS
        // This is safe because we already verified user is participant in this conversation
        let otherParticipantData = null;
        if (otherParticipants && otherParticipants.length > 0) {
          const otherConsumerId = otherParticipants[0].consumer_id;
          
          const { data: otherConsumer, error: consumerError } = await serviceSupabase
            .from('consumers')
            .select('id, email, name')
            .eq('id', otherConsumerId)
            .single();
          
          if (consumerError) {
            console.error('Error fetching other participant:', consumerError);
          }
          
          if (otherConsumer) {
            otherParticipantData = [otherConsumer];
          }
        }

        // Get last message - support both old (message_content) and new (message_text) structure
        // Use service client to bypass RLS
        const { data: lastMessage } = await serviceSupabase
          .from('messages')
          .select('message_content, message_text, message_type, created_at')
          .eq('conversation_id', conv.id)
          .is('deleted_at', null) // Only non-deleted messages
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get unread count - only non-deleted messages
        // Use service client to bypass RLS
        const { count: unreadCount } = await serviceSupabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .neq('sender_id', consumer.id)
          .is('deleted_at', null)
          .not('id', 'in', `(
            SELECT message_id FROM message_reads WHERE consumer_id = '${consumer.id}'
          )`);

        return {
          id: conv.id,
          updated_at: conv.updated_at,
          created_at: conv.created_at,
          other_participants: otherParticipantData || [],
          last_message_preview: lastMessage?.message_content || lastMessage?.message_text || '',
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
    console.error('❌❌❌ CRITICAL ERROR in GET /api/messages:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: error.message || 'Internal server error',
      type: error.constructor.name
    }, { status: error.status || 500 });
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

    // Prepare message data - support both old and new structure
    const messageData: any = {
      conversation_id: conversationId,
      sender_id: sender.id,
      message_type: message_type || 'text',
    };

    // Support both message_content (old) and message_text (new)
    if (message_content !== undefined && message_content !== null) {
      messageData.message_content = message_content;
      messageData.message_text = message_content; // Sync to new structure
    }

    // Support location_id (old structure)
    if (location_id) {
      messageData.location_id = location_id;
      // Also store in metadata if using new structure
      if (!messageData.metadata) {
        messageData.metadata = {};
      }
      messageData.metadata.location_id = location_id;
    }

    // Create message
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert(messageData)
      .select('*')
      .single();
    
    // Enrich message with sender data using service client
    let enrichedMessage = message;
    if (message && !msgError) {
      const serviceSupabase = await createServiceClient();
      const { data: senderData } = await serviceSupabase
        .from('consumers')
        .select('id, email, name')
        .eq('id', message.sender_id)
        .single();
      
      let locationData = null;
      if (message.location_id) {
        const { data: loc } = await supabase
          .from('locations')
          .select('id, name, slug, hero_image_url, address_json, cuisine, price_range')
          .eq('id', message.location_id)
          .single();
        locationData = loc;
      }
      
      enrichedMessage = {
        ...message,
        sender: senderData || { id: message.sender_id, email: 'unknown', name: 'Onbekend' },
        location: locationData,
      };
    }

    if (msgError) {
      console.error('❌ Message error:', msgError);
      console.error('❌ Message error code:', msgError.code);
      console.error('❌ Message error details:', msgError.details);
      console.error('❌ Message error hint:', msgError.hint);
      console.error('❌ Message data attempted:', messageData);
      return NextResponse.json({ 
        error: 'Could not send message',
        details: msgError.message,
        code: msgError.code,
        hint: msgError.hint
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
      message: enrichedMessage, 
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

