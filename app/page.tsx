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
    <main className="relative min-h-screen bg-gray-50">
      {/* Background Image for entire page - Vinted style: subtle, lighter */}
      <div className="fixed inset-0 w-full h-full -z-10">
        <Image
          src="/heray.png"
          alt="Reserve4You Background"
          fill
          className="object-cover"
          style={{ opacity: 0.3 }}
          quality={90}
        />
        {/* Light gradient overlay - Vinted style: very subtle */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/50 to-white/40" />
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

      {/* Main Content - Vinted style: cleaner spacing and layout */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Business Categories */}
        <BusinessCategoriesSection className="mb-12 sm:mb-16" />

        {/* Vandaag beschikbaar - Vinted style section */}
        <section className="mb-12 sm:mb-16">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                Vandaag Beschikbaar
              </h2>
              <p className="text-sm text-gray-600">
                Vandaag beschikbare locaties
              </p>
            </div>
            <Link href="/discover">
              <Button variant="ghost" className="text-sm text-gray-700 hover:text-primary">
                Alles bekijken →
              </Button>
            </Link>
          </div>

          {featuredLocations.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
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
            <div className="text-center py-12 text-gray-500">
              <p>Geen locaties gevonden. Voeg eerst locaties toe in het manager portaal.</p>
            </div>
          )}
        </section>

        {/* Stijgen (Trending) - Vinted style section */}
        {trendingLocations.length > 0 && (
          <section className="mb-12 sm:mb-16">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                  Stijgers
                </h2>
                <p className="text-sm text-gray-600">
                  Populaire locaties met stijgende beoordelingen
                </p>
              </div>
              <Link href="/discover">
                <Button variant="ghost" className="text-sm text-gray-700 hover:text-primary">
                  Alles bekijken →
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
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

      {/* Main Content Continued - Vinted style */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Best Beoordeeld (Best Rated) - Vinted style section */}
        {bestRatedLocations.length > 0 && (
          <section className="mb-12 sm:mb-16">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                  Best Beoordeeld
                </h2>
                <p className="text-sm text-gray-600">
                  Locaties met de hoogste beoordelingen
                </p>
              </div>
              <Link href="/discover">
                <Button variant="ghost" className="text-sm text-gray-700 hover:text-primary">
                  Alles bekijken →
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
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

        {/* Nieuw op Reserve4You (New Locations) - Vinted style section */}
        {newLocations.length > 0 && (
          <section className="mb-12 sm:mb-16">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                  Nieuw op Reserve4You
                </h2>
                <p className="text-sm text-gray-600">
                  Ontdek de nieuwste locaties op ons platform
                </p>
              </div>
              <Link href="/discover">
                <Button variant="ghost" className="text-sm text-gray-700 hover:text-primary">
                  Alles bekijken →
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
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

        {/* Popular Specialties - Vinted style */}
        {availableCuisines.length > 0 && (
          <section className="mb-12 sm:mb-16">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
              Populaire specialiteiten
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {availableCuisines.slice(0, 12).map((cuisine) => (
                <Link
                  key={cuisine}
                  href={`/discover?cuisine=${encodeURIComponent(cuisine)}`}
                  className="group"
                >
                  <div className="aspect-square rounded-xl bg-white hover:bg-gray-50 transition-all p-4 sm:p-6 flex flex-col items-center justify-center text-center border border-gray-200 hover:border-primary hover:shadow-md">
                    <span className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-primary transition-colors">
                      {cuisine}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA Section - Voor Restaurant Owners - Vinted style */}
        <section className="bg-white rounded-2xl border border-gray-200 p-8 md:p-12 text-center shadow-sm mb-12 sm:mb-16">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 gradient-bg rounded-xl mb-6 shadow-sm p-2 overflow-hidden">
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
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Heb je een bedrijf?
            </h2>
            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto">
              Sluit je aan bij R4Y en begin vandaag nog met het ontvangen van boekingen. 
              Gratis starten, geen creditcard nodig.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <Link href="/manager">
                <Button size="lg" className="gradient-bg text-white rounded-lg shadow-md hover:shadow-lg transition-all px-6 sm:px-8 h-11 sm:h-12 text-sm sm:text-base font-semibold">
                  Start Gratis
                </Button>
              </Link>
              <Link href="/manager">
                <Button size="lg" variant="outline" className="rounded-lg border-2 border-primary text-primary hover:bg-primary/5 px-6 sm:px-8 h-11 sm:h-12 text-sm sm:text-base font-semibold">
                  Manager Portal
                </Button>
              </Link>
            </div>
            <p className="text-xs text-gray-500 mt-5 sm:mt-6">
              Gratis voor altijd • Geen setup kosten • Direct beginnen
            </p>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
} 