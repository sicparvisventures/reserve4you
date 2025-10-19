'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ArrowLeft,
  Calendar,
  MapPin,
  CreditCard,
  Building2,
  AlertCircle,
  Info,
  CheckCircle2,
  Clock,
  Mail,
  ChevronRight,
  Filter,
  Archive,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Notification {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  action_url?: string;
  action_label?: string;
  booking?: any;
  location?: any;
  tenant?: any;
}

interface NotificationsClientProps {
  initialNotifications: Notification[];
}

const NOTIFICATION_ICONS: Record<string, any> = {
  BOOKING_CONFIRMED: CheckCircle2,
  BOOKING_CANCELLED: AlertCircle,
  BOOKING_REMINDER: Clock,
  BOOKING_MODIFIED: Calendar,
  BOOKING_PENDING: Clock,
  PAYMENT_SUCCESS: CheckCircle2,
  PAYMENT_FAILED: AlertCircle,
  SUBSCRIPTION_UPGRADED: CreditCard,
  SUBSCRIPTION_EXPIRING: AlertCircle,
  SYSTEM_ANNOUNCEMENT: Info,
  LOCATION_PUBLISHED: Building2,
  REVIEW_REQUEST: Mail,
  MESSAGE_RECEIVED: Mail,
  GENERAL: Bell,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  URGENT: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-blue-500',
  LOW: 'bg-gray-500',
};

const FILTER_OPTIONS = [
  { value: 'all', label: 'Alle' },
  { value: 'unread', label: 'Ongelezen' },
  { value: 'bookings', label: 'Reserveringen' },
  { value: 'system', label: 'Systeem' },
];

export function NotificationsClient({ initialNotifications }: NotificationsClientProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      });

      if (!response.ok) throw new Error('Failed to mark as read');

      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Error marking as read:', error);
      showMessage('error', 'Fout bij markeren als gelezen');
    }
  };

  const handleMarkAllAsRead = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to mark all as read');

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      showMessage('success', 'Alle notificaties gemarkeerd als gelezen');
      router.refresh();
    } catch (error) {
      console.error('Error marking all as read:', error);
      showMessage('error', 'Fout bij markeren alle als gelezen');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      setNotifications(prev => prev.filter(n => n.id !== id));
      showMessage('success', 'Notificatie verwijderd');
    } catch (error) {
      console.error('Error deleting notification:', error);
      showMessage('error', 'Fout bij verwijderen');
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'bookings') return notification.type.startsWith('BOOKING_');
    if (filter === 'system') return notification.type === 'SYSTEM_ANNOUNCEMENT';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    const Icon = NOTIFICATION_ICONS[type] || Bell;
    return Icon;
  };

  const getPriorityColor = (priority: string) => {
    return NOTIFICATION_COLORS[priority] || NOTIFICATION_COLORS.MEDIUM;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Button>
              <div className="h-8 w-px bg-border" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Notificaties</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  {unreadCount > 0 ? `${unreadCount} ongelezen` : 'Alle gelezen'}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Markeer alle als gelezen</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className="sticky top-[73px] z-10">
          <div className={`px-4 sm:px-6 lg:px-8 py-3 ${
            message.type === 'success' 
              ? 'bg-green-50 border-b border-green-200' 
              : 'bg-red-50 border-b border-red-200'
          }`}>
            <div className="max-w-[1800px] mx-auto flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.text}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <div className="sticky top-32 space-y-1">
              {FILTER_OPTIONS.map((option) => {
                const isActive = filter === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setFilter(option.value)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className="font-medium text-sm">{option.label}</span>
                    {option.value === 'unread' && unreadCount > 0 && (
                      <Badge variant={isActive ? 'secondary' : 'default'} className="ml-2">
                        {unreadCount}
                      </Badge>
                    )}
                    {isActive && <ChevronRight className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Mobile Filter */}
          <div className="lg:hidden w-full mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {FILTER_OPTIONS.map((option) => {
                const isActive = filter === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setFilter(option.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all flex-shrink-0 ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Filter className="h-4 w-4" />
                    <span className="text-sm font-medium">{option.label}</span>
                    {option.value === 'unread' && unreadCount > 0 && (
                      <Badge variant={isActive ? 'secondary' : 'default'} className="ml-1">
                        {unreadCount}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <main className="flex-1 min-w-0">
            {filteredNotifications.length > 0 ? (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  const priorityColor = getPriorityColor(notification.priority);

                  return (
                    <Card
                      key={notification.id}
                      className={`p-4 transition-all ${
                        !notification.read
                          ? 'border-l-4 border-l-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${priorityColor} flex items-center justify-center`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <h3 className="font-semibold text-foreground">
                                {notification.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
                            )}
                          </div>

                          {/* Metadata */}
                          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                            <span>
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                                locale: nl,
                              })}
                            </span>
                            {notification.priority !== 'MEDIUM' && (
                              <Badge variant="outline" className="text-xs">
                                {notification.priority}
                              </Badge>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 mt-4">
                            {notification.action_url && (
                              <Link href={notification.action_url}>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleMarkAsRead(notification.id)}
                                >
                                  {notification.action_label || 'Bekijken'}
                                </Button>
                              </Link>
                            )}
                            {!notification.read && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="gap-2"
                              >
                                <Check className="h-4 w-4" />
                                Markeer als gelezen
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(notification.id)}
                              className="gap-2 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              Verwijderen
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-6">
                  <Bell className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {filter === 'unread' ? 'Geen ongelezen notificaties' : 'Geen notificaties'}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {filter === 'unread'
                    ? 'Je bent helemaal bij! Alle notificaties zijn gelezen.'
                    : 'Je hebt nog geen notificaties ontvangen.'}
                </p>
                {filter !== 'all' && (
                  <Button onClick={() => setFilter('all')} variant="outline">
                    Bekijk alle notificaties
                  </Button>
                )}
              </Card>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

