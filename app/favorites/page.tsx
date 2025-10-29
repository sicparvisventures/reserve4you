import { verifySession } from '@/lib/auth/dal';
import { getConsumerFavorites } from '@/lib/auth/tenant-dal';
import { FavoritesClient } from './FavoritesClient';
import { Footer } from '@/components/footer';
import { PageHero } from '@/components/hero/PageHero';
import { ToastProvider } from '@/components/ui/toast-simple';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mijn Favorieten - Reserve4You',
  description: 'Beheer je favoriete locaties en ontvang slimme beschikbaarheidsalerts',
};

export const dynamic = 'force-dynamic';

export default async function FavoritesPage() {
  const session = await verifySession();
  const favorites = await getConsumerFavorites();

  return (
    <ToastProvider>
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
          description="Beheer je favoriete locaties en krijg automatisch meldingen wanneer ze beschikbaar zijn"
        />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <FavoritesClient initialFavorites={favorites || []} />
        </div>

        <Footer />
      </main>
    </ToastProvider>
  );
}

