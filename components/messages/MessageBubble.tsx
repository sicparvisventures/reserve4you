/**
 * MessageBubble Component
 * iMessage-achtige message bubble voor berichten
 */

'use client';

import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { MapPin, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MessageBubbleProps {
  message: {
    id: string;
    message_type: 'text' | 'location' | 'system';
    message_content?: string;
    created_at: string;
    sender: {
      id: string;
      email: string;
      name?: string;
    };
    location?: {
      id: string;
      name: string;
      address?: string;
      city?: string;
      postal_code?: string;
      image_url?: string;
      rating?: number;
      cuisine_type?: string;
    };
    location_data?: any;
  };
  isOwnMessage: boolean;
  showSender?: boolean;
}

export function MessageBubble({ message, isOwnMessage, showSender = true }: MessageBubbleProps) {
  const senderName = message.sender.name || message.sender.email.split('@')[0];
  
  // Parse location data
  let location = message.location || message.location_data;
  
  // Parse address_json if present
  if (location && location.address_json) {
    const addr = location.address_json;
    location = {
      ...location,
      address: [addr.street, addr.number].filter(Boolean).join(' '),
      city: addr.city || '',
      postal_code: addr.postalCode || '',
      image_url: location.hero_image_url || location.image_url,
      cuisine_type: location.cuisine || location.cuisine_type
    };
  }

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 group`}>
      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[75%] sm:max-w-[65%]`}>
        {/* Sender Name */}
        {showSender && !isOwnMessage && (
          <div className="text-xs text-muted-foreground mb-1 px-3">
            {senderName}
          </div>
        )}

        {/* Message Bubble */}
        <div
          style={isOwnMessage ? { backgroundColor: '#FF5A5F' } : {}}
          className={`rounded-2xl shadow-sm transition-all ${
            message.message_type === 'text'
              ? isOwnMessage
                ? 'text-white rounded-br-md px-4 py-2'
                : 'bg-muted text-foreground rounded-bl-md px-4 py-2'
              : isOwnMessage
                ? 'rounded-br-md p-1'
                : 'bg-muted rounded-bl-md p-1'
          }`}
        >
          {/* Text Message */}
          {message.message_type === 'text' && (
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
              {message.message_content}
            </p>
          )}

          {/* Location Message */}
          {message.message_type === 'location' && location && (
            <Link href={`/p/${location.slug}`} className="block">
              <Card className="overflow-hidden hover:shadow-md transition-shadow bg-white text-foreground min-w-[200px] border-2 border-white">
                {/* Location Image */}
                {location.image_url && (
                  <div className="relative h-32 w-full bg-muted">
                    <Image
                      src={location.image_url}
                      alt={location.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-primary" />
                    </div>
                  </div>
                )}

                {/* Location Info */}
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-sm text-foreground line-clamp-1">
                      {location.name}
                    </h4>
                    {location.rating && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-medium text-foreground">
                          {location.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  {location.address && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {location.address}
                    </p>
                  )}

                  {location.city && (
                    <p className="text-xs text-muted-foreground">
                      {location.postal_code} {location.city}
                    </p>
                  )}

                  {location.cuisine_type && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {location.cuisine_type}
                    </Badge>
                  )}

                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="text-xs font-medium text-primary">
                      Tik om locatie te bekijken →
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          )}
        </div>

        {/* Timestamp */}
        <div className={`text-[10px] text-muted-foreground mt-1 px-3 opacity-0 group-hover:opacity-100 transition-opacity`}>
          {formatDistanceToNow(new Date(message.created_at), {
            addSuffix: true,
            locale: nl,
          })}
        </div>
      </div>
    </div>
  );
}

