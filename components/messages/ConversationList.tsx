/**
 * ConversationList Component
 * Lijst van gesprekken met preview van laatste bericht
 */

'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { MessageCircle, MapPin, Search, Trash2, MoreVertical } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
}

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onDeleteConversation,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const otherUser = conv.other_participants?.[0];
    const searchLower = searchQuery.toLowerCase();
    return (
      otherUser?.email?.toLowerCase().includes(searchLower) ||
      otherUser?.name?.toLowerCase().includes(searchLower) ||
      conv.last_message_preview?.toLowerCase().includes(searchLower)
    );
  });

  const getInitials = (participant: any) => {
    if (participant?.name) {
      const parts = participant.name.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return participant.name.slice(0, 2).toUpperCase();
    }
    if (participant?.email) {
      return participant.email.slice(0, 2).toUpperCase();
    }
    return '??';
  };

  const getDisplayName = (participant: any) => {
    return participant?.name || participant?.email || 'Onbekend';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b bg-card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Zoek gesprekken..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length > 0 ? (
          <div className="divide-y divide-border">
            {filteredConversations.map((conversation) => {
              const otherUser = conversation.other_participants?.[0];
              const isSelected = conversation.id === selectedConversationId;
              const hasUnread = conversation.unread_count > 0;
              const isDeleting = deletingId === conversation.id;

              return (
                <div
                  key={conversation.id}
                  className={`group relative flex items-center ${
                    isSelected ? 'bg-muted' : ''
                  } ${isDeleting ? 'opacity-50' : ''}`}
                >
                  <button
                    onClick={() => onSelectConversation(conversation.id)}
                    disabled={isDeleting}
                    className="flex-1 p-4 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <Avatar className={`flex-shrink-0 ${hasUnread ? 'ring-2 ring-primary' : ''}`}>
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {getInitials(otherUser)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className={`text-sm font-semibold truncate ${
                            hasUnread ? 'text-foreground' : 'text-foreground'
                          }`}>
                            {getDisplayName(otherUser)}
                          </h4>
                          {conversation.last_message_at && (
                            <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                              {formatDistanceToNow(new Date(conversation.last_message_at), {
                                addSuffix: false,
                                locale: nl,
                              })}
                            </span>
                          )}
                        </div>

                        {conversation.last_message_preview && (
                          <p className={`text-sm truncate ${
                            hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground'
                          }`}>
                            {conversation.last_message_preview}
                          </p>
                        )}

                        {!conversation.last_message_preview && (
                          <p className="text-sm text-muted-foreground italic">
                            Geen berichten nog
                          </p>
                        )}
                      </div>

                      {/* Unread Badge */}
                      {hasUnread && (
                        <Badge
                          variant="default"
                          className="flex-shrink-0 h-5 min-w-[20px] px-1.5 bg-primary text-primary-foreground text-xs"
                        >
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                  </button>

                  {/* Delete Button - Hidden on mobile, visible on hover on desktop */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          disabled={isDeleting}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (confirm('Weet je zeker dat je dit gesprek wilt verwijderen?')) {
                              setDeletingId(conversation.id);
                              try {
                                await onDeleteConversation(conversation.id);
                              } catch (err) {
                                console.error('Delete failed:', err);
                                alert('Kon gesprek niet verwijderen');
                              } finally {
                                setDeletingId(null);
                              }
                            }
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Verwijderen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
              <MessageCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchQuery ? 'Geen gesprekken gevonden' : 'Nog geen gesprekken'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? 'Probeer een andere zoekopdracht'
                : 'Start een nieuw gesprek om te beginnen'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

