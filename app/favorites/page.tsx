import { verifySession } from '@/lib/auth/dal';
import { getConsumerFavorites } from '@/lib/auth/tenant-dal';
import { LocationCard } from '@/components/location/LocationCard';
import { Footer } from '@/components/footer';
import { PageHero } from '@/components/hero/PageHero';
import { Heart } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mijn Favorieten - Reserve4You',
  description: 'Bekijk je favoriete restaurants',
};

export const dynamic = 'force-dynamic';

export default async function FavoritesPage() {
  const session = await verifySession();
  const favorites = await getConsumerFavorites();

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <PageHero
        title={
          <>
            Mijn{' '}
            <span className="text-primary bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Favorieten
            </span>
          </>
        }
        description="Bekijk en beheer je favoriete restaurants op één plek"
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {favorites && favorites.length > 0 ? (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Jouw favoriete restaurants
                </h2>
                <p className="text-muted-foreground">
                  {favorites.length} {favorites.length === 1 ? 'favoriet restaurant' : 'favoriete restaurants'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favorites.map((favorite: any) => (
                <LocationCard
                  key={favorite.location_id}
                  location={favorite.location}
                  showBookButton={true}
                />
              ))}
            </div>
          </section>
        ) : (
          <section className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-2xl mb-6">
              <Heart className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Nog geen favorieten
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Voeg restaurants toe aan je favorieten om ze hier terug te vinden.
              Klik op het hartje bij een restaurant om het toe te voegen.
            </p>
            <a
              href="/discover"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
            >
              Ontdek Restaurants
            </a>
          </section>
        )}
      </div>

      <Footer />
    </main>
  );
}

