/**
 * ComposeMessage Component
 * iMessage-achtige compose bar met locatie delen functionaliteit
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, MapPin, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { LocationPicker } from './LocationPicker';
import Image from 'next/image';

interface ComposeMessageProps {
  onSendMessage: (content: string, type: 'text' | 'location', locationId?: string) => Promise<void>;
  disabled?: boolean;
}

export function ComposeMessage({ onSendMessage, disabled }: ComposeMessageProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSend = async () => {
    if (sending || disabled) return;

    // Send location
    if (selectedLocation) {
      setSending(true);
      try {
        await onSendMessage('', 'location', selectedLocation.id);
        setSelectedLocation(null);
      } catch (error) {
        console.error('Error sending location:', error);
      } finally {
        setSending(false);
      }
      return;
    }

    // Send text
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    setSending(true);
    try {
      await onSendMessage(trimmedMessage, 'text');
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLocationSelect = (location: any) => {
    setSelectedLocation(location);
    setShowLocationPicker(false);
  };

  const canSend = (message.trim().length > 0 || selectedLocation) && !sending && !disabled;

  return (
    <div className="border-t bg-card safe-bottom">
      {/* Selected Location Preview */}
      {selectedLocation && (
        <div className="p-3 border-b bg-muted/50">
          <div className="flex items-center gap-3">
            {selectedLocation.image_url && (
              <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={selectedLocation.image_url}
                  alt={selectedLocation.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {selectedLocation.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {selectedLocation.city}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedLocation(null)}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Compose Area */}
      <div className="flex items-end gap-2 p-3 pb-safe">
        {/* Location Button */}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => setShowLocationPicker(!showLocationPicker)}
          disabled={disabled || sending}
          className={`flex-shrink-0 rounded-full h-9 w-9 ${
            showLocationPicker ? 'bg-primary text-primary-foreground' : ''
          }`}
        >
          <MapPin className="h-5 w-5" />
        </Button>

        {/* Text Input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Typ een bericht..."
            disabled={disabled || sending || !!selectedLocation}
            className="min-h-[40px] max-h-[120px] resize-none rounded-2xl border-2 pr-12 py-2.5"
            rows={1}
          />
        </div>

        {/* Send Button */}
        <Button
          type="button"
          size="icon"
          onClick={handleSend}
          disabled={!canSend}
          style={canSend ? { backgroundColor: '#FF5A5F' } : {}}
          className={`flex-shrink-0 rounded-full h-9 w-9 transition-all ${
            canSend
              ? 'text-white hover:opacity-90'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {sending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Location Picker */}
      {showLocationPicker && (
        <div className="border-t bg-card">
          <LocationPicker
            onSelectLocation={handleLocationSelect}
            onClose={() => setShowLocationPicker(false)}
          />
        </div>
      )}
    </div>
  );
}

