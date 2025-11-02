import { Suspense } from 'react';
import { verifySession } from '@/lib/auth/dal';
import { FriendsClient } from './FriendsClient';

export default async function FriendsPage() {
  await verifySession();

  return (
    <Suspense fallback={<FriendsSkeleton />}>
      <FriendsClient />
    </Suspense>
  );
}

function FriendsSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <div className="h-12 bg-muted rounded-lg animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Vind Vrienden | Reserve4You',
  description: 'Ontdek en volg gebruikers op Reserve4You',
};

