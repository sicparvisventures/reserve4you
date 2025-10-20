import { Suspense } from 'react';
import { verifySession, getUser } from '@/lib/auth/dal';
import { getConsumer, getConsumerBookings } from '@/lib/auth/tenant-dal';
import { BookingsClient } from './BookingsClient';

export default async function BookingsPage() {
  const session = await verifySession();
  const user = await getUser();
  const consumer = await getConsumer();
  const bookings = await getConsumerBookings();

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <BookingsClient
        user={user}
        consumer={consumer}
        bookings={bookings}
      />
    </Suspense>
  );
}

