import { Suspense } from 'react';
import { Footer } from '@/components/footer';
import { SearchClient } from './SearchClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Zoeken - Reserve4You',
  description: 'Zoek en vind het perfecte restaurant voor elke gelegenheid.',
};

export const dynamic = 'force-dynamic';

interface SearchParams {
  q?: string;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const query = params.q || '';

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
            Zoek je favoriete{' '}
            <span className="text-primary">restaurant</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
            Gebruik de uitgebreide zoekmogelijkheden om het perfecte restaurant te vinden
          </p>

          <Suspense fallback={<div>Laden...</div>}>
            <SearchClient initialQuery={query} />
          </Suspense>
        </div>
      </div>

      <Footer />
    </main>
  );
}

