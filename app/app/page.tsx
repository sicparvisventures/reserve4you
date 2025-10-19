import { getUser } from '@/lib/auth/dal';
import { Calendar, MapPin, Clock, TrendingUp, Users, Settings, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Footer } from '@/components/footer';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic';

export default async function AppPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string }>;
}) {
  // Get authenticated user data
  const userData = await getUser();
  const params = await searchParams;
  
  // Check if this is a new signup verification
  const isNewSignup = params.verified === 'true';
  
  // Check if user is newly created (within last 5 minutes)
  const supabase = await createClient();
  const { data: userProfile } = await supabase
    .from('users')
    .select('created_at')
    .eq('supabase_user_id', userData.userId)
    .single();
  
  const isRecentSignup = userProfile?.created_at 
    ? (new Date().getTime() - new Date(userProfile.created_at).getTime()) < 5 * 60 * 1000 
    : false;
  
  const isFirstLogin = isNewSignup || isRecentSignup;

  console.log(`[APP] User accessing app: ${userData.email} (first login: ${isFirstLogin})`);

  return (
    <div className="min-h-screen bg-background">
      {/* Success Banner - Only for new signups */}
      {isNewSignup && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-center gap-2 text-green-800">
              <CheckCircle2 className="h-5 w-5" />
              <p className="text-sm font-medium">
                Je email is succesvol geverifieerd!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-6 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
      </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
              {isFirstLogin ? (
                <>
                  Welkom bij <span className="text-primary">Reserve4You</span>
                </>
              ) : (
                <>
                  Welkom terug bij <span className="text-primary">Reserve4You</span>
                </>
              )}
        </h1>
        
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {isFirstLogin ? (
                <>
                  Je account is succesvol aangemaakt. Begin nu met het ontdekken van restaurants of beheer je eigen locaties.
                </>
              ) : (
                <>
                  Fijn dat je er weer bent! Ontdek nieuwe restaurants of beheer je locaties.
                </>
              )}
            </p>

            {userData.email && (
              <p className="text-sm text-muted-foreground mb-8">
                Ingelogd als <span className="font-medium text-foreground">{userData.email}</span>
              </p>
            )}
          </div>
      </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Actions */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Wat wil je doen?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Discover Restaurants */}
            <Link href="/" className="group">
              <div className="p-6 rounded-2xl border-2 border-border hover:border-primary bg-background hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Ontdek Restaurants
                </h3>
                <p className="text-muted-foreground">
                  Zoek en reserveer bij de beste restaurants in België
                </p>
              </div>
            </Link>

            {/* Make Reservation */}
            <Link href="/" className="group">
              <div className="p-6 rounded-2xl border-2 border-border hover:border-primary bg-background hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Maak een Reservering
                </h3>
                <p className="text-muted-foreground">
                  Direct online reserveren bij jouw favoriete restaurant
                </p>
              </div>
            </Link>

            {/* Profile */}
            <Link href="/profile" className="group">
              <div className="p-6 rounded-2xl border-2 border-border hover:border-primary bg-background hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Mijn Profiel
                </h3>
                <p className="text-muted-foreground">
                  Bekijk en beheer je reserveringen en voorkeuren
                </p>
              </div>
            </Link>
          </div>
        </section>

        {/* For Restaurant Owners */}
        <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-2xl border-2 border-primary/20 p-8 md:p-12">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-6 shadow-md">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Heb je een restaurant?
            </h2>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Sluit je aan bij Reserve4You en begin vandaag nog met het ontvangen van online reserveringen. 
              Professioneel reserveringssysteem voor jouw restaurant.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">24/7 Beschikbaar</h3>
                <p className="text-sm text-muted-foreground">Ontvang reserveringen op elk moment</p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Meer Klanten</h3>
                <p className="text-sm text-muted-foreground">Vergroot je bereik en omzet</p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Eenvoudig Beheer</h3>
                <p className="text-sm text-muted-foreground">Intuïtief dashboard voor je restaurant</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/manager">
                <Button size="lg" className="gradient-bg text-white rounded-xl shadow-lg hover:shadow-xl transition-all px-8 h-12 text-base font-semibold w-full sm:w-auto">
                  Start Gratis
                </Button>
              </Link>
              <Link href="/manager">
                <Button size="lg" variant="outline" className="rounded-xl border-2 border-primary text-primary hover:bg-primary/5 px-8 h-12 text-base font-semibold w-full sm:w-auto">
                  Manager Portal
                </Button>
              </Link>
            </div>

            <p className="text-xs text-muted-foreground mt-6">
              Gratis voor altijd • Geen setup kosten • Direct beginnen
            </p>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
} 