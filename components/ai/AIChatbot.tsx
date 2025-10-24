'use client';

/**
 * AI Chatbot Assistant - Reserve4You
 * 
 * Professionele AI assistant met OpenAI integratie
 * Analyseert database data en geeft intelligente tips
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageCircle, X, Send, Sparkles, TrendingUp, Calendar, Users, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface AIChatbotProps {
  tenantId: string;
  locationId?: string;
}

export function AIChatbot({ tenantId, locationId }: AIChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setHasNewMessage(false);
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: 'Welkom! Ik ben je AI assistent voor Reserve4You. Ik kan je helpen met:\n\n• Reservering analyses\n• Omzet inzichten\n• Gasten statistieken\n• Optimalisatie tips\n• Voorspellingen\n\nWaar kan ik je mee helpen?',
        timestamp: new Date(),
        suggestions: [
          'Laat reserveringen van vandaag zien',
          'Geef me omzet analyse',
          'Welke tips heb je voor mij?',
          'Voorspel drukke periodes'
        ]
      }]);
    }
  }, []);

  const quickActions = [
    { icon: Calendar, label: 'Vandaag', prompt: 'Geef me een overzicht van de reserveringen vandaag' },
    { icon: TrendingUp, label: 'Analyse', prompt: 'Analyseer mijn prestaties van deze week' },
    { icon: Users, label: 'Gasten', prompt: 'Geef me inzichten over mijn gasten' },
    { icon: Sparkles, label: 'Tips', prompt: 'Welke tips heb je om mijn restaurant te verbeteren?' }
  ];

  const handleSend = async (message?: string) => {
    const messageToSend = message || input.trim();
    if (!messageToSend || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          tenantId,
          locationId,
          conversationHistory: messages.slice(-10) // Last 10 messages for context
        })
      });

      if (!response.ok) throw new Error('AI response failed');

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        suggestions: data.suggestions
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If AI generated a tip, optionally create notification
      if (data.createNotification && data.notificationData) {
        await createTipNotification(data.notificationData);
      }

      // Pulse notification if chat is closed
      if (!isOpen) {
        setHasNewMessage(true);
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, er ging iets mis. Probeer het opnieuw.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const createTipNotification = async (notificationData: any) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    await supabase.from('notifications').insert({
      user_id: user.id,
      tenant_id: tenantId,
      type: 'SYSTEM_ANNOUNCEMENT',
      priority: 'MEDIUM',
      title: 'AI Tip',
      message: notificationData.message,
      action_url: notificationData.actionUrl,
      action_label: notificationData.actionLabel
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <Button
            onClick={() => setIsOpen(true)}
            className="h-14 w-14 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 gradient-bg relative group"
            size="lg"
          >
            <MessageCircle className="h-6 w-6 text-white" />
            {hasNewMessage && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-success rounded-full animate-pulse" />
            )}
            <span className="absolute right-full mr-3 px-3 py-1 bg-foreground text-background text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none hidden md:block">
              AI Assistent
            </span>
          </Button>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed inset-x-4 top-4 bottom-20 md:inset-auto md:right-6 md:bottom-6 md:w-[420px] md:h-[600px] md:max-h-[calc(100vh-3rem)] z-50 shadow-2xl border-2 border-primary/20 flex flex-col animate-scale-in">
          {/* Header */}
          <div className="gradient-bg p-3 md:p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm md:text-base font-semibold text-white">AI Assistent</h3>
                <p className="text-[0.65rem] md:text-xs text-white/80">Powered by OpenAI</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 h-8 w-8 md:h-9 md:w-9"
            >
              <X className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="p-2 md:p-3 border-b bg-muted/30">
            <div className="grid grid-cols-4 gap-1.5 md:gap-2">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(action.prompt)}
                  disabled={isLoading}
                  className="flex flex-col items-center gap-0.5 md:gap-1 p-1.5 md:p-2 rounded-lg hover:bg-primary/10 transition-colors disabled:opacity-50"
                >
                  <action.icon className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                  <span className="text-[0.65rem] md:text-xs font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 md:px-4 md:py-3 ${
                    message.role === 'user'
                      ? 'gradient-bg text-white'
                      : 'bg-muted border border-border'
                  }`}
                >
                  <p className="text-xs md:text-sm whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </p>
                  
                  {/* Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-2 md:mt-3 space-y-1.5 md:space-y-2">
                      {message.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(suggestion)}
                          disabled={isLoading}
                          className="block w-full text-left text-[0.65rem] md:text-xs px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg bg-background hover:bg-primary/10 border border-border transition-colors disabled:opacity-50"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-[0.65rem] md:text-xs opacity-60 mt-1.5 md:mt-2">
                    {message.timestamp.toLocaleTimeString('nl-NL', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted border border-border rounded-2xl px-3 py-2 md:px-4 md:py-3">
                  <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin text-primary" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 md:p-4 border-t bg-background">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Stel een vraag..."
                disabled={isLoading}
                className="flex-1 px-3 py-2 md:px-4 md:py-3 rounded-xl border-2 border-border focus:border-primary focus:outline-none transition-colors disabled:opacity-50 text-xs md:text-sm"
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="gradient-bg rounded-xl px-3 md:px-4"
                size="lg"
              >
                <Send className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </Button>
            </div>
            <p className="text-[0.65rem] md:text-xs text-muted-foreground mt-1.5 md:mt-2 text-center">
              AI kan fouten maken. Controleer belangrijke informatie.
            </p>
          </div>
        </Card>
      )}
    </>
  );
}

