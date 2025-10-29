'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Heart, 
  Bell, 
  BellOff, 
  Calendar, 
  Clock, 
  Users, 
  Settings, 
  X,
  Check,
  TrendingUp,
  Eye,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Location {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  cuisine_type?: string;
  primary_image_url?: string;
  average_rating?: number;
}

interface Alert {
  id: string;
  is_active: boolean;
  preferred_day_of_week: number | null;
  preferred_time_start: string | null;
  preferred_time_end: string | null;
  preferred_party_size: number;
  notification_count: number;
  max_notifications: number;
  cooldown_hours: number;
  last_notified_at: string | null;
}

interface Insight {
  view_count: number;
  booking_count: number;
  last_viewed_at: string | null;
  last_booked_at: string | null;
  alert_click_count: number;
}

interface FavoriteCardProps {
  location: Location;
  alert?: Alert;
  insight?: Insight;
  onRemoveFavorite: (locationId: string) => void;
  onCreateAlert: (data: any) => void;
  onUpdateAlert: (alertId: string, data: any) => void;
  onDeleteAlert: (alertId: string) => void;
}

const DAYS_OF_WEEK = [
  { value: null, label: 'Elke dag' },
  { value: 1, label: 'Maandag' },
  { value: 2, label: 'Dinsdag' },
  { value: 3, label: 'Woensdag' },
  { value: 4, label: 'Donderdag' },
  { value: 5, label: 'Vrijdag' },
  { value: 6, label: 'Zaterdag' },
  { value: 0, label: 'Zondag' },
];

export function FavoriteCard({
  location,
  alert,
  insight,
  onRemoveFavorite,
  onCreateAlert,
  onUpdateAlert,
  onDeleteAlert,
}: FavoriteCardProps) {
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Alert form state
  const [preferredDay, setPreferredDay] = useState<number | null>(
    alert?.preferred_day_of_week ?? null
  );
  const [preferredTimeStart, setPreferredTimeStart] = useState(
    alert?.preferred_time_start ?? '18:00'
  );
  const [preferredTimeEnd, setPreferredTimeEnd] = useState(
    alert?.preferred_time_end ?? '20:00'
  );
  const [partySize, setPartySize] = useState(alert?.preferred_party_size ?? 2);
  const [cooldownHours, setCooldownHours] = useState(alert?.cooldown_hours ?? 24);

  const hasAlert = !!alert;
  const isAlertActive = alert?.is_active ?? false;

  const handleSaveAlert = async () => {
    setIsLoading(true);
    try {
      if (hasAlert) {
        // Update existing alert
        await onUpdateAlert(alert.id, {
          preferredDayOfWeek: preferredDay,
          preferredTimeStart: preferredTimeStart,
          preferredTimeEnd: preferredTimeEnd,
          preferredPartySize: partySize,
          cooldownHours: cooldownHours,
          isActive: true,
        });
      } else {
        // Create new alert
        await onCreateAlert({
          locationId: location.id,
          preferredDayOfWeek: preferredDay,
          preferredTimeStart: preferredTimeStart,
          preferredTimeEnd: preferredTimeEnd,
          preferredPartySize: partySize,
          cooldownHours: cooldownHours,
        });
      }
      setIsAlertDialogOpen(false);
    } catch (error) {
      console.error('Error saving alert:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAlert = async () => {
    if (!alert) return;
    setIsLoading(true);
    try {
      await onUpdateAlert(alert.id, {
        isActive: !isAlertActive,
      });
    } catch (error) {
      console.error('Error toggling alert:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAlert = async () => {
    if (!alert) return;
    setIsLoading(true);
    try {
      await onDeleteAlert(alert.id);
      setIsAlertDialogOpen(false);
    } catch (error) {
      console.error('Error deleting alert:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDayName = (day: number | null) => {
    if (day === null) return 'Elke dag';
    return DAYS_OF_WEEK.find(d => d.value === day)?.label || 'Onbekend';
  };

  return (
    <div className="group relative bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary/50">
      {/* Image */}
      <Link href={`/p/${location.slug}`} className="block relative h-48 bg-muted overflow-hidden">
        {location.primary_image_url ? (
          <Image
            src={location.primary_image_url}
            alt={location.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // Fallback to raylogo if image fails to load
              e.currentTarget.src = '/raylogo.png';
              e.currentTarget.className = 'object-contain p-8';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-8">
            <img src="/raylogo.png" alt="Reserve4You" className="w-full h-full object-contain" />
          </div>
        )}

        {/* Alert Badge */}
        {hasAlert && isAlertActive && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm">
              <Bell className="h-3 w-3 mr-1" />
              Alert actief
            </Badge>
          </div>
        )}

        {/* Rating Badge */}
        {location.average_rating && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-white/90 text-foreground backdrop-blur-sm">
              ⭐ {location.average_rating.toFixed(1)}
            </Badge>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <Link href={`/p/${location.slug}`}>
              <h3 className="font-semibold text-lg text-foreground truncate hover:text-primary transition-colors">
                {location.name}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground truncate">
              {location.address}, {location.city}
            </p>
          </div>

          {/* Remove Favorite Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 ml-2"
            onClick={() => onRemoveFavorite(location.id)}
          >
            <Heart className="h-4 w-4 fill-primary text-primary" />
          </Button>
        </div>

        {location.cuisine_type && (
          <Badge variant="secondary" className="mb-3">
            {location.cuisine_type}
          </Badge>
        )}

        {/* Alert Info */}
        {hasAlert && isAlertActive && (
          <div className="mb-3 p-2 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{getDayName(alert.preferred_day_of_week)}</span>
              {alert.preferred_time_start && (
                <>
                  <Clock className="h-3 w-3 ml-1" />
                  <span>{alert.preferred_time_start} - {alert.preferred_time_end}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <Users className="h-3 w-3" />
              <span>{alert.preferred_party_size} personen</span>
              <span className="ml-auto text-primary font-medium">
                {alert.notification_count}/{alert.max_notifications} meldingen
              </span>
            </div>
          </div>
        )}

        {/* Stats Preview */}
        {insight && (insight.booking_count > 0 || insight.view_count > 0) && (
          <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
            {insight.booking_count > 0 && (
              <div className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                <span>{insight.booking_count}x geboekt</span>
              </div>
            )}
            {insight.view_count > 0 && (
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{insight.view_count}x bekeken</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Alert Dialog */}
          <Dialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant={hasAlert ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
              >
                {hasAlert ? (
                  <>
                    <Bell className="h-3.5 w-3.5 mr-1.5" />
                    Alert beheren
                  </>
                ) : (
                  <>
                    <Bell className="h-3.5 w-3.5 mr-1.5" />
                    Alert instellen
                  </>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Beschikbaarheid Alert</DialogTitle>
                <DialogDescription>
                  Ontvang een melding wanneer {location.name} beschikbaar is op jouw voorkeuren.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Day of Week */}
                <div className="space-y-2">
                  <Label>Voorkeursdag</Label>
                  <Select
                    value={preferredDay?.toString() ?? 'null'}
                    onValueChange={(v) => setPreferredDay(v === 'null' ? null : parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day.value?.toString() ?? 'null'} value={day.value?.toString() ?? 'null'}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Time Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Van</Label>
                    <Input
                      type="time"
                      value={preferredTimeStart}
                      onChange={(e) => setPreferredTimeStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tot</Label>
                    <Input
                      type="time"
                      value={preferredTimeEnd}
                      onChange={(e) => setPreferredTimeEnd(e.target.value)}
                    />
                  </div>
                </div>

                {/* Party Size */}
                <div className="space-y-2">
                  <Label>Aantal personen</Label>
                  <Select
                    value={partySize.toString()}
                    onValueChange={(v) => setPartySize(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size} {size === 1 ? 'persoon' : 'personen'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Cooldown Hours */}
                <div className="space-y-2">
                  <Label>Minimale tijd tussen meldingen</Label>
                  <Select
                    value={cooldownHours.toString()}
                    onValueChange={(v) => setCooldownHours(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12 uur</SelectItem>
                      <SelectItem value="24">24 uur</SelectItem>
                      <SelectItem value="48">48 uur</SelectItem>
                      <SelectItem value="72">3 dagen</SelectItem>
                      <SelectItem value="168">1 week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Alert Status */}
                {hasAlert && (
                  <div className="pt-4 border-t space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Alert status</span>
                      <Badge variant={isAlertActive ? 'default' : 'secondary'}>
                        {isAlertActive ? 'Actief' : 'Gepauzeerd'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {alert.notification_count} van {alert.max_notifications} meldingen verzonden
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {hasAlert && (
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAlert}
                    disabled={isLoading}
                    className="mr-auto"
                  >
                    Verwijder alert
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setIsAlertDialogOpen(false)}
                  className={!hasAlert ? 'flex-1' : ''}
                >
                  Annuleer
                </Button>
                <Button
                  onClick={handleSaveAlert}
                  disabled={isLoading}
                  className={!hasAlert ? 'flex-1' : ''}
                >
                  {isLoading ? 'Bezig...' : hasAlert ? 'Bijwerken' : 'Alert aanmaken'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Stats Dialog */}
          {insight && (
            <Dialog open={isStatsDialogOpen} onOpenChange={setIsStatsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="px-3">
                  <TrendingUp className="h-3.5 w-3.5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Statistieken</DialogTitle>
                  <DialogDescription>
                    Jouw interacties met {location.name}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-primary">{insight.booking_count}</div>
                      <div className="text-sm text-muted-foreground mt-1">Reserveringen</div>
                    </div>
                    <div className="bg-secondary/50 border border-border rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-foreground">{insight.view_count}</div>
                      <div className="text-sm text-muted-foreground mt-1">Weergaven</div>
                    </div>
                  </div>

                  {insight.alert_click_count > 0 && (
                    <div className="bg-secondary/50 border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Via alert geklikt</span>
                        <span className="text-lg font-semibold">{insight.alert_click_count}x</span>
                      </div>
                    </div>
                  )}

                  {insight.last_booked_at && (
                    <div className="bg-secondary/50 border border-border rounded-lg p-4">
                      <div className="text-sm text-muted-foreground mb-1">Laatst geboekt</div>
                      <div className="font-medium">
                        {new Date(insight.last_booked_at).toLocaleDateString('nl-NL', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Toggle Alert */}
          {hasAlert && (
            <Button
              variant="outline"
              size="sm"
              className="px-3"
              onClick={handleToggleAlert}
              disabled={isLoading}
            >
              {isAlertActive ? (
                <BellOff className="h-3.5 w-3.5" />
              ) : (
                <Bell className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
        </div>

        {/* Book Button */}
        <Link href={`/p/${location.slug}`} className="block mt-3">
          <Button className="w-full" size="sm">
            Reserveer nu
          </Button>
        </Link>
      </div>
    </div>
  );
}

