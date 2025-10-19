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

export function ProfileClient({ user, consumer, bookings, favorites, tenants }: ProfileClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'bookings' | 'favorites' | 'subscription'>('info');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: consumer?.name || '',
    phone: consumer?.phone || '',
  });
  const [upgradingTenant, setUpgradingTenant] = useState<string | null>(null);
  const [upgradeSuccess, setUpgradeSuccess] = useState<{ plan: string; testMode: boolean } | null>(null);

  // Check for upgrade success in URL
  useEffect(() => {
    const upgraded = searchParams.get('upgraded');
    const plan = searchParams.get('plan');
    const testmode = searchParams.get('testmode');
    
    if (upgraded === 'true' && plan) {
      setUpgradeSuccess({ plan, testMode: testmode === 'true' });
      setActiveTab('subscription');
      
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
    setSaveError('');
    setSaveSuccess(false);

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

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // Refresh the page to show updated data
      router.refresh();
    } catch (error: any) {
      setSaveError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const upcomingBookings = bookings.filter(b => new Date(b.start_ts) > new Date());
  const pastBookings = bookings.filter(b => new Date(b.start_ts) <= new Date());

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                <User className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-1">
                  {consumer?.name || user?.email?.split('@')[0] || 'Gast'}
                </h1>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="rounded-xl"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isLoggingOut ? 'Uitloggen...' : 'Uitloggen'}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'info'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Settings className="h-4 w-4 inline mr-2" />
              Mijn gegevens
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'bookings'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calendar className="h-4 w-4 inline mr-2" />
              Reserveringen ({bookings.length})
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'favorites'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Heart className="h-4 w-4 inline mr-2" />
              Favorieten ({favorites.length})
            </button>
            {tenants.length > 0 && (
              <button
                onClick={() => setActiveTab('subscription')}
                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'subscription'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <CreditCard className="h-4 w-4 inline mr-2" />
                Abonnementen ({tenants.length})
              </button>
            )}
          </div>
        </div>
      </div>

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

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Personal Info Tab */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            {/* Success Message */}
            {saveSuccess && (
              <div className="p-4 bg-success/10 border border-success/20 rounded-xl">
                <p className="text-success font-medium">Wijzigingen succesvol opgeslagen!</p>
              </div>
            )}

            {/* Error Message */}
            {saveError && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                <p className="text-destructive font-medium">{saveError}</p>
              </div>
            )}

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6">Persoonlijke informatie</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-base font-medium">
                    Naam
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Je volledige naam"
                    className="mt-2 h-12 rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-base font-medium">
                    E-mailadres
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={user?.email || ''}
                    disabled
                    className="mt-2 h-12 rounded-xl bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Je e-mailadres kan niet worden gewijzigd
                  </p>
                </div>
                <div>
                  <Label htmlFor="phone" className="text-base font-medium">
                    Telefoonnummer
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+31 6 12345678"
                    className="mt-2 h-12 rounded-xl"
                  />
                </div>
                <Button 
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="w-full h-12 gradient-bg text-white rounded-xl font-semibold"
                >
                  {isSaving ? 'Opslaan...' : 'Wijzigingen opslaan'}
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Voorkeuren</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium">E-mail notificaties</p>
                    <p className="text-sm text-muted-foreground">Ontvang updates over je reserveringen</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium">SMS notificaties</p>
                    <p className="text-sm text-muted-foreground">Ontvang SMS herinneringen</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">Marketing communicatie</p>
                    <p className="text-sm text-muted-foreground">Ontvang aanbiedingen en nieuws</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 rounded" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Restaurant manager?</h2>
              <p className="text-muted-foreground mb-4">
                Beheer je eigen restaurant met R4Y's krachtige reserveringssysteem
              </p>
              <Button variant="outline" asChild className="w-full h-12 rounded-xl">
                <Link href="/manager">
                  <Building2 className="h-4 w-4 mr-2" />
                  Ga naar Manager Portal
                </Link>
              </Button>
            </Card>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            {/* Upcoming Bookings */}
            {upcomingBookings.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">Aankomende reserveringen</h2>
                <div className="space-y-3">
                  {upcomingBookings.map((booking) => (
                    <Card key={booking.id} className="p-4 hover:border-primary transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{booking.location?.name}</h3>
                            <Badge variant={booking.status === 'CONFIRMED' ? 'default' : 'secondary'}>
                              {booking.status}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {new Date(booking.start_ts).toLocaleString('nl-NL', {
                                dateStyle: 'full',
                                timeStyle: 'short',
                              })}
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {booking.party_size} personen
                            </div>
                            {booking.location?.address_line1 && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                {booking.location.address_line1}, {booking.location.city}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild className="rounded-xl">
                          <Link href={`/p/${booking.location?.slug}`}>
                            Details
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Past Bookings */}
            {pastBookings.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">Eerdere reserveringen</h2>
                <div className="space-y-3">
                  {pastBookings.map((booking) => (
                    <Card key={booking.id} className="p-4 opacity-75">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{booking.location?.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(booking.start_ts).toLocaleDateString('nl-NL', {
                              dateStyle: 'long',
                            })}
                          </p>
                        </div>
                        <Badge variant="outline">{booking.status}</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {bookings.length === 0 && (
              <Card className="p-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nog geen reserveringen</h3>
                <p className="text-muted-foreground mb-6">
                  Begin met het verkennen van restaurants en maak je eerste reservering
                </p>
                <Button asChild className="rounded-xl">
                  <Link href="/discover">
                    Ontdek restaurants
                  </Link>
                </Button>
              </Card>
            )}
          </div>
        )}

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div className="space-y-4">
            {favorites.length > 0 ? (
              favorites.map((favorite) => (
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
              ))
            ) : (
              <Card className="p-12 text-center">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nog geen favorieten</h3>
                <p className="text-muted-foreground mb-6">
                  Voeg restaurants toe aan je favorieten om ze snel terug te vinden
                </p>
                <Button asChild className="rounded-xl">
                  <Link href="/discover">
                    Ontdek restaurants
                  </Link>
                </Button>
              </Card>
            )}
          </div>
        )}

        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <SubscriptionSection tenants={tenants} />
        )}
      </div>
    </div>
  );
}

