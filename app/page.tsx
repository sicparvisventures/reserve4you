import { getOptionalUser } from '@/lib/auth/dal';
import { searchLocations } from '@/lib/auth/tenant-dal';
import { Footer } from '@/components/footer';
import { LocationCard } from '@/components/location/LocationCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HeroSection } from '@/components/hero/HeroSection';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reserve4You - Stop guessing Start booking',
  description: 'Ontdek en reserveer bij de beste restaurants in België. Direct online reserveren bij jouw favoriete restaurant.',
};

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }: { searchParams: Promise<{ access?: string }> }) {
  const userData = await getOptionalUser();
  const user = userData?.dbUser || null;
  const resolvedSearchParams = await searchParams;
  
  // Get featured locations
  const locations = await searchLocations({});
  const featuredLocations = locations.slice(0, 12);
  
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section with Grid Distortion */}
      <HeroSection />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Vanavond beschikbaar */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Vanavond beschikbaar
              </h2>
              <p className="text-muted-foreground">
                Restaurants met direct beschikbare tafels
              </p>
            </div>
            <Link href="/discover">
              <Button variant="ghost">
                Alles bekijken →
              </Button>
            </Link>
          </div>

          {featuredLocations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredLocations.map((location) => (
                <LocationCard
                  key={location.id}
                  location={location}
                  showBookButton={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Geen restaurants gevonden. Voeg eerst locaties toe in het manager portaal.</p>
            </div>
          )}
        </section>

        {/* Popular Cuisines */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Populaire keukens
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {['Italiaans', 'Sushi', 'Frans', 'Grieks', 'Mexicaans', 'Thais'].map((cuisine) => (
              <Link
                key={cuisine}
                href={`/discover?cuisine=${cuisine.toLowerCase()}`}
                className="group"
              >
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 transition-all p-6 flex flex-col items-center justify-center text-center border border-border hover:border-primary">
                  <span className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                    {cuisine}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA Section - Voor Restaurant Owners */}
        <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-2xl border-2 border-primary/20 p-8 md:p-12 text-center shadow-lg">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-6 shadow-md">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Heb je een restaurant?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Sluit je aan bij R4Y en begin vandaag nog met het ontvangen van reserveringen. 
              Gratis starten, geen creditcard nodig.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/manager">
                <Button size="lg" className="gradient-bg text-white rounded-xl shadow-lg hover:shadow-xl transition-all px-8 h-12 text-base font-semibold">
                  Start Gratis
                </Button>
              </Link>
              <Link href="/manager">
                <Button size="lg" variant="outline" className="rounded-xl border-2 border-primary text-primary hover:bg-primary/5 px-8 h-12 text-base font-semibold">
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
    </main>
  );
} 