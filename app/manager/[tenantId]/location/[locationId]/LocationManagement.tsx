'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { BookingDetailModal } from '@/components/manager/BookingDetailModal';
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
  Eye,
  Tag,
  Save,
  Building2,
  MessageSquare,
  UserPlus,
  Star,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { PromotionsManager } from '@/components/manager/PromotionsManager';
import { LocationImageUpload } from '@/components/manager/LocationImageUpload';
import { GuestMessagingPanel } from '@/components/manager/GuestMessagingPanel';
import { StaffLoginQuickAccess } from '@/components/staff/StaffLoginQuickAccess';
import { CalendarSettings } from '@/components/calendar/CalendarSettings';
import { WaitlistManager } from '@/components/waitlist/WaitlistManager';
import { CRMManager } from '@/components/crm/CRMManager';
import { ReviewsManagement } from '@/components/manager/ReviewsManagement';
import { ShiftsManager } from '@/components/manager/ShiftsManager';
import { UnifiedTableManagement } from '@/components/manager/UnifiedTableManagement';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useTerminology } from '@/lib/hooks/useTerminology';

interface LocationManagementProps {
  tenant: any;
  role: string;
  location: any;
  tables: any[];
  bookings: any[];
  stats: any;
  permissions?: {
    can_view_dashboard: boolean;
    can_manage_bookings: boolean;
    can_manage_tables: boolean;
  };
  isVenueUser?: boolean;
}

export function LocationManagement({
  tenant,
  role,
  location: initialLocation,
  tables: initialTables,
  bookings: initialBookings,
  stats: initialStats,
  permissions,
  isVenueUser = false,
}: LocationManagementProps) {
  // 🔥 Get dynamic terminology
  const t = useTerminology();
  
  // Default permissions for owner/manager
  const hasPermission = permissions || {
    can_view_dashboard: true,
    can_manage_bookings: true,
    can_manage_tables: true,
  };
  const [location, setLocation] = useState(initialLocation);
  const [bookings, setBookings] = useState(initialBookings);
  const [stats, setStats] = useState(initialStats);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [savingAutoAccept, setSavingAutoAccept] = useState(false);
  const [savingSpotlight, setSavingSpotlight] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);
  
  // Location name state
  const [locationInfo, setLocationInfo] = useState({
    name: initialLocation.name || '',
    internal_name: initialLocation.internal_name || '',
  });
  const [savingLocationInfo, setSavingLocationInfo] = useState(false);

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

  // Reload location data after image upload
  const reloadLocation = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('id', location.id)
        .single();
      
      if (!error && data) {
        setLocation(data);
        setLocationInfo({
          name: data.name || '',
          internal_name: data.internal_name || '',
        });
      }
    } catch (err) {
      console.error('Error reloading location:', err);
    }
  };

  // Save location info (names)
  const handleSaveLocationInfo = async () => {
    setSavingLocationInfo(true);
    try {
      const supabase = createClient();
      
      // Validate
      if (!locationInfo.name.trim()) {
        alert('Publieke naam is verplicht');
        return;
      }

      const { error } = await supabase
        .from('locations')
        .update({
          name: locationInfo.name.trim(),
          internal_name: locationInfo.internal_name.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', location.id);

      if (error) throw error;

      // Update local state
      setLocation({
        ...location,
        name: locationInfo.name.trim(),
        internal_name: locationInfo.internal_name.trim() || null,
      });

      alert('✅ Locatienamen succesvol opgeslagen');
    } catch (error) {
      console.error('Error saving location info:', error);
      alert('❌ Er is een fout opgetreden bij het opslaan');
    } finally {
      setSavingLocationInfo(false);
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

  const handleSpotlightToggle = async (checked: boolean) => {
    setSavingSpotlight(true);
    try {
      const supabase = createClient();
      
      const updateData: any = {
        spotlight_enabled: checked,
      };
      
      // If enabling, set activation time
      if (checked && !location.spotlight_activated_at) {
        updateData.spotlight_activated_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('locations')
        .update(updateData)
        .eq('id', location.id);

      if (error) throw error;

      setLocation({ ...location, ...updateData });
    } catch (err) {
      console.error('Error updating spotlight:', err);
      alert('Fout bij opslaan van Spotlight instelling');
    } finally {
      setSavingSpotlight(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    setUpdatingBookingId(bookingId);
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
      
      // Update selected booking if it's the one being updated
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error('Error updating booking:', err);
      alert('Fout bij bijwerken van reservering');
    } finally {
      setUpdatingBookingId(null);
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
                  {location.internal_name || location.name}
                </h1>
                {location.internal_name && location.internal_name !== location.name && (
                  <p className="text-sm text-muted-foreground">
                    Publieke naam: {location.name}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  {location.address_json?.street && location.address_json?.number 
                    ? `${location.address_json.street} ${location.address_json.number}${location.address_json?.city ? `, ${location.address_json.city}` : ''}`
                    : location.city || 'Geen adres ingesteld'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(location.staff_login_slug || location.slug) && (
                <StaffLoginQuickAccess
                  locationSlug={location.staff_login_slug || location.slug}
                  locationName={location.internal_name || location.name}
                  isVenueUser={isVenueUser}
                />
              )}
              <Badge variant={location.is_public ? 'default' : 'secondary'}>
                {location.is_public ? 'Gepubliceerd' : 'Concept'}
              </Badge>
            </div>
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
        <Tabs defaultValue="tables" className="space-y-6">
          <div className="w-full overflow-x-auto pb-2">
            <TabsList className="inline-flex h-auto w-auto">
              <TabsTrigger value="tables" className="gap-1.5 px-4 whitespace-nowrap">
                <TableIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Tafels & Plattegrond</span>
                <span className="sm:hidden">Tafels</span>
              </TabsTrigger>
              <TabsTrigger value="shifts" className="gap-1.5 px-4 whitespace-nowrap">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Diensten</span>
                <span className="sm:hidden">Diensten</span>
              </TabsTrigger>
              <TabsTrigger value="bookings" className="gap-1.5 px-4 whitespace-nowrap">
                <ListOrdered className="h-4 w-4" />
                <span className="hidden sm:inline">Reserveringen</span>
                <span className="sm:hidden">Boekingen</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-1.5 px-4 whitespace-nowrap">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Kalender</span>
                <span className="sm:hidden">Kal</span>
              </TabsTrigger>
              <TabsTrigger value="waitlist" className="gap-1.5 px-4 whitespace-nowrap">
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Wachtlijst</span>
                <span className="sm:hidden">Wacht</span>
              </TabsTrigger>
              <TabsTrigger value="crm" className="gap-1.5 px-4 whitespace-nowrap">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">CRM</span>
                <span className="sm:hidden">CRM</span>
              </TabsTrigger>
              <TabsTrigger value="messaging" className="gap-1.5 px-4 whitespace-nowrap">
                <MessageSquare className="h-4 w-4" />
                Berichten
              </TabsTrigger>
              <TabsTrigger value="promotions" className="gap-1.5 px-4 whitespace-nowrap">
                <Tag className="h-4 w-4" />
                Promoties
              </TabsTrigger>
              <TabsTrigger value="reviews" className="gap-1.5 px-4 whitespace-nowrap">
                <Star className="h-4 w-4" />
                Reviews
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-1.5 px-4 whitespace-nowrap">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Locatie Instellingen</span>
                <span className="sm:hidden">Inst</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Unified Table Management Tab */}
          <TabsContent value="tables" className="space-y-4">
            <UnifiedTableManagement
              locationId={location.id}
              locationName={location.name}
            />
          </TabsContent>

          {/* Shifts Tab */}
          <TabsContent value="shifts" className="space-y-4">
            <Card className="p-6">
              <ShiftsManager
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
                    <Card 
                      key={booking.id} 
                      className="p-4 cursor-pointer hover:border-primary/50 transition-all"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setIsBookingModalOpen(true);
                      }}
                    >
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
                            <p className="text-sm text-foreground mt-2">
                              <span className="font-medium">Speciale wensen:</span> {booking.special_requests}
                            </p>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          {booking.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateBookingStatus(booking.id, 'confirmed');
                                }}
                                disabled={updatingBookingId === booking.id}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Accepteren
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateBookingStatus(booking.id, 'cancelled');
                                }}
                                disabled={updatingBookingId === booking.id}
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
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateBookingStatus(booking.id, 'seated');
                              }}
                              disabled={updatingBookingId === booking.id}
                            >
                              Gezeten
                            </Button>
                          )}
                          {booking.status === 'seated' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateBookingStatus(booking.id, 'completed');
                              }}
                              disabled={updatingBookingId === booking.id}
                            >
                              Voltooid
                            </Button>
                          )}
                          
                          {/* Eye icon for detail view */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBooking(booking);
                              setIsBookingModalOpen(true);
                            }}
                            className="opacity-70 hover:opacity-100"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Promotions Tab */}
          {/* Messaging Tab */}
          <TabsContent value="messaging" className="space-y-4">
            <GuestMessagingPanel
              locationId={location.id}
              locationName={location.name}
              tenantId={tenant.id}
            />
          </TabsContent>

          <TabsContent value="promotions" className="space-y-4">
            <PromotionsManager 
              locationId={location.id}
              locationName={location.name}
            />
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-4">
            <ReviewsManagement
              locationId={location.id}
              locationName={location.name}
            />
          </TabsContent>

          {/* Calendar Settings Tab */}
          <TabsContent value="calendar" className="space-y-4">
            <CalendarSettings locationId={location.id} tenantId={tenant.id} />
          </TabsContent>

          {/* Waitlist Tab */}
          <TabsContent value="waitlist" className="space-y-4">
            <WaitlistManager locationId={location.id} locationName={location.name} />
          </TabsContent>

          {/* CRM Tab */}
          <TabsContent value="crm" className="space-y-4">
            <CRMManager locationId={location.id} locationName={location.internal_name || location.name} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            {/* Location Information */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Building2 className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Locatie Informatie</h2>
              </div>
              
              <div className="space-y-6">
                {/* Public Name */}
                <div className="space-y-2">
                  <Label htmlFor="public-name" className="text-base font-semibold">
                    Publieke Naam *
                  </Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Deze naam wordt getoond aan klanten op de website en in de app
                  </p>
                  <Input
                    id="public-name"
                    value={locationInfo.name}
                    onChange={(e) => setLocationInfo({ ...locationInfo, name: e.target.value })}
                    placeholder="Bijv. Restaurant De Smaakmaker"
                    className="max-w-md"
                  />
                </div>

                {/* Internal Name */}
                <div className="space-y-2">
                  <Label htmlFor="internal-name" className="text-base font-semibold">
                    Interne Naam <span className="text-muted-foreground font-normal">(optioneel)</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Deze naam wordt gebruikt in het dashboard en is alleen zichtbaar voor jou en je team. 
                    Handig voor interne codes of verkorte namen.
                  </p>
                  <Input
                    id="internal-name"
                    value={locationInfo.internal_name}
                    onChange={(e) => setLocationInfo({ ...locationInfo, internal_name: e.target.value })}
                    placeholder="Bijv. DS-AMS-01 of Centrum Amsterdam"
                    className="max-w-md"
                  />
                </div>

                {/* Info Box */}
                <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 shrink-0" />
                    <div className="text-sm">
                      <p className="font-semibold text-foreground mb-1">
                        Wat is het verschil?
                      </p>
                      <ul className="text-muted-foreground space-y-1">
                        <li>• <strong>Publieke naam:</strong> Zichtbaar voor klanten op {location.name}</li>
                        <li>• <strong>Interne naam:</strong> Alleen zichtbaar in je dashboard{locationInfo.internal_name ? ` (${locationInfo.internal_name})` : ''}</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    onClick={handleSaveLocationInfo}
                    disabled={savingLocationInfo || !locationInfo.name.trim()}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {savingLocationInfo ? 'Opslaan...' : 'Wijzigingen Opslaan'}
                  </Button>
                  {(locationInfo.name !== location.name || locationInfo.internal_name !== (location.internal_name || '')) && (
                    <span className="text-sm text-orange-600">
                      Je hebt onopgeslagen wijzigingen
                    </span>
                  )}
                </div>
              </div>
            </Card>

            {/* Location Images */}
            <LocationImageUpload
              locationId={location.id}
              locationName={location.name}
              currentImageUrl={location.image_url}
              currentBannerUrl={location.banner_image_url || location.hero_image_url}
              onImageUpdate={reloadLocation}
            />

            {/* Booking Settings */}
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

            {/* Spotlight Settings - Premium Feature */}
            <Card className="p-6 border-2 border-gradient-to-r from-accent-sunset/30 to-secondary-amber/30">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-accent-sunset to-secondary-amber rounded-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    Spotlight Feature
                    <Badge className="bg-gradient-to-r from-accent-sunset to-secondary-amber text-white border-0">
                      Premium
                    </Badge>
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Word uitgelicht in de homepage carousel
                  </p>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Spotlight Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg border-2 border-border bg-gradient-to-br from-accent-sunset/5 to-secondary-amber/5">
                  <div className="space-y-0.5 flex-1">
                    <Label htmlFor="spotlight" className="text-base font-semibold flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-accent-sunset" />
                      Spotlight Activeren
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Jouw restaurant wordt prominent weergegeven in de homepage carousel
                    </p>
                  </div>
                  <Switch
                    id="spotlight"
                    checked={location.spotlight_enabled || false}
                    onCheckedChange={handleSpotlightToggle}
                    disabled={savingSpotlight}
                  />
                </div>

                {/* Info Box */}
                <div className={cn(
                  "p-4 rounded-lg border-2",
                  location.spotlight_enabled 
                    ? "bg-gradient-to-br from-accent-sunset/10 to-secondary-amber/10 border-accent-sunset/30" 
                    : "bg-muted/50 border-border"
                )}>
                  <div className="flex gap-3">
                    {location.spotlight_enabled ? (
                      <TrendingUp className="h-5 w-5 text-accent-sunset shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}
                    <div className="text-sm">
                      <p className="font-semibold text-foreground mb-1">
                        {location.spotlight_enabled ? '✨ Spotlight is ACTIEF' : 'Spotlight is Inactief'}
                      </p>
                      <p className="text-muted-foreground">
                        {location.spotlight_enabled
                          ? 'Jouw restaurant wordt nu uitgelicht op de homepage! Dit zorgt voor meer zichtbaarheid en reserveringen.'
                          : 'Activeer Spotlight om jouw restaurant prominent te laten zien aan alle bezoekers op de homepage.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">Wat krijg je met Spotlight:</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-accent-sunset shrink-0 mt-0.5" />
                      <span>Grote, aantrekkelijke carousel positie op de homepage</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-accent-sunset shrink-0 mt-0.5" />
                      <span>Premium "Spotlight" badge bij jouw restaurant</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-accent-sunset shrink-0 mt-0.5" />
                      <span>Verhoogde zichtbaarheid en meer boekingen</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-accent-sunset shrink-0 mt-0.5" />
                      <span>Auto-roterende showcase van jouw restaurant</span>
                    </li>
                  </ul>
                </div>

                {/* Future: Stripe Payment Info */}
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-primary shrink-0" />
                    <div className="text-sm">
                      <p className="font-semibold text-foreground mb-1">
                        Tijdelijk Gratis
                      </p>
                      <p className="text-muted-foreground">
                        Spotlight is nu gratis te activeren! Binnenkort wordt dit een betaalde premium feature met Stripe integratie.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Booking Detail Modal */}
      <BookingDetailModal
        booking={selectedBooking}
        open={isBookingModalOpen}
        onOpenChange={setIsBookingModalOpen}
        onStatusUpdate={handleUpdateBookingStatus}
        isUpdating={updatingBookingId === selectedBooking?.id}
      />
    </div>
  );
}
