import { Suspense } from 'react';
import { verifySession } from '@/lib/auth/dal';
import { FeedClient } from './FeedClient';

export default async function FeedPage() {
  await verifySession();

  return (
    <Suspense fallback={<FeedSkeleton />}>
      <FeedClient />
    </Suspense>
  );
}

function FeedSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="h-12 bg-muted rounded-lg animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Activity Feed | Reserve4You',
  description: 'Bekijk activiteiten van gebruikers die je volgt',
};

