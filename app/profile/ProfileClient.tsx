'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Heart,
  LogOut,
  Settings,
  MapPin,
  Clock,
  Users,
  ChevronRight,
  Building2,
  CreditCard,
  Check,
  Zap,
  ArrowUpCircle,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { SubscriptionSection } from './SubscriptionSection';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface ProfileClientProps {
  user: any;
  consumer: any;
  bookings: any[];
  favorites: any[];
  tenants: any[];
}

const NAVIGATION = [
  { id: 'info', label: 'Mijn gegevens', icon: Settings, description: 'Persoonlijke informatie' },
  { id: 'bookings', label: 'Reserveringen', icon: Calendar, description: 'Je boekingen' },
  { id: 'favorites', label: 'Favorieten', icon: Heart, description: 'Opgeslagen restaurants' },
];

export function ProfileClient({ user, consumer, bookings, favorites, tenants }: ProfileClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeSection, setActiveSection] = useState<'info' | 'bookings' | 'favorites' | 'subscription'>('info');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    name: consumer?.name || '',
    phone: consumer?.phone || '',
  });
  const [upgradingTenant, setUpgradingTenant] = useState<string | null>(null);
  const [upgradeSuccess, setUpgradeSuccess] = useState<{ plan: string; testMode: boolean } | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState<string | null>(null);

  // Add subscription to navigation if user has tenants
  const navigation = tenants.length > 0
    ? [...NAVIGATION, { id: 'subscription', label: 'Abonnementen', icon: CreditCard, description: 'Beheer je plannen' }]
    : NAVIGATION;

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Check for upgrade success in URL
  useEffect(() => {
    const upgraded = searchParams.get('upgraded');
    const plan = searchParams.get('plan');
    const testmode = searchParams.get('testmode');
    
    if (upgraded === 'true' && plan) {
      setUpgradeSuccess({ plan, testMode: testmode === 'true' });
      setActiveSection('subscription');
      
      // Refresh data to show new plan
      router.refresh();
      
      // Clean URL (remove query params) after a short delay
      setTimeout(() => {
        router.replace('/profile', { scroll: false });
      }, 100);
    }
  }, [searchParams, router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Error logging out:', error);
      setIsLoggingOut(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);

    try {
      const response = await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      showMessage('success', 'Wijzigingen succesvol opgeslagen!');
      
      // Refresh the page to show updated data
      router.refresh();
    } catch (error: any) {
      showMessage('error', error.message || 'Fout bij opslaan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    const confirmed = confirm('Weet je zeker dat je deze reservering wilt annuleren?');
    if (!confirmed) return;

    setCancellingBooking(bookingId);

    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel booking');
      }

      showMessage('success', 'Reservering succesvol geannuleerd!');
      
      // Refresh the page to show updated data
      router.refresh();
    } catch (error: any) {
      showMessage('error', error.message || 'Fout bij annuleren');
    } finally {
      setCancellingBooking(null);
    }
  };

  const upcomingBookings = bookings.filter(b => new Date(b.start_ts) > new Date());
  const pastBookings = bookings.filter(b => new Date(b.start_ts) <= new Date());

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
                <h1 className="text-2xl font-bold text-foreground">Mijn Profiel</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{isLoggingOut ? 'Uitloggen...' : 'Uitloggen'}</span>
            </Button>
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

      {/* Upgrade Success Modal */}
      <Dialog open={!!upgradeSuccess} onOpenChange={(open) => !open && setUpgradeSuccess(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-center text-2xl font-bold">
              Abonnement geactiveerd
            </DialogTitle>
            <DialogDescription className="text-center text-base pt-2">
              Je bent nu upgraded naar het{' '}
              <strong className="text-foreground">
                {upgradeSuccess?.plan === 'START' && 'Start'}
                {upgradeSuccess?.plan === 'PRO' && 'Pro'}
                {upgradeSuccess?.plan === 'PLUS' && 'Plus'}
                {!['START', 'PRO', 'PLUS'].includes(upgradeSuccess?.plan || '') && upgradeSuccess?.plan}
              </strong>{' '}
              plan.
              {upgradeSuccess?.testMode && (
                <span className="block mt-2 text-sm text-muted-foreground">
                  Test mode - geen betaling vereist
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-4 bg-muted/30 rounded-xl border border-border">
            <p className="text-sm text-muted-foreground text-center">
              Al je nieuwe features zijn nu direct beschikbaar in het dashboard.
            </p>
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-2">
            {tenants.length > 0 && (
              <Button 
                className="w-full h-12 rounded-xl gradient-bg text-white font-semibold"
                asChild
              >
                <Link href={`/manager/${tenants[0].id}/dashboard`}>
                  <Building2 className="h-4 w-4 mr-2" />
                  Ga naar dashboard
                </Link>
              </Button>
            )}
            <Button 
              variant="outline"
              className="w-full h-12 rounded-xl"
              onClick={() => setUpgradeSuccess(null)}
            >
              Sluiten
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <div className="sticky top-32 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id as any)}
                    className={`w-full flex items-start gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isActive ? 'text-primary-foreground' : ''}`} />
                    <div className="text-left flex-1">
                      <div className={`font-medium text-sm ${isActive ? 'text-primary-foreground' : ''}`}>
                        {item.label}
                      </div>
                      <div className={`text-xs mt-0.5 ${
                        isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                      }`}>
                        {item.description}
                      </div>
                    </div>
                    {isActive && <ChevronRight className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Mobile Navigation */}
          <div className="lg:hidden w-full mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all flex-shrink-0 ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <main className="flex-1 min-w-0">
            {/* Personal Info Section */}
            {activeSection === 'info' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Persoonlijke Informatie</h2>
                  <p className="text-sm text-muted-foreground">Beheer je account gegevens</p>
                </div>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Account Gegevens</h3>
                  <div className="space-y-5">
                    <div>
                      <Label htmlFor="name">Naam</Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Je volledige naam"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">E-mailadres</Label>
                      <Input
                        id="email"
                        type="email"
                        defaultValue={user?.email || ''}
                        disabled
                        className="mt-1.5 bg-muted"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Je e-mailadres kan niet worden gewijzigd
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefoonnummer</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+32 9 123 45 67"
                        className="mt-1.5"
                      />
                    </div>

                    <div className="pt-4 border-t flex justify-end">
                      <Button onClick={handleSaveProfile} disabled={isSaving}>
                        {isSaving ? 'Opslaan...' : 'Wijzigingen Opslaan'}
                      </Button>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Voorkeuren</h3>
                  <div className="space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <input type="checkbox" defaultChecked className="w-5 h-5 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">E-mail notificaties</p>
                        <p className="text-sm text-muted-foreground">
                          Ontvang updates over je reserveringen
                        </p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <input type="checkbox" defaultChecked className="w-5 h-5 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">SMS notificaties</p>
                        <p className="text-sm text-muted-foreground">
                          Ontvang SMS herinneringen
                        </p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <input type="checkbox" className="w-5 h-5 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">Marketing communicatie</p>
                        <p className="text-sm text-muted-foreground">
                          Ontvang aanbiedingen en nieuws
                        </p>
                      </div>
                    </label>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-2">Restaurant manager?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Beheer je eigen restaurant met R4Y's krachtige reserveringssysteem
                  </p>
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/manager">
                      <Building2 className="h-4 w-4 mr-2" />
                      Ga naar Manager Portal
                    </Link>
                  </Button>
                </Card>
              </div>
            )}

            {/* Bookings Section */}
            {activeSection === 'bookings' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Reserveringen</h2>
                  <p className="text-sm text-muted-foreground">Bekijk en beheer je boekingen</p>
                </div>

                {/* Upcoming Bookings */}
                {upcomingBookings.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Aankomende reserveringen</h3>
                    <div className="space-y-4">
                  {upcomingBookings.map((booking) => (
                    <Card key={booking.id} className="p-6 hover:shadow-lg transition-all border-2 hover:border-primary">
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                                <MapPin className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <h3 className="font-bold text-xl">{booking.location?.name}</h3>
                                <Badge 
                                  variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                                  className="mt-1"
                                >
                                  {booking.status === 'confirmed' && 'Bevestigd'}
                                  {booking.status === 'pending' && 'In afwachting'}
                                  {booking.status === 'cancelled' && 'Geannuleerd'}
                                  {booking.status === 'seated' && 'Zit aan tafel'}
                                  {booking.status === 'completed' && 'Voltooid'}
                                  {booking.status === 'no_show' && 'Niet verschenen'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" asChild className="rounded-xl">
                            <Link href={`/p/${booking.location?.slug}`}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Bekijk vestiging
                            </Link>
                          </Button>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-xl">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Calendar className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">Datum & Tijd</p>
                              <p className="font-semibold text-foreground">
                                {new Date(booking.start_ts || `${booking.booking_date}T${booking.booking_time}`).toLocaleString('nl-NL', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </p>
                              <p className="text-sm text-foreground font-medium">
                                om {booking.booking_time || new Date(booking.start_ts).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">Aantal Personen</p>
                              <p className="font-semibold text-lg text-foreground">
                                {booking.number_of_guests || booking.party_size} {(booking.number_of_guests || booking.party_size) === 1 ? 'persoon' : 'personen'}
                              </p>
                            </div>
                          </div>

                          {booking.customer_name && (
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Op Naam Van</p>
                                <p className="font-semibold text-foreground">{booking.customer_name}</p>
                              </div>
                            </div>
                          )}

                          {booking.customer_phone && (
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Phone className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Telefoonnummer</p>
                                <p className="font-semibold text-foreground">{booking.customer_phone}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Location Address */}
                        {booking.location?.address_json && (
                          <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
                            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {booking.location.address_json.street} {booking.location.address_json.number}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {booking.location.address_json.postal_code} {booking.location.address_json.city}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Special Requests */}
                        {booking.special_requests && (
                          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                            <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1">
                              Speciale Verzoeken
                            </p>
                            <p className="text-sm text-foreground">
                              {booking.special_requests}
                            </p>
                          </div>
                        )}

                        {/* Booking ID & Created At */}
                        <div className="flex items-center justify-between pt-3 border-t border-border text-xs text-muted-foreground">
                          <span>Reserveringsnummer: {booking.id.split('-')[0]}</span>
                          <span>
                            Gemaakt op {new Date(booking.created_at).toLocaleDateString('nl-NL', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              year: 'numeric' 
                            })}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                          <div className="flex gap-2 pt-4">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleCancelBooking(booking.id)}
                              disabled={cancellingBooking === booking.id}
                              className="flex-1"
                            >
                              {cancellingBooking === booking.id ? 'Annuleren...' : 'Reservering Annuleren'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                    ))}
                  </div>
                </div>
              )}

                {/* Past Bookings */}
                {pastBookings.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Eerdere reserveringen</h3>
                    <div className="space-y-3">
                  {pastBookings.map((booking) => (
                    <Card key={booking.id} className="p-5 opacity-75 hover:opacity-100 transition-opacity">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-base">{booking.location?.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(booking.start_ts || `${booking.booking_date}T${booking.booking_time}`).toLocaleDateString('nl-NL', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })} om {booking.booking_time || new Date(booking.start_ts).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {booking.number_of_guests || booking.party_size} pers.
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {booking.status === 'completed' && 'Voltooid'}
                                {booking.status === 'cancelled' && 'Geannuleerd'}
                                {booking.status === 'no_show' && 'Niet verschenen'}
                                {!['completed', 'cancelled', 'no_show'].includes(booking.status) && booking.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                    ))}
                  </div>
                </div>
              )}

                {bookings.length === 0 && (
                  <Card className="p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-6">
                      <Calendar className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Nog geen reserveringen</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Begin met het verkennen van restaurants en maak je eerste reservering
                    </p>
                    <Button asChild size="lg" className="rounded-xl">
                      <Link href="/discover">
                        Ontdek restaurants
                      </Link>
                    </Button>
                  </Card>
                )}
              </div>
            )}

            {/* Favorites Section */}
            {activeSection === 'favorites' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Favorieten</h2>
                  <p className="text-sm text-muted-foreground">Je opgeslagen restaurants</p>
                </div>

                {favorites.length > 0 ? (
                  <div className="space-y-3">
                    {favorites.map((favorite) => (
                <Card key={favorite.id} className="p-4 hover:border-primary transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{favorite.location?.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {favorite.location?.cuisine} • {favorite.location?.price_range}
                      </p>
                      {favorite.location?.address_json && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {favorite.location.address_json.city}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild className="rounded-xl">
                        <Link href={`/p/${favorite.location?.slug}`}>
                          Bekijken
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                      </Button>
                    </div>
                    </div>
                  </Card>
                ))}
                  </div>
                ) : (
                  <Card className="p-12 text-center">
                    <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nog geen favorieten</h3>
                    <p className="text-muted-foreground mb-6">
                      Voeg restaurants toe aan je favorieten om ze snel terug te vinden
                    </p>
                    <Button asChild>
                      <Link href="/discover">
                        Ontdek restaurants
                      </Link>
                    </Button>
                  </Card>
                )}
              </div>
            )}

            {/* Subscription Section */}
            {activeSection === 'subscription' && tenants.length > 0 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Abonnementen</h2>
                  <p className="text-sm text-muted-foreground">Beheer je abonnementen</p>
                </div>
                <SubscriptionSection tenants={tenants} />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

