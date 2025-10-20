import { Suspense } from 'react';
import { searchLocations } from '@/lib/auth/tenant-dal';
import { Footer } from '@/components/footer';
import { LocationCard } from '@/components/location/LocationCard';
import { DiscoverClient } from './DiscoverClient';
import { PageHero } from '@/components/hero/PageHero';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ontdek Restaurants - Reserve4You',
  description: 'Ontdek en reserveer bij de beste restaurants in België. Filter op keuken, prijs en meer.',
};

export const dynamic = 'force-dynamic';

interface SearchParams {
  query?: string;
  cuisine?: string;
  price?: string;
  city?: string;
  nearby?: string;
  open_now?: string;
  today?: string;
  groups?: string;
  deals?: string;
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  
  // Get search parameters
  const searchQuery = params.query || '';
  const cuisineType = params.cuisine || '';
  const priceRange = params.price ? parseInt(params.price) : undefined;
  const nearby = params.nearby === 'true';
  const openNow = params.open_now === 'true';
  const today = params.today === 'true';
  const groups = params.groups === 'true';
  const deals = params.deals === 'true';
  
  // Fetch locations based on filters
  const locations = await searchLocations({
    query: searchQuery || undefined,
    cuisineType: cuisineType || undefined,
    priceRange: priceRange,
    nearby,
    openNow,
    today,
    groups,
    deals,
  });

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section with Search */}
      <PageHero
        title={
          <>
            Ontdek{' '}
            <span className="text-primary bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              restaurants
            </span>
          </>
        }
        description="Vind het perfecte restaurant voor elke gelegenheid"
      >
        <Suspense fallback={<div>Laden...</div>}>
          <DiscoverClient 
            initialQuery={searchQuery}
            initialCuisine={cuisineType}
            initialPrice={priceRange}
            initialFilters={{
              nearby,
              openNow,
              today,
              groups,
              deals,
            }}
          />
        </Suspense>
      </PageHero>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {locations.length} {locations.length === 1 ? 'restaurant' : 'restaurants'} gevonden
            </h2>
            {(searchQuery || cuisineType || priceRange || nearby || openNow || today || groups || deals) && (
              <p className="text-muted-foreground mt-2">
                {searchQuery && `Zoeken naar "${searchQuery}"`}
                {cuisineType && ` • ${cuisineType}`}
                {priceRange && ` • Prijsklasse ${priceRange}`}
                {nearby && ` • Bij mij in de buurt`}
                {openNow && ` • Nu open`}
                {today && ` • Vandaag beschikbaar`}
                {groups && ` • Geschikt voor groepen`}
                {deals && ` • Speciale deals`}
              </p>
            )}
          </div>
        </div>

        {/* Results Grid */}
        {locations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {locations.map((location) => (
              <LocationCard
                key={location.id}
                location={location}
                showBookButton={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-2xl mb-6">
              <svg
                className="w-8 h-8 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Geen restaurants gevonden
            </h3>
            <p className="text-muted-foreground mb-6">
              Probeer andere filters of zoektermen
            </p>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}

