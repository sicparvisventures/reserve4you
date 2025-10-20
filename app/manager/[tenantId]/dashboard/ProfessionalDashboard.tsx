'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookingDetailModal } from '@/components/manager/BookingDetailModal';
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
  Search,
  Filter,
  Download,
  RefreshCw,
  LogOut,
  Phone,
  Mail,
  X,
  Check,
  Ban,
  Eye,
  Edit,
  MoreVertical,
  Calendar as CalendarIcon,
  LayoutGrid,
  List,
  TrendingDown,
  DollarSign,
  Percent,
} from 'lucide-react';
import Link from 'next/link';

interface ProfessionalDashboardProps {
  tenant: any;
  role: string;
  locations: any[];
  bookings: any[];
  billing: any;
  stats?: any;
}

export function ProfessionalDashboard({ 
  tenant, 
  role, 
  locations: initialLocations, 
  bookings: initialBookings, 
  billing,
  stats: initialStats
}: ProfessionalDashboardProps) {
  const router = useRouter();
  const [locations, setLocations] = useState(initialLocations);
  const [bookings, setBookings] = useState(initialBookings);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'calendar'>('list');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [stats, setStats] = useState<any>(initialStats || {});
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const selectedLocation = selectedLocationId && selectedLocationId !== 'all' 
    ? locations.find(l => l.id === selectedLocationId) 
    : null;
  
  // Filter bookings
  const filteredBookings = bookings.filter(b => {
    const matchesLocation = selectedLocationId === 'all' || !selectedLocationId || b.location_id === selectedLocationId;
    const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
    const matchesSearch = !searchQuery || 
      b.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customer_phone?.includes(searchQuery);
    return matchesLocation && matchesStatus && matchesSearch;
  });

  // Calculate stats
  const today = new Date().toISOString().split('T')[0];
  const todayBookings = filteredBookings.filter(b => b.booking_date === today);

  const upcomingBookings = filteredBookings.filter(b => {
    return b.booking_date >= today;
  });

  const confirmedCount = upcomingBookings.filter(b => b.status === 'confirmed').length;
  const pendingCount = upcomingBookings.filter(b => b.status === 'pending').length;
  const totalGuests = todayBookings.reduce((sum, b) => sum + (b.number_of_guests || 0), 0);

  // Handle logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        router.push('/');
        router.refresh();
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      setError('Failed to logout');
      setIsLoggingOut(false);
    }
  };

  // Handle booking status update
  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    setUpdatingBookingId(bookingId);
    setError('');

    try {
      const response = await fetch(`/api/manager/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update booking');
      }

      // Update local state
      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, status: newStatus } : b
      ));

      // Refresh the page data
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdatingBookingId(null);
    }
  };

  // Handle delete location
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

      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setDeletingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-success/10 text-success border-success/20';
      case 'seated': return 'bg-success/10 text-success border-success/20';
      case 'completed': return 'bg-muted text-muted-foreground border-border';
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      case 'cancelled': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'no_show': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'seated':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'completed':
        return <Check className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'cancelled':
      case 'no_show':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <div className="border-b bg-card sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Tenant Info */}
            <div className="flex items-center gap-4">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-md"
                style={{ backgroundColor: tenant.brand_color || '#FF5A5F' }}
              >
                {tenant.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">{tenant.name}</h1>
                <p className="text-xs text-muted-foreground">
                  {role} • {billing?.plan || 'No Plan'}
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.refresh()}
                className="hidden sm:flex"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Verversen
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <Link href={`/manager/${tenant.id}/settings`}>
                  <Settings className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Instellingen</span>
                </Link>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">
                  {isLoggingOut ? 'Uitloggen...' : 'Uitloggen'}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-destructive/10 border-b border-destructive/20 py-3">
          <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError('')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Location Selector & Quick Actions */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Location Selector */}
          <Card className="flex-1 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Vestigingen ({locations.length})
              </h3>
              <Button
                size="sm"
                variant="outline"
                asChild
                className="h-8"
              >
                <Link href={`/manager/onboarding?step=2&tenantId=${tenant.id}`}>
                  <Plus className="h-3 w-3 mr-1" />
                  Toevoegen
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {/* All Locations Option */}
              <button
                onClick={() => setSelectedLocationId('all')}
                className={`block p-3 rounded-lg border-2 transition-all text-left ${
                  selectedLocationId === 'all'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <LayoutGrid className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">Alle Vestigingen</p>
                    <p className="text-xs text-muted-foreground truncate">
                      Gecombineerd overzicht
                    </p>
                  </div>
                </div>
              </button>

              {locations.map((location) => (
                <div
                  key={location.id}
                  className="relative group"
                >
                  <Link
                    href={`/manager/${tenant.id}/location/${location.id}`}
                    className={`block p-3 rounded-lg border-2 transition-all ${
                      selectedLocationId === location.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedLocationId(location.id)}
                  >
                    <div className="flex items-start gap-2 flex-1 min-w-0 pr-8">
                      <Store className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{location.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {location.is_public ? 'Gepubliceerd' : 'Concept'}
                        </p>
                      </div>
                    </div>
                  </Link>
                  
                  {/* Delete button - outside Link to avoid nesting */}
                  {(role === 'OWNER' || role === 'MANAGER') && locations.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteLocation(location.id, location.name);
                      }}
                      disabled={deletingId === location.id}
                      className="absolute top-2 right-2 h-6 w-6 p-0 rounded hover:bg-destructive/10 transition-colors flex items-center justify-center z-10"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-foreground">{todayBookings.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Vandaag</p>
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {totalGuests} gasten totaal
              </p>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-foreground">{confirmedCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Bevestigd</p>
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {upcomingBookings.length} totaal komend
              </p>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <AlertCircle className="h-4 w-4 text-warning" />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
              <p className="text-xs text-muted-foreground mt-1">In afwachting</p>
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Vereist actie
              </p>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-info/10">
                <TrendingUp className="h-5 w-5 text-info" />
              </div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-foreground">
                {todayBookings.length > 0 ? Math.round((confirmedCount / todayBookings.length) * 100) : 0}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">Bezettingsgraad</p>
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Gebaseerd op capaciteit
              </p>
            </div>
          </Card>
        </div>

        {/* Filters & Search */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Zoek op naam, email, of telefoonnummer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              {['all', 'PENDING', 'CONFIRMED', 'CANCELLED', 'NO_SHOW'].map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                  className={filterStatus === status ? 'gradient-bg text-white' : ''}
                >
                  {status === 'all' ? 'Alle' : status}
                </Button>
              ))}
            </div>

            {/* View Mode */}
            <div className="flex items-center gap-1 border border-border rounded-lg p-1">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 w-8 p-0"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                className="h-8 w-8 p-0"
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Bookings List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">Reserveringen</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredBookings.length} resultaten
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporteren
            </Button>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">
                Geen reserveringen gevonden
              </p>
              <p className="text-muted-foreground">
                {searchQuery || filterStatus !== 'all' 
                  ? 'Probeer andere filters' 
                  : 'Er zijn nog geen reserveringen'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredBookings.slice(0, 50).map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/50 transition-all group cursor-pointer"
                  onClick={() => {
                    setSelectedBooking(booking);
                    setIsBookingModalOpen(true);
                  }}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Status Icon */}
                    <div className={`p-2 rounded-lg border ${getStatusColor(booking.status)}`}>
                      {getStatusIcon(booking.status)}
                    </div>

                    {/* Guest Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground truncate">
                          {booking.customer_name || 'Gast'}
                        </p>
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(booking.status)}
                        >
                          {booking.status}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(booking.booking_date + 'T' + booking.booking_time).toLocaleString('nl-NL', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {booking.number_of_guests} personen
                        </span>
                        {booking.table && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Tafel {booking.table.table_number}
                          </span>
                        )}
                        {booking.customer_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {booking.customer_phone}
                          </span>
                        )}
                      </div>
                      
                      {booking.special_requests && (
                        <p className="text-xs text-foreground mt-2 truncate">
                          <span className="font-medium">Speciale wensen:</span> {booking.special_requests}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {booking.status === 'PENDING' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateBookingStatus(booking.id, 'CONFIRMED');
                          }}
                          disabled={updatingBookingId === booking.id}
                          className="text-success hover:bg-success/10 border-success/20"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Bevestigen
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateBookingStatus(booking.id, 'CANCELLED');
                          }}
                          disabled={updatingBookingId === booking.id}
                          className="text-destructive hover:bg-destructive/10 border-destructive/20"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Annuleren
                        </Button>
                      </>
                    )}
                    
                    {booking.status === 'CONFIRMED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateBookingStatus(booking.id, 'NO_SHOW');
                        }}
                        disabled={updatingBookingId === booking.id}
                        className="text-destructive hover:bg-destructive/10 border-destructive/20"
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        No-show
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBooking(booking);
                        setIsBookingModalOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
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

