import { Suspense } from 'react';
import { searchLocations } from '@/lib/auth/tenant-dal';
import { Footer } from '@/components/footer';
import { LocationCard } from '@/components/location/LocationCard';
import { DiscoverClient } from './DiscoverClient';
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
  
  // Fetch locations based on filters
  const locations = await searchLocations({
    query: searchQuery || undefined,
    cuisineType: cuisineType || undefined,
    priceRange: priceRange,
  });

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section with Search */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
            Ontdek{' '}
            <span className="text-primary">restaurants</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
            Vind het perfecte restaurant voor elke gelegenheid
          </p>

          <Suspense fallback={<div>Laden...</div>}>
            <DiscoverClient 
              initialQuery={searchQuery}
              initialCuisine={cuisineType}
              initialPrice={priceRange}
            />
          </Suspense>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {locations.length} {locations.length === 1 ? 'restaurant' : 'restaurants'} gevonden
            </h2>
            {(searchQuery || cuisineType || priceRange) && (
              <p className="text-muted-foreground mt-2">
                {searchQuery && `Zoeken naar "${searchQuery}"`}
                {cuisineType && ` • ${cuisineType}`}
                {priceRange && ` • Prijsklasse ${priceRange}`}
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

