'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Send,
  Users,
  Calendar,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Mail,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';

interface GuestMessagingPanelProps {
  locationId: string;
  locationName: string;
  tenantId: string;
}

interface MessageStats {
  total_messages: number;
  total_recipients: number;
  messages_this_month: number;
  average_recipients: number;
}

const MESSAGE_TYPES = [
  { value: 'ANNOUNCEMENT', label: 'Aankondiging', icon: MessageSquare, color: 'bg-blue-500' },
  { value: 'REMINDER', label: 'Herinnering', icon: Clock, color: 'bg-purple-500' },
  { value: 'SPECIAL_OFFER', label: 'Speciale Aanbieding', icon: Sparkles, color: 'bg-gradient-to-r from-accent-sunset to-secondary-amber' },
  { value: 'UPDATE', label: 'Update', icon: AlertCircle, color: 'bg-orange-500' },
  { value: 'WELCOME', label: 'Welkom', icon: Users, color: 'bg-pink-500' },
  { value: 'THANK_YOU', label: 'Bedankt', icon: CheckCircle2, color: 'bg-teal-500' },
  { value: 'CUSTOM', label: 'Aangepast', icon: Mail, color: 'bg-gray-500' },
];

const TARGET_OPTIONS = [
  { value: 'all', label: 'Alle gasten met reserveringen', description: 'Stuur naar iedereen met een actieve reservering' },
  { value: 'upcoming', label: 'Aankomende reserveringen', description: 'Alleen gasten met toekomstige reserveringen' },
  { value: 'specific', label: 'Specifieke datum', description: 'Gasten met reservering op een bepaalde datum' },
];

export function GuestMessagingPanel({ locationId, locationName, tenantId }: GuestMessagingPanelProps) {
  const [messageType, setMessageType] = useState('ANNOUNCEMENT');
  const [targetOption, setTargetOption] = useState('upcoming');
  const [specificDate, setSpecificDate] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [targetCount, setTargetCount] = useState(0);
  const [stats, setStats] = useState<MessageStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sentMessages, setSentMessages] = useState<any[]>([]);

  // Load stats on mount
  useEffect(() => {
    loadStats();
    loadSentMessages();
  }, [locationId]);

  // Update target count when targeting changes
  useEffect(() => {
    updateTargetCount();
  }, [targetOption, specificDate]);

  const loadStats = async () => {
    try {
      const response = await fetch(`/api/manager/messages/stats?locationId=${locationId}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const loadSentMessages = async () => {
    try {
      const response = await fetch(`/api/manager/messages?locationId=${locationId}`);
      if (response.ok) {
        const data = await response.json();
        setSentMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const updateTargetCount = async () => {
    try {
      const params = new URLSearchParams({
        locationId,
        targetUpcoming: targetOption === 'upcoming' ? 'true' : 'false',
      });
      
      if (targetOption === 'specific' && specificDate) {
        params.append('specificDate', specificDate);
      }

      const response = await fetch(`/api/manager/messages/target-count?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTargetCount(data.count);
      }
    } catch (err) {
      console.error('Error getting target count:', err);
    }
  };

  const handleSend = async () => {
    setError(null);
    setSuccess(null);

    if (!subject.trim()) {
      setError('Onderwerp is verplicht');
      return;
    }

    if (!message.trim()) {
      setError('Bericht is verplicht');
      return;
    }

    if (targetOption === 'specific' && !specificDate) {
      setError('Selecteer een datum');
      return;
    }

    if (targetCount === 0) {
      setError('Geen gasten gevonden voor deze selectie');
      return;
    }

    setSending(true);

    try {
      const response = await fetch('/api/manager/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId,
          tenantId,
          messageType,
          subject,
          message,
          targetOption,
          specificDate: targetOption === 'specific' ? specificDate : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setSuccess(`✅ Bericht verstuurd naar ${data.sentCount} gast${data.sentCount !== 1 ? 'en' : ''}!`);
      
      // Reset form
      setSubject('');
      setMessage('');
      
      // Reload stats and messages
      loadStats();
      loadSentMessages();
      
      // Clear success after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Er ging iets mis bij het versturen');
    } finally {
      setSending(false);
    }
  };

  const selectedMessageType = MESSAGE_TYPES.find(t => t.value === messageType);
  const Icon = selectedMessageType?.icon || MessageSquare;

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Totaal Berichten</p>
              <p className="text-2xl font-bold">{stats?.total_messages || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Totaal Bereikt</p>
              <p className="text-2xl font-bold">{stats?.total_recipients || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Deze Maand</p>
              <p className="text-2xl font-bold">{stats?.messages_this_month || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gemiddeld</p>
              <p className="text-2xl font-bold">
                {stats ? Math.round(stats.average_recipients || 0) : 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Message Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Send className="h-5 w-5" />
          Bericht Versturen naar Gasten
        </h3>

        <div className="space-y-6">
          {/* Message Type */}
          <div>
            <Label>Type Bericht</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              {MESSAGE_TYPES.map((type) => {
                const TypeIcon = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => setMessageType(type.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      messageType === type.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <TypeIcon className={`h-5 w-5 mx-auto mb-1 ${
                      messageType === type.value ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                    <p className="text-xs font-medium">{type.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <Label>Doelgroep</Label>
            <div className="space-y-2 mt-2">
              {TARGET_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    targetOption === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="target"
                    value={option.value}
                    checked={targetOption === option.value}
                    onChange={(e) => setTargetOption(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Specific Date (if selected) */}
          {targetOption === 'specific' && (
            <div>
              <Label htmlFor="specific-date">Reserveringsdatum</Label>
              <Input
                id="specific-date"
                type="date"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="mt-1.5"
              />
            </div>
          )}

          {/* Target Count Badge */}
          {targetCount > 0 && (
            <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
              <Target className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">
                Bericht bereikt <strong>{targetCount}</strong> gast{targetCount !== 1 ? 'en' : ''}
              </span>
            </div>
          )}

          {/* Subject */}
          <div>
            <Label htmlFor="subject">Onderwerp *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Bijv: Welkom bij ons restaurant"
              className="mt-1.5"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {subject.length}/100 karakters
            </p>
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message">Bericht *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Typ hier je bericht aan de gasten..."
              rows={6}
              className="mt-1.5"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {message.length}/500 karakters
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {success}
            </div>
          )}

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={sending || targetCount === 0}
            size="lg"
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {sending ? 'Versturen...' : `Verstuur naar ${targetCount} gast${targetCount !== 1 ? 'en' : ''}`}
          </Button>
        </div>
      </Card>

      {/* Recent Messages */}
      {sentMessages.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recente Berichten</h3>
          <div className="space-y-3">
            {sentMessages.slice(0, 5).map((msg) => {
              const msgType = MESSAGE_TYPES.find(t => t.value === msg.message_type);
              const MsgIcon = msgType?.icon || MessageSquare;
              
              return (
                <div key={msg.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={`w-8 h-8 rounded-full ${msgType?.color || 'bg-gray-500'} flex items-center justify-center flex-shrink-0`}>
                    <MsgIcon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-medium text-sm truncate">{msg.subject}</p>
                      <Badge variant="secondary" className="text-xs">
                        {msg.sent_count} ontvanger{msg.sent_count !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{msg.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(msg.created_at).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

