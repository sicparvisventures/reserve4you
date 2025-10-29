import { getOptionalUser } from '@/lib/auth/dal';
import { searchLocations, getTrendingLocations, getBestRatedLocations, getNewLocations, getSpotlightLocations, getOnzeKeuzeLocations } from '@/lib/auth/tenant-dal';
import { getFavoriteLocationIds } from '@/lib/actions/favorites';
import { getAvailableCuisineTypes } from '@/lib/actions/discover';
import { Footer } from '@/components/footer';
import { LocationCard } from '@/components/location/LocationCard';
import { LocationCardWithFavorite } from '@/components/location/LocationCardWithFavorite';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VideoHeroSection } from '@/components/hero/VideoHeroSection';
import { HeroSection } from '@/components/hero/HeroSection';
import { SpotlightCarousel } from '@/components/spotlight/SpotlightCarousel';
import { OnzeKeuzeCarousel } from '@/components/onzekeuze/OnzeKeuzeCarousel';
import { StaffLoginFloatingButton } from '@/components/staff/StaffLoginFloatingButton';
import { BusinessCategoriesSection } from '@/components/home/BusinessCategoriesSection';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reserve4You - Stop guessing Start booking',
  description: 'Ontdek en reserveer bij professionele bedrijven in heel België. Direct online boeken voor alle diensten.',
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
  
  // Get sections for homepage
  const spotlightLocations = await getSpotlightLocations(6);
  const onzeKeuzeLocations = await getOnzeKeuzeLocations(10);
  const trendingLocations = await getTrendingLocations(5);
  const bestRatedLocations = await getBestRatedLocations(5);
  const newLocations = await getNewLocations(5);
  
  // Get favorite location IDs for the current user
  const favoriteLocationIds = await getFavoriteLocationIds();
  
  // Get available cuisine types from database
  const availableCuisines = await getAvailableCuisineTypes();
  
  return (
    <main className="relative min-h-screen bg-background">
      {/* Background Image for entire page */}
      <div className="fixed inset-0 w-full h-full -z-10">
        <Image
          src="/heray.png"
          alt="Reserve4You Background"
          fill
          className="object-cover"
          style={{ opacity: 0.7 }}
          quality={90}
        />
        {/* Light gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/50 via-background/40 to-background/30" />
      </div>

      {/* Staff Login Floating Button */}
      <StaffLoginFloatingButton />
      
      {/* Video Hero Section with Logo */}
      <VideoHeroSection />
      
      {/* Hero Section with Grid Distortion */}
      <HeroSection />

      {/* Spotlight Carousel - Featured Paid Restaurants */}
      {spotlightLocations.length > 0 && (
        <SpotlightCarousel locations={spotlightLocations} />
      )}

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Business Categories */}
        <BusinessCategoriesSection className="mb-20" />

        {/* Vandaag beschikbaar */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Vandaag Beschikbaar
              </h2>
              <p className="text-muted-foreground">
                Vandaag beschikbare locaties
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
                <LocationCardWithFavorite
                  key={location.id}
                  location={location}
                  initialIsFavorite={favoriteLocationIds.includes(location.id)}
                  showBookButton={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Geen locaties gevonden. Voeg eerst locaties toe in het manager portaal.</p>
            </div>
          )}
        </section>

        {/* Stijgen (Trending) */}
        {trendingLocations.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Stijgers
                </h2>
                <p className="text-muted-foreground">
                  Populaire locaties met stijgende beoordelingen
                </p>
              </div>
              <Link href="/discover">
                <Button variant="ghost">
                  Alles bekijken →
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {trendingLocations.map((location) => (
                <LocationCardWithFavorite
                  key={location.id}
                  location={location}
                  initialIsFavorite={favoriteLocationIds.includes(location.id)}
                  showBookButton={true}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Onze Keuze Carousel - Top 10 This Week */}
      {onzeKeuzeLocations.length > 0 && (
        <OnzeKeuzeCarousel locations={onzeKeuzeLocations} />
      )}

      {/* Main Content Continued */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Best Beoordeeld (Best Rated) */}
        {bestRatedLocations.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Best Beoordeeld
                </h2>
                <p className="text-muted-foreground">
                  Locaties met de hoogste beoordelingen
                </p>
              </div>
              <Link href="/discover">
                <Button variant="ghost">
                  Alles bekijken →
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {bestRatedLocations.map((location) => (
                <LocationCardWithFavorite
                  key={location.id}
                  location={location}
                  initialIsFavorite={favoriteLocationIds.includes(location.id)}
                  showBookButton={true}
                />
              ))}
            </div>
          </section>
        )}

        {/* Nieuw op Reserve4You (New Locations) */}
        {newLocations.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Nieuw op Reserve4You
                </h2>
                <p className="text-muted-foreground">
                  Ontdek de nieuwste locaties op ons platform
                </p>
              </div>
              <Link href="/discover">
                <Button variant="ghost">
                  Alles bekijken →
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {newLocations.map((location) => (
                <LocationCardWithFavorite
                  key={location.id}
                  location={location}
                  initialIsFavorite={favoriteLocationIds.includes(location.id)}
                  showBookButton={true}
                />
              ))}
            </div>
          </section>
        )}

        {/* Popular Specialties */}
        {availableCuisines.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Populaire specialiteiten
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {availableCuisines.slice(0, 12).map((cuisine) => (
                <Link
                  key={cuisine}
                  href={`/discover?cuisine=${encodeURIComponent(cuisine)}`}
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
        )}

        {/* CTA Section - Voor Restaurant Owners */}
        <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-2xl border-2 border-primary/20 p-8 md:p-12 text-center shadow-lg">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-24 h-24 gradient-bg rounded-2xl mb-6 shadow-md p-2 overflow-hidden">
              <div className="relative w-full h-full">
                <Image
                  src="/raylogo.png"
                  alt="Reserve4You Logo"
                  fill
                  className="object-contain"
                  quality={100}
                />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Heb je een bedrijf?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Sluit je aan bij R4Y en begin vandaag nog met het ontvangen van boekingen. 
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