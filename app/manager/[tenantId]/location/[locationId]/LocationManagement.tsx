'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Table as TableIcon,
  MapPin,
  Grid3x3,
  ListOrdered,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { FloorPlanEditor } from '@/components/floor-plan/FloorPlanEditor';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface LocationManagementProps {
  tenant: any;
  role: string;
  location: any;
  tables: any[];
  bookings: any[];
  stats: any;
}

export function LocationManagement({
  tenant,
  role,
  location: initialLocation,
  tables: initialTables,
  bookings: initialBookings,
  stats: initialStats,
}: LocationManagementProps) {
  const [location, setLocation] = useState(initialLocation);
  const [bookings, setBookings] = useState(initialBookings);
  const [stats, setStats] = useState(initialStats);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [savingAutoAccept, setSavingAutoAccept] = useState(false);

  const filteredBookings = bookings.filter(b => 
    filterStatus === 'all' || b.status === filterStatus
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'seated':
      case 'completed':
        return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'cancelled':
      case 'no_show':
        return 'bg-red-500/10 text-red-700 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'seated':
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'cancelled':
      case 'no_show':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const handleAutoAcceptToggle = async (checked: boolean) => {
    setSavingAutoAccept(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('locations')
        .update({ auto_accept_bookings: checked })
        .eq('id', location.id);

      if (error) throw error;

      setLocation({ ...location, auto_accept_bookings: checked });
    } catch (err) {
      console.error('Error updating auto-accept:', err);
      alert('Fout bij opslaan van instelling');
    } finally {
      setSavingAutoAccept(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(prev =>
        prev.map(b =>
          b.id === bookingId ? { ...b, status: newStatus } : b
        )
      );
    } catch (err) {
      console.error('Error updating booking:', err);
      alert('Fout bij bijwerken van reservering');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/manager/${tenant.id}/dashboard`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {location.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {location.city || 'Geen stad ingesteld'}
                </p>
              </div>
            </div>
            <Badge variant={location.is_public ? 'default' : 'secondary'}>
              {location.is_public ? 'Gepubliceerd' : 'Concept'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reserveringen Vandaag</p>
                <p className="text-2xl font-bold">{stats.todayBookings || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Totaal Gasten Vandaag</p>
                <p className="text-2xl font-bold">{stats.totalGuests || 0}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tafels</p>
                <p className="text-2xl font-bold">{stats.totalTables || 0}</p>
              </div>
              <TableIcon className="h-8 w-8 text-primary" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Totaal Zitplaatsen</p>
                <p className="text-2xl font-bold">{stats.totalSeats || 0}</p>
              </div>
              <MapPin className="h-8 w-8 text-primary" />
            </div>
          </Card>
        </div>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="floorplan" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="floorplan" className="gap-2">
              <Grid3x3 className="h-4 w-4" />
              Plattegrond
            </TabsTrigger>
            <TabsTrigger value="bookings" className="gap-2">
              <ListOrdered className="h-4 w-4" />
              Reserveringen
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Instellingen
            </TabsTrigger>
          </TabsList>

          {/* Floor Plan Tab */}
          <TabsContent value="floorplan" className="space-y-4">
            <Card className="p-6">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-foreground">Plattegrond Beheer</h2>
                <p className="text-sm text-muted-foreground">
                  Sleep tafels naar de gewenste positie op de plattegrond
                </p>
              </div>
              <FloorPlanEditor
                locationId={location.id}
                locationName={location.name}
              />
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Reserveringen</h2>
                  <p className="text-sm text-muted-foreground">
                    Beheer reserveringen voor deze locatie
                  </p>
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant={filterStatus === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('all')}
                  >
                    Alle ({bookings.length})
                  </Button>
                  <Button
                    variant={filterStatus === 'pending' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('pending')}
                  >
                    Pending ({bookings.filter(b => b.status === 'pending').length})
                  </Button>
                  <Button
                    variant={filterStatus === 'confirmed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('confirmed')}
                  >
                    Bevestigd ({bookings.filter(b => b.status === 'confirmed').length})
                  </Button>
                </div>
              </div>

              {filteredBookings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Geen reserveringen gevonden</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredBookings.map((booking) => (
                    <Card key={booking.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{booking.customer_name}</h3>
                            <Badge className={cn('gap-1', getStatusColor(booking.status))}>
                              {getStatusIcon(booking.status)}
                              {booking.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(booking.booking_date), 'd MMM yyyy', { locale: nl })}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {booking.booking_time}
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {booking.number_of_guests} personen
                            </div>
                            {booking.table && (
                              <div className="flex items-center gap-2">
                                <TableIcon className="h-4 w-4" />
                                Tafel {booking.table.table_number}
                              </div>
                            )}
                          </div>
                          {booking.customer_phone && (
                            <p className="text-sm text-muted-foreground mt-2">
                              Tel: {booking.customer_phone}
                            </p>
                          )}
                          {booking.special_requests && (
                            <p className="text-sm text-muted-foreground mt-2">
                              Speciale wensen: {booking.special_requests}
                            </p>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          {booking.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Accepteren
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Afwijzen
                              </Button>
                            </>
                          )}
                          {booking.status === 'confirmed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateBookingStatus(booking.id, 'seated')}
                            >
                              Gezeten
                            </Button>
                          )}
                          {booking.status === 'seated' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateBookingStatus(booking.id, 'completed')}
                            >
                              Voltooid
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">Reserveringsinstellingen</h2>
              
              <div className="space-y-6">
                {/* Auto Accept Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-accept" className="text-base font-semibold">
                      Automatisch Accepteren
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Reserveringen worden automatisch bevestigd zonder handmatige goedkeuring
                    </p>
                  </div>
                  <Switch
                    id="auto-accept"
                    checked={location.auto_accept_bookings || false}
                    onCheckedChange={handleAutoAcceptToggle}
                    disabled={savingAutoAccept}
                  />
                </div>

                {/* Info Box */}
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-primary shrink-0" />
                    <div className="text-sm">
                      <p className="font-semibold text-foreground mb-1">
                        {location.auto_accept_bookings ? 'Auto-Accept is AAN' : 'Auto-Accept is UIT'}
                      </p>
                      <p className="text-muted-foreground">
                        {location.auto_accept_bookings
                          ? 'Nieuwe reserveringen krijgen direct de status "confirmed". Ze verschijnen meteen in je planner.'
                          : 'Nieuwe reserveringen krijgen de status "pending". Je moet ze handmatig accepteren in het "Reserveringen" tabblad.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
