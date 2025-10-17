'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Settings,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Store,
  Plus,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardClientProps {
  tenant: any;
  role: string;
  locations: any[];
  bookings: any[];
  billing: any;
}

export function DashboardClient({ tenant, role, locations, bookings, billing }: DashboardClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedLocationId, setSelectedLocationId] = useState(locations[0]?.id || null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const published = searchParams.get('published');

  const selectedLocation = locations.find(l => l.id === selectedLocationId);
  const filteredBookings = selectedLocationId
    ? bookings.filter(b => b.location_id === selectedLocationId)
    : bookings;

  // Stats
  const todayBookings = filteredBookings.filter(b => {
    const bookingDate = new Date(b.start_ts);
    const today = new Date();
    return bookingDate.toDateString() === today.toDateString();
  });

  const upcomingBookings = filteredBookings.filter(b => {
    const bookingDate = new Date(b.start_ts);
    return bookingDate > new Date();
  });

  const confirmedCount = upcomingBookings.filter(b => b.status === 'CONFIRMED').length;
  const pendingCount = upcomingBookings.filter(b => b.status === 'PENDING').length;

  const handleDeleteLocation = async (locationId: string, locationName: string) => {
    const confirmed = confirm(
      `Weet je zeker dat je vestiging "${locationName}" wilt verwijderen?\n\n` +
      `Dit verwijdert permanent:\n` +
      `- Alle tafels en shifts\n` +
      `- Alle reserveringen\n` +
      `- Alle policies en instellingen\n\n` +
      `Deze actie kan niet ongedaan gemaakt worden.`
    );

    if (!confirmed) return;

    setDeletingId(locationId);
    setError('');

    try {
      const response = await fetch(`/api/manager/locations/${locationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete location');
      }

      // Refresh the page
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setDeletingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      CONFIRMED: 'default',
      PENDING: 'secondary',
      CANCELLED: 'destructive',
      NO_SHOW: 'destructive',
      WAITLIST: 'outline',
    };
    return <Badge variant={variants[status] || 'outline' as any}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Success Banner */}
      {published === 'true' && (
        <div className="bg-success/10 border-b border-success/20 py-4">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-success mr-3 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Restaurant succesvol gepubliceerd</p>
                  <p className="text-sm text-muted-foreground">
                    Je restaurant is nu zichtbaar voor klanten
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="rounded-xl"
              >
                <Link href={`/p/${selectedLocation?.slug}`} target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Bekijk pagina
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{tenant.name}</h1>
              <p className="text-muted-foreground">
                {role} • {billing?.plan || 'No active subscription'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                asChild 
                className="rounded-xl gradient-bg text-white border-0 hover:opacity-90"
              >
                <Link href={`/manager/onboarding?step=2&tenantId=${tenant.id}`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nieuwe Vestiging
                </Link>
              </Button>
              <Button variant="outline" asChild className="rounded-xl">
                <Link href={`/manager/${tenant.id}/settings`}>
                  <Settings className="h-4 w-4 mr-2" />
                  Instellingen
                </Link>
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded-xl">
              <p className="text-destructive text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Location Tabs with Delete */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground">
                VESTIGINGEN ({locations.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {locations.map((location) => (
                <Card
                  key={location.id}
                  className={`p-4 transition-all ${
                    selectedLocationId === location.id
                      ? 'border-2 border-primary shadow-md'
                      : 'border border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <button
                      onClick={() => setSelectedLocationId(location.id)}
                      className="flex items-start flex-1 text-left hover:opacity-80 transition-opacity"
                    >
                      <Store className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-foreground">{location.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {location.is_public ? 'Gepubliceerd' : 'Concept'}
                        </p>
                      </div>
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="text-xs text-muted-foreground">
                      {location.slug}
                    </div>
                    {(role === 'OWNER' || role === 'MANAGER') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteLocation(location.id, location.name)}
                        disabled={deletingId === location.id || locations.length === 1}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                      >
                        {deletingId === location.id ? (
                          <span className="text-xs">...</span>
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
            {locations.length === 1 && (
              <p className="text-xs text-muted-foreground">
                Je laatste vestiging kan niet verwijderd worden. Verwijder eerst het bedrijf via /manager.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* No Locations State */}
      {locations.length === 0 && (
        <div className="container mx-auto px-4 py-16">
          <Card className="p-12 text-center">
            <Store className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Geen vestigingen
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Je hebt nog geen vestigingen toegevoegd. Voeg je eerste vestiging toe om te beginnen met reserveringen ontvangen.
            </p>
            <Button 
              asChild 
              size="lg"
              className="gradient-bg text-white rounded-xl"
            >
              <Link href={`/manager/onboarding?step=2&tenantId=${tenant.id}`}>
                <Plus className="h-5 w-5 mr-2" />
                Eerste Vestiging Toevoegen
              </Link>
            </Button>
          </Card>
        </div>
      )}

      {/* Main Content */}
      {locations.length > 0 && (
        <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Vandaag</span>
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div className="text-3xl font-bold">{todayBookings.length}</div>
            <p className="text-xs text-muted-foreground mt-1">reserveringen</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Bevestigd</span>
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div className="text-3xl font-bold">{confirmedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">komende boekingen</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">In afwachting</span>
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div className="text-3xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">te bevestigen</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Capaciteit</span>
              <TrendingUp className="h-5 w-5 text-info" />
            </div>
            <div className="text-3xl font-bold">
              {Math.round((todayBookings.length / (selectedLocation?.tables?.length || 10)) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">vandaag bezetting</p>
          </Card>
        </div>

        {/* Bookings List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Komende reserveringen</h2>
            <Button variant="outline" className="rounded-xl">
              <Calendar className="h-4 w-4 mr-2" />
              Kalenderweergave
            </Button>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">
                Geen reserveringen
              </p>
              <p className="text-muted-foreground">
                Er zijn nog geen reserveringen voor deze locatie
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBookings.slice(0, 20).map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border border-border rounded-xl hover:border-primary transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(booking.status)}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{booking.guest_name || 'Gast'}</p>
                        {getStatusBadge(booking.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(booking.start_ts).toLocaleString('nl-NL', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                        <span className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {booking.party_size} personen
                        </span>
                        {booking.table && (
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {booking.table.name}
                          </span>
                        )}
                      </div>
                      {booking.special_notes && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {booking.special_notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="rounded-xl">
                      Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        </div>
      )}
    </div>
  );
}
