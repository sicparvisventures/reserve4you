/**
 * MessagesView Component
 * Volledig berichtensysteem met conversations en messages
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, ArrowLeft, Plus, X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConversationList } from './ConversationList';
import { MessageBubble } from './MessageBubble';
import { ComposeMessage } from './ComposeMessage';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';

interface Message {
  id: string;
  message_type: 'text' | 'location' | 'system';
  message_content?: string;
  created_at: string;
  sender: {
    id: string;
    email: string;
    name?: string;
  };
  location?: any;
  location_data?: any;
}

interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
  last_message_preview?: string;
  unread_count: number;
  other_participants: Array<{
    consumer_id: string;
    email: string;
    name?: string;
  }>;
}

interface MessagesViewProps {
  currentUserId: string;
}

export function MessagesView({ currentUserId }: MessagesViewProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [newRecipientEmail, setNewRecipientEmail] = useState('');
  const [creatingConversation, setCreatingConversation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Fetch conversations and setup real-time subscriptions
  useEffect(() => {
    fetchConversations();

    // Setup Supabase real-time subscription for new messages
    const supabase = createClient();
    
    const messagesSubscription = supabase
      .channel('messages_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('New message received:', payload);
          // Refresh conversations to update preview
          fetchConversations();
          // If message is in current conversation, add it
          if (selectedConversationId && payload.new.conversation_id === selectedConversationId) {
            fetchMessages(selectedConversationId);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => {
          console.log('New conversation:', payload);
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
    };
  }, [selectedConversationId]);

  // Fetch messages when conversation selected
  useEffect(() => {
    if (selectedConversationId) {
      fetchMessages(selectedConversationId);
      // Mark as read
      markConversationAsRead(selectedConversationId);
    }
  }, [selectedConversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/messages');
      if (!response.ok) throw new Error('Kon gesprekken niet ophalen');

      const data = await response.json();
      setConversations(data.conversations || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      setMessagesLoading(true);
      const response = await fetch(`/api/messages?conversation_id=${conversationId}`);
      if (!response.ok) throw new Error('Kon berichten niet ophalen');

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setError(err.message);
    } finally {
      setMessagesLoading(false);
    }
  };

  const markConversationAsRead = async (conversationId: string) => {
    try {
      await fetch(`/api/messages/${conversationId}/read`, { method: 'POST' });
      // Update unread count locally
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
        )
      );
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleSendMessage = async (
    content: string,
    type: 'text' | 'location',
    locationId?: string
  ) => {
    if (!selectedConversationId && !newRecipientEmail) {
      throw new Error('Selecteer een gesprek of voer een email in');
    }

    // Get recipient email for existing conversation
    let recipientEmail = newRecipientEmail;
    if (selectedConversationId && !recipientEmail) {
      const conversation = conversations.find(c => c.id === selectedConversationId);
      recipientEmail = conversation?.other_participants?.[0]?.email || '';
    }

    console.log('Sending message with:', { 
      recipientEmail, 
      selectedConversationId, 
      newRecipientEmail,
      content: content.substring(0, 50) 
    });

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: selectedConversationId || undefined,
          recipient_email: recipientEmail || undefined,
          message_content: content,
          message_type: type,
          location_id: locationId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        const errorMessage = error.error || 'Kon bericht niet versturen';
        console.error('API Error:', errorMessage, error);
        alert(`Error: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // If this was a new conversation, select it
      if (!selectedConversationId && data.conversation_id) {
        setSelectedConversationId(data.conversation_id);
        setShowNewConversation(false);
        setNewRecipientEmail('');
      }

      // Add message to list
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
      }

      // Refresh conversations
      await fetchConversations();
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'Kon bericht niet versturen');
      throw err;
    }
  };

  const handleNewConversation = () => {
    setShowNewConversation(true);
    setSelectedConversationId(null);
    setMessages([]);
    setNewRecipientEmail('');
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/messages/${conversationId}/archive`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }

      // Remove from local state
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      // If this was the selected conversation, clear selection
      if (selectedConversationId === conversationId) {
        setSelectedConversationId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
      throw err;
    }
  };

  const handleStartConversation = async () => {
    if (!newRecipientEmail.trim()) return;

    setCreatingConversation(true);
    try {
      // Send initial empty message to create conversation
      await handleSendMessage('Hallo! 👋', 'text');
    } catch (err: any) {
      alert(err.message || 'Kon gesprek niet starten');
    } finally {
      setCreatingConversation(false);
    }
  };

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);
  const otherUser = selectedConversation?.other_participants?.[0];

  return (
    <div className="h-[calc(100vh-200px)] md:h-[calc(100vh-180px)] flex flex-col lg:flex-row gap-0 lg:gap-4">
      {/* Conversations List - Mobile/Desktop */}
      <Card
        className={`${
          selectedConversationId ? 'hidden lg:block' : 'block'
        } w-full lg:w-96 flex-shrink-0 overflow-hidden flex flex-col h-full`}
      >
        {/* Header */}
        <div className="p-4 border-b bg-card flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Berichten
          </h2>
          <Button
            size="sm"
            onClick={handleNewConversation}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nieuw</span>
          </Button>
        </div>

        {/* Conversations */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mb-2" />
            <p className="text-sm text-destructive mb-3">{error}</p>
            <Button size="sm" variant="outline" onClick={fetchConversations}>
              Opnieuw proberen
            </Button>
          </div>
        ) : (
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversationId || undefined}
            onSelectConversation={setSelectedConversationId}
            onDeleteConversation={handleDeleteConversation}
          />
        )}
      </Card>

      {/* Messages View */}
      <Card className={`${
        !selectedConversationId && !showNewConversation
          ? 'hidden lg:flex'
          : 'flex'
      } flex-1 flex-col overflow-hidden h-full`}>
        {selectedConversationId || showNewConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b bg-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setSelectedConversationId(null);
                    setShowNewConversation(false);
                  }}
                  className="lg:hidden"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  {showNewConversation ? (
                    <h3 className="font-semibold text-foreground">Nieuw Gesprek</h3>
                  ) : (
                    <>
                      <h3 className="font-semibold text-foreground">
                        {otherUser?.name || otherUser?.email || 'Onbekend'}
                      </h3>
                      {otherUser?.email && (
                        <p className="text-xs text-muted-foreground">{otherUser.email}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* New Conversation Input */}
            {showNewConversation && (
              <div className="p-4 border-b bg-muted/30">
                <Label htmlFor="recipient" className="text-sm font-medium mb-2 block">
                  Naar (email adres):
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="recipient"
                    type="email"
                    placeholder="naam@example.com"
                    value={newRecipientEmail}
                    onChange={(e) => setNewRecipientEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleStartConversation();
                      }
                    }}
                    disabled={creatingConversation}
                  />
                  <Button
                    onClick={handleStartConversation}
                    disabled={!newRecipientEmail.trim() || creatingConversation}
                  >
                    {creatingConversation ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Start'
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Voer het email adres in van de gebruiker die je een bericht wilt sturen
                </p>
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length > 0 ? (
                <div className="space-y-1">
                  {messages.map((message, index) => {
                    const prevMessage = messages[index - 1];
                    const showSender =
                      !prevMessage || prevMessage.sender.id !== message.sender.id;

                    return (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwnMessage={message.sender.id === currentUserId}
                        showSender={showSender}
                      />
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              ) : showNewConversation ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Voer een email adres in om te beginnen
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Geen berichten nog
                    </p>
                  </div>
                </div>
              )}
            </ScrollArea>

            {/* Compose */}
            {(selectedConversationId || (showNewConversation && newRecipientEmail)) && (
              <ComposeMessage
                onSendMessage={handleSendMessage}
                disabled={showNewConversation && !newRecipientEmail}
              />
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-6">
            <div>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
                <MessageCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Welkom bij Berichten
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Selecteer een gesprek of start een nieuw gesprek om te beginnen
              </p>
              <Button onClick={handleNewConversation} className="gap-2">
                <Plus className="h-4 w-4" />
                Nieuw Gesprek
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

