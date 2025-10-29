'use client';

import { useState, useEffect } from 'react';
import { FavoriteCard } from '@/components/favorites/FavoriteCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Heart, 
  Bell, 
  TrendingUp, 
  Loader2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/components/ui/toast-simple';

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

interface Favorite {
  location_id: string;
  location: Location;
}

interface Alert {
  id: string;
  location_id: string;
  is_active: boolean;
  preferred_day_of_week: number | null;
  preferred_time_start: string | null;
  preferred_time_end: string | null;
  preferred_party_size: number;
  notification_count: number;
  max_notifications: number;
  cooldown_hours: number;
  last_notified_at: string | null;
  location?: Location;
}

interface Insight {
  location_id: string;
  view_count: number;
  booking_count: number;
  last_viewed_at: string | null;
  last_booked_at: string | null;
  alert_click_count: number;
}

interface FavoritesClientProps {
  initialFavorites: Favorite[];
}

export function FavoritesClient({ initialFavorites }: FavoritesClientProps) {
  const [favorites, setFavorites] = useState<Favorite[]>(initialFavorites);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(true);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();

  // Fetch alerts on mount
  useEffect(() => {
    fetchAlerts();
    fetchInsights();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/favorites/alerts');
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setIsLoadingAlerts(false);
    }
  };

  const fetchInsights = async () => {
    try {
      const response = await fetch('/api/favorites/insights');
      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights || []);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const handleRemoveFavorite = async (locationId: string) => {
    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId, action: 'remove' }),
      });

      if (response.ok) {
        setFavorites(favorites.filter(f => f.location_id !== locationId));
        setAlerts(alerts.filter(a => a.location_id !== locationId));
        toast.success('Verwijderd uit favorieten');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Fout bij verwijderen');
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Er ging iets mis');
    }
  };

  const handleCreateAlert = async (data: any) => {
    try {
      const response = await fetch('/api/favorites/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        setAlerts([...alerts, result.alert]);
        toast.success('Alert succesvol aangemaakt!', {
          description: 'Je ontvangt een melding wanneer er beschikbaarheid is.',
        });
      } else {
        const result = await response.json();
        toast.error(result.error || 'Fout bij aanmaken van alert');
      }
    } catch (error) {
      console.error('Error creating alert:', error);
      toast.error('Er ging iets mis');
    }
  };

  const handleUpdateAlert = async (alertId: string, data: any) => {
    try {
      const response = await fetch('/api/favorites/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, ...data }),
      });

      if (response.ok) {
        const result = await response.json();
        setAlerts(alerts.map(a => a.id === alertId ? result.alert : a));
        toast.success('Alert bijgewerkt');
      } else {
        const result = await response.json();
        toast.error(result.error || 'Fout bij updaten van alert');
      }
    } catch (error) {
      console.error('Error updating alert:', error);
      toast.error('Er ging iets mis');
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/favorites/alerts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId }),
      });

      if (response.ok) {
        setAlerts(alerts.filter(a => a.id !== alertId));
        toast.success('Alert verwijderd');
      } else {
        const result = await response.json();
        toast.error(result.error || 'Fout bij verwijderen van alert');
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast.error('Er ging iets mis');
    }
  };

  const getAlertForLocation = (locationId: string) => {
    return alerts.find(a => a.location_id === locationId);
  };

  const getInsightForLocation = (locationId: string) => {
    return insights.find(i => i.location_id === locationId);
  };

  const favoritesWithAlerts = favorites.filter(f => 
    alerts.some(a => a.location_id === f.location_id && a.is_active)
  );

  const activeAlerts = alerts.filter(a => a.is_active);

  if (favorites.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-2xl mb-6">
          <Heart className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Nog geen favorieten
        </h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Voeg locaties toe aan je favorieten om ze hier terug te vinden.
          Klik op het hartje bij een locatie om het toe te voegen.
        </p>
        <a
          href="/discover"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
        >
          Ontdek Locaties
        </a>
      </div>
    );
  }

  const isLoading = isLoadingAlerts || isLoadingInsights;

  return (
    <div className="space-y-8">
      {/* Smart Alerts Feature Banner */}
      <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/30 rounded-xl p-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
            Smart Availability Alerts
            <Badge variant="secondary" className="text-xs">Nieuw</Badge>
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Mis nooit meer een kans! Stel alerts in voor je favoriete restaurants en krijg automatisch een melding 
            wanneer ze beschikbaar zijn op jouw gewenste dag en tijd. Perfect voor populaire locaties die vaak volgeboekt zijn.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>
              {activeAlerts.length === 0 
                ? 'Klik op "Alert instellen" bij een favoriet om te beginnen' 
                : `Je hebt ${activeAlerts.length} actieve alert${activeAlerts.length === 1 ? '' : 's'}`
              }
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger value="all" className="gap-2">
            <Heart className="h-4 w-4" />
            Alle Favorieten
            <Badge variant="secondary" className="ml-1">{favorites.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <Bell className="h-4 w-4" />
            Met Alerts
            <Badge variant="secondary" className="ml-1">{favoritesWithAlerts.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favorites.map((favorite) => (
                <FavoriteCard
                  key={favorite.location_id}
                  location={favorite.location}
                  alert={getAlertForLocation(favorite.location_id)}
                  insight={getInsightForLocation(favorite.location_id)}
                  onRemoveFavorite={handleRemoveFavorite}
                  onCreateAlert={handleCreateAlert}
                  onUpdateAlert={handleUpdateAlert}
                  onDeleteAlert={handleDeleteAlert}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : favoritesWithAlerts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favoritesWithAlerts.map((favorite) => (
                <FavoriteCard
                  key={favorite.location_id}
                  location={favorite.location}
                  alert={getAlertForLocation(favorite.location_id)}
                  insight={getInsightForLocation(favorite.location_id)}
                  onRemoveFavorite={handleRemoveFavorite}
                  onCreateAlert={handleCreateAlert}
                  onUpdateAlert={handleUpdateAlert}
                  onDeleteAlert={handleDeleteAlert}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-2xl mb-4">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Geen actieve alerts
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Stel alerts in voor je favorieten om automatisch een melding te krijgen 
                wanneer ze beschikbaar zijn.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

